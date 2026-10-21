import { Nav } from '@/components/Nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      {/* Subtle warm vignette in top-right */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0, right: 0,
          width: 480, height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,144,42,0.06) 0%, transparent 70%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10">
        <Nav />
        <main className="mx-auto max-w-3xl px-4 pb-28 pt-10 animate-slide-up">
          {children}
        </main>
      </div>
    </div>
  )
}
