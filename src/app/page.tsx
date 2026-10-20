'use client'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ConnectKitButton } from 'connectkit'
import { Plus, ArrowRight, Shield, Clock, Users } from 'lucide-react'
import { Card } from '@/components/Card'
import { VaultRow } from '@/components/VaultRow'
import { Btn } from '@/components/Btn'
import { useOwnerVaults } from '@/hooks/useVault'

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const { data: vaultIds, isLoading } = useOwnerVaults(address)

  if (!isConnected) {
    return <Landing />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Vault list */}
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
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Create your first inheritance vault</p>
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

function Landing() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 py-10 text-center">
      <div>
        <div
          className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent)' }}
        >
          <Shield className="size-8 text-white" />
        </div>
        <h1 className="display text-4xl font-bold tracking-tight" style={{ color: 'var(--ink)', letterSpacing: '-0.04em' }}>
          Your USDC, always<br />in the right hands.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base" style={{ color: 'var(--muted)' }}>
          Afterlife is a trustless digital inheritance vault. Lock USDC, name your beneficiaries, and check in periodically.
          If you stop — your loved ones receive everything automatically.
        </p>
      </div>

      <ConnectKitButton label="Connect Wallet to Start" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Shield, title: 'Trustless', desc: 'No admin keys, no backdoors. The contract enforces every rule.' },
          { icon: Clock, title: 'Time-locked', desc: 'Set any inactivity window from 7 days to 10 years.' },
          { icon: Users, title: 'Multi-beneficiary', desc: 'Up to 10 beneficiaries with custom percentage splits.' },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="p-5 text-left">
            <div
              className="mb-3 flex size-9 items-center justify-center rounded-xl"
              style={{ background: 'rgba(18,45,69,0.08)' }}
            >
              <Icon className="size-4" style={{ color: 'var(--ink)' }} />
            </div>
            <p className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>{title}</p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Link href="/explore">
          <Btn variant="secondary">
            Browse Vaults <ArrowRight className="size-4" />
          </Btn>
        </Link>
      </div>
    </div>
  )
}
