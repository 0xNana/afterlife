'use client'

import { useEffect, useState } from 'react'
import { formatCountdown } from '@/lib/contract'

export function Countdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = deadline - now
  const expired = remaining <= 0
  const pct = Math.max(0, Math.min(100, (remaining / (deadline - (deadline - 365 * 86400))) * 100))

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span
          className="display text-2xl font-bold tabular-nums"
          style={{ color: expired ? 'var(--danger)' : 'var(--ink)' }}
        >
          {formatCountdown(remaining)}
        </span>
        {!expired && (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>until inheritance triggers</span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(18,45,69,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: expired
              ? 'var(--danger)'
              : pct < 20
              ? 'linear-gradient(90deg, #f05c6b, #ffcd83)'
              : 'var(--success)',
          }}
        />
      </div>
    </div>
  )
}
