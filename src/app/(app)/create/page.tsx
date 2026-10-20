'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { Plus, Trash2, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/Card'
import { TxButton } from '@/components/TxButton'
import { Btn } from '@/components/Btn'
import { useChainGuard } from '@/hooks/useChainGuard'
import { useUsdcBalance, useUsdcAllowance, useMinWindow } from '@/hooks/useVault'
import {
  AFTERLIFE_ADDRESS, AFTERLIFE_ABI, ERC20_ABI, USDC_ADDRESS,
  parseUsdc, formatUsdc, encodeBytes32Name, formatAddress,
} from '@/lib/contract'

interface Beneficiary { addr: string; share: string }

const DEFAULT_BEN: Beneficiary = { addr: '', share: '' }

export default function CreatePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { wrongChain, isSwitching, ensureChain } = useChainGuard()
  const { data: usdcBalance } = useUsdcBalance(address)
  const { data: allowance, refetch: refetchAllowance } = useUsdcAllowance(address, AFTERLIFE_ADDRESS)
  const { data: minWindow } = useMinWindow()

  const [name, setName] = useState('')
  const [windowDays, setWindowDays] = useState('30')
  const [deposit, setDeposit] = useState('')
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([{ ...DEFAULT_BEN }])
  const [step, setStep] = useState<'idle' | 'approving' | 'creating'>('idle')

  const depositRaw = parseUsdc(deposit)
  const needsApproval = depositRaw > 0n && (allowance ?? 0n) < depositRaw

  // Approve tx
  const {
    writeContract: approve, data: approveHash, isPending: approvePending, reset: approveReset,
  } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  // Create tx
  const {
    writeContract: create, data: createHash, isPending: createPending, reset: createReset,
  } = useWriteContract()
  const { isLoading: createConfirming, isSuccess: createSuccess } = useWaitForTransactionReceipt({ hash: createHash })

  const totalShares = beneficiaries.reduce((s, b) => s + (parseInt(b.share) || 0), 0)
  const sharesOk = totalShares === 10000
  const windowSecs = BigInt(Math.round(parseFloat(windowDays || '0') * 86400))
  const minWindowDays = minWindow ? Number(minWindow) / 86400 : 7

  const addBeneficiary = useCallback(() => {
    if (beneficiaries.length < 10) setBeneficiaries((p) => [...p, { ...DEFAULT_BEN }])
  }, [beneficiaries.length])

  const removeBeneficiary = useCallback((i: number) => {
    setBeneficiaries((p) => p.filter((_, idx) => idx !== i))
  }, [])

  const updateBeneficiary = useCallback((i: number, field: keyof Beneficiary, value: string) => {
    setBeneficiaries((p) => p.map((b, idx) => idx === i ? { ...b, [field]: value } : b))
  }, [])

  const splitEvenly = useCallback(() => {
    const n = beneficiaries.length
    const base = Math.floor(10000 / n)
    const rem = 10000 - base * n
    setBeneficiaries((p) => p.map((b, i) => ({ ...b, share: String(base + (i === n - 1 ? rem : 0)) })))
  }, [beneficiaries.length])

  const canSubmit = isConnected && !wrongChain && name.trim() && sharesOk && parseFloat(windowDays) >= minWindowDays && beneficiaries.every((b) => b.addr.startsWith('0x'))

  const handleSubmit = useCallback(async () => {
    if (!ensureChain()) return
    if (!canSubmit) return

    if (needsApproval && step === 'idle') {
      setStep('approving')
      approve({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [AFTERLIFE_ADDRESS, depositRaw],
      })
      return
    }

    setStep('creating')
    const nameBytes = encodeBytes32Name(name.trim())
    const addrs = beneficiaries.map((b) => b.addr as `0x${string}`)
    const shares = beneficiaries.map((b) => parseInt(b.share) || 0)
    create({
      address: AFTERLIFE_ADDRESS,
      abi: AFTERLIFE_ABI,
      functionName: 'createVault',
      args: [nameBytes, addrs, shares, windowSecs, depositRaw],
    })
  }, [ensureChain, canSubmit, needsApproval, step, approve, depositRaw, name, beneficiaries, windowSecs, create])

  // After approve succeeds, proceed to create
  if (approveSuccess && step === 'approving') {
    setStep('idle')
    void refetchAllowance()
    toast.success('USDC approved. Now create the vault.')
  }

  if (createSuccess && step === 'creating') {
    setStep('idle')
    createReset()
    approveReset()
    toast.success('Vault created!')
    setTimeout(() => router.push('/'), 1500)
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <p className="text-base" style={{ color: 'var(--muted)' }}>Connect your wallet to create a vault</p>
        <ConnectKitButton />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Create Vault</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Set up your USDC inheritance vault</p>
      </div>

      {wrongChain && (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}>
          Wrong network. Switch to Arc Testnet to continue.
        </div>
      )}

      {/* Vault name */}
      <Card className="p-5 space-y-4">
        <h2 className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>Vault Details</h2>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 32))}
            placeholder="e.g. Family Fund"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
          />
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>{name.length}/32 chars</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Inactivity Window (days)</label>
          <input
            type="number"
            value={windowDays}
            onChange={(e) => setWindowDays(e.target.value)}
            min={minWindowDays}
            max={3650}
            placeholder="30"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
          />
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>Min {minWindowDays} days · Max 3650 days</p>
        </div>
      </Card>

      {/* Initial deposit */}
      <Card className="p-5 space-y-3" spectralTop>
        <div className="flex items-center justify-between">
          <h2 className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>Initial Deposit (optional)</h2>
          {usdcBalance !== undefined && (
            <button
              onClick={() => setDeposit(formatUsdc(usdcBalance as bigint).replace(/,/g, ''))}
              className="text-xs font-semibold"
              style={{ color: 'var(--accent-hover)' }}
            >
              Max: {formatUsdc(usdcBalance as bigint)} USDC
            </button>
          )}
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.46)', border: '1px solid rgba(255,255,255,0.56)' }}>
          <input
            inputMode="decimal"
            value={deposit}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, '')
              if (v === '' || /^\d*\.?\d*$/.test(v)) setDeposit(v)
            }}
            placeholder="0.00"
            className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:opacity-20"
            style={{ color: 'var(--ink)' }}
          />
          <p className="mt-1 text-xs font-medium" style={{ color: 'var(--subtle)' }}>USDC</p>
        </div>
        {needsApproval && depositRaw > 0n && (
          <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
            <Info className="size-3" /> Step 1: Approve USDC · Step 2: Create Vault
          </p>
        )}
      </Card>

      {/* Beneficiaries */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>
            Beneficiaries
            <span className="ml-2 text-xs font-normal" style={{ color: totalShares === 10000 ? 'var(--success)' : 'var(--danger)' }}>
              {totalShares}/10000 bp
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {beneficiaries.length > 1 && (
              <Btn size="sm" variant="ghost" onClick={splitEvenly}>Split evenly</Btn>
            )}
            {beneficiaries.length < 10 && (
              <Btn size="sm" variant="secondary" onClick={addBeneficiary}>
                <Plus className="size-3" /> Add
              </Btn>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {beneficiaries.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={b.addr}
                onChange={(e) => updateBeneficiary(i, 'addr', e.target.value)}
                placeholder="0x address"
                className="mono min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
              />
              <input
                type="number"
                value={b.share}
                onChange={(e) => updateBeneficiary(i, 'share', e.target.value)}
                placeholder="bp"
                className="w-20 rounded-xl border px-3 py-2 text-xs outline-none tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
                min={1}
                max={10000}
              />
              <span className="w-10 text-center text-xs" style={{ color: 'var(--muted)' }}>
                {b.share ? `${(parseInt(b.share) / 100).toFixed(1)}%` : '—'}
              </span>
              {beneficiaries.length > 1 && (
                <button onClick={() => removeBeneficiary(i)} style={{ color: 'var(--danger)' }}>
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {!sharesOk && beneficiaries.length > 0 && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>Shares must sum to 10000 basis points (= 100%)</p>
        )}
      </Card>

      {/* Summary */}
      {canSubmit && (
        <Card inner className="px-4 py-3 space-y-1">
          {beneficiaries.map((b, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="mono" style={{ color: 'var(--muted)' }}>{formatAddress(b.addr)}</span>
              <span className="tabular-nums font-semibold" style={{ color: 'var(--ink)' }}>{(parseInt(b.share) / 100).toFixed(1)}%</span>
            </div>
          ))}
        </Card>
      )}

      {/* CTA */}
      {step === 'approving' ? (
        <TxButton
          label="Approve USDC"
          onClick={handleSubmit}
          isPending={approvePending || isSwitching}
          isConfirming={approveConfirming}
          isSuccess={approveSuccess}
          hash={approveHash}
          disabled={!canSubmit}
        />
      ) : (
        <TxButton
          label={needsApproval && depositRaw > 0n ? 'Step 1: Approve USDC' : wrongChain ? 'Switch to Arc Testnet' : 'Create Vault'}
          onClick={wrongChain ? () => ensureChain() : handleSubmit}
          isPending={createPending || isSwitching}
          isConfirming={createConfirming}
          isSuccess={createSuccess}
          hash={createHash}
          disabled={!canSubmit}
        />
      )}
    </div>
  )
}
