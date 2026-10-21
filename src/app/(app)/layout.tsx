import { Nav } from '@/components/Nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden" style={{ background: 'var(--bg-gradient)' }}>
      {/* Ambient blobs — subtle, not centre-stage */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div style={{
          position: 'absolute', top: '5%', left: '2%',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(133,177,237,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', top: '42%', right: '4%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,205,131,0.13) 0%, transparent 70%)',
          filter: 'blur(72px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '8%', left: '32%',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(126,241,179,0.10) 0%, transparent 70%)',
          filter: 'blur(68px)',
        }} />
      </div>

      <div className="relative z-10">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 animate-slide-up">
          {children}
        </main>
      </div>
    </div>
  )
}
