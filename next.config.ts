import type { NextConfig } from 'next'

// Stub out all @x402/* sub-path imports that @coinbase/cdp-sdk optionally imports
// but which are not installed in this project.
const x402Stubs = [
  '@x402/core/client',
  '@x402/core/schemas',
  '@x402/core/server',
  '@x402/evm',
  '@x402/evm/auth-capture/client',
  '@x402/evm/batch-settlement/client',
  '@x402/evm/exact/client',
  '@x402/evm/exact/server',
  '@x402/evm/exact/v1/client',
  '@x402/evm/upto/client',
  '@x402/evm/upto/server',
  '@x402/express',
  '@x402/extensions/bazaar',
  '@x402/extensions/builder-code',
  '@x402/fetch',
  '@x402/svm/exact/client',
  '@x402/svm/exact/server',
  '@x402/svm/exact/v1/client',
  '@x402/svm/upto/client',
  '@x402/svm/upto/server',
]

const nextConfig: NextConfig = {
  async rewrites() {
    const backendPort = process.env.NOTIFICATION_SERVER_PORT ?? '3001'
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:${backendPort}/:path*`,
      },
    ]
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Stub optional x402 deps
    const aliases: Record<string, false> = {}
    for (const pkg of x402Stubs) {
      aliases[pkg] = false
    }
    config.resolve.alias = { ...config.resolve.alias, ...aliases }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        worker_threads: false,
      }
    }

    return config
  },
}

export default nextConfig
