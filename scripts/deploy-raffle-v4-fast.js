const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Deploying NadRaffleV4Fast Contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MON");

  // Deploy the contract
  console.log("\n📦 Deploying NadRaffleV4Fast...");
  const NadRaffleV4Fast = await ethers.getContractFactory("NadRaffleV4Fast");
  const contract = await NadRaffleV4Fast.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ NadRaffleV4Fast deployed to:", contractAddress);

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
    features: [
      "2-minute reveal window (instead of 1 hour)",
      "Optimized for Monad's 0.5s block time",
      "Same security features as Ultra-Secure",
      "Fast winner selection"
    ]
  };

  const fileName = `raffle-v4-fast-deployment-monadTestnet-${Date.now()}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${fileName}`);

  // Generate ABI
  console.log("\n📝 Generating ABI...");
  const artifact = await ethers.getContractFactory("NadRaffleV4Fast");
  const abi = artifact.interface.formatJson();
  fs.writeFileSync('NadRaffleV4-Fast.abi.json', abi);
  console.log("💾 ABI saved to: NadRaffleV4-Fast.abi.json");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Summary:");
  console.log("   Contract:", contractAddress);
  console.log("   Reveal Window: 2 minutes ⚡");
  console.log("   Network: Monad Testnet");
  console.log("   Ready for fast raffle operations!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 