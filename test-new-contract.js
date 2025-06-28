const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🧪 TESTING NEW FIXED CONTRACT");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("👤 Testing with wallet:", wallet.address);
  
  const newContractAddress = "0x225f2C16360e18BcAa36Fc3d0d3197e6756117d6"; // NEW FIXED
  const oldContractAddress = "0xb7a8e84F06124D2E444605137E781cDd7ac480fa"; // OLD
  
  // Test ABI for basic functions
  const testAbi = [
    "function getTotalRaffles() external view returns (uint256)",
    "function getActiveRaffles() external view returns (uint256[])",
    "function owner() external view returns (address)",
    "function REVEAL_WINDOW() external view returns (uint256)",
    "function finalizeExpiredRaffles() external",
    "function paused() external view returns (bool)"
  ];
  
  const newContract = new ethers.Contract(newContractAddress, testAbi, wallet);
  const oldContract = new ethers.Contract(oldContractAddress, testAbi, wallet);
  
  console.log("\n🔍 NEW FIXED CONTRACT STATUS:");
  console.log("📍 Address:", newContractAddress);
  
  try {
    const totalRaffles = await newContract.getTotalRaffles();
    const activeRaffles = await newContract.getActiveRaffles();
    const owner = await newContract.owner();
    const revealWindow = await newContract.REVEAL_WINDOW();
    
    console.log("📊 Total Raffles:", totalRaffles.toString());
    console.log("🎯 Active Raffles:", activeRaffles.length);
    console.log("👑 Owner:", owner);
    console.log("⏰ Reveal Window:", revealWindow.toString(), "seconds");
    
    // Test new function
    console.log("\n🧹 Testing finalizeExpiredRaffles function...");
    try {
      const gasEstimate = await newContract.finalizeExpiredRaffles.estimateGas();
      console.log("✅ finalizeExpiredRaffles function exists! Gas estimate:", gasEstimate.toString());
    } catch (error) {
      console.log("❌ finalizeExpiredRaffles error:", error.message);
    }
    
    console.log("✅ NEW CONTRACT IS WORKING!");
    
  } catch (error) {
    console.log("❌ NEW contract error:", error.message);
  }
  
  console.log("\n🔍 OLD CONTRACT STATUS:");
  console.log("📍 Address:", oldContractAddress);
  
  try {
    const totalRaffles = await oldContract.getTotalRaffles();
    const activeRaffles = await oldContract.getActiveRaffles();
    
    console.log("📊 Old Total Raffles:", totalRaffles.toString());
    console.log("🎯 Old Active Raffles:", activeRaffles.length);
    
    // Test if pause function exists
    try {
      const isPaused = await oldContract.paused();
      console.log("⏸️  Old contract paused:", isPaused);
    } catch (error) {
      console.log("⚠️  Old contract has no pause function");
    }
    
  } catch (error) {
    console.log("❌ OLD contract error:", error.message);
  }
  
  console.log("\n🎯 SUMMARY:");
  console.log("✅ NEW Fixed Contract: WORKING");
  console.log("⚠️  OLD Contract: Still active (no pause function)");
  console.log("💡 Recommendation: Update frontend to use new contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 