import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

// Validate required environment variables
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const GAS_STATION_PRIVATE_KEY = process.env.GAS_STATION_PRIVATE_KEY;

if (!DEPLOYER_PRIVATE_KEY) {
  throw new Error("DEPLOYER_PRIVATE_KEY is required in .env file");
}

if (!GAS_STATION_PRIVATE_KEY) {
  throw new Error("GAS_STATION_PRIVATE_KEY is required in .env file");
}

// Validate private key format
const validatePrivateKey = (key: string, name: string) => {
  if (!key.startsWith('0x') || key.length !== 66) {
    throw new Error(`${name} must be a valid private key starting with 0x and 64 characters long`);
  }
};

validatePrivateKey(DEPLOYER_PRIVATE_KEY, "DEPLOYER_PRIVATE_KEY");
validatePrivateKey(GAS_STATION_PRIVATE_KEY, "GAS_STATION_PRIVATE_KEY");

console.log("🔑 Private keys validated successfully");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: [
        {
          privateKey: DEPLOYER_PRIVATE_KEY,
          balance: "10000000000000000000000", // 10,000 ETH
        },
        {
          privateKey: GAS_STATION_PRIVATE_KEY,
          balance: "10000000000000000000000", // 10,000 ETH
        },
      ],
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: [DEPLOYER_PRIVATE_KEY, GAS_STATION_PRIVATE_KEY],
      gasPrice: 10000000000, // 10 gwei
      gas: 2100000,
      timeout: 60000,
    },
    bsc: {
      url: process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org/",
      chainId: 56,
      accounts: [DEPLOYER_PRIVATE_KEY, GAS_STATION_PRIVATE_KEY],
      gasPrice: 1000000000,
      gas: 2100000,
      timeout: 120000, 
    },

    bscCheap: {
      url: process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org/",
      chainId: 56,
      accounts: [DEPLOYER_PRIVATE_KEY, GAS_STATION_PRIVATE_KEY],
      gasPrice: 1000000000,
      gas: 2500000,
      timeout: 300000,
    },
  },
  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
    },
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
