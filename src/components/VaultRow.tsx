'use client'

import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { Countdown } from '@/components/Countdown'
import { useVault, useVaultDeadline } from '@/hooks/useVault'
import { formatUsdc, decodeBytes32Name, VaultStatus } from '@/lib/contract'

interface VaultRowProps {
  id: bigint
  showActions?: boolean
}

export function VaultRow({ id, showActions }: VaultRowProps) {
  const { data, isLoading } = useVault(id)
  const { data: deadlineTs } = useVaultDeadline(id)

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-3xl" style={{ background: 'rgba(18,45,69,0.06)' }} />
  }
  if (!data) return null

  const [, name, , , balance, , status] = data
  const displayName = decodeBytes32Name(name as string)
  const isActive = Number(status) === VaultStatus.Active
  const isExpiredSoon = deadlineTs && isActive && (Number(deadlineTs) - Math.floor(Date.now() / 1000)) < 7 * 86400

  return (
    <Link href={`/vault/${id}`} className="block">
      <Card className="group cursor-pointer p-5 transition-transform hover:scale-[1.005]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="display truncate text-base font-bold" style={{ color: 'var(--ink)' }}>{displayName}</span>
              <StatusBadge status={Number(status)} />
              {isExpiredSoon && (
                <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'rgba(255,205,131,0.3)', color: '#92400e' }}>
                  <AlertTriangle className="size-3" /> Expiring soon
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>Vault #{id.toString()}</p>

            {isActive && deadlineTs && (
              <div className="mt-3">
                <Countdown deadline={Number(deadlineTs)} />
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="display text-xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                {formatUsdc(balance as bigint)}
              </p>
              <p className="text-xs" style={{ color: 'var(--subtle)' }}>USDC</p>
            </div>
            {showActions && (
              <ArrowRight className="size-4 opacity-30 transition-opacity group-hover:opacity-80" style={{ color: 'var(--ink)' }} />
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
