'use client'

import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { ReactNode, CSSProperties } from 'react'

interface BtnProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
  style?: CSSProperties
}

const VARIANTS: Record<NonNullable<BtnProps['variant']>, CSSProperties> = {
  primary:   { background: 'var(--accent)', color: '#fff' },
  secondary: { background: 'rgba(15,35,54,0.07)', color: 'var(--ink)' },
  danger:    { background: 'var(--danger-bg)', color: 'var(--danger)' },
  ghost:     { background: 'transparent', color: 'var(--muted)' },
  success:   { background: 'var(--success-bg)', color: 'var(--success)' },
}

const HOVER: Record<NonNullable<BtnProps['variant']>, string> = {
  primary:   'hover:brightness-110',
  secondary: 'hover:bg-black/[0.09]',
  danger:    'hover:brightness-95',
  ghost:     'hover:bg-black/[0.04]',
  success:   'hover:brightness-95',
}

export function Btn({
  children, onClick, disabled, loading, variant = 'primary',
  size = 'md', className, type = 'button', fullWidth, style,
}: BtnProps) {
  const sizes = {
    xs: 'h-6 px-2.5 text-xs rounded-xl gap-1',
    sm: 'h-8 px-3   text-xs rounded-[14px] gap-1.5',
    md: 'h-10 px-4  text-sm rounded-2xl gap-2',
    lg: 'h-12 px-6  text-sm rounded-2xl gap-2',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'active:scale-[0.97]',
        HOVER[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      style={{ ...VARIANTS[variant], ...style }}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  )
}
