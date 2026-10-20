'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { VaultRow } from '@/components/VaultRow'
import { Btn } from '@/components/Btn'
import { useNextVaultId } from '@/hooks/useVault'

export default function ExplorePage() {
  const { data: nextId } = useNextVaultId()
  const [search, setSearch] = useState('')
  const router = useRouter()

  const total = nextId ? Number(nextId) : 0
  const allIds = Array.from({ length: total }, (_, i) => BigInt(total - 1 - i))

  const handleSearch = () => {
    const n = parseInt(search.trim())
    if (!isNaN(n) && n >= 0 && n < total) {
      router.push(`/vault/${n}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Explore Vaults</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
          {total} vault{total !== 1 ? 's' : ''} deployed on Arc Testnet
        </p>
      </div>

      {/* Search by ID */}
      <Card inner className="flex items-center gap-2 px-4 py-3">
        <Search className="size-4 shrink-0" style={{ color: 'var(--muted)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Jump to vault ID…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--ink)' }}
          type="number"
          min={0}
        />
        <Btn size="sm" onClick={handleSearch} disabled={!search}>Go</Btn>
      </Card>

      {total === 0 ? (
        <Card className="p-10 text-center">
          <p className="display text-base font-semibold" style={{ color: 'var(--ink)' }}>No vaults yet</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Be the first to create one</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {allIds.map((id) => (
            <VaultRow key={id.toString()} id={id} />
          ))}
        </div>
      )}
    </div>
  )
}
