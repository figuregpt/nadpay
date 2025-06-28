const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Deploying NadRaffleV4Fast (FIXED) Contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MON");

  // Deploy the fixed contract
  console.log("\n📦 Deploying NadRaffleV4Fast (Fixed)...");
  const NadRaffleV4Fast = await ethers.getContractFactory("NadRaffleV4Fast");
  const contract = await NadRaffleV4Fast.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ NadRaffleV4Fast (FIXED) deployed to:", contractAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalRaffles = await contract.getTotalRaffles();
  const revealWindow = await contract.REVEAL_WINDOW();
  const owner = await contract.owner();
  
  console.log("📊 Total Raffles:", totalRaffles.toString());
  console.log("⏰ Reveal Window:", revealWindow.toString(), "seconds (", revealWindow.toString() / 60, "minutes)");
  console.log("👑 Owner:", owner);

  // Save deployment info
  const deploymentInfo = {
    contractName: "NadRaffleV4Fast",
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    network: "monadTestnet",
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    revealWindowSeconds: revealWindow.toString(),
    revealWindowMinutes: (Number(revealWindow) / 60).toString(),
    version: "FIXED",
    bugFixes: [
      "Fixed expired raffle finalization",
      "Added commitRandomnessForExpiredRaffle function",
      "Added finalizeExpiredRaffles function",
      "Added _cancelRaffleInternal for no-ticket raffles",
      "Solves stuck expired raffle problem"
    ],
    features: [
      "2-minute reveal window (instead of 1 hour)",
      "Optimized for Monad's 0.5s block time", 
      "Same security features as Ultra-Secure",
      "Fast winner selection",
      "Proper expired raffle handling"
    ]
  };

  const fileName = `raffle-v4-fast-FIXED-deployment-monadTestnet-${Date.now()}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${fileName}`);

  // Generate ABI
  console.log("\n📝 Generating ABI...");
  const artifact = await ethers.getContractFactory("NadRaffleV4Fast");
  const abi = artifact.interface.formatJson();
  fs.writeFileSync('NadRaffleV4-Fast-FIXED.abi.json', abi);
  console.log("💾 ABI saved to: NadRaffleV4-Fast-FIXED.abi.json");

  console.log("\n🎉 FIXED Contract Deployment completed successfully!");
  console.log("📋 Summary:");
  console.log("   Contract:", contractAddress);
  console.log("   Reveal Window: 2 minutes ⚡");
  console.log("   Network: Monad Testnet");
  console.log("   Version: FIXED - Solves expired raffle stuck problem!");
  console.log("\n🔧 Bug Fixes Applied:");
  console.log("   ✅ Expired raffles with tickets → Auto commit + emergency select");
  console.log("   ✅ Expired raffles without tickets → Cancel + return reward to creator");
  console.log("   ✅ Sold out raffles → Immediate commit + fast selection");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 