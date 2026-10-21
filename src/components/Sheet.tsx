'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  spectral?: boolean
}

const SHEET_SPRING = { type: 'spring', stiffness: 400, damping: 36, mass: 0.8 } as const
const OVERLAY_TRANSITION = { duration: 0.2, ease: 'easeOut' } as const

export function Sheet({ open, onClose, title, children, spectral }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={OVERLAY_TRANSITION}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />

          {/* Sheet panel */}
          <motion.section
            className="relative w-full max-w-lg overflow-hidden rounded-t-[28px]"
            style={{
              background: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              boxShadow: '0 -4px 40px rgba(15,35,54,0.12)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SHEET_SPRING}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Spectral strip */}
            {spectral && (
              <div className="h-[3px]" style={{ background: 'var(--spectral)' }} />
            )}

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-0">
              <div className="h-1 w-10 rounded-full" style={{ background: 'rgba(15,35,54,0.15)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-2">
              <h2 className="display text-base font-bold" style={{ color: 'var(--ink)' }}>{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/[0.06] active:bg-black/10"
                style={{ color: 'var(--muted)' }}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="h-px mx-5" style={{ background: 'var(--border)' }} />

            {/* Body */}
            <div className="max-h-[78dvh] overflow-y-auto px-5 pb-10 pt-5">
              {children}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
