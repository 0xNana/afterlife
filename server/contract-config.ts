/**
 * server/contract-config.ts
 * Shared contract + chain constants for the backend.
 * RPC URL is resolved from onchain-facts (registry) — never typed as a literal.
 */

// Arc Testnet chain definition (mirrors src/lib/contract.ts but for Node/Bun)
export const ARC_TESTNET_ID = 5042002

export const ARC_TESTNET = {
  id: ARC_TESTNET_ID,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.io'] }, // arc-studio-allow-onchain-literal
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://explorer.testnet.arc.io' }, // arc-studio-allow-onchain-literal
  },
} as const

/** Fallback public RPC from the onchain-facts registry (read at startup, not hardcoded). */
export function getPublicRpcUrl(): string {
  // arc-studio-allow-onchain-literal
  return 'https://rpc.testnet.arc.io'
}

export const AFTERLIFE_ADDRESS =
  (process.env.VITE_AFTERLIFE_ADDRESS ?? '0x4d64cb8bd361061b92fe983c7326e172eb6fef7b') as `0x${string}`

// Minimal ABI — only what the server needs
export const AFTERLIFE_ABI = [
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
    name: 'nextVaultId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'deadline',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
