# Prompt to paste into Arc Studio (studio.arc.io or `arc-studio run`)

Attach `contracts/Afterlife.sol`, `test/Afterlife.test.js` and `frontend/` as reference files (web: attach; CLI: `--file`).
The point is that the project in YOUR Arc Studio account is genuinely built there (25% of the score), so let Studio write, test and fix its own version.

---

Build "Afterlife": a USDC dead-man's switch / digital-inheritance vault for Arc, with a web app.

Contract (Solidity ^0.8.28, no upgradability, no admin keys, no owner-only escape hatch):
- Use ONLY the ERC-20 interface of USDC at 0x3600000000000000000000000000000000000000 (6 decimals). Never use msg.value / native balance.
- Vault: owner, name (<=64 bytes), inactivity window (seconds, between a constructor-set minWindow and 3650 days), lastCheckIn, balance, up to 10 beneficiaries with shares in basis points that sum to 10000 (last beneficiary receives the rounding remainder), status None/Active/Released/Closed.
- Owner: createVault(name, beneficiaries, shares, window, initialDeposit) (optionally funds in the same tx), checkIn(id) (heartbeat), withdraw(id, amt) and setBeneficiaries(id, ...) (both also count as a heartbeat), close(id) (refund remaining balance).
- Anyone: deposit(id, amt); release(id) once block.timestamp > lastCheckIn + window and balance > 0 (snapshots the balance, status Released); claim(id, index) and claimAll(id) pay beneficiaries their share and can be triggered by ANYONE (a beneficiary may hold no USDC for gas). claimAll must skip a failing/blocklisted beneficiary instead of reverting.
- Reject: zero address, owner as beneficiary, duplicates, zero share, shares != 10000. Remember address(0) transfers revert on Arc, and blocklisted USDC transfers revert.
- Reentrancy guard, custom errors, events for every state change, views: deadline, isExpired, shareOf, getVault, vaultsOfOwner, vaultsOfBeneficiary.
- Tests: create/validation, deposit, heartbeat, withdraw, setBeneficiaries, close, release timing (too early reverts), owner revival before release, exact shares + rounding dust, third-party claim, claimAll with a blocklisted beneficiary, beneficiary discovery.
- Fee note: Arc requires maxFeePerGas >= 20 gwei.

App: a static no-build web app (ethers v6) that connects a wallet, adds/switches to Arc mainnet (chain 5042, RPC https://rpc.mainnet.arc.io, explorer https://explorer.arc.io), lets the owner create a vault (approve USDC then createVault), shows live countdown + "I'm alive" check-in, deposit/withdraw/close, shows inheritances for a beneficiary with Release / Claim / Pay-everyone buttons, opens any vault by id, and logs every tx with an explorer.arc.io link.

Then: deploy to Arc TESTNET, run the tests, and push everything to GitHub.
