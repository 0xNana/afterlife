'use client'

import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { ARC_TESTNET } from './contract'

export const wagmiConfig = createConfig({
  chains: [ARC_TESTNET, mainnet],
  connectors: [injected()],
  transports: {
    [ARC_TESTNET.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
})
