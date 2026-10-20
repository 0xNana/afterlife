'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'
import { Shield } from 'lucide-react'
import { clsx } from 'clsx'

const links = [
  { href: '/dashboard', label: 'My Vaults' },
  { href: '/create', label: 'Create' },
  { href: '/inheritances', label: 'Inheritances' },
  { href: '/explore', label: 'Explore' },
]

export function Nav() {
  const path = usePathname()
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo — always back to landing */}
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-xl"
            style={{ background: 'var(--accent)' }}
          >
            <Shield className="size-4 text-white" />
          </div>
          <span className="display text-base font-bold" style={{ color: 'var(--ink)' }}>
            Afterlife
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
                path === l.href ? 'text-white' : 'hover:bg-black/5'
              )}
              style={
                path === l.href
                  ? { background: 'var(--accent)', color: 'white' }
                  : { color: 'var(--ink-2)' }
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Wallet */}
        <ConnectKitButton />
      </div>

      {/* Mobile nav */}
      <div className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              'whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
              path === l.href ? 'text-white' : 'hover:bg-black/5'
            )}
            style={
              path === l.href
                ? { background: 'var(--accent)', color: 'white' }
                : { color: 'var(--ink-2)' }
            }
          >
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  )
}
