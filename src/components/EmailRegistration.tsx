'use client'

/**
 * EmailRegistration — lets a beneficiary (or owner) register/update their
 * email address so they receive notifications when the vault is released.
 *
 * Used in:
 *   - Vault Detail page (for beneficiaries viewing a vault they're named in)
 *   - Inheritances page (per-vault card)
 *
 * The component signs a short message with the connected wallet to prove
 * ownership of the address, then POSTs to /api/emails.
 */

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Mail, CheckCircle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRegisterEmail, useVaultEmails } from '@/hooks/useEmails'
import { Btn } from './Btn'

interface Props {
  vaultId: string
  /** The address being registered (beneficiary OR owner for deadline warnings) */
  address: string
  /** 'beneficiary' | 'owner' — determines which endpoint is called */
  role: 'beneficiary' | 'owner'
  /** Optional label shown above the input */
  label?: string
}

export function EmailRegistration({ vaultId, address, role, label }: Props) {
  const { address: connected } = useAccount()
  const { emails, refetch } = useVaultEmails(vaultId)
  const { registerEmail, registerOwnerEmail, loading, error } = useRegisterEmail()

  const existing = emails.find((e) => e.beneficiary.toLowerCase() === address.toLowerCase())?.email
  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(false)

  // Only let the connected address register their own email
  const isMe = connected?.toLowerCase() === address.toLowerCase()

  if (!isMe) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const ok = role === 'owner'
      ? await registerOwnerEmail(vaultId, address, input.trim())
      : await registerEmail(vaultId, address, input.trim())
    if (ok) {
      toast.success('Email registered — you\'ll receive notifications.')
      setEditing(false)
      setInput('')
      refetch()
    } else {
      toast.error(error ?? 'Failed to register email')
    }
  }

  if (existing && !editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(26,128,71,0.07)', border: '1px solid rgba(26,128,71,0.15)' }}>
        <CheckCircle className="size-3.5 shrink-0" style={{ color: 'var(--success)' }} />
        <span className="flex-1 text-xs" style={{ color: 'var(--success)' }}>
          {label ?? 'Notifications'}: <strong>{existing}</strong>
        </span>
        <button
          onClick={() => { setInput(existing); setEditing(true) }}
          className="text-xs underline opacity-60 hover:opacity-100"
          style={{ color: 'var(--muted)' }}
        >
          Edit
        </button>
      </div>
    )
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
        style={{ color: 'var(--muted)' }}
      >
        <Mail className="size-3.5" />
        {label ?? 'Add email for notifications'}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
        {label ?? 'Email for notifications'}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
          className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--ink)' }}
        />
        <Btn type="submit" size="sm" disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : 'Save'}
        </Btn>
        <button
          type="button"
          onClick={() => { setEditing(false); setInput('') }}
          style={{ color: 'var(--muted)' }}
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="text-xs" style={{ color: 'var(--subtle)' }}>
        You'll sign a message to prove you own this address. No private key is shared.
      </p>
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
    </form>
  )
}
