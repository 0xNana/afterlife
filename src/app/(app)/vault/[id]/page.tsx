'use client'

import { use, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import Link from 'next/link'
import { ArrowLeft, Heart, ExternalLink, Plus, Minus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { Countdown } from '@/components/Countdown'
import { TxButton } from '@/components/TxButton'
import { Btn } from '@/components/Btn'
import { Sheet } from '@/components/Sheet'
import { useVault, useVaultDeadline, useUsdcBalance, useUsdcAllowance } from '@/hooks/useVault'
import { useChainGuard } from '@/hooks/useChainGuard'
import { EmailRegistration } from '@/components/EmailRegistration'
import {
  AFTERLIFE_ADDRESS, AFTERLIFE_ABI, ERC20_ABI, USDC_ADDRESS,
  VaultStatus, parseUsdc, formatUsdc, formatDuration,
  decodeBytes32Name, formatAddress, explorerAddr,
} from '@/lib/contract'

export default function VaultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = use(params)
  const id = BigInt(idStr)

  const { address } = useAccount()
  const { wrongChain, ensureChain } = useChainGuard()
  const { data: vault, refetch } = useVault(id)
  const { data: deadlineTs } = useVaultDeadline(id)
  const { data: usdcBalance } = useUsdcBalance(address)
  const { data: allowance, refetch: refetchAllowance } = useUsdcAllowance(address, AFTERLIFE_ADDRESS)

  const [depositSheet, setDepositSheet] = useState(false)
  const [withdrawSheet, setWithdrawSheet] = useState(false)
  const [depositAmt, setDepositAmt] = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('')

  const { writeContract, data: hash, isPending, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  if (!vault) {
    return (
      <div className="space-y-4 py-10">
        <div className="h-40 animate-pulse rounded-3xl" style={{ background: 'rgba(18,45,69,0.06)' }} />
      </div>
    )
  }

  const [owner, name, window, lastCheckIn, balance, releasedBalance, status, beneficiaryAddrs, beneficiaryShares] = vault
  const displayName = decodeBytes32Name(name as string)
  const isOwner = address?.toLowerCase() === (owner as string).toLowerCase()
  const statusNum = Number(status)
  const isActive = statusNum === VaultStatus.Active
  const isReleased = statusNum === VaultStatus.Released
  const depositRaw = parseUsdc(depositAmt)
  const withdrawRaw = parseUsdc(withdrawAmt)
  const needsApproval = depositRaw > 0n && (allowance ?? 0n) < depositRaw

  function handleSuccess(msg: string) {
    toast.success(msg)
    setTimeout(() => { void refetch() }, 2000)
    reset()
  }

  if (isSuccess) {
    handleSuccess('Transaction confirmed!')
    setDepositSheet(false)
    setWithdrawSheet(false)
  }

  const doCheckIn = () => {
    if (!ensureChain()) return
    writeContract({ address: AFTERLIFE_ADDRESS, abi: AFTERLIFE_ABI, functionName: 'checkIn', args: [id] })
  }

  const doRelease = () => {
    if (!ensureChain()) return
    writeContract({ address: AFTERLIFE_ADDRESS, abi: AFTERLIFE_ABI, functionName: 'release', args: [id] })
  }

  const doClaimAll = () => {
    if (!ensureChain()) return
    writeContract({ address: AFTERLIFE_ADDRESS, abi: AFTERLIFE_ABI, functionName: 'claimAll', args: [id] })
  }

  const doClose = () => {
    if (!ensureChain()) return
    writeContract({ address: AFTERLIFE_ADDRESS, abi: AFTERLIFE_ABI, functionName: 'close', args: [id] })
  }

  const doDeposit = () => {
    if (!ensureChain()) return
    if (needsApproval) {
      writeContract({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'approve', args: [AFTERLIFE_ADDRESS, depositRaw] })
      setTimeout(() => void refetchAllowance(), 3000)
      return
    }
    writeContract({ address: AFTERLIFE_ADDRESS, abi: AFTERLIFE_ABI, functionName: 'deposit', args: [id, depositRaw] })
  }

  const doWithdraw = () => {
    if (!ensureChain()) return
    writeContract({ address: AFTERLIFE_ADDRESS, abi: AFTERLIFE_ABI, functionName: 'withdraw', args: [id, withdrawRaw] })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="size-4" /> My Vaults
      </Link>

      {/* Hero card */}
      <Card className="p-6" spectralTop>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>{displayName}</h1>
              <StatusBadge status={statusNum} />
            </div>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
              Vault #{id.toString()} · Owner:{' '}
              <a href={explorerAddr(owner as string)} target="_blank" rel="noreferrer" className="mono inline-flex items-center gap-0.5 hover:underline">
                {formatAddress(owner as string)} <ExternalLink className="size-2.5" />
              </a>
            </p>
          </div>
        </div>

        {/* Balance */}
        <div className="mt-5">
          <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            {isReleased ? 'Locked at Release' : 'Current Balance'}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="display text-4xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
              {formatUsdc(isReleased ? (releasedBalance as bigint) : (balance as bigint))}
            </span>
            <span className="text-lg font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
          </div>
          {isReleased && BigInt(balance as bigint) < BigInt(releasedBalance as bigint) && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
              {formatUsdc(balance as bigint)} USDC remaining (partially claimed)
            </p>
          )}
        </div>

        {/* Countdown */}
        {isActive && deadlineTs && (
          <div className="mt-5 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.46)', border: '1px solid rgba(255,255,255,0.56)' }}>
            <Countdown deadline={Number(deadlineTs)} />
            <p className="mt-2 text-xs" style={{ color: 'var(--subtle)' }}>
              Window: {formatDuration(window as bigint)} · Last check-in: {new Date(Number(lastCheckIn as bigint) * 1000).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Owner actions */}
        {isOwner && isActive && (
          <div className="mt-4 flex flex-wrap gap-2">
            <TxButton
              label="I'm Alive"
              onClick={doCheckIn}
              isPending={isPending}
              isConfirming={isConfirming}
              isSuccess={isSuccess}
              hash={hash}
              variant="success"
            />
            <Btn variant="secondary" onClick={() => setDepositSheet(true)}>
              <Plus className="size-4" /> Add USDC
            </Btn>
            <Btn variant="secondary" onClick={() => setWithdrawSheet(true)}>
              <Minus className="size-4" /> Withdraw
            </Btn>
            <Btn variant="danger" onClick={doClose} disabled={isPending || isConfirming}>
              <X className="size-4" /> Close Vault
            </Btn>
          </div>
        )}

        {/* Release / Claim */}
        {isActive && deadlineTs && Number(deadlineTs) < Math.floor(Date.now() / 1000) && (balance as bigint) > 0n && (
          <div className="mt-4">
            <TxButton label="Trigger Release" onClick={doRelease} isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} hash={hash} />
          </div>
        )}

        {isReleased && (balance as bigint) > 0n && (
          <div className="mt-4">
            <TxButton label="Pay Everyone" onClick={doClaimAll} isPending={isPending} isConfirming={isConfirming} isSuccess={isSuccess} hash={hash} variant="success" />
          </div>
        )}
      </Card>

      {/* Beneficiaries */}
      <Card className="p-5">
        <h2 className="display mb-4 text-sm font-bold" style={{ color: 'var(--ink)' }}>
          Beneficiaries ({(beneficiaryAddrs as string[]).length})
        </h2>
        <div className="space-y-2">
          {(beneficiaryAddrs as string[]).map((addr, i) => {
            const share = (beneficiaryShares as number[])[i]
            const payout = isReleased ? (BigInt(releasedBalance as bigint) * BigInt(share)) / 10000n : 0n
            return (
              <div
                key={addr}
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ background: 'rgba(18,45,69,0.04)' }}
              >
                <div>
                  <a href={explorerAddr(addr)} target="_blank" rel="noreferrer" className="mono flex items-center gap-1 text-xs hover:underline" style={{ color: 'var(--ink)' }}>
                    {formatAddress(addr)} <ExternalLink className="size-2.5" />
                  </a>
                  {address?.toLowerCase() === addr.toLowerCase() && (
                    <span className="text-xs" style={{ color: 'var(--accent-hover)' }}>You</span>
                  )}
                  <EmailRegistration
                    vaultId={id.toString()}
                    address={addr}
                    role="beneficiary"
                    label="Get notified when released"
                  />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>{(share / 100).toFixed(1)}%</p>
                  {isReleased && (
                    <p className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>≈ {formatUsdc(payout)} USDC</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Per-beneficiary claim buttons */}
        {isReleased && (
          <div className="mt-4 space-y-2">
            {(beneficiaryAddrs as string[]).map((addr, i) => (
              <div key={addr} className="flex items-center justify-between">
                <span className="mono text-xs" style={{ color: 'var(--muted)' }}>{formatAddress(addr)}</span>
                <Btn size="sm" onClick={() => {
                  if (!ensureChain()) return
                  writeContract({ address: AFTERLIFE_ADDRESS, abi: AFTERLIFE_ABI, functionName: 'claim', args: [id, BigInt(i)] })
                }} disabled={isPending || isConfirming}>
                  <Heart className="size-3" /> Claim
                </Btn>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Owner deadline notifications */}
      {isOwner && isActive && (
        <Card className="p-5 space-y-3">
          <h2 className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>Check-in reminders</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Get an email reminder 24 h and 4 h before your vault expires.
          </p>
          <EmailRegistration
            vaultId={id.toString()}
            address={owner as string}
            role="owner"
            label="Reminder email"
          />
        </Card>
      )}

      {/* Deposit sheet */}
      <Sheet open={depositSheet} onClose={() => setDepositSheet(false)} title="Add USDC" spectral>
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.46)', border: '1px solid rgba(255,255,255,0.56)' }}>
            <input
              inputMode="decimal"
              value={depositAmt}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '')
                if (v === '' || /^\d*\.?\d*$/.test(v)) setDepositAmt(v)
              }}
              placeholder="0.00"
              className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:opacity-20"
              style={{ color: 'var(--ink)' }}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
              {usdcBalance !== undefined && (
                <button
                  onClick={() => setDepositAmt(formatUsdc(usdcBalance as bigint).replace(/,/g, ''))}
                  className="text-xs font-semibold"
                  style={{ color: 'var(--accent-hover)' }}
                >
                  Max: {formatUsdc(usdcBalance as bigint)}
                </button>
              )}
            </div>
          </div>
          <TxButton
            label={needsApproval ? 'Approve USDC' : 'Add to Vault'}
            onClick={doDeposit}
            isPending={isPending}
            isConfirming={isConfirming}
            isSuccess={isSuccess}
            hash={hash}
            disabled={depositRaw === 0n}
          />
        </div>
      </Sheet>

      {/* Withdraw sheet */}
      <Sheet open={withdrawSheet} onClose={() => setWithdrawSheet(false)} title="Withdraw USDC" spectral>
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.46)', border: '1px solid rgba(255,255,255,0.56)' }}>
            <input
              inputMode="decimal"
              value={withdrawAmt}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '')
                if (v === '' || /^\d*\.?\d*$/.test(v)) setWithdrawAmt(v)
              }}
              placeholder="0.00"
              className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:opacity-20"
              style={{ color: 'var(--ink)' }}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
              <button
                onClick={() => setWithdrawAmt(formatUsdc(balance as bigint).replace(/,/g, ''))}
                className="text-xs font-semibold"
                style={{ color: 'var(--accent-hover)' }}
              >
                Max: {formatUsdc(balance as bigint)}
              </button>
            </div>
          </div>
          <TxButton
            label="Withdraw"
            onClick={doWithdraw}
            isPending={isPending}
            isConfirming={isConfirming}
            isSuccess={isSuccess}
            hash={hash}
            disabled={withdrawRaw === 0n || withdrawRaw > (balance as bigint)}
          />
        </div>
      </Sheet>
    </div>
  )
}
