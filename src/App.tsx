/**
 * Afterlife — USDC Inheritance Vault
 * Built with Arc Studio — https://studio.arc.io
 */

import { useState, useCallback, useEffect } from 'react'
import {
  useAccount, useWriteContract, useWaitForTransactionReceipt,
  useReadContract, useSwitchChain
} from 'wagmi'
import { erc20Abi, type Abi } from 'viem'
import { ConnectKitButton } from 'connectkit'
import { toast } from 'sonner'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { parseAmount } from '@/onchain-money'

// ── Chain config ──────────────────────────────────────────────────────────────
const ARC_TESTNET_ID = 5042002
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const
const USDC_DECIMALS = 6

const AFTERLIFE_ADDRESS = (import.meta.env.VITE_AFTERLIFE_ADDRESS || '') as `0x${string}`

// ABI loaded at module level — safe outside render
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AFTERLIFE_ABI: Abi = (require('../contracts/out/Afterlife.sol/Afterlife.json') as { abi: Abi }).abi

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(raw: bigint | undefined) {
  if (raw === undefined) return '—'
  const n = Number(raw) / 10 ** USDC_DECIMALS
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}

function shortAddr(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—'
}

function fmtCountdown(secs: number) {
  if (secs <= 0) return 'EXPIRED'
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  return `${h}h ${m}m ${s}s`
}

function encodeBytes32String(str: string): `0x${string}` {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str.slice(0, 31))
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `0x${hex.padEnd(64, '0')}`
}

function decodeBytes32String(hex: `0x${string}`): string {
  const bytes = hex.slice(2).match(/.{2}/g)?.map(b => parseInt(b, 16)) ?? []
  const nullIdx = bytes.indexOf(0)
  const trimmed = nullIdx === -1 ? bytes : bytes.slice(0, nullIdx)
  return new TextDecoder().decode(new Uint8Array(trimmed))
}

const STATUS_LABEL: Record<number, string> = { 0: 'None', 1: 'Active', 2: 'Released', 3: 'Closed' }
const STATUS_COLOR: Record<number, string> = {
  0: 'text-[var(--subtle)]',
  1: 'text-[var(--success)]',
  2: 'text-amber-600',
  3: 'text-[var(--muted)]',
}

// ── TxButton ─────────────────────────────────────────────────────────────────
function TxButton({
  label, pendingLabel, onWrite, disabled, danger,
}: {
  label: string
  pendingLabel: string
  onWrite: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onWrite}
      disabled={disabled}
      className={[
        'px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed',
        danger
          ? 'bg-[var(--danger)] text-white hover:opacity-90'
          : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
      ].join(' ')}
    >
      {disabled ? pendingLabel : label}
    </button>
  )
}

function ExplorerLink({ hash }: { hash: `0x${string}` | undefined }) {
  if (!hash) return null
  return (
    <a href={buildTxExplorerUrl(ARC_TESTNET_ID, hash)} target="_blank" rel="noopener noreferrer"
      className="text-xs text-[var(--accent-hover)] hover:underline mt-1 block">
      View on explorer ↗
    </a>
  )
}

// ── Countdown hook ────────────────────────────────────────────────────────────
function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

// ── CreateVaultPanel ──────────────────────────────────────────────────────────
type CreateStep = 'idle' | 'approving' | 'creating'

function CreateVaultPanel() {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [name, setName] = useState('')
  const [window_, setWindow_] = useState('30')
  const [beneficiaries, setBeneficiaries] = useState([{ addr: '', share: '10000' }])
  const [deposit_, setDeposit_] = useState('')
  const [step, setStep] = useState<CreateStep>('idle')

  const wrongChain = chainId !== ARC_TESTNET_ID
  const { writeContract, data: hash, isPending, isError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const busy = isPending || isConfirming

  // Step sequencer: approving -> creating -> done
  useEffect(() => {
    if (isError && step !== 'idle') { setStep('idle'); return }
    if (!isSuccess) return
    if (step === 'approving') {
      // Approval confirmed — now call createVault
      const nameBytes = encodeBytes32String(name)
      const windowSecs = BigInt(Math.round(parseFloat(window_) * 86400))
      const addrs = beneficiaries.map(b => b.addr as `0x${string}`)
      const shares = beneficiaries.map(b => parseInt(b.share) || 0)
      const depositAmt = deposit_ ? parseAmount(ARC_TESTNET_ID, deposit_).raw : 0n
      setStep('creating')
      writeContract({
        address: AFTERLIFE_ADDRESS,
        abi: AFTERLIFE_ABI,
        functionName: 'createVault',
        args: [nameBytes, addrs, shares, windowSecs, depositAmt],
      })
      reset()
    } else if (step === 'creating') {
      toast.success('Vault created!')
      setStep('idle')
      setName('')
      setDeposit_('')
      reset()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isError])

  const handleCreate = useCallback(() => {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_ID }); return }
    if (!AFTERLIFE_ADDRESS) { toast.error('Contract not deployed yet'); return }

    const nameBytes = encodeBytes32String(name)
    const windowSecs = BigInt(Math.round(parseFloat(window_) * 86400))
    const addrs = beneficiaries.map(b => b.addr as `0x${string}`)
    const shares = beneficiaries.map(b => parseInt(b.share) || 0)
    const depositAmt = deposit_ ? parseAmount(ARC_TESTNET_ID, deposit_).raw : 0n

    if (depositAmt > 0n) {
      setStep('approving')
      writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [AFTERLIFE_ADDRESS, depositAmt],
      })
    } else {
      setStep('creating')
      writeContract({
        address: AFTERLIFE_ADDRESS,
        abi: AFTERLIFE_ABI,
        functionName: 'createVault',
        args: [nameBytes, addrs, shares, windowSecs, 0n],
      })
    }
  }, [name, window_, beneficiaries, deposit_, wrongChain, switchChain, writeContract])

  const addBeneficiary = () => {
    if (beneficiaries.length >= 10) return
    setBeneficiaries(prev => [...prev, { addr: '', share: '0' }])
  }
  const removeBeneficiary = (i: number) => setBeneficiaries(prev => prev.filter((_, j) => j !== i))
  const updateBeneficiary = (i: number, field: 'addr' | 'share', val: string) =>
    setBeneficiaries(prev => prev.map((b, j) => j === i ? { ...b, [field]: val } : b))

  const totalShares = beneficiaries.reduce((s, b) => s + (parseInt(b.share) || 0), 0)
  const sharesOk = totalShares === 10000

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur p-5 space-y-4">
      <h2 className="display text-lg font-semibold text-[var(--ink)]">Create Vault</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">Vault Name</label>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={31}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--focus)]"
            placeholder="My Digital Estate" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">Inactivity Window (days)</label>
          <input type="number" value={window_} onChange={e => setWindow_(e.target.value)} min="1" max="3650"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--focus)]"
            placeholder="365" />
          <p className="text-xs text-[var(--subtle)] mt-1">If you miss check-ins for this many days, beneficiaries can claim.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">Initial Deposit (USDC, optional)</label>
          <input type="number" value={deposit_} onChange={e => setDeposit_(e.target.value)} min="0"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--focus)] tabular-nums"
            placeholder="100.00" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Beneficiaries</label>
            <span className={`text-xs tabular-nums font-semibold ${sharesOk ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {totalShares}/10000 bp
            </span>
          </div>
          <div className="space-y-2">
            {beneficiaries.map((b, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={b.addr} onChange={e => updateBeneficiary(i, 'addr', e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink)] mono outline-none focus:border-[var(--focus)]"
                  placeholder="0x address" />
                <input type="number" value={b.share} onChange={e => updateBeneficiary(i, 'share', e.target.value)}
                  className="w-20 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-2 text-xs text-[var(--ink)] tabular-nums outline-none focus:border-[var(--focus)]"
                  placeholder="bp" min="1" max="10000" />
                {beneficiaries.length > 1 && (
                  <button onClick={() => removeBeneficiary(i)}
                    className="text-[var(--danger)] hover:opacity-70 text-sm font-bold px-1">×</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addBeneficiary} disabled={beneficiaries.length >= 10}
            className="mt-2 text-xs text-[var(--accent-hover)] hover:underline disabled:opacity-40">
            + Add beneficiary
          </button>
          <p className="text-xs text-[var(--subtle)] mt-1">Shares in basis points — must total exactly 10000. Last beneficiary gets the rounding remainder.</p>
        </div>
      </div>

      {step === 'approving' && <p className="text-xs text-amber-600">Step 1/2: Approving USDC spend…</p>}
      {step === 'creating' && <p className="text-xs text-amber-600">Step 2/2: Creating vault…</p>}

      <TxButton
        label={wrongChain ? 'Switch to Arc Testnet' : deposit_ ? 'Approve & Create Vault' : 'Create Vault'}
        pendingLabel={isConfirming ? 'Confirming…' : 'Waiting for wallet…'}
        onWrite={handleCreate}
        disabled={busy || !address || !name || !sharesOk}
      />
      <ExplorerLink hash={hash} />
    </div>
  )
}

// ── VaultCard ─────────────────────────────────────────────────────────────────
type DepositStep = 'idle' | 'approving'

function VaultCard({ id, userAddress }: { id: bigint; userAddress: `0x${string}` }) {
  const now = useNow()
  const { data: vaultData, refetch } = useReadContract({
    address: AFTERLIFE_ADDRESS,
    abi: AFTERLIFE_ABI,
    functionName: 'getVault',
    args: [id],
    chainId: ARC_TESTNET_ID,
  }) as { data: [string, `0x${string}`, bigint, bigint, bigint, bigint, number, string[], number[]] | undefined, refetch: () => void }

  const [depositAmt, setDepositAmt] = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const [depositStep, setDepositStep] = useState<DepositStep>('idle')
  const [pendingDepositAmt, setPendingDepositAmt] = useState<bigint>(0n)

  const { chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const wrongChain = chainId !== ARC_TESTNET_ID

  const { writeContract, data: txHash, isPending, isSuccess, isError } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash })
  const busy = isPending || isConfirming

  useEffect(() => {
    if (isError && depositStep !== 'idle') { setDepositStep('idle'); return }
    if (!isSuccess) return
    if (depositStep === 'approving') {
      setDepositStep('idle')
      writeContract({ address: AFTERLIFE_ADDRESS, abi: AFTERLIFE_ABI, functionName: 'deposit', args: [id, pendingDepositAmt] })
    } else {
      refetch()
      toast.success('Transaction confirmed')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isError])

  if (!vaultData) return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 h-32 animate-pulse" />
  )

  const [owner, nameBytes, window, lastCheckIn, balance, releasedBalance, statusNum, benefAddrs, benefShares] = vaultData
  const vaultName = decodeBytes32String(nameBytes)
  const deadline = Number(lastCheckIn) + Number(window)
  const remaining = deadline - now
  const isExpired = remaining <= 0
  const status = statusNum as 0 | 1 | 2 | 3
  const isOwner = owner.toLowerCase() === userAddress.toLowerCase()
  const isBenef = benefAddrs.some(a => a.toLowerCase() === userAddress.toLowerCase())

  const doAction = (fn: string, args: unknown[]) => {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_ID }); return }
    writeContract({ address: AFTERLIFE_ADDRESS, abi: AFTERLIFE_ABI, functionName: fn, args })
  }

  const handleDeposit = () => {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_ID }); return }
    if (!depositAmt) return
    const raw = parseAmount(ARC_TESTNET_ID, depositAmt).raw
    setPendingDepositAmt(raw)
    setDepositStep('approving')
    writeContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [AFTERLIFE_ADDRESS, raw] })
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="display text-base font-semibold text-[var(--ink)]">{vaultName || `Vault #${id}`}</p>
          <p className="mono text-xs text-[var(--subtle)] mt-0.5"># {id.toString()}</p>
        </div>
        <span className={`text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded-full border border-current ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-semibold">Balance</p>
          <p className="display text-xl font-semibold tabular-nums text-[var(--ink)] mt-0.5">
            {fmt(balance)} <span className="text-sm text-[var(--subtle)]">USDC</span>
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-3">
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-semibold">Countdown</p>
          <p className={`display text-xl font-semibold tabular-nums mt-0.5 ${isExpired && status === 1 ? 'text-[var(--danger)]' : 'text-[var(--ink)]'}`}>
            {status === 1 ? fmtCountdown(remaining) : STATUS_LABEL[status]}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">Beneficiaries</p>
        <div className="space-y-1">
          {benefAddrs.map((addr, i) => (
            <div key={addr} className="flex justify-between items-center text-xs">
              <span className="mono text-[var(--ink-2)]">{shortAddr(addr)}</span>
              <span className="tabular-nums text-[var(--subtle)]">{(benefShares[i] / 100).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>

      {isOwner && status === 1 && (
        <div className="space-y-3 border-t border-[var(--border)] pt-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Owner Actions</p>
          <TxButton label="I'm Alive" pendingLabel="Sending…" disabled={busy}
            onWrite={() => doAction('checkIn', [id])} />

          <div className="flex gap-2 items-center">
            <input type="number" value={depositAmt} onChange={e => setDepositAmt(e.target.value)}
              placeholder="USDC to deposit" min="0"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm tabular-nums outline-none focus:border-[var(--focus)]" />
            <TxButton label="Deposit" pendingLabel="…" disabled={busy || !depositAmt} onWrite={handleDeposit} />
          </div>
          {depositStep === 'approving' && <p className="text-xs text-amber-600">Approving USDC…</p>}

          <div className="flex gap-2 items-center">
            <input type="number" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)}
              placeholder="USDC to withdraw" min="0"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm tabular-nums outline-none focus:border-[var(--focus)]" />
            <TxButton label="Withdraw" pendingLabel="…" disabled={busy || !withdrawAmt}
              onWrite={() => doAction('withdraw', [id, parseAmount(ARC_TESTNET_ID, withdrawAmt).raw])} />
          </div>

          <TxButton label="Close Vault" pendingLabel="Closing…" disabled={busy} danger
            onWrite={() => doAction('close', [id])} />
        </div>
      )}

      {status === 1 && isExpired && (
        <div className="border-t border-[var(--border)] pt-3">
          <p className="text-xs text-[var(--danger)] font-semibold mb-2">Vault has expired — anyone can release it</p>
          <TxButton label="Release Vault" pendingLabel="Releasing…" disabled={busy}
            onWrite={() => doAction('release', [id])} />
        </div>
      )}

      {status === 2 && (
        <div className="border-t border-[var(--border)] pt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
            Released — {fmt(releasedBalance)} USDC to distribute
          </p>
          {isBenef && benefAddrs.map((addr, i) =>
            addr.toLowerCase() === userAddress.toLowerCase() ? (
              <TxButton key={i} label={`Claim My Share (#${i})`} pendingLabel="Claiming…" disabled={busy}
                onWrite={() => doAction('claim', [id, BigInt(i)])} />
            ) : null
          )}
          <TxButton label="Pay Everyone" pendingLabel="Paying…" disabled={busy}
            onWrite={() => doAction('claimAll', [id])} />
        </div>
      )}

      <ExplorerLink hash={txHash} />
    </div>
  )
}

// ── BeneficiaryView ───────────────────────────────────────────────────────────
function BeneficiaryView({ userAddress }: { userAddress: `0x${string}` }) {
  const { data: ids } = useReadContract({
    address: AFTERLIFE_ADDRESS,
    abi: AFTERLIFE_ABI,
    functionName: 'vaultsOfBeneficiary',
    args: [userAddress],
    chainId: ARC_TESTNET_ID,
  }) as { data: bigint[] | undefined }

  if (!ids || ids.length === 0) return (
    <p className="text-sm text-[var(--subtle)] text-center py-4">You are not listed as a beneficiary in any vault.</p>
  )
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">You are a beneficiary in {ids.length} vault{ids.length !== 1 ? 's' : ''}.</p>
      {ids.map(id => <VaultCard key={id.toString()} id={id} userAddress={userAddress} />)}
    </div>
  )
}

// ── OwnerView ─────────────────────────────────────────────────────────────────
function OwnerView({ userAddress }: { userAddress: `0x${string}` }) {
  const { data: ids } = useReadContract({
    address: AFTERLIFE_ADDRESS,
    abi: AFTERLIFE_ABI,
    functionName: 'vaultsOfOwner',
    args: [userAddress],
    chainId: ARC_TESTNET_ID,
  }) as { data: bigint[] | undefined }

  return (
    <div className="space-y-4">
      {!ids || ids.length === 0 ? (
        <p className="text-sm text-[var(--subtle)] text-center py-4">You have no vaults yet. Create one in the Create tab.</p>
      ) : (
        ids.map(id => <VaultCard key={id.toString()} id={id} userAddress={userAddress} />)
      )}
    </div>
  )
}

// ── LookupVault ───────────────────────────────────────────────────────────────
function LookupVault({ userAddress }: { userAddress: `0x${string}` }) {
  const [inputId, setInputId] = useState('')
  const [lookupId, setLookupId] = useState<bigint | null>(null)
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={inputId} onChange={e => setInputId(e.target.value)}
          placeholder="Vault ID (e.g. 0)"
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm mono outline-none focus:border-[var(--focus)]" />
        <button onClick={() => setLookupId(inputId !== '' ? BigInt(inputId) : null)}
          className="bg-[var(--accent)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all active:scale-95">
          Load
        </button>
      </div>
      {lookupId !== null && <VaultCard id={lookupId} userAddress={userAddress} />}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
type Tab = 'my-vaults' | 'inheritances' | 'lookup' | 'create'

export default function App() {
  const { address, isConnected } = useAccount()
  const [tab, setTab] = useState<Tab>('my-vaults')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'my-vaults', label: 'My Vaults' },
    { id: 'inheritances', label: 'Inheritances' },
    { id: 'lookup', label: 'Look Up' },
    { id: 'create', label: 'Create' },
  ]

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="display text-lg font-bold text-[var(--ink)] leading-none">Afterlife</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">USDC Inheritance Vault · Arc Testnet</p>
          </div>
          <ConnectKitButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {!AFTERLIFE_ADDRESS && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            Contract not yet deployed. Set <code className="mono text-xs bg-amber-100 px-1 rounded">VITE_AFTERLIFE_ADDRESS</code> in <code className="mono text-xs bg-amber-100 px-1 rounded">.env</code> after deploying.
          </div>
        )}

        {!isConnected ? (
          <div className="text-center py-16 space-y-4">
            <div className="display text-4xl font-bold text-[var(--ink)]">Your digital estate,<br />protected forever.</div>
            <p className="text-[var(--muted)] text-sm max-w-xs mx-auto text-pretty">
              Create a USDC vault on Arc. Check in regularly. If you stop, your beneficiaries receive everything automatically.
            </p>
            <div className="flex justify-center pt-2">
              <ConnectKitButton label="Connect Wallet" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-1 rounded-2xl bg-[var(--surface-muted)] p-1">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={[
                    'flex-1 py-2 text-sm font-semibold rounded-xl transition-all',
                    tab === t.id
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]',
                  ].join(' ')}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'create' && <CreateVaultPanel />}
            {tab === 'my-vaults' && address && <OwnerView userAddress={address} />}
            {tab === 'inheritances' && address && <BeneficiaryView userAddress={address} />}
            {tab === 'lookup' && address && <LookupVault userAddress={address} />}
          </>
        )}
      </main>
    </div>
  )
}
