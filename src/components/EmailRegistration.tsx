'use client'

import { useState } from 'react'
import { useSignMessage } from 'wagmi'
import { Bell, BellOff, Check, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Btn } from '@/components/Btn'
import { useEmailForAddress } from '@/hooks/useEmails'

interface EmailRegistrationProps {
  vaultId: string
  address: string
  role: 'beneficiary' | 'owner'
  label?: string
}

export function EmailRegistration({ vaultId, address, role, label = 'Get notified by email' }: EmailRegistrationProps) {
  const [editing, setEditing] = useState(false)
  const [inputEmail, setInputEmail] = useState('')
  const { signMessage, isPending: isSigning } = useSignMessage()
  const { email, isLoading, register, unregister } = useEmailForAddress(vaultId, address)

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)

  async function handleRegister() {
    if (!isValidEmail) return
    const msg = `Afterlife: register ${inputEmail} for vault ${vaultId} (${role})`
    signMessage(
      { message: msg },
      {
        onSuccess: async (sig) => {
          const ok = await register(inputEmail, sig, msg)
          if (ok) {
            toast.success('Email registered.')
            setEditing(false)
            setInputEmail('')
          } else {
            toast.error('Failed to register email. Try again.')
          }
        },
        onError: () => toast.error('Signature cancelled.'),
      },
    )
  }

  async function handleUnregister() {
    const msg = `Afterlife: unregister email for vault ${vaultId} (${role})`
    signMessage(
      { message: msg },
      {
        onSuccess: async (sig) => {
          const ok = await unregister(sig, msg)
          if (ok) toast.success('Email removed.')
          else toast.error('Failed to remove email.')
        },
        onError: () => toast.error('Signature cancelled.'),
      },
    )
  }

  if (isLoading) return null

  // Registered state
  if (email && !editing) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
          style={{
            background: 'rgba(90,156,106,0.10)',
            border: '1px solid rgba(90,156,106,0.20)',
            color: 'var(--success)',
            fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 500,
          }}
        >
          <Check className="size-3" />
          {email}
        </span>
        <button
          onClick={handleUnregister}
          className="flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: 'var(--subtle)' }}
          title="Remove email"
        >
          <BellOff className="size-3" />
        </button>
      </div>
    )
  }

  // Editing
  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-1.5"
          style={{
            background: 'rgba(255,248,238,0.04)',
            borderColor: isValidEmail ? 'rgba(90,156,106,0.45)' : 'rgba(255,248,238,0.12)',
          }}
        >
          <Mail className="size-3.5 shrink-0" style={{ color: 'var(--subtle)' }} />
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            placeholder="your@email.com"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            style={{
              color: 'var(--ink)',
              fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
            }}
            autoFocus
          />
        </div>
        <Btn
          size="xs"
          onClick={handleRegister}
          disabled={!isValidEmail || isSigning}
          loading={isSigning}
        >
          {isSigning ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
        </Btn>
        <Btn
          size="xs"
          variant="ghost"
          onClick={() => { setEditing(false); setInputEmail('') }}
        >
          ✕
        </Btn>
      </div>
    )
  }

  // Default: prompt
  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
      style={{
        color: 'var(--subtle)',
        fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      <Bell className="size-3" />
      {label}
    </button>
  )
}
