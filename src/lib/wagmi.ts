'use client'

import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { ARC_MAINNET, ARC_TESTNET } from './contract'

export const wagmiConfig = createConfig({
  chains: [ARC_MAINNET, ARC_TESTNET, mainnet],
  connectors: [injected()],
  transports: {
    [ARC_MAINNET.id]: http('https://rpc.mainnet.arc.io'),
    [ARC_TESTNET.id]: http('https://rpc.testnet.arc.io'),
    [mainnet.id]: http(),
  },
  ssr: true,
})
