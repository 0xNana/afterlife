'use client'

import { useEffect, useState } from 'react'

function splitCountdown(secs: number): { days: number; hours: number; mins: number; secs: number } {
  const s = Math.max(0, secs)
  return {
    days:  Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins:  Math.floor((s % 3600) / 60),
    secs:  s % 60,
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

type Urgency = 'ok' | 'warning' | 'danger' | 'expired'

function urgency(remaining: number, window: number): Urgency {
  if (remaining <= 0)               return 'expired'
  if (remaining < 3600 * 4)         return 'danger'   // < 4 h
  if (remaining < 86400 * 3)        return 'warning'  // < 3 d
  return 'ok'
}

const URGENCY_COLORS: Record<Urgency, { text: string; bar: string; track: string }> = {
  ok:      { text: 'var(--success)', bar: 'var(--success)', track: 'rgba(22,163,74,0.12)' },
  warning: { text: 'var(--warning)', bar: '#f59e0b', track: 'rgba(245,158,11,0.12)' },
  danger:  { text: 'var(--danger)',  bar: 'linear-gradient(90deg,#f05c6b,#ffcd83)', track: 'rgba(190,18,60,0.10)' },
  expired: { text: 'var(--danger)',  bar: 'var(--danger)', track: 'rgba(190,18,60,0.10)' },
}

interface CountdownProps {
  deadline: number
  /** Full window in seconds — used to compute the progress bar width */
  windowSecs?: number
}

export function Countdown({ deadline, windowSecs }: CountdownProps) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = deadline - now
  const u = urgency(remaining, windowSecs ?? 365 * 86400)
  const c = URGENCY_COLORS[u]
  const pct = windowSecs
    ? Math.max(0, Math.min(100, (remaining / windowSecs) * 100))
    : Math.max(0, Math.min(100, (remaining / (365 * 86400)) * 100))

  if (u === 'expired') {
    return (
      <div className="space-y-1.5">
        <p className="display text-sm font-bold" style={{ color: 'var(--danger)' }}>
          Deadline passed
        </p>
        <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: c.track }}>
          <div className="h-full rounded-full" style={{ width: '100%', background: c.bar }} />
        </div>
      </div>
    )
  }

  const { days, hours, mins, secs } = splitCountdown(remaining)

  return (
    <div className="space-y-2">
      {/* Time units */}
      <div className="flex items-end gap-3">
        {days > 0 && (
          <div className="text-center">
            <span className="display text-2xl font-bold tabular-nums leading-none" style={{ color: c.text }}>
              {days}
            </span>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--subtle)' }}>
              {days === 1 ? 'day' : 'days'}
            </p>
          </div>
        )}
        <div className="text-center">
          <span className="display text-2xl font-bold tabular-nums leading-none" style={{ color: c.text }}>
            {pad(hours)}
          </span>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--subtle)' }}>h</p>
        </div>
        <div className="text-center">
          <span className="display text-2xl font-bold tabular-nums leading-none" style={{ color: c.text }}>
            {pad(mins)}
          </span>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--subtle)' }}>m</p>
        </div>
        {days === 0 && (
          <div className="text-center">
            <span className="display text-2xl font-bold tabular-nums leading-none" style={{ color: c.text }}>
              {pad(secs)}
            </span>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--subtle)' }}>s</p>
          </div>
        )}
        <p className="mb-0.5 ml-auto text-xs" style={{ color: 'var(--subtle)' }}>until trigger</p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: c.track }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: c.bar }}
        />
      </div>
    </div>
  )
}
