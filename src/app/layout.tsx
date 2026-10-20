import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Afterlife: A USDC Inheritance Vault for the People You Love',
  description:
    'Leave USDC to the people you choose. Name up to 10 beneficiaries, check in now and then, and if you stop, the vault pays out by itself. No admin keys.',
  openGraph: {
    title: 'Afterlife: your USDC, passed on when it matters',
    description:
      'A simple on-chain vault for your USDC. Name the people who should receive it and check in from time to time. If you ever stop, it goes to them in the shares you chose, without a middleman.',
    type: 'website',
    url: 'https://afterlife-gamma.vercel.app',
    siteName: 'Afterlife',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Afterlife logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Afterlife: your USDC, passed on when it matters',
    description:
      'A simple on-chain vault for your USDC. Name the people who should receive it and check in from time to time. If you ever stop, it goes to them in the shares you chose, without a middleman.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
