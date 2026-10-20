'use client'

import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface BtnProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
}

export function Btn({
  children, onClick, disabled, loading, variant = 'primary',
  size = 'md', className, type = 'button', fullWidth,
}: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] hover:scale-[1.01]'

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-sm',
  }

  const variants = {
    primary: { background: 'var(--accent)', color: 'white' },
    secondary: { background: 'rgba(18,45,69,0.07)', color: 'var(--ink)' },
    danger: { background: 'rgba(186,43,76,0.1)', color: 'var(--danger)' },
    ghost: { background: 'transparent', color: 'var(--muted)' },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(base, sizes[size], fullWidth && 'w-full', className)}
      style={variants[variant]}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
