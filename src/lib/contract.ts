// Afterlife contract config — Arc Testnet
export const AFTERLIFE_ADDRESS =
  (process.env.NEXT_PUBLIC_AFTERLIFE_ADDRESS as `0x${string}`) ||
  '0x4d64cb8bd361061b92fe983c7326e172eb6fef7b'

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const
export const USDC_DECIMALS = 6

export const ARC_TESTNET_ID = 5042002
export const ARC_MAINNET_ID = 5042

export const ARC_TESTNET = {
  id: ARC_TESTNET_ID,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://explorer.testnet.arc.io' } },
} as const

export const AFTERLIFE_ABI = [
  // Write
  {
    name: 'createVault',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name_', type: 'bytes32' },
      { name: 'beneficiaries_', type: 'address[]' },
      { name: 'shares_', type: 'uint16[]' },
      { name: 'window_', type: 'uint256' },
      { name: 'initialDeposit_', type: 'uint256' },
    ],
    outputs: [{ name: 'id', type: 'uint256' }],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'checkIn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'setBeneficiaries',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'beneficiaries_', type: 'address[]' },
      { name: 'shares_', type: 'uint16[]' },
    ],
    outputs: [],
  },
  {
    name: 'close',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'release',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'index', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  // Views
  {
    name: 'getVault',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'name', type: 'bytes32' },
      { name: 'window', type: 'uint256' },
      { name: 'lastCheckIn', type: 'uint256' },
      { name: 'balance', type: 'uint256' },
      { name: 'releasedBalance', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'beneficiaryAddrs', type: 'address[]' },
      { name: 'beneficiaryShares', type: 'uint16[]' },
    ],
  },
  {
    name: 'deadline',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'isExpired',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'shareOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'beneficiary', type: 'address' }],
    outputs: [{ name: '', type: 'uint16' }],
  },
  {
    name: 'vaultsOfOwner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'vaultsOfBeneficiary',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'beneficiary', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'claimedAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }, { name: 'index', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'nextVaultId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'minWindow',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// Vault status enum
export enum VaultStatus {
  None = 0,
  Active = 1,
  Released = 2,
  Closed = 3,
}

export function statusLabel(s: number) {
  return ['None', 'Active', 'Released', 'Closed'][s] ?? 'Unknown'
}

export function parseUsdc(amount: string): bigint {
  if (!amount || isNaN(parseFloat(amount))) return 0n
  return BigInt(Math.round(parseFloat(amount) * 10 ** USDC_DECIMALS))
}

export function formatUsdc(raw: bigint): string {
  return (Number(raw) / 10 ** USDC_DECIMALS).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatDuration(seconds: bigint | number): string {
  const s = Number(seconds)
  if (s >= 86400) return `${Math.round(s / 86400)} day${Math.round(s / 86400) !== 1 ? 's' : ''}`
  if (s >= 3600) return `${Math.round(s / 3600)} hour${Math.round(s / 3600) !== 1 ? 's' : ''}`
  return `${Math.round(s / 60)} min`
}

export function formatCountdown(remaining: number): string {
  if (remaining <= 0) return 'Expired'
  const d = Math.floor(remaining / 86400)
  const h = Math.floor((remaining % 86400) / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${remaining % 60}s`
}

export function decodeBytes32Name(hex: string): string {
  try {
    const bytes = Buffer.from(hex.slice(2), 'hex')
    return bytes.toString('utf8').replace(/\0/g, '').trim()
  } catch {
    return hex
  }
}

export function encodeBytes32Name(name: string): `0x${string}` {
  const buf = Buffer.alloc(32)
  Buffer.from(name.slice(0, 32), 'utf8').copy(buf)
  return `0x${buf.toString('hex')}` as `0x${string}`
}

export function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function explorerTx(hash: string) {
  return `https://explorer.testnet.arc.io/tx/${hash}`
}

export function explorerAddr(addr: string) {
  return `https://explorer.testnet.arc.io/address/${addr}`
}
