// Active network config. `npm run deploy:local` OVERWRITES this file for local testing;
// after the real Arc mainnet deploy, set `afterlife` to the deployed address (or run `npm run deploy:mainnet`,
// which writes it for you). Hosting this folder (e.g. Vercel / GitHub Pages / Netlify) gives the "live app link".
window.AFTERLIFE_CONFIG = {
  name: "Arc Mainnet",
  chainId: 5042,
  rpc: "https://rpc.mainnet.arc.io",
  explorer: "https://explorer.arc.io",
  usdc: "0x3600000000000000000000000000000000000000",
  afterlife: "", // <-- deployed Afterlife contract address on Arc mainnet
  minFeeGwei: 20,
  currency: { name: "USDC", symbol: "USDC", decimals: 18 },
  local: false,
};
