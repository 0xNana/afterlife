'use client'

import { useReadContract, useReadContracts } from 'wagmi'
import { AFTERLIFE_ADDRESS, AFTERLIFE_ABI, ARC_MAINNET_ID } from '@/lib/contract'

export function useVault(id: bigint | undefined) {
  return useReadContract({
    address: AFTERLIFE_ADDRESS,
    abi: AFTERLIFE_ABI,
    functionName: 'getVault',
    args: id !== undefined ? [id] : undefined,
    chainId: ARC_MAINNET_ID,
    query: { enabled: id !== undefined, refetchInterval: 10_000 },
  })
}

export function useVaultDeadline(id: bigint | undefined) {
  return useReadContract({
    address: AFTERLIFE_ADDRESS,
    abi: AFTERLIFE_ABI,
    functionName: 'deadline',
    args: id !== undefined ? [id] : undefined,
    chainId: ARC_MAINNET_ID,
    query: { enabled: id !== undefined, refetchInterval: 10_000 },
  })
}

export function useOwnerVaults(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: AFTERLIFE_ADDRESS,
    abi: AFTERLIFE_ABI,
    functionName: 'vaultsOfOwner',
    args: owner ? [owner] : undefined,
    chainId: ARC_MAINNET_ID,
    query: { enabled: !!owner, refetchInterval: 15_000 },
  })
}

export function useBeneficiaryVaults(addr: `0x${string}` | undefined) {
  return useReadContract({
    address: AFTERLIFE_ADDRESS,
    abi: AFTERLIFE_ABI,
    functionName: 'vaultsOfBeneficiary',
    args: addr ? [addr] : undefined,
    chainId: ARC_MAINNET_ID,
    query: { enabled: !!addr, refetchInterval: 15_000 },
  })
}

export function useNextVaultId() {
  return useReadContract({
    address: AFTERLIFE_ADDRESS,
    abi: AFTERLIFE_ABI,
    functionName: 'nextVaultId',
    chainId: ARC_MAINNET_ID,
    query: { refetchInterval: 15_000 },
  })
}

export function useMinWindow() {
  return useReadContract({
    address: AFTERLIFE_ADDRESS,
    abi: AFTERLIFE_ABI,
    functionName: 'minWindow',
    chainId: ARC_MAINNET_ID,
  })
}

export function useVaults(ids: bigint[]) {
  return useReadContracts({
    contracts: ids.map((id) => ({
      address: AFTERLIFE_ADDRESS,
      abi: AFTERLIFE_ABI,
      functionName: 'getVault' as const,
      args: [id] as const,
      chainId: ARC_MAINNET_ID,
    })),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  })
}

export function useUsdcBalance(address: `0x${string}` | undefined) {
  const ERC20_ABI = [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ] as const

  return useReadContract({
    address: '0x3600000000000000000000000000000000000000',
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_MAINNET_ID,
    query: { enabled: !!address, refetchInterval: 15_000 },
  })
}

export function useUsdcAllowance(owner: `0x${string}` | undefined, spender: `0x${string}`) {
  const ERC20_ABI = [
    {
      name: 'allowance',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ] as const

  return useReadContract({
    address: '0x3600000000000000000000000000000000000000',
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner ? [owner, spender] : undefined,
    chainId: ARC_MAINNET_ID,
    query: { enabled: !!owner, refetchInterval: 10_000 },
  })
}
