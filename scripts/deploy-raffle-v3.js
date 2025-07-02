const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  //console.log("🚀 Deploying NadRaffle V3 Contract...");
  
  const [deployer] = await ethers.getSigners();
  //console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  //console.log("Account balance:", ethers.formatEther(balance), "MON");

  // Deploy the contract
  const NadRaffleV3 = await ethers.getContractFactory("NadRaffleV3");
  const nadRaffleV3 = await NadRaffleV3.deploy();

  await nadRaffleV3.waitForDeployment();
  const contractAddress = await nadRaffleV3.getAddress();

  //console.log("✅ NadRaffle V3 deployed to:", contractAddress);

  // Get deployment transaction
  const deploymentTx = nadRaffleV3.deploymentTransaction();
  //console.log("Transaction hash:", deploymentTx.hash);
  //console.log("Block number:", deploymentTx.blockNumber);
  //console.log("Gas used:", deploymentTx.gasLimit.toString());

  // Verify basic functionality
  //console.log("\n🔍 Verifying contract functionality...");
  
  try {
    const totalRaffles = await nadRaffleV3.getTotalRaffles();
    //console.log("✅ Total raffles:", totalRaffles.toString());
    
    const platformFee = await nadRaffleV3.platformFeePercentage();
    //console.log("✅ Platform fee:", platformFee.toString(), "basis points");
    
    const owner = await nadRaffleV3.owner();
    //console.log("✅ Contract owner:", owner);
    
  } catch (error) {
    //console.error("❌ Error verifying contract:", error.message);
  }

  // Save deployment information
  const deploymentInfo = {
    network: "monadTestnet",
    contractName: "NadRaffleV3",
    address: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: deploymentTx.hash,
    blockNumber: deploymentTx.blockNumber,
    gasUsed: deploymentTx.gasLimit.toString(),
    constructorArgs: [],
    abi: JSON.stringify(nadRaffleV3.interface.formatJson())
  };

  const filename = "raffle-v3-deployment-monadTestnet.json";
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  //console.log(`\n📄 Deployment info saved to ${filename}`);

  //console.log("\n🎯 Next Steps:");
  //console.log("1. Update frontend hooks to use V3 contract address");
  //console.log("2. Test raffle creation with native MON rewards");
  //console.log("3. Update dashboard to use V3 contract");
  
  //console.log("\n📋 Contract Summary:");
  //console.log("- Address:", contractAddress);
  //console.log("- Network: Monad Testnet");
  //console.log("- Features: Native MON rewards, Multi-token support, Enhanced security");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 