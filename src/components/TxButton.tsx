'use client'

import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { explorerTx } from '@/lib/contract'

interface TxButtonProps {
  label: string
  onClick: () => void
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  hash?: `0x${string}` | string
  disabled?: boolean
  variant?: 'primary' | 'success' | 'danger'
  fullWidth?: boolean
}

const BG: Record<NonNullable<TxButtonProps['variant']>, string> = {
  primary: 'var(--accent)',
  success: 'var(--success)',
  danger:  'var(--danger)',
}

export function TxButton({
  label, onClick, isPending, isConfirming, isSuccess,
  hash, disabled, variant = 'primary', fullWidth = true,
}: TxButtonProps) {
  const isLoading = isPending || isConfirming
  const bg = isSuccess ? 'var(--success)' : BG[variant]

  const inner = isLoading ? (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="size-4 animate-spin" />
      {isPending ? 'Confirm in wallet…' : 'Confirming on Arc…'}
    </span>
  ) : isSuccess ? (
    <span className="flex items-center justify-center gap-2">
      <CheckCircle2 className="size-4" />
      Done!
    </span>
  ) : (
    label
  )

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className="relative overflow-hidden rounded-2xl py-3.5 text-sm font-semibold text-white
          transition-all duration-150 select-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-1
          disabled:cursor-not-allowed disabled:opacity-40
          active:scale-[0.98] hover:brightness-110"
        style={{
          background: bg,
          width: fullWidth ? '100%' : undefined,
          display: fullWidth ? 'block' : 'inline-block',
        }}
      >
        {inner}
      </button>

      {isSuccess && hash && (
        <a
          href={explorerTx(hash as string)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs font-medium
            transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent-hover)' }}
        >
          View on ArcScan <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  )
}
