import { ethers } from "hardhat";

async function approveGasStationDirectly() {
  const [admin] = await ethers.getSigners();
  
  console.log("🔓 Approving Gas Station for USDT transfers");
  console.log("├── Admin:", admin.address);
  console.log("├── Gas Station: 0x1dA2b030808D46678284dB112bfe066AA9A8be0E");
  
  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
  const GAS_STATION_ADDRESS = "0x1dA2b030808D46678284dB112bfe066AA9A8be0E";
  
  const usdt = await ethers.getContractAt([
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
  ], USDT_ADDRESS);
  
  // Check current state
  const adminBalance = await usdt.balanceOf(admin.address);
  const currentAllowance = await usdt.allowance(admin.address, GAS_STATION_ADDRESS);
  const decimals = await usdt.decimals(); // Get actual decimals from contract

  console.log("\n💰 Current State:");
  console.log("├── Admin USDT Balance:", ethers.formatUnits(adminBalance, decimals), "USDT");
  console.log("├── Current Gas Station Allowance:", ethers.formatUnits(currentAllowance, decimals), "USDT");
  console.log("├── USDT Decimals:", decimals.toString());
  console.log("├── Current Allowance (raw):", currentAllowance.toString());
  console.log("└── Gas Station Address:", GAS_STATION_ADDRESS);

  // 🔥 FIX: Use the contract's actual decimals (18 in your case)
  const actualDecimals = Number(decimals);
  const approveAmount = ethers.parseUnits("10000000", actualDecimals); // 10M USDT with actual decimals

  console.log(`\n🔓 Approving ${ethers.formatUnits(approveAmount, actualDecimals)} USDT for Gas Station...`);
  console.log("├── Spender (Gas Station):", GAS_STATION_ADDRESS);
  console.log("├── Amount (raw):", approveAmount.toString());
  console.log("├── Amount (formatted):", ethers.formatUnits(approveAmount, actualDecimals), "USDT");
  console.log("├── Using USDT Decimals:", actualDecimals);
  console.log(`└── Expected raw value: ${ethers.parseUnits("10000000", actualDecimals).toString()}`);

  // Reset allowance if needed
  if (currentAllowance > 0) {
    console.log("\n🔄 Resetting existing allowance to 0...");
    const resetTx = await usdt.approve(GAS_STATION_ADDRESS, 0, {
      gasLimit: 50000,
      gasPrice: ethers.parseUnits("1", "gwei")
    });
    console.log("📝 Reset transaction:", resetTx.hash);
    await resetTx.wait();
    console.log("✅ Allowance reset to 0");
  }

  try {
    console.log("\n🔓 Setting new allowance...");
    const tx = await usdt.approve(GAS_STATION_ADDRESS, approveAmount, {
      gasLimit: 50000,
      gasPrice: ethers.parseUnits("1", "gwei")
    });
    
    console.log("📝 Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newAllowance = await usdt.allowance(admin.address, GAS_STATION_ADDRESS);
    console.log("\n✅ Gas Station USDT approval successful!");
    console.log("├── New allowance (raw):", newAllowance.toString());
    console.log("├── New allowance (formatted):", ethers.formatUnits(newAllowance, actualDecimals), "USDT");
    console.log("├── Expected:", approveAmount.toString());
    console.log("├── Actual:", newAllowance.toString());
    console.log("└── Match:", newAllowance.toString() === approveAmount.toString() ? "✅ YES" : "❌ NO");
    
    console.log("\n🔗 Verify on BSCScan:");
    console.log(`https://bscscan.com/tx/${tx.hash}`);
    
  } catch (error) {
    console.error("❌ Failed to approve USDT for Gas Station:", error);
  }
}

approveGasStationDirectly()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });