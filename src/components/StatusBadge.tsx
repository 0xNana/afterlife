'use client'

import { clsx } from 'clsx'
import { VaultStatus, statusLabel } from '@/lib/contract'

const CONFIG: Record<number, { dot: string; bg: string; color: string }> = {
  [VaultStatus.None]:     { dot: '#94a3b8', bg: 'rgba(148,163,184,0.12)', color: '#64748b' },
  [VaultStatus.Active]:   { dot: '#16a34a', bg: 'rgba(22,163,74,0.10)',   color: '#15803d' },
  [VaultStatus.Released]: { dot: '#2563eb', bg: 'rgba(37,99,235,0.10)',   color: '#1d4ed8' },
  [VaultStatus.Closed]:   { dot: '#be123c', bg: 'rgba(190,18,60,0.08)',   color: '#9f1239' },
}

export function StatusBadge({ status }: { status: number }) {
  const c = CONFIG[status] ?? CONFIG[0]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      <span
        className={clsx('size-1.5 rounded-full', status === VaultStatus.Active && 'relative')}
        style={{ background: c.dot }}
      >
        {status === VaultStatus.Active && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: c.dot, opacity: 0.5 }}
          />
        )}
      </span>
      {statusLabel(status)}
    </span>
  )
}
