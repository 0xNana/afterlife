# Afterlife — USDC Inheritance Vault

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Afterlife is a USDC dead-man's switch / digital-inheritance vault deployed on Arc. The vault owner deposits USDC and must check in periodically. If the owner stops checking in for longer than the inactivity window, any address can trigger release and beneficiaries can claim their share. Includes a React/wagmi preview app and a standalone ethers v6 static HTML file (`public/afterlife.html`).

## Deployed Contracts

| Contract | Network | Address | Explorer |
|---|---|---|---|
| Afterlife | Arc Mainnet | 0xCBE6dF9722be9c40d18ed3d6263e42C74312C441 | https://explorer.arc.io/address/0xCBE6dF9722be9c40d18ed3d6263e42C74312C441 |
| Afterlife | Arc Testnet | 0x4d64cb8bd361061b92fe983c7326e172eb6fef7b | https://explorer.testnet.arc.io/address/0x4d64cb8bd361061b92fe983c7326e172eb6fef7b |

Constructor args: `minWindow = 604800` (7 days). USDC hardcoded at `0x3600000000000000000000000000000000000000`.
Deploy tx (mainnet): 0x34d38a0a63d2856f4cdfc4c5e9223801879f38c67897b64f0582dbf78caa5667
Deployer: 0x52F016116508986c6ef2419266075cD7C4C01434

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
