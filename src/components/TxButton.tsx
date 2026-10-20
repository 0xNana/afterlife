'use client'

import { Loader2, ExternalLink } from 'lucide-react'
import { explorerTx } from '@/lib/contract'

interface TxButtonProps {
  label: string
  onClick: () => void
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  hash?: string
  disabled?: boolean
  variant?: 'primary' | 'success' | 'danger'
}

export function TxButton({ label, onClick, isPending, isConfirming, isSuccess, hash, disabled, variant = 'primary' }: TxButtonProps) {
  const bg = {
    primary: 'var(--accent)',
    success: 'var(--success)',
    danger: 'var(--danger)',
  }[variant]

  const isLoading = isPending || isConfirming

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: isSuccess ? 'var(--success)' : bg }}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {isPending ? 'Confirm in wallet…'
          : isConfirming ? 'Confirming…'
          : isSuccess ? 'Done!'
          : label}
      </button>
      {isSuccess && hash && (
        <a
          href={explorerTx(hash)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs"
          style={{ color: 'var(--accent-hover)' }}
        >
          View on ArcScan <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  )
}
