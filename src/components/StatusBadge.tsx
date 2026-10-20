'use client'

import { VaultStatus, statusLabel } from '@/lib/contract'

export function StatusBadge({ status }: { status: number }) {
  const styles: Record<number, { bg: string; color: string }> = {
    [VaultStatus.None]:     { bg: 'rgba(139,132,156,0.12)', color: '#6b6580' },
    [VaultStatus.Active]:   { bg: 'rgba(26,128,71,0.12)',   color: '#1a8047' },
    [VaultStatus.Released]: { bg: 'rgba(16,97,166,0.12)',   color: '#1061a6' },
    [VaultStatus.Closed]:   { bg: 'rgba(186,43,76,0.10)',   color: '#ba2b4c' },
  }
  const s = styles[status] ?? styles[0]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {statusLabel(status)}
    </span>
  )
}
