'use client'

import { clsx } from 'clsx'
import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  inner?: boolean
  spectralTop?: boolean
  hover?: boolean
  style?: CSSProperties
}

export function Card({ children, className, inner, spectralTop, hover, style }: CardProps) {
  const base = inner
    ? 'glass-inner rounded-2xl'
    : clsx(
        'glass-card rounded-3xl overflow-hidden',
        hover && 'transition-shadow duration-200 hover:shadow-[0_8px_32px_rgba(15,35,54,0.10)]',
      )

  return (
    <div className={clsx(base, className)} style={style}>
      {spectralTop && (
        <div className="h-[3px] w-full" style={{ background: 'var(--spectral)' }} />
      )}
      {children}
    </div>
  )
}
