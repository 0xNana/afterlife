'use client'

import { useState, useCallback, useEffect } from 'react'
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
  // 'idle' | 'approving' | 'creating'
  const [step, setStep] = useState<'idle' | 'approving' | 'creating'>('idle')
  // Optimistic allowance: set after approve confirms so UI transitions immediately
  const [optimisticAllowance, setOptimisticAllowance] = useState<bigint | null>(null)

  const depositRaw = parseUsdc(deposit)
  const effectiveAllowance = optimisticAllowance ?? (allowance as bigint | undefined) ?? 0n
  const needsApproval = depositRaw > 0n && effectiveAllowance < depositRaw

  // ── Approve tx ────────────────────────────────────────────────────────────
  const {
    writeContract: approve,
    data: approveHash,
    isPending: approvePending,
    reset: approveReset,
  } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash })

  // ── Create tx ─────────────────────────────────────────────────────────────
  const {
    writeContract: create,
    data: createHash,
    isPending: createPending,
    reset: createReset,
  } = useWriteContract()
  const { isLoading: createConfirming, isSuccess: createSuccess } =
    useWaitForTransactionReceipt({ hash: createHash })

  const totalShares = beneficiaries.reduce((s, b) => s + (parseInt(b.share) || 0), 0)
  const sharesOk = totalShares === 10000
  const windowSecs = BigInt(Math.round(parseFloat(windowDays || '0') * 86400))
  const minWindowDays = minWindow ? Number(minWindow) / 86400 : 7

  // ── After approve confirms → optimistically update allowance, reset step ──
  useEffect(() => {
    if (approveSuccess && step === 'approving') {
      setOptimisticAllowance(depositRaw)
      setStep('idle')
      void refetchAllowance()
      toast.success('USDC approved — now click Create Vault.')
    }
  }, [approveSuccess, step, depositRaw, refetchAllowance])

  // ── After create confirms → redirect to dashboard ─────────────────────────
  useEffect(() => {
    if (createSuccess && step === 'creating') {
      setStep('idle')
      createReset()
      approveReset()
      toast.success('Vault created!')
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }, [createSuccess, step, createReset, approveReset, router])

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

  const canSubmit =
    isConnected &&
    !wrongChain &&
    name.trim().length > 0 &&
    sharesOk &&
    parseFloat(windowDays) >= minWindowDays &&
    beneficiaries.every((b) => b.addr.startsWith('0x') && b.addr.length === 42)

  const handleSubmit = useCallback(() => {
    if (!ensureChain()) return
    if (!canSubmit) return

    // Need approval first
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

    // Directly to create (no deposit, or already approved)
    if (step === 'idle') {
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
    }
  }, [
    ensureChain, canSubmit, needsApproval, step,
    approve, depositRaw, name, beneficiaries, windowSecs, create,
  ])

  // After approve completes, user clicks again to trigger create
  const handleCreateAfterApprove = useCallback(() => {
    if (!ensureChain()) return
    if (!canSubmit) return
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
  }, [ensureChain, canSubmit, name, beneficiaries, windowSecs, depositRaw, create])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <p className="text-base" style={{ color: 'var(--muted)' }}>Connect your wallet to create a vault</p>
        <ConnectKitButton />
      </div>
    )
  }

  // Determine CTA state
  const isApproving = step === 'approving'
  const isCreating = step === 'creating'
  const approvedAndReady = !needsApproval && depositRaw > 0n && optimisticAllowance !== null

  let ctaLabel = 'Create Vault'
  if (wrongChain) ctaLabel = 'Switch to Arc Mainnet'
  else if (isApproving) ctaLabel = 'Approve USDC'
  else if (needsApproval) ctaLabel = 'Step 1: Approve USDC'
  else if (approvedAndReady) ctaLabel = 'Step 2: Create Vault'

  const ctaOnClick = isCreating || approvedAndReady
    ? handleCreateAfterApprove
    : wrongChain
      ? () => ensureChain()
      : handleSubmit

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Create Vault</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Set up your USDC inheritance vault</p>
      </div>

      {wrongChain && (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(192,90,74,0.08)', color: 'var(--danger)' }}>
          Wrong network. Switch to Arc Mainnet to continue.
        </div>
      )}

      {/* Vault name + window */}
      <Card className="p-5 space-y-4">
        <h2 className="sans text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Vault Details</h2>
        <div className="space-y-1">
          <label className="sans text-xs font-semibold" style={{ color: 'var(--muted)' }}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 32))}
            placeholder="e.g. Family Fund"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
          />
          <p className="sans text-xs" style={{ color: 'var(--subtle)' }}>{name.length}/32 chars</p>
        </div>

        <div className="space-y-1">
          <label className="sans text-xs font-semibold" style={{ color: 'var(--muted)' }}>Inactivity Window (days)</label>
          <input
            type="number"
            value={windowDays}
            onChange={(e) => setWindowDays(e.target.value)}
            min={minWindowDays}
            max={3650}
            placeholder="30"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
          />
          <p className="sans text-xs" style={{ color: 'var(--subtle)' }}>Min {minWindowDays} days · Max 3650 days</p>
        </div>
      </Card>

      {/* Initial deposit */}
      <Card className="p-5 space-y-3" spectralTop>
        <div className="flex items-center justify-between">
          <h2 className="sans text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Initial Deposit <span style={{ opacity: 0.5 }}>(optional)</span></h2>
          {usdcBalance !== undefined && (
            <button
              onClick={() => setDeposit(formatUsdc(usdcBalance as bigint).replace(/,/g, ''))}
              className="sans text-xs font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              Max: {formatUsdc(usdcBalance as bigint)} USDC
            </button>
          )}
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
          <input
            inputMode="decimal"
            value={deposit}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, '')
              if (v === '' || /^\d*\.?\d*$/.test(v)) {
                setDeposit(v)
                setOptimisticAllowance(null) // reset on amount change
              }
            }}
            placeholder="0.00"
            className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:opacity-20"
            style={{ color: 'var(--ink)' }}
          />
          <p className="sans mt-1 text-xs font-medium" style={{ color: 'var(--subtle)' }}>USDC</p>
        </div>

        {/* Step indicator */}
        {depositRaw > 0n && (
          <div className="sans flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
            <span
              className="flex items-center gap-1"
              style={{ color: approvedAndReady ? 'var(--success)' : needsApproval ? 'var(--accent)' : 'var(--muted)' }}
            >
              {approvedAndReady ? '✓' : <Info className="size-3" />} Approve USDC
            </span>
            <span style={{ opacity: 0.3 }}>→</span>
            <span style={{ color: !needsApproval ? 'var(--ink)' : 'var(--subtle)' }}>
              Create Vault
            </span>
          </div>
        )}
      </Card>

      {/* Beneficiaries */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="sans text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Beneficiaries
            <span className="ml-2 normal-case" style={{ color: totalShares === 10000 ? 'var(--success)' : 'var(--danger)' }}>
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
                className="sans w-20 rounded-xl border px-3 py-2 text-xs outline-none tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
                min={1}
                max={10000}
              />
              <span className="sans w-10 text-center text-xs" style={{ color: 'var(--muted)' }}>
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
          <p className="sans text-xs" style={{ color: 'var(--danger)' }}>Shares must sum to 10000 basis points (= 100%)</p>
        )}
      </Card>

      {/* Summary */}
      {canSubmit && (
        <Card inner className="px-4 py-3 space-y-1">
          {beneficiaries.map((b, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="mono" style={{ color: 'var(--muted)' }}>{formatAddress(b.addr)}</span>
              <span className="sans tabular-nums font-semibold" style={{ color: 'var(--ink)' }}>{(parseInt(b.share) / 100).toFixed(1)}%</span>
            </div>
          ))}
        </Card>
      )}

      {/* CTA */}
      <TxButton
        label={ctaLabel}
        onClick={ctaOnClick}
        isPending={(isApproving ? approvePending : createPending) || isSwitching}
        isConfirming={isApproving ? approveConfirming : createConfirming}
        isSuccess={isApproving ? approveSuccess : createSuccess}
        hash={isApproving ? approveHash : createHash}
        disabled={!canSubmit}
        variant={wrongChain ? 'danger' : 'primary'}
      />
    </div>
  )
}
