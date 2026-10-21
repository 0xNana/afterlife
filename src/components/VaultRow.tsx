'use client'

import Link from 'next/link'
import { ArrowRight, AlertTriangle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
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
    return <div className="skeleton h-28" />
  }
  if (!data) return null

  const [, name, windowSecs, , balance, , status] = data
  const displayName = decodeBytes32Name(name as string)
  const statusNum = Number(status)
  const isActive = statusNum === VaultStatus.Active
  const remaining = deadlineTs ? Number(deadlineTs) - Math.floor(Date.now() / 1000) : Infinity
  const isExpiredSoon = isActive && remaining < 7 * 86400 && remaining > 0
  const isExpired = isActive && remaining <= 0

  return (
    <Link href={`/vault/${id}`} className="block group">
      <motion.div
        whileHover={{ y: -1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <Card
          className="p-5 cursor-pointer transition-shadow duration-200 group-hover:shadow-[0_6px_24px_rgba(15,35,54,0.10)]"
          spectralTop={isExpiredSoon || isExpired}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="display truncate text-base font-bold" style={{ color: 'var(--ink)' }}>
                  {displayName}
                </span>
                <StatusBadge status={statusNum} />
                {(isExpiredSoon || isExpired) && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}
                  >
                    <AlertTriangle className="size-3" />
                    {isExpired ? 'Expired' : 'Expiring soon'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--subtle)' }}>
                <Clock className="size-3" />
                <span>Vault #{id.toString()}</span>
              </div>

              {isActive && deadlineTs && (
                <div className="mt-3">
                  <Countdown
                    deadline={Number(deadlineTs)}
                    windowSecs={Number(windowSecs as bigint)}
                  />
                </div>
              )}
            </div>

            {/* Right */}
            <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
              <div className="text-right">
                <p className="display text-xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                  {formatUsdc(balance as bigint)}
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>USDC</p>
              </div>
              {showActions && (
                <ArrowRight
                  className="size-4 transition-all duration-200 group-hover:translate-x-0.5"
                  style={{ color: 'var(--subtle)' }}
                />
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  )
}
