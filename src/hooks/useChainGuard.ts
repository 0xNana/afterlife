'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { ARC_MAINNET_ID } from '@/lib/contract'

export function useChainGuard() {
  const { chainId, isConnected } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const wrongChain = isConnected && chainId !== ARC_MAINNET_ID

  function ensureChain() {
    if (wrongChain) {
      switchChain({ chainId: ARC_MAINNET_ID })
      return false
    }
    return true
  }

  return { wrongChain, isSwitching: isPending, ensureChain, isConnected }
}
