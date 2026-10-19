require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

// NOTE: no private keys live in this repo. For the Arc mainnet deploy the user passes their own
// key at deploy time via the PRIVATE_KEY env var (see scripts/deploy.js and PLAN.md).
const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

module.exports = {
  solidity: { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" } },
  networks: {
    arcMainnet: { url: "https://rpc.mainnet.arc.io", chainId: 5042, accounts },
    arcTestnet: { url: "https://rpc.testnet.arc.io", chainId: 5042002, accounts },
  },
};
