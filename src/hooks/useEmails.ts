'use client'

/**
 * useEmails — fetch and register beneficiary emails for a vault.
 * All requests go through /api/emails (Next.js proxy → backend :3001).
 */

import { useState, useEffect } from 'react'
import { useWalletClient } from 'wagmi'

export type EmailEntry = { beneficiary: string; email: string }

const API = '/api'

function signatureMessage(action: string, vaultId: string, address: string) {
  return `afterlife:${action}:${vaultId}:${address.toLowerCase()}`
}

export function useVaultEmails(vaultId: string | undefined) {
  const [emails, setEmails] = useState<EmailEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!vaultId) return
    setLoading(true)
    fetch(`${API}/emails/${vaultId}`)
      .then((r) => r.json())
      .then((d) => setEmails(d.emails ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [vaultId])

  return { emails, loading, refetch: () => {
    if (!vaultId) return
    fetch(`${API}/emails/${vaultId}`)
      .then((r) => r.json())
      .then((d) => setEmails(d.emails ?? []))
      .catch(console.error)
  }}
}

export function useRegisterEmail() {
  const { data: walletClient } = useWalletClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function registerEmail(vaultId: string, beneficiary: string, email: string) {
    if (!walletClient) { setError('Wallet not connected'); return false }
    setLoading(true); setError(null)
    try {
      const message = signatureMessage('register', vaultId, beneficiary)
      const signature = await walletClient.signMessage({ message })
      const res = await fetch(`${API}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId, beneficiary, email, signature }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return false }
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function registerOwnerEmail(vaultId: string, owner: string, email: string) {
    if (!walletClient) { setError('Wallet not connected'); return false }
    setLoading(true); setError(null)
    try {
      const message = signatureMessage('owner-email', vaultId, owner)
      const signature = await walletClient.signMessage({ message })
      const res = await fetch(`${API}/owner-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId, owner, email, signature }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return false }
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function unregisterEmail(vaultId: string, beneficiary: string) {
    if (!walletClient) { setError('Wallet not connected'); return false }
    setLoading(true); setError(null)
    try {
      const message = signatureMessage('unregister', vaultId, beneficiary)
      const signature = await walletClient.signMessage({ message })
      const res = await fetch(`${API}/emails`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId, beneficiary, signature }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return false }
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { registerEmail, registerOwnerEmail, unregisterEmail, loading, error }
}
