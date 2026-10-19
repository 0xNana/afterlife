/* Afterlife core: ABI + pure helpers. Works in the browser (window.AfterlifeCore) and in Node (module.exports). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AfterlifeCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const ARC_USDC = "0x3600000000000000000000000000000000000000"; // ERC-20 interface of Arc's native USDC (6 decimals)

  const AFTERLIFE_ABI = [
    "function usdc() view returns (address)",
    "function minWindow() view returns (uint64)",
    "function nextVaultId() view returns (uint256)",
    "function createVault(string name, address[] beneficiaries, uint16[] shares, uint64 window, uint256 initialDeposit) returns (uint256)",
    "function deposit(uint256 id, uint256 amount)",
    "function checkIn(uint256 id)",
    "function withdraw(uint256 id, uint256 amount)",
    "function setBeneficiaries(uint256 id, address[] beneficiaries, uint16[] shares)",
    "function close(uint256 id)",
    "function release(uint256 id)",
    "function claim(uint256 id, uint256 index)",
    "function claimAll(uint256 id)",
    "function deadline(uint256 id) view returns (uint256)",
    "function isExpired(uint256 id) view returns (bool)",
    "function shareOf(uint256 id, uint256 index) view returns (uint256)",
    "function getVault(uint256 id) view returns (address owner, string name, uint8 status, uint64 window, uint64 lastCheckIn, uint256 balance, uint256 released, uint256 claimedAmount, address[] beneficiaries, uint16[] shares, bool[] claimedFlags)",
    "function vaultsOfOwner(address) view returns (uint256[])",
    "function vaultsOfBeneficiary(address) view returns (uint256[])",
    "event VaultCreated(uint256 indexed id, address indexed owner, string name, uint64 window)",
    "event Released(uint256 indexed id, address indexed by, uint256 amount)",
    "event Claimed(uint256 indexed id, uint256 indexed index, address indexed beneficiary, uint256 amount)",
  ];
  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
  ];
  const STATUS = ["None", "Active", "Released", "Closed"];
  const UNITS = { minutes: 60, hours: 3600, days: 86400, seconds: 1 };

  function fmtUsdc(bn) {
    const s = bn.toString().padStart(7, "0");
    const whole = s.slice(0, -6), frac = s.slice(-6).replace(/0+$/, "");
    return frac ? `${whole}.${frac}` : whole;
  }
  function parseUsdc(str) {
    const m = /^\s*(\d+)(?:\.(\d{1,6}))?\s*$/.exec(String(str));
    if (!m) throw new Error("Enter a USDC amount with at most 6 decimals");
    return BigInt(m[1]) * 1000000n + BigInt((m[2] || "").padEnd(6, "0") || "0");
  }
  function humanDuration(secs) {
    secs = Math.max(0, Math.floor(Number(secs)));
    const d = Math.floor(secs / 86400), h = Math.floor((secs % 86400) / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    const parts = [];
    if (d) parts.push(d + "d");
    if (h) parts.push(h + "h");
    if (m) parts.push(m + "m");
    if (!d && !h) parts.push(s + "s");
    return parts.join(" ");
  }
  /** rows: [{address, percent}] -> {addresses, shares(bps)}; throws readable errors. isAddress injected for testability */
  function buildBeneficiaries(rows, isAddress, owner) {
    const clean = rows.filter((r) => (r.address || "").trim() || String(r.percent || "").trim());
    if (!clean.length) throw new Error("Add at least one beneficiary");
    if (clean.length > 10) throw new Error("Max 10 beneficiaries");
    const addresses = [], shares = [], seen = new Set();
    let total = 0;
    for (const r of clean) {
      const a = (r.address || "").trim();
      if (!isAddress(a)) throw new Error(`Invalid address: ${a || "(empty)"}`);
      if (/^0x0{40}$/i.test(a)) throw new Error("Zero address is not allowed (sends to it revert on Arc)");
      if (owner && a.toLowerCase() === owner.toLowerCase()) throw new Error("You cannot be your own beneficiary");
      if (seen.has(a.toLowerCase())) throw new Error(`Duplicate beneficiary: ${a}`);
      seen.add(a.toLowerCase());
      const p = Number(r.percent);
      if (!(p > 0)) throw new Error("Every beneficiary needs a share above 0%");
      const bps = Math.round(p * 100);
      if (Math.abs(bps - p * 100) > 1e-6) throw new Error("Shares support at most 2 decimals (e.g. 33.33)");
      addresses.push(a); shares.push(bps); total += bps;
    }
    if (total !== 10000) throw new Error(`Shares must add up to 100% (currently ${(total / 100).toFixed(2)}%)`);
    return { addresses, shares };
  }
  function windowSeconds(amount, unit) {
    const n = Number(amount);
    if (!(n > 0) || !UNITS[unit]) throw new Error("Pick a valid inactivity window");
    return Math.round(n * UNITS[unit]);
  }
  function normalizeVault(id, raw, nowSec) {
    const [owner, name, status, window, lastCheckIn, balance, released, claimedAmount, beneficiaries, shares, claimedFlags] = raw;
    const deadline = Number(lastCheckIn) + Number(window);
    const st = STATUS[Number(status)];
    return {
      id: Number(id), owner, name, status: st, window: Number(window), lastCheckIn: Number(lastCheckIn), deadline,
      balance, released, claimedAmount, beneficiaries: [...beneficiaries], shares: [...shares].map(Number), claimedFlags: [...claimedFlags],
      expired: st === "Active" && nowSec > deadline, secondsLeft: Math.max(0, deadline - nowSec),
    };
  }
  async function loadVault(af, id, nowSec) { return normalizeVault(id, await af.getVault(id), nowSec); }
  async function loadMine(af, who, nowSec) {
    const [o, b] = await Promise.all([af.vaultsOfOwner(who), af.vaultsOfBeneficiary(who)]);
    const owned = await Promise.all(o.map((id) => loadVault(af, id, nowSec)));
    const uniq = [...new Set(b.map(Number))];
    const inh = (await Promise.all(uniq.map((id) => loadVault(af, id, nowSec)))).filter((v) => v.beneficiaries.some((x) => x.toLowerCase() === who.toLowerCase()));
    return { owned, inherited: inh };
  }
  /** Arc enforces a 20 gwei maxFeePerGas floor. */
  async function feeOverrides(provider, minGwei) {
    const fd = await provider.getFeeData();
    const floor = BigInt(Math.round((minGwei || 20) * 1e9));
    const max = fd.maxFeePerGas && fd.maxFeePerGas > floor ? fd.maxFeePerGas : floor;
    const tip = fd.maxPriorityFeePerGas && fd.maxPriorityFeePerGas < max ? fd.maxPriorityFeePerGas : 1n;
    return { maxFeePerGas: max, maxPriorityFeePerGas: tip };
  }
  function explorerTx(cfg, hash) { return `${cfg.explorer}/tx/${hash}`; }
  function explorerAddr(cfg, a) { return `${cfg.explorer}/address/${a}`; }

  return { ARC_USDC, AFTERLIFE_ABI, ERC20_ABI, STATUS, UNITS, fmtUsdc, parseUsdc, humanDuration, buildBeneficiaries, windowSeconds, normalizeVault, loadVault, loadMine, feeOverrides, explorerTx, explorerAddr };
});
