# Afterlife — a USDC dead-man's switch on Arc

Owner deposits USDC into a vault, checks in now and then, and if they go silent past a chosen window **anyone** can release the vault and each beneficiary receives their share (claimable by anyone on their behalf, so beneficiaries need no gas).

```
npm install --legacy-peer-deps
npm test                       # 19 contract tests (Hardhat)
npx hardhat node               # terminal 1
npm run deploy:local           # terminal 2: mock USDC at the real Arc USDC address + Afterlife, writes frontend/config.js
npm run e2e                    # scripted full lifecycle against the node
npm run serve                  # http://localhost:8080  (point MetaMask at http://127.0.0.1:8545, chain 31337)
npm run ui-test                # headless Chrome drives the real UI (needs /usr/bin/google-chrome)
```
Arc: `PRIVATE_KEY=0x… npm run deploy:testnet` / `PRIVATE_KEY=0x… MIN_WINDOW=60 npm run deploy:mainnet` (YOU run these with your own key; no key lives in this repo).
`deploy:local` overwrites `frontend/config.js`; re-run `npm run deploy:mainnet` (rewrites it for Arc mainnet) before publishing.
Unaudited demo software — use tiny amounts.
