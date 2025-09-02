import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", Number(network.chainId));

  const USDT_ADDRESSES: { [key: number]: string } = {
    56: "0x55d398326f99059fF775485246999027B3197955", // BSC Mainnet
    97: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", // BSC Testnet
    31337: "0x0000000000000000000000000000000000000000" // Local hardhat (you'd deploy a mock)
  };

  const chainId = Number(network.chainId);
  let usdtAddress = USDT_ADDRESSES[chainId];
  
  if (!usdtAddress) {
    throw new Error(`USDT address not configured for chain ID: ${chainId}`);
  }

  console.log("Using USDT address:", usdtAddress);

  // Deploy the contract
  const P2PTrading = await ethers.getContractFactory("P2PTrading");
  console.log("Deploying P2PTrading contract...");
  
  const p2pTrading = await P2PTrading.deploy(usdtAddress);
  
  // Wait for deployment to complete
  await p2pTrading.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await p2pTrading.getAddress();

  console.log("✅ P2PTrading deployed to:", contractAddress);
  console.log("📄 USDT address:", usdtAddress);
  console.log("🌐 Network:", network.name);
  console.log("⛽ Deployer address:", deployer.address);
  
  // Test the deployed contract
  try {
    const orderCounter = await p2pTrading.getOrderCounter();
    console.log("📊 Current order counter:", orderCounter.toString());
    
  } catch (error) {
    console.error("❌ Error testing deployed contract:", error);
  }
  
  // Update the contract address in your frontend
  console.log("\n🔥 Update CONTRACTS.P2P_TRADING address in useWalletManager.ts:");
  console.log(`[${chainId}]: '${contractAddress}' as Address,`);
  
  // Contract verification info
  console.log("\n📋 To verify the contract, run:");
  console.log(`npx hardhat verify --network ${chainId === 56 ? 'bsc' : 'bscTestnet'} ${contractAddress} ${usdtAddress}`);
  
  // Save deployment info to a file
  const deploymentInfo = {
    network: network.name,
    chainId: chainId,
    contractAddress: contractAddress,
    usdtAddress: usdtAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  console.log("\n📝 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });