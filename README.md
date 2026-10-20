# Afterlife — USDC Inheritance Vault on Arc

> **Your USDC, delivered to the right people, exactly when it's needed — with no middleman, no probate, and no single point of failure.**

Afterlife is a fully on-chain dead-man's switch and digital-inheritance vault built on [Arc](https://arc.io) — the chain where USDC is the native gas token. You deposit USDC, name your beneficiaries, set an inactivity window, and check in periodically. If you ever stop checking in, your vault unlocks automatically and your beneficiaries can claim their exact shares — permissionlessly, forever, from any wallet, including a phone with no ETH.

**Live on Arc Testnet →** [`0x4d64cb8bd361061b92fe983c7326e172eb6fef7b`](https://explorer.testnet.arc.io/address/0x4d64cb8bd361061b92fe983c7326e172eb6fef7b)

---

## Why this exists

There are roughly **$140 billion** in unclaimed crypto assets today. The leading cause is not theft — it's death and incapacitation with no recovery plan. Every existing "solution" requires trusting a custodian, a lawyer, a multisig co-signer, or a secret being stored somewhere it can be lost. Afterlife removes every one of those dependencies.

- **No custodian.** The contract holds the funds. No company, no key holder.
- **No gas required for beneficiaries.** Arc's USDC-native gas model means a beneficiary with zero ETH can still trigger a claim through anyone calling `claimAll` on their behalf.
- **No lawyer.** The inactivity window is the will. The blockchain is the executor.
- **No probate.** Claims settle in one transaction.
- **No admin keys.** The contract has no owner, no pause function, no upgrade path.

---

## How it works

```
Owner creates vault
  → deposits USDC
  → names up to 10 beneficiaries with basis-point shares (must sum to 10,000)
  → sets an inactivity window (7 days – 3,650 days)

Owner checks in periodically ("I'm alive")
  → any of: checkIn(), withdraw(), setBeneficiaries()

If owner stops checking in for longer than the window:
  → anyone calls release()  — vault status: Active → Released
  → anyone calls claimAll() — USDC sent to each beneficiary
  → blocklisted or failing addresses are skipped, not reverted
```

The last beneficiary always receives the rounding remainder, so the full `releasedBalance` is always distributed to the penny.

---

## Contract design

| Property | Value |
|---|---|
| Language | Solidity `^0.8.28` |
| Standard | No upgradability, no admin keys, no owner escape hatch |
| Token | USDC ERC-20 only — `0x3600000000000000000000000000000000000000` |
| Max beneficiaries | 10 |
| Share precision | Basis points (10,000 = 100%) |
| Window range | `minWindow` (7 days at deploy) → 3,650 days |
| Security | OpenZeppelin `ReentrancyGuard`, custom errors, full event log |
| Rounding | Last beneficiary receives exact remainder — no dust left in vault |
| Blocklist safety | `claimAll` uses a low-level `_tryTransfer` — a blocked address is skipped, others are paid |

### Functions

**Owner-only (also reset the inactivity clock):**

| Function | Description |
|---|---|
| `createVault(name, beneficiaries, shares, window, initialDeposit)` | Create and optionally fund a vault in one tx |
| `checkIn(id)` | Heartbeat — proves the owner is alive |
| `withdraw(id, amount)` | Pull USDC back out; also counts as a check-in |
| `setBeneficiaries(id, addrs, shares)` | Update the beneficiary list; also counts as a check-in |
| `close(id)` | Refund remaining balance and close the vault permanently |

**Permissionless (anyone can call):**

| Function | Description |
|---|---|
| `deposit(id, amount)` | Anyone can top up an active vault |
| `release(id)` | Trigger inheritance once the window has elapsed |
| `claim(id, index)` | Pay a single beneficiary their exact share |
| `claimAll(id)` | Pay all beneficiaries in one tx, skipping any that revert |

**Views:** `getVault`, `deadline`, `isExpired`, `shareOf`, `vaultsOfOwner`, `vaultsOfBeneficiary`, `claimedAmount`

---

## Tech stack

| Layer | Choice |
|---|---|
| Chain | Arc Testnet (Chain ID: `5042002`) / Arc Mainnet (Chain ID: `5042`) |
| Token | USDC — native gas on Arc; zero ETH needed by beneficiaries |
| Smart contract | Solidity 0.8.28 + Foundry |
| Frontend | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS |
| Web3 | wagmi v2, viem v2, ConnectKit |
| Tests | Foundry (59 tests, 0 failures) |

---

## Test coverage (59/59 passing)

| Category | Tests |
|---|---|
| createVault — happy path + all 9 validation errors | 16 |
| deposit — third-party, active-only guard, fuzz | 5 |
| checkIn — happy path, NotOwner, VaultNotActive | 3 |
| withdraw — happy path, NotOwner, InsufficientBalance, AlreadyExpired, fuzz | 6 |
| setBeneficiaries — happy path, NotOwner, AlreadyExpired, VaultNotActive | 4 |
| close — with balance, zero balance, NotOwner, double-close | 4 |
| release timing — too early, at-deadline, after-deadline, owner revival, zero-balance | 5 |
| Exact shares + rounding dust (3 beneficiaries, 100 USDC) | 1 |
| Third-party claim / claimAll | 2 |
| claimAll with a simulated blocklisted beneficiary | 1 |
| Beneficiary + owner discovery views | 2 |
| AlreadyClaimed double-claim revert | 1 |
| Multiple vault independence | 1 |
| Fuzz: window bounds | 3 |
| Views: deadline, isExpired, shareOf, claimedAmount, InvalidVaultId | 5 |

```
forge test --summary
[PASS] 59 tests, 0 failures, 0 skipped
```

---

## Security

- **No admin keys.** The contract has no `owner`, no `pause()`, no `upgrade()`. Once deployed, it is immutable and autonomous.
- **Reentrancy guard** on every state-changing function via OpenZeppelin `ReentrancyGuard`.
- **No native value.** `msg.value` is never used. The contract is ERC-20 only.
- **Blocklist-safe `claimAll`.** A USDC-blocklisted beneficiary does not block other beneficiaries from being paid.
- **No dust.** The rounding remainder always goes to the last beneficiary — the vault never accumulates un-claimable USDC.
- **Immutable USDC address.** Set once in the constructor, cannot be changed.
- **Audit:** Two independent code reviews (rule-corpus + functional) ran before deployment. One pre-deploy finding was fixed: the constructor now enforces `minWindow <= MAX_WINDOW`, preventing a deployment that would brick vault creation.

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1
- [Foundry](https://getfoundry.sh)
- MetaMask (or any EIP-1193 wallet)

### Install and run

```bash
git clone https://github.com/0xNana/afterlife
cd afterlife
bun install
bun run dev          # Next.js on http://localhost:5173
```

### Run the contract tests

```bash
bun run contracts:test
# forge test -vv — 59 tests, 0 failures
```

### Build the contract

```bash
bun run contracts:build
# forge build
```

### Environment

Copy `.env.local.example` (or create `.env.local`) with:

```env
NEXT_PUBLIC_AFTERLIFE_ADDRESS=0x4d64cb8bd361061b92fe983c7326e172eb6fef7b
```

The address defaults to the Arc Testnet deployment when the variable is absent.

---

## Project structure

```
afterlife/
├── contracts/
│   ├── Afterlife.sol              # The vault contract (418 lines)
│   └── test/
│       └── Afterlife.t.sol        # Foundry tests (59 tests)
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── page.tsx               # Dashboard — your vaults + countdowns
│   │   ├── create/page.tsx        # Create vault flow
│   │   ├── vault/[id]/page.tsx    # Vault detail — check-in, withdraw, close
│   │   ├── inheritances/page.tsx  # Beneficiary view — release + claim
│   │   ├── explore/page.tsx       # Look up any vault by ID
│   │   ├── layout.tsx             # Root layout + nav
│   │   └── providers.tsx          # wagmi + ConnectKit + React Query
│   ├── components/                # Btn, Card, Countdown, Nav, Sheet, StatusBadge, TxButton, VaultRow
│   ├── hooks/
│   │   ├── useVault.ts            # All contract reads + writes
│   │   └── useChainGuard.ts       # Arc chain enforcement + auto-switch
│   └── lib/
│       ├── contract.ts            # ABI + address constant
│       └── wagmi.ts               # ConnectKit + wagmi config
├── public/
│   └── afterlife.html             # Standalone ethers v6 static app (no build needed)
├── foundry.toml
├── next.config.ts
└── package.json
```

---

## Deployed contract

| Network | Address | Explorer |
|---|---|---|
| Arc Testnet | `0x4d64cb8bd361061b92fe983c7326e172eb6fef7b` | [View on ArcScan](https://explorer.testnet.arc.io/address/0x4d64cb8bd361061b92fe983c7326e172eb6fef7b) |

Constructor args: `minWindow = 604800` (7 days). USDC hardcoded at `0x3600000000000000000000000000000000000000`.

---

## Why Arc

Arc is the first L2 where USDC is the native gas token. For an inheritance vault, this is the only chain where this product makes complete sense:

1. **Beneficiaries need no ETH.** On every other chain, a beneficiary must hold native gas just to claim what they are owed. On Arc, USDC *is* the gas — a beneficiary with only the USDC they just inherited can pay for the claim transaction with it.
2. **Predictable fees.** Inheritance is not a high-frequency use case. Stable, USDC-denominated fees mean the vault owner knows exactly what each interaction costs with no exchange-rate surprise.
3. **Sub-second finality.** `claimAll` for all 10 beneficiaries settles in one block, in under a second.

---

## License

MIT
