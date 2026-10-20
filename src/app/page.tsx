import Link from 'next/link'
import { Shield, Clock, Users, ArrowRight, Lock, Coins, Eye, Bell } from 'lucide-react'

// ─── Primitives ────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest"
      style={{ borderColor: 'var(--border-strong)', color: 'var(--muted)' }}
    >
      {children}
    </p>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3 text-xs font-semibold uppercase tracking-widest"
      style={{ color: 'var(--muted)' }}
    >
      {children}
    </p>
  )
}

function Divider() {
  return <hr style={{ borderColor: 'var(--border)', margin: '0 auto', maxWidth: '72rem' }} />
}

// ─── Landing Page ──────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div
      className="relative min-h-dvh overflow-x-hidden"
      style={{ background: 'var(--bg-gradient)', color: 'var(--ink)' }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div style={{ position: 'absolute', top: '0%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(133,177,237,0.14) 0%, transparent 70%)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', top: '45%', right: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,205,131,0.13) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(126,241,179,0.10) 0%, transparent 70%)', filter: 'blur(75px)' }} />
      </div>

      {/* ── Minimal top nav ──────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl" style={{ background: 'var(--accent)' }}>
              <Shield className="size-4 text-white" />
            </div>
            <span className="display text-base font-bold" style={{ color: 'var(--ink)' }}>Afterlife</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              Launch app
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-20 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>
            <span
              className="size-1.5 rounded-full"
              style={{ display: 'inline-block', background: 'var(--success)' }}
            />
            Runs on Arc · Currently on testnet
          </Eyebrow>

          <h1
            className="display text-balance text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl"
            style={{ letterSpacing: '-0.04em', color: 'var(--ink)' }}
          >
            Your USDC,<br />in the right hands.<br />
            <span style={{ color: 'var(--accent-hover)' }}>Even when you&rsquo;can&rsquo;t be there.</span>
          </h1>

          <p
            className="text-pretty mx-auto mt-6 max-w-xl text-lg leading-relaxed"
            style={{ color: 'var(--muted)' }}
          >
            Afterlife is a simple vault for your USDC. Choose who should receive it,
            then check in every so often. If you ever stop, it passes to them in the
            shares you set. No company sits in the middle, and no one holds a key to it.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
              style={{ background: 'var(--accent)' }}
            >
              Launch app <ArrowRight className="size-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-2xl border px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-black/5"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--ink-2)' }}
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-xs" style={{ color: 'var(--subtle)' }}>
            Early software that hasn&apos;t been audited. Please start with small amounts.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── The Problem ──────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>The problem</SectionLabel>
          <h2
            className="display text-balance text-3xl font-bold sm:text-4xl"
            style={{ letterSpacing: '-0.03em', color: 'var(--ink)' }}
          >
            Your money is safe with you.<br />That&apos;s the problem.
          </h2>
          <p
            className="text-pretty mt-5 text-base leading-relaxed"
            style={{ color: 'var(--ink-2)', maxWidth: '60ch' }}
          >
            Holding your own USDC means nobody can freeze it, lose it, or spend it for
            you. But it also means nobody else can reach it. If you&apos;re gone, or simply
            can&apos;t get to your wallet, those funds can sit untouched indefinitely — even
            when the people you&apos;d want to have them are right there.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Lock,
                label: 'Share your phrase',
                detail: 'Gives someone full access today — not just someday.',
              },
              {
                icon: Shield,
                label: 'Use a custodian',
                detail: 'Trust a company to still be there, and to act, when it matters.',
              },
              {
                icon: Bell,
                label: 'Write it down',
                detail: 'Relies on the right person finding it and knowing what to do.',
              },
            ].map(({ icon: Icon, label, detail }) => (
              <div
                key={label}
                className="rounded-2xl border p-5"
                style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)' }}
              >
                <div
                  className="mb-3 flex size-9 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(186,43,76,0.08)' }}
                >
                  <Icon className="size-4" style={{ color: 'var(--danger)' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{label}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{detail}</p>
              </div>
            ))}
          </div>

          <div
            className="mt-8 rounded-2xl border-l-4 p-6"
            style={{
              borderLeftColor: 'var(--accent)',
              background: 'rgba(18,45,69,0.04)',
              borderTopColor: 'var(--border)',
              borderRightColor: 'var(--border)',
              borderBottomColor: 'var(--border)',
              borderWidth: '1px',
              borderLeftWidth: '4px',
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              Afterlife takes another approach. You keep full control while you&apos;re here.
              If you stop checking in, the rules you set decide where the money goes.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>How it works</SectionLabel>
          <h2
            className="display text-balance text-3xl font-bold sm:text-4xl"
            style={{ letterSpacing: '-0.03em', color: 'var(--ink)' }}
          >
            Four steps. Then you just live your life.
          </h2>

          <div className="mt-12 space-y-8">
            {[
              {
                n: '1',
                title: 'Create your vault',
                body: 'Give it a name and add the USDC you want to set aside. You can add more later, or take some back.',
              },
              {
                n: '2',
                title: 'Choose your people',
                body: 'Add up to 10 beneficiaries by wallet address and decide how much each one receives. Shares must add up to exactly 100%. If you want equal portions, one tap splits them evenly.',
              },
              {
                n: '3',
                title: 'Set your check-in window',
                body: 'Choose how long Afterlife should wait after your last sign of life — anywhere from 7 days to 10 years. Then, every so often, press "I\'m Alive." The clock starts over each time.',
              },
              {
                n: '4',
                title: 'If you stop checking in, it passes on',
                body: 'After your window runs out, anyone can trigger the release. Then anyone can press "Pay Everyone" to send every beneficiary their share in one transaction. Your beneficiaries don\'t have to sign anything to receive it.',
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-5">
                <div
                  className="display flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'var(--accent)', marginTop: 2 }}
                >
                  {n}
                </div>
                <div>
                  <p className="display text-base font-bold" style={{ color: 'var(--ink)' }}>{title}</p>
                  <p className="text-pretty mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-10 rounded-2xl border p-5 text-sm leading-relaxed"
            style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)', color: 'var(--ink-2)' }}
          >
            <strong style={{ color: 'var(--ink)' }}>Good to know:</strong> When you withdraw funds or update
            your beneficiaries, that also counts as checking in. Adding funds does not.
            Use &ldquo;I&apos;m Alive&rdquo; for that.
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 max-w-2xl">
            <SectionLabel>Features</SectionLabel>
            <h2
              className="display text-balance text-3xl font-bold sm:text-4xl"
              style={{ letterSpacing: '-0.03em', color: 'var(--ink)' }}
            >
              Built to be simple, and built so it can&apos;t be quietly changed.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Lock,
                title: 'You stay in control while you\'re here',
                body: 'Until the window runs out, the vault is yours. Add USDC, withdraw it, update your beneficiaries, or close the vault and get your remaining balance back.',
              },
              {
                icon: Coins,
                title: 'Shares paid exactly as you set them',
                body: 'Set each person\'s share in fine increments (0.01%). The last beneficiary also gets any leftover rounding amount — the whole balance goes out and nothing is left behind.',
              },
              {
                icon: Users,
                title: 'Beneficiaries don\'t have to do anything',
                body: 'Anyone can pay everyone in a single transaction. Your beneficiaries never need to sign or keep funds on hand for fees. They only need the wallet address you named.',
              },
              {
                icon: Shield,
                title: 'One problem doesn\'t hold up everyone else',
                body: 'If one beneficiary\'s address can\'t receive USDC, Afterlife skips that person and pays the others. The skipped share stays set aside — it isn\'t given to anyone else.',
              },
              {
                icon: Lock,
                title: 'No admin keys. No upgrades. No pause button.',
                body: 'Nobody — including the people who built Afterlife — can change the rules, freeze your vault, or move your funds. The contract has no owner and can\'t be upgraded.',
              },
              {
                icon: Coins,
                title: 'USDC only, start to finish',
                body: 'You deposit USDC and your beneficiaries receive USDC. On Arc, network fees are paid in USDC too — so you don\'t need a separate token to use it.',
              },
              {
                icon: Users,
                title: 'Family can contribute',
                body: 'Anyone can add USDC to an active vault, so a partner or relative can contribute to the same plan. Only you can withdraw from it.',
              },
              {
                icon: Eye,
                title: 'See where things stand at a glance',
                body: 'Your dashboard shows every vault you own with a live countdown. Beneficiaries have their own Inheritances page that shows each vault naming them and their share.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-3xl border p-6 transition-shadow hover:shadow-md"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div
                  className="mb-4 flex size-10 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(18,45,69,0.07)' }}
                >
                  <Icon className="size-5" style={{ color: 'var(--ink)' }} />
                </div>
                <p className="display mb-2 text-sm font-bold leading-snug" style={{ color: 'var(--ink)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Who it's for ─────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Who it&apos;s for</SectionLabel>
          <h2
            className="display text-balance text-3xl font-bold sm:text-4xl"
            style={{ letterSpacing: '-0.03em', color: 'var(--ink)' }}
          >
            For anyone who&apos;s ever wondered, &ldquo;What if?&rdquo;
          </h2>

          <div className="mt-10 space-y-5">
            {[
              {
                who: 'Parents and partners',
                detail: 'You hold savings in USDC and want them to go to your family without asking anyone\'s permission and without anyone needing your recovery phrase.',
              },
              {
                who: 'People who travel, sail, climb, or work far from home',
                detail: 'Set a window that fits how you live. A few weeks off the grid won\'t trigger anything, and a long silence will.',
              },
              {
                who: 'Builders and freelancers paid in USDC',
                detail: 'Your income already lives on-chain. Afterlife gives part of it a plan, split among the people or causes you choose.',
              },
              {
                who: 'Anyone who worries about losing access',
                detail: 'If you lose your wallet and can\'t check in, your vault still goes to the people you named — so your funds aren\'t simply lost.',
              },
              {
                who: 'The curious and careful',
                detail: 'Want to see how it works before trusting it with anything that matters? Afterlife is currently on testnet, so you can try every step without real money.',
              },
            ].map(({ who, detail }) => (
              <div
                key={who}
                className="flex gap-4 rounded-2xl border p-5"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div
                  className="mt-0.5 size-2 shrink-0 rounded-full"
                  style={{ background: 'var(--accent)', marginTop: 6 }}
                />
                <div>
                  <p className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>{who}</p>
                  <p className="text-pretty mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Trust & Security ─────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Trust &amp; security</SectionLabel>
          <h2
            className="display text-balance text-3xl font-bold sm:text-4xl"
            style={{ letterSpacing: '-0.03em', color: 'var(--ink)' }}
          >
            What you can count on, and what you should know.
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {/* What the code guarantees */}
            <div
              className="rounded-3xl border p-6"
              style={{ background: 'rgba(26,128,71,0.04)', borderColor: 'rgba(26,128,71,0.18)' }}
            >
              <p className="display mb-4 text-sm font-bold" style={{ color: 'var(--success)' }}>What the code guarantees</p>
              <ul className="space-y-3">
                {[
                  'No one else holds the keys. No owner, no admin, no pause switch, no upgrade path.',
                  'Funds go only where you said. Anyone may trigger a release, but nobody can redirect the money.',
                  'Nothing happens early. Funds can\'t be released while your window is still open.',
                  'One problem doesn\'t hold up everyone. A blocked address is skipped; others are paid.',
                  'Everything is on the record. Every event is public on the Arc blockchain.',
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                    <span className="mt-0.5 shrink-0 text-sm" style={{ color: 'var(--success)' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What you should know */}
            <div
              className="rounded-3xl border p-6"
              style={{ background: 'rgba(186,43,76,0.04)', borderColor: 'rgba(186,43,76,0.16)' }}
            >
              <p className="display mb-4 text-sm font-bold" style={{ color: 'var(--danger)' }}>What you should know</p>
              <ul className="space-y-3">
                {[
                  "It hasn't been audited. Please use only amounts you could afford to lose.",
                  "There is no undo. Nobody can reverse a mistake for you.",
                  "It doesn't remind you. Set your own reminder; choose a window with plenty of margin.",
                  "Your vault is public. Balances and addresses are visible on-chain.",
                  "Tell your people. Afterlife doesn't contact beneficiaries — they need to know.",
                  "It isn't a legal will. It only covers the USDC you put in the vault.",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                    <span className="mt-0.5 shrink-0 text-sm" style={{ color: 'var(--danger)' }}>!</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>FAQ</SectionLabel>
          <h2
            className="display mb-10 text-3xl font-bold sm:text-4xl"
            style={{ letterSpacing: '-0.03em', color: 'var(--ink)' }}
          >
            Common questions
          </h2>

          <div className="space-y-5">
            {[
              {
                q: 'What exactly happens if I stop checking in?',
                a: "Nothing happens right away. Once your inactivity window has fully passed, the vault becomes eligible for release. Someone — a beneficiary, a friend, or anyone else — presses \"Trigger Release,\" which locks in the balance for payout. Then anyone can press \"Pay Everyone\" to send every beneficiary their share, or each beneficiary can claim their own.",
              },
              {
                q: "What if I just forget, or I'm in the hospital, and my deadline passes?",
                a: "The vault doesn't pay out by itself the moment your deadline passes. Someone has to trigger the release. Until that happens, checking in brings the vault back to normal. Once anyone triggers the release, though, it's final. Don't rely on this grace period. Choose a window with plenty of room to spare, and set yourself a reminder.",
              },
              {
                q: "Do my beneficiaries need crypto, or gas, to receive their share?",
                a: "No. On Arc, network fees are paid in USDC, and anyone can send every beneficiary their share in one transaction. Your beneficiaries don't have to sign anything or keep funds on hand. They only need a wallet address that can receive USDC.",
              },
              {
                q: "Can I change my mind?",
                a: "Yes, as long as your window hasn't run out. You can add or withdraw USDC, update your beneficiaries and their shares, or close the vault and get your full remaining balance back. Closing is permanent — if you change your mind later, you'll need to create a new vault.",
              },
              {
                q: "Can Afterlife, or anyone else, take my money?",
                a: "No. The contract has no admin keys, no owner, and no upgrade mechanism. Nobody — including the people who built Afterlife — can move funds outside of the rules you set. The only way funds leave the vault is by your explicit action (withdraw or close) or by the normal release-and-claim process after your window expires.",
              },
              {
                q: "What happens if one of my beneficiaries loses access to their wallet?",
                a: "Their share will remain locked in the vault, unclaimed. It won't be redistributed to other beneficiaries. Update your beneficiary list before your window closes if you need to change an address — updating beneficiaries also counts as a check-in.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl border p-5"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <summary
                  className="display cursor-pointer select-none text-sm font-semibold"
                  style={{ color: 'var(--ink)', listStyle: 'none' }}
                >
                  <span className="flex items-center justify-between gap-3">
                    {q}
                    <span
                      className="shrink-0 text-lg font-light transition-transform group-open:rotate-45"
                      style={{ color: 'var(--muted)', display: 'inline-block' }}
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="text-pretty mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── CTA footer ───────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <div
            className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl"
            style={{ background: 'var(--accent)' }}
          >
            <Shield className="size-7 text-white" />
          </div>
          <h2
            className="display text-balance text-3xl font-bold sm:text-4xl"
            style={{ letterSpacing: '-0.03em', color: 'var(--ink)' }}
          >
            Make sure your USDC<br />finds its way home.
          </h2>
          <p
            className="text-pretty mx-auto mt-4 max-w-md text-base leading-relaxed"
            style={{ color: 'var(--muted)' }}
          >
            It takes five minutes to set up a vault. Everything else runs on its own.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
              style={{ background: 'var(--accent)' }}
            >
              Launch app <ArrowRight className="size-4" />
            </Link>
            <a
              href="https://github.com/0xNana/afterlife"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border px-8 py-4 text-sm font-semibold transition-colors hover:bg-black/5"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--ink-2)' }}
            >
              View on GitHub
            </a>
          </div>

          <p className="mt-6 text-xs" style={{ color: 'var(--subtle)' }}>
            Early software that hasn&apos;t been audited. Please start with small amounts.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer
        className="relative z-10 border-t px-6 py-8 text-center"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-lg" style={{ background: 'var(--accent)' }}>
              <Shield className="size-3 text-white" />
            </div>
            <span className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>Afterlife</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>
            Runs on{' '}
            <a href="https://arc.io" target="_blank" rel="noopener noreferrer" className="underline">
              Arc
            </a>
            {' '}· USDC by{' '}
            <a href="https://circle.com" target="_blank" rel="noopener noreferrer" className="underline">
              Circle
            </a>
            {' '}· Contract:{' '}
            <a
              href="https://explorer.testnet.arc.io/address/0x4d64cb8bd361061b92fe983c7326e172eb6fef7b"
              target="_blank"
              rel="noopener noreferrer"
              className="mono underline"
              style={{ fontSize: '0.7rem' }}
            >
              0x4d64…fef7b
            </a>
          </p>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>MIT License</p>
        </div>
      </footer>
    </div>
  )
}
