'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { ConnectKitProvider } from 'connectkit'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { wagmiConfig } from '@/lib/wagmi'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="auto"
          customTheme={{
            '--ck-font-family': "'DM Sans', sans-serif",
            '--ck-primary-button-background': '#122d45',
            '--ck-primary-button-hover-background': '#1061a6',
            '--ck-body-background': '#fffcf7',
            '--ck-body-color': '#122d45',
            '--ck-border-radius': '16px',
          }}
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "'DM Sans', sans-serif",
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(18,45,69,0.12)',
                color: '#122d45',
              },
            }}
          />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
