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

const spring = { type: 'spring', damping: 32, stiffness: 300, mass: 0.8 } as const

export function Sheet({ open, onClose, title, children, spectral }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.section
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
          >
            {spectral && (
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)' }} />
            )}
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="display text-base font-bold" style={{ color: 'var(--ink)' }}>{title}</h2>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                style={{ color: 'var(--muted)' }}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[80dvh] overflow-y-auto px-5 pb-8 pt-4">
              {children}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
