'use client'

import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  inner?: boolean
  spectralTop?: boolean
}

export function Card({ children, className, inner, spectralTop }: CardProps) {
  const glass = inner
    ? {
        background: 'rgba(255,255,255,0.46)',
        border: '1px solid rgba(255,255,255,0.56)',
      }
    : {
        background: 'rgba(255,255,255,0.64)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.68)',
        boxShadow: '0 8px 32px rgba(18,45,69,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
      }

  return (
    <div className={clsx('rounded-3xl overflow-hidden', className)} style={glass}>
      {spectralTop && (
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)' }} />
      )}
      {children}
    </div>
  )
}
