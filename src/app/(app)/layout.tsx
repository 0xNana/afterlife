import { Nav } from '@/components/Nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden" style={{ background: 'var(--bg-gradient)' }}>
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div style={{ position: 'absolute', top: '6%', left: '4%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(133,177,237,0.18) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '6%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,205,131,0.16) 0%, transparent 70%)', filter: 'blur(65px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '30%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(126,241,179,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>
      <div className="relative z-10">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}
