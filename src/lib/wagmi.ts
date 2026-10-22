'use client'

import { createConfig, http } from 'wagmi'
import { ARC_MAINNET } from './contract'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [ARC_MAINNET],
  connectors: [injected()],
  transports: {
    [ARC_MAINNET.id]: http('https://rpc.mainnet.arc.io'),
  },
  ssr: true,
})
