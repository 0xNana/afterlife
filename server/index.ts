/**
 * server/index.ts — Afterlife notification backend
 *
 * Routes:
 *   POST /emails          register/update beneficiary email for a vault
 *   GET  /emails/:vaultId list all registered emails for a vault
 *   DELETE /emails        remove a beneficiary email registration
 *   POST /owner-email     register vault owner email for deadline warnings
 *
 * All state-mutating routes require a signature from the vault owner or the
 * beneficiary themselves (signed message: "afterlife:<action>:<vaultId>:<address>")
 * to prevent anyone from registering arbitrary email addresses.
 *
 * The server also starts the chain indexer in the same process (one SQLite writer).
 */

import { serve } from 'bun'
import { verifyMessage } from 'viem'
import {
  upsertBeneficiaryEmail,
  removeBeneficiaryEmail,
  getVaultEmails,
  getBeneficiaryEmail,
} from './db'
import { startIndexer } from './indexer'
import { sendRegistrationEmail } from './mailer'
import { AFTERLIFE_ABI, AFTERLIFE_ADDRESS, ARC_TESTNET, getPublicRpcUrl } from './contract-config'
import { createPublicClient, http } from 'viem'

const PORT = parseInt(process.env.NOTIFICATION_SERVER_PORT ?? '3001')

// RPC client for ownership verification
const COMPASS_CHAIN = 'Arc_Testnet'
const proxyChains = (process.env.RPC_PROXY_CHAINS ?? '').split(',').map((s) => s.trim())
const rpcUrl =
  process.env.RPC_PROXY_BASE_URL && proxyChains.includes(COMPASS_CHAIN)
    ? `${process.env.RPC_PROXY_BASE_URL}/api/rpc/${COMPASS_CHAIN}?_rpc_token=${process.env.RPC_PROXY_TOKEN}`
    : getPublicRpcUrl()

const rpcClient = createPublicClient({ chain: ARC_TESTNET, transport: http(rpcUrl) })

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status)
}

async function getVaultOwner(vaultId: string): Promise<string | null> {
  try {
    const result = await rpcClient.readContract({
      address: AFTERLIFE_ADDRESS,
      abi: AFTERLIFE_ABI,
      functionName: 'getVault',
      args: [BigInt(vaultId)],
    }) as readonly unknown[]
    return (result[0] as string).toLowerCase()
  } catch {
    return null
  }
}

/**
 * Verify a signed message proving the signer controls `expectedSigner`.
 * Message format: "afterlife:<action>:<vaultId>:<address>"
 */
async function verifySignature(
  action: string,
  vaultId: string,
  address: string,
  signature: string,
  expectedSigner: string,
): Promise<boolean> {
  try {
    const message = `afterlife:${action}:${vaultId}:${address.toLowerCase()}`
    const valid = await verifyMessage({ message, signature: signature as `0x${string}`, address: expectedSigner as `0x${string}` })
    return valid
  } catch {
    return false
  }
}

// ── Request router ────────────────────────────────────────────────────────────

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // ── POST /emails ── register a beneficiary email ──────────────────────────
  if (method === 'POST' && path === '/emails') {
    let body: { vaultId?: string; beneficiary?: string; email?: string; signature?: string }
    try { body = await req.json() } catch { return err('Invalid JSON') }

    const { vaultId, beneficiary, email, signature } = body
    if (!vaultId || !beneficiary || !email || !signature) return err('Missing fields')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Invalid email')

    // Signature must be from the beneficiary themselves
    const valid = await verifySignature('register', vaultId, beneficiary, signature, beneficiary)
    if (!valid) return err('Invalid signature', 403)

    upsertBeneficiaryEmail(vaultId, beneficiary, email)

    // Send registration email (fire-and-forget — don't block the response)
    const owner = await getVaultOwner(vaultId)
    if (owner) {
      try {
        const vaultData = await rpcClient.readContract({
          address: AFTERLIFE_ADDRESS, abi: AFTERLIFE_ABI, functionName: 'getVault',
          args: [BigInt(vaultId)],
        }) as readonly unknown[]
        const nameHex = vaultData[1] as string
        const vaultName = decodeBytes32Name(nameHex) || `Vault #${vaultId}`
        const beneficiaryAddrs = vaultData[7] as string[]
        const beneficiaryShares = vaultData[8] as number[]
        const idx = beneficiaryAddrs.findIndex((a) => a.toLowerCase() === beneficiary.toLowerCase())
        const share = idx >= 0 ? beneficiaryShares[idx] : 0
        const sharePercent = (share / 100).toFixed(1)
        void sendRegistrationEmail({
          to: email, beneficiaryAddress: beneficiary, vaultId, vaultName, ownerAddress: owner, sharePercent,
        }).catch((e) => console.error('[server] registration email failed:', e))
      } catch (e) {
        console.error('[server] vault lookup for registration email failed:', e)
      }
    }

    return json({ ok: true })
  }

  // ── GET /emails/:vaultId ── list registered emails for a vault ────────────
  if (method === 'GET' && path.startsWith('/emails/')) {
    const vaultId = path.slice('/emails/'.length)
    if (!vaultId) return err('Missing vault id')
    const rows = getVaultEmails(vaultId)
    return json({ emails: rows })
  }

  // ── DELETE /emails ── remove a beneficiary email ──────────────────────────
  if (method === 'DELETE' && path === '/emails') {
    let body: { vaultId?: string; beneficiary?: string; signature?: string }
    try { body = await req.json() } catch { return err('Invalid JSON') }

    const { vaultId, beneficiary, signature } = body
    if (!vaultId || !beneficiary || !signature) return err('Missing fields')

    // Signature must be from the beneficiary or the vault owner
    const owner = await getVaultOwner(vaultId)
    const validBen = await verifySignature('unregister', vaultId, beneficiary, signature, beneficiary)
    const validOwner = owner
      ? await verifySignature('unregister', vaultId, beneficiary, signature, owner)
      : false

    if (!validBen && !validOwner) return err('Invalid signature', 403)

    removeBeneficiaryEmail(vaultId, beneficiary)
    return json({ ok: true })
  }

  // ── POST /owner-email ── register owner email for deadline warnings ────────
  if (method === 'POST' && path === '/owner-email') {
    let body: { vaultId?: string; owner?: string; email?: string; signature?: string }
    try { body = await req.json() } catch { return err('Invalid JSON') }

    const { vaultId, owner, email, signature } = body
    if (!vaultId || !owner || !email || !signature) return err('Missing fields')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Invalid email')

    // Must be signed by the owner
    const onchainOwner = await getVaultOwner(vaultId)
    if (!onchainOwner || onchainOwner !== owner.toLowerCase()) return err('Not the vault owner', 403)

    const valid = await verifySignature('owner-email', vaultId, owner, signature, owner)
    if (!valid) return err('Invalid signature', 403)

    // Store owner email using their address as the "beneficiary" key
    upsertBeneficiaryEmail(vaultId, owner, email)
    return json({ ok: true })
  }

  // ── GET /emails/:vaultId/:beneficiary ── get one email ───────────────────
  if (method === 'GET' && path.startsWith('/emails/')) {
    const parts = path.slice('/emails/'.length).split('/')
    if (parts.length === 2) {
      const [vaultId, beneficiary] = parts
      const email = getBeneficiaryEmail(vaultId, beneficiary)
      return json({ email })
    }
  }

  // ── GET /health ───────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/health') {
    return json({ ok: true, ts: Date.now() })
  }

  return json({ error: 'Not found' }, 404)
}

// ── Start ─────────────────────────────────────────────────────────────────────

serve({ port: PORT, fetch: handleRequest })
console.log(`[server] notification backend listening on :${PORT}`)

// Start indexer in same process (one SQLite writer)
startIndexer().catch((err) => {
  console.error('[server] indexer startup failed:', err)
})

function decodeBytes32Name(hex: string): string {
  try {
    const bytes = Buffer.from(hex.replace(/^0x/, ''), 'hex')
    return bytes.toString('utf8').replace(/\0/g, '').trim()
  } catch {
    return ''
  }
}
