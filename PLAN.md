# AFTERLIFE — build & win plan (Arc Microgrants: Built with Arc Studio)

Deadline **Nov 1, 2026** (time of day not stated; submit by Oct 30 to be safe). Prize: 8 × $500 USDC, scored in batches. Reported field ≈ 88 registered / ~7 projects (third-party aggregator, unverified).

## 1. What the rules actually say (read on the CompeteHub mirror of the DoraHacks page; DoraHacks itself 405s; the community.arc.io page only renders a title)
**Ship:** (a) contracts *written and tested in Arc Studio*, deployed to **Arc mainnet**; (b) a working app *built in Arc Studio* that calls them, live at a public link; (c) ≥1 mainnet tx moving USDC through your contract + app.
**Submission fields (all required):**
1. Arc Studio project URL
2. Live app link
3. Contract address(es) + one example tx hash, linked on explorer.arc.io
4. Public repo (Studio can connect to GitHub and push)
5. Video walkthrough showing the build in Arc Studio **and** the mainnet transaction (**no length limit stated** — keep ≤ 3 min)
6. Short description: what it does + how you used Arc Studio
7. Public builder profile (GitHub, X or Farcaster)

**Scoring:** real USDC on mainnet with addresses + tx hashes **30%** · Arc Studio use across contracts, tests *and* app **25%** · working product **25%** · potential to go further **20%**.
**Ineligible:** testnet-only, mockups/decks, already Circle/Arc-funded. One submission per project (teams may enter several). Worldwide, subject to sanctions screening; pseudonymous OK until payout. Payout needs a wallet that can receive USDC on Arc + short verification. Suggested ideas: escrow/conditional payouts (scheduled payouts, payroll, vesting), splitters/shared treasuries, software-to-software (agent) payments.

## 2. Arc facts you need
| | Mainnet | Testnet |
|---|---|---|
| Chain ID | **5042** | 5042002 |
| RPC | https://rpc.mainnet.arc.io | https://rpc.testnet.arc.io |
| Explorer | https://explorer.arc.io | testnet explorer (see docs.arc.io) |
| Faucet | none (real USDC) | faucet.circle.com |
- Circle's EVM L1; **USDC is the gas token**; sub-second finality; mainnet live since Sep 16, 2026.
- USDC ERC-20 interface at `0x3600000000000000000000000000000000000000` has **6 decimals**; native balance / `msg.value` is 18 decimals → contracts use only the ERC-20 interface (done).
- Quirks: `maxFeePerGas` floor **20 gwei** (frontend and deploy script handle it); `address(0)` transfers revert; blocklisted USDC transfers revert (handled by `claimAll`); local EVM can't replicate the USDC precompile/blocklist → **do a testnet run before mainnet**.
- **Arc Studio** (studio.arc.io, CLI `@circle-fin/arc-studio-cli`: `run`, `pull`, `apps`, `deployments`, `--file`): AI agent that writes/tests/deploys — **testnet only; it never deploys to mainnet.** The mainnet deploy is yours, with your own key.
- Getting mainnet USDC (needed for gas too): withdraw Arc USDC from an exchange that supports it (Kraken was reported; Ghana availability *unverified*), or bridge from another chain via CCTP/Bridge Kit to Arc (domain 26; TokenMessengerV2 `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA`). A tx costs cents (20 gwei floor), so **$5–10 total is plenty**.

## 3. Concept (pick: Dead-man's-switch inheritance, called Afterlife)
Why this beats a splitter: Arc's own tutorial is a revenue splitter, so splitters will pile up; Afterlife is conditional payout (explicitly listed), has a human story, needs several real USDC txs (deposit → release → claim = strong 30%), and has a clean "go further" path. Rejected alternatives: payroll/vesting streamer (crowded, no emotional hook), agent-to-agent payments (hard to demo working on mainnet in a day).

## 4. What is built (this folder)
- `contracts/Afterlife.sol` — vaults; owner `createVault / deposit / checkIn / withdraw / setBeneficiaries / close`; `release` (anyone, after `lastCheckIn+window`); `claim` / `claimAll` (anyone may trigger, pays the beneficiary); ≤10 beneficiaries, bps shares, last takes rounding dust; reentrancy guard; custom errors; events. No admin, no upgrade.
- `contracts/MockUSDC.sol` — test only.
- `frontend/` — no-build static dapp (ethers v6 vendored): connect + add/switch chain 5042, create vault (approve→create), live countdown, "I'm alive", deposit/withdraw/close, inheritances with Release / Claim / Pay-everyone, lookup by id, tx log with explorer links.
- `scripts/` — `deploy.js` (local / arcTestnet / arcMainnet; key only from your `PRIVATE_KEY` env), `e2e.js`, `serve.js`, `ui-test.js`.
- `ARC_STUDIO_PROMPT.md` — the prompt to give Studio. `README.md`.

**Tested locally:** 19 contract tests pass; `e2e.js` full lifecycle on a live local node (early release rejected → check-in → silence → third-party release → third-party `claimAll`, exact 70/30 payout); headless-Chrome UI test (connect, create vault, vault shown, check-in tx logged; screenshot `docs/ui-smoke.png`).
**NOT tested (cannot be tested here):** real Arc USDC precompile/blocklist, real wallets, Arc testnet/mainnet, Arc Studio itself.

## 5. Contract design notes
- State machine: None → Active → (Released | Closed). `release` snapshots balance into `released`; share i = `released*bps/10000` (last gets remainder); `claimed[i]` + `claimedAmount` prevent double pay.
- Heartbeats: `checkIn`, `withdraw`, `setBeneficiaries` reset the clock. Owner can revive any time *before* `release` is called (documented).
- Anyone can `deposit` (family can top up) and `release`/`claim` (beneficiary needs no gas).
- `minWindow` is a constructor arg: **demo instance = 60 s** (so the video can show a real release); say in the description that production would use ≥ 30 days. Optionally deploy a second instance with 30 days.
- Known limits (state them honestly, 20% "potential" rewards candor): unaudited; no oracle of death (liveness only); owner key loss = same as death (feature); a blocklisted beneficiary can't be paid by anyone (others unaffected).

## 6. Tx flow (what a viewer sees on explorer.arc.io)
1. `USDC.approve(Afterlife, amt)` 2. `createVault(...)` (deposit included) 3. `checkIn` 4. (silence > window) `release` — send from a *second* wallet to prove "anyone" 5. `claim`/`claimAll` — USDC lands in beneficiary wallet. Use **$1 USDC**.

## 7. Demo video script (target 2:30, screen recording + voice)
| t | Show | Say |
|---|---|---|
| 0:00 | Title card "Afterlife" + app homepage | "If you disappear, does your money disappear with you? Afterlife is a dead-man's switch for USDC on Arc." |
| 0:15 | **Arc Studio project**: prompt, generated contract, test run green, app preview, GitHub push | "I built the contracts, the tests and the app in Arc Studio — here's the project, the 19 passing tests, and the repo." (25%) |
| 0:55 | Mainnet app (public URL): connect wallet on Arc 5042, create "Family fund", 1 USDC, 2 beneficiaries 70/30, window 1 min | "Real USDC on Arc mainnet. Approve, create — one-second finality." |
| 1:20 | Click tx hash → explorer.arc.io, show contract address + USDC transfer | "Here's the contract and the transaction on explorer.arc.io." (30%) |
| 1:35 | "I'm alive" check-in; countdown resets | "Check in and the clock resets." |
| 1:50 | Stop checking in; countdown hits 0 → switch to second wallet → Release → Claim all | "I go silent. Anyone can release it — beneficiaries don't even need gas." |
| 2:15 | Beneficiary wallet balance up; explorer shows claim tx | "70% and 30%, settled." |
| 2:25 | Roadmap slide (one line) | "Next: Circle wallets, agent heartbeats, cross-chain claims via CCTP. Afterlife." (20%) |
Tip: pre-fund both wallets and rehearse on testnet first; keep the 60 s window so nothing is cut.

## 8. Submission text
**Project name:** Afterlife
**One-liner:** A USDC dead-man's switch on Arc: check in to keep your funds, go silent and your beneficiaries inherit.
**Description (paste):**
> Afterlife is a digital-inheritance vault for USDC on Arc. An owner creates a vault, deposits USDC, names up to 10 beneficiaries with percentage shares, and sets an inactivity window. While the owner checks in (or deposits/withdraws/edits), the vault stays locked. If the owner goes silent past the window, anyone can release the vault, and every beneficiary's share can be claimed — by the beneficiary or by anyone on their behalf, so heirs don't need gas USDC first. The last beneficiary receives rounding dust; blocklisted recipients can't block others.
> How I used Arc Studio: I described the product and constraints (USDC ERC-20 interface at 0x3600…0000, 6 decimals, 20 gwei fee floor, address(0)/blocklist reverts) to Arc Studio, which generated the Solidity contract, a 19-case test suite and the no-build web app, iterated on failing tests, deployed to testnet, and pushed to GitHub. I then deployed the tested contract to Arc mainnet and ran the full flow with real USDC (create → check-in → release → claim); the video shows Studio and the explorer transactions.
> Potential: Circle Wallets / passkeys so heirs onboard with an email, an AI agent that sends heartbeat reminders or auto check-ins, CCTP/Gateway so heirs can claim on another chain, EURC/USYC vaults, guardian approvals and long windows, audit and a hosted relayer that releases expired vaults.
**Fields to fill (with your real values):** Studio URL `<…>` · Live app `<https://…>` · Contract `<0x…>` · Example tx `https://explorer.arc.io/tx/<0x…>` (use the **claim** or **create** tx; also list release tx) · Repo `<github url>` · Video `<url>` · Builder profile `<github/x/farcaster>`.

## 9. ONLY YOU can do these (I did not and must not touch keys/funds/accounts)
1. **Create a fresh, throwaway wallet** (MetaMask/Rabby) for the deployer, plus **2 more** (beneficiary A and B; one doubles as the "random releaser"). Never reuse a main wallet.
2. **Fund mainnet USDC** to the deployer ≈ $5–8 (gas + $1 demo) and ≈ $0.50 to the releaser wallet. Route: exchange withdrawal to Arc if available to you, or bridge via CCTP/Bridge Kit (Ghana access to Kraken unverified). Fund testnet via faucet.circle.com first.
3. **Arc Studio:** log in at studio.arc.io, create a project, paste `ARC_STUDIO_PROMPT.md`, attach the files, let Studio generate/test/fix, deploy to testnet, connect GitHub and push. Make sure the Studio project/contract is what you then deploy (export it; compare with mine). *The submission is graded on genuine Studio use — do not just upload my code.*
4. Run `npm test` and the testnet deploy (`PRIVATE_KEY=… npm run deploy:testnet`), try the UI against testnet.
5. **Deploy to mainnet with your own key:** `PRIVATE_KEY=0x… MIN_WINDOW=60 npm run deploy:mainnet` → note address + deploy tx. (Optionally verify the source on the explorer.)
6. **Host the frontend** at a public URL (Vercel/Netlify/GitHub Pages: publish `frontend/`; `config.js` must contain the mainnet address — the deploy script writes it). Don't publish a `config.js` generated by `deploy:local`.
7. Do the real flow with wallets 1–3 (section 6) and copy the tx hashes. Do it once before recording.
8. **Record** the video (section 7), upload (YouTube unlisted / Loom).
9. Make the **public builder profile** (GitHub/X/Farcaster) and a public repo.
10. **Submit on DoraHacks** (log in, find "Arc Microgrants: Built with Arc Studio" — link from community.arc.io/pages/arc-studio-xm3qwi), project name exactly **Afterlife**, fill all 7 fields. Submit early (batch review). Keep wallet ready to receive USDC on Arc; complete verification if selected.

## 10. Risks
- If Studio can't be shown generating the code, you lose up to 25% and risk ineligibility → do step 3 for real.
- Studio-generated code may differ from mine; re-run tests on whatever you deploy.
- Unaudited code holding real money: $1–2 only; tell viewers it's a demo.
- Date.now()-based countdown in the UI can drift a few seconds from chain time (seen on the local node); harmless on Arc.
- Required video length/time-of-day deadline not found in the sources I could read (DoraHacks blocked) — re-check the official page.
