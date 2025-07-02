const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("💰 Checking Deployment Balance");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const deployer = new ethers.Wallet(privateKey, provider);
  
  console.log("👤 Deployer address:", deployer.address);
  
  const balance = await provider.getBalance(deployer.address);
  const balanceInMON = ethers.formatEther(balance);
  
  console.log("💰 Current balance:", balanceInMON, "MON");
  
  // Check if enough for deployments
  const requiredForRaffle = ethers.parseEther("0.02"); // Estimate
  const requiredForSwap = ethers.parseEther("0.02"); // Estimate
  const totalRequired = requiredForRaffle + requiredForSwap;
  
  console.log("📊 DEPLOYMENT REQUIREMENTS:");
  console.log("🎫 NadRaffle V5:", ethers.formatEther(requiredForRaffle), "MON");
  console.log("🔄 NadSwap V4:", ethers.formatEther(requiredForSwap), "MON");
  console.log("📦 Total needed:", ethers.formatEther(totalRequired), "MON");
  
  if (balance >= totalRequired) {
    console.log("✅ Sufficient balance for both deployments!");
  } else if (balance >= requiredForRaffle) {
    console.log("⚠️ Enough for one deployment (NadRaffle V5)");
  } else {
    console.log("❌ Insufficient balance for deployments");
    console.log("💡 Need at least 0.02 MON for deployment");
  }
  
  console.log("\n🎯 Target fee recipient:", "0xddadef163ad373f9a0e7bec3bc5f4d0c61d247b1");
  console.log("👑 You (deployer) will remain contract owner");
  console.log("💰 But fees will go to target address automatically");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌", error);
    process.exit(1);
  }); 