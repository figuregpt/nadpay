const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  //console.log("🚀 Deploying NadRaffleV3 with Automatic Reward Distribution...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  //console.log("Deploying contracts with the account:", deployer.address);
  //console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const NadRaffleV3 = await hre.ethers.getContractFactory("NadRaffleV3");
  const nadRaffleV3 = await NadRaffleV3.deploy();

  await nadRaffleV3.waitForDeployment();
  const contractAddress = await nadRaffleV3.getAddress();

  //console.log("✅ NadRaffleV3 deployed to:", contractAddress);
  //console.log("🎲 Contract owner:", await nadRaffleV3.owner());
  //console.log("💰 Platform fee:", await nadRaffleV3.platformFeePercentage(), "basis points (2.5%)");

  // Test basic functionality
  //console.log("\n🧪 Testing basic contract functionality...");
  
  try {
    const totalRaffles = await nadRaffleV3.getTotalRaffles();
    //console.log("✅ Total raffles initialized:", totalRaffles.toString());
    
    const maxFee = await nadRaffleV3.MAX_FEE();
    //console.log("✅ Maximum fee limit:", maxFee.toString(), "basis points");
    
    //console.log("✅ Contract deployed and tested successfully!");
  } catch (error) {
    //console.error("❌ Error testing contract:", error);
  }

  // Generate deployment info
  const deploymentInfo = {
    contractName: "NadRaffleV3",
    address: contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    features: [
      "Automatic reward distribution",
      "No manual claiming needed", 
      "Prevents creator manipulation",
      "Supports both ERC20 and NFT rewards",
      "Multi-token payment support",
      "Expired raffle auto-finalization"
    ],
    gasUsed: "Estimated ~3.5M gas",
    verificationCommand: `npx hardhat verify --network ${hre.network.name} ${contractAddress}`,
    blockNumber: "TBD" // Will be filled after deployment confirmation
  };

  // Save deployment info
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `raffle-v3-auto-deployment-${hre.network.name}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  //console.log(`\n📄 Deployment info saved to: ${filepath}`);

  // Display important information
  //console.log("\n" + "=".repeat(80));
  //console.log("📋 DEPLOYMENT SUMMARY");
  //console.log("=".repeat(80));
  //console.log(`Contract Address: ${contractAddress}`);
  //console.log(`Network: ${hre.network.name} (Chain ID: ${hre.network.config.chainId})`);
  //console.log(`Deployer: ${deployer.address}`);
  //console.log(`Gas Limit: Auto (estimated ~3.5M gas)`);
  //console.log("\n🔥 NEW FEATURES:");
  //console.log("• ✅ Automatic reward distribution when raffle ends");
  //console.log("• ✅ No manual claiming - rewards sent instantly to winner");
  //console.log("• ✅ Prevents creator manipulation of rewards");
  //console.log("• ✅ Auto-end on sold out (if enabled by creator)");
  //console.log("• ✅ Force-end expired raffles by anyone");
  //console.log("• ✅ Automatic reward return if no tickets sold");
  
  //console.log("\n⚠️  IMPORTANT NOTES:");
  //console.log("• Creators can no longer manually end active raffles");
  //console.log("• Only expired raffles can be manually finalized");
  //console.log("• Rewards are distributed immediately upon raffle end");
  //console.log("• Old claimReward function is deprecated");
  
  //console.log("\n🔧 NEXT STEPS:");
  //console.log("1. Update frontend contract address");
  //console.log("2. Remove manual claim reward UI");
  //console.log("3. Update raffle end UI for automatic system");
  //console.log("4. Test with small amounts first");
  //console.log("5. Verify contract on explorer");
  
  //console.log(`\n📋 Verification Command:`);
  //console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
  
  //console.log("\n" + "=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 