'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectKitButton } from 'connectkit'
import { Shield, LayoutDashboard, Plus, Heart, Search, Menu, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'

const LINKS = [
  { href: '/dashboard',   label: 'My Vaults',     icon: LayoutDashboard },
  { href: '/create',      label: 'Create',         icon: Plus },
  { href: '/inheritances',label: 'Inheritances',   icon: Heart },
  { href: '/explore',     label: 'Explore',        icon: Search },
]

export function Nav() {
  const path = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.76)',
          backdropFilter: 'blur(24px) saturate(190%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          borderBottom: '1px solid rgba(15,35,54,0.08)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 select-none">
            <div
              className="flex size-8 items-center justify-center rounded-[10px] shadow-sm"
              style={{ background: 'var(--accent)' }}
            >
              <Shield className="size-[15px] text-white" strokeWidth={2.2} />
            </div>
            <span className="display text-[15px] font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
              Afterlife
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 sm:flex">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = path === href || (href !== '/' && path.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all',
                    active
                      ? 'text-white shadow-sm'
                      : 'hover:bg-black/[0.05]',
                  )}
                  style={
                    active
                      ? { background: 'var(--accent)', color: 'white' }
                      : { color: 'var(--ink-2)' }
                  }
                >
                  <Icon className="size-3.5" strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ConnectKitButton />
            {/* Mobile hamburger */}
            <button
              className="flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-black/[0.05] sm:hidden"
              style={{ color: 'var(--ink)' }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            className="border-t px-4 pb-4 pt-2 sm:hidden animate-fade-in"
            style={{ borderColor: 'var(--border)' }}
          >
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = path === href || (href !== '/' && path.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active ? 'text-white' : 'hover:bg-black/[0.05]',
                  )}
                  style={
                    active
                      ? { background: 'var(--accent)', color: 'white' }
                      : { color: 'var(--ink-2)' }
                  }
                >
                  <Icon className="size-4" strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </header>
    </>
  )
}
