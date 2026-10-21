'use client'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ConnectKitButton } from 'connectkit'
import { Plus, Shield, ArrowRight } from 'lucide-react'
import { Card } from '@/components/Card'
import { VaultRow } from '@/components/VaultRow'
import { Btn } from '@/components/Btn'
import { useOwnerVaults } from '@/hooks/useVault'

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { data: vaultIds, isLoading } = useOwnerVaults(address)

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-8 py-20 text-center">
        <div
          className="flex size-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent)' }}
        >
          <Shield className="size-8 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Connect your wallet</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Connect to view and manage your vaults</p>
        </div>
        <ConnectKitButton />
        <Link href="/explore" className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--accent-hover)' }}>
          Browse public vaults <ArrowRight className="size-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>My Vaults</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            {isLoading ? '—' : `${vaultIds?.length ?? 0} vault${vaultIds?.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/create">
          <Btn>
            <Plus className="size-4" /> New Vault
          </Btn>
        </Link>
      </div>

      {/* Vault list */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-28" />)}
        </div>
      ) : !vaultIds || vaultIds.length === 0 ? (
        <Card className="p-12 text-center">
          <div
            className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(15,35,54,0.06)' }}
          >
            <Shield className="size-7 opacity-40" style={{ color: 'var(--ink)' }} />
          </div>
          <p className="display text-base font-semibold" style={{ color: 'var(--ink)' }}>No vaults yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm" style={{ color: 'var(--muted)' }}>
            Create your first vault to start planning your digital inheritance.
          </p>
          <Link href="/create" className="mt-5 inline-block">
            <Btn><Plus className="size-4" /> Create Vault</Btn>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {vaultIds.map((id) => (
            <VaultRow key={id.toString()} id={id} showActions />
          ))}
        </div>
      )}
    </div>
  )
}
