'use client'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ConnectKitButton } from 'connectkit'
import { Plus, Shield } from 'lucide-react'
import { Card } from '@/components/Card'
import { VaultRow } from '@/components/VaultRow'
import { Btn } from '@/components/Btn'
import { useOwnerVaults } from '@/hooks/useVault'

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { data: vaultIds, isLoading } = useOwnerVaults(address)

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="mb-6 flex size-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent)' }}
        >
          <Shield className="size-7 text-white" />
        </div>
        <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>
          Connect your wallet
        </h1>
        <p className="mt-2 max-w-sm text-sm" style={{ color: 'var(--muted)' }}>
          Connect to see your vaults and check-in status.
        </p>
        <div className="mt-6">
          <ConnectKitButton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>My Vaults</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
            {vaultIds?.length ?? 0} vault{vaultIds?.length !== 1 ? 's' : ''} owned
          </p>
        </div>
        <Link href="/create">
          <Btn>
            <Plus className="size-4" /> New Vault
          </Btn>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl" style={{ background: 'rgba(18,45,69,0.06)' }} />
          ))}
        </div>
      ) : !vaultIds || vaultIds.length === 0 ? (
        <Card className="p-10 text-center">
          <Shield className="mx-auto mb-4 size-10 opacity-20" style={{ color: 'var(--ink)' }} />
          <p className="display text-base font-semibold" style={{ color: 'var(--ink)' }}>No vaults yet</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Create your first inheritance vault.</p>
          <Link href="/create" className="mt-4 inline-block">
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
