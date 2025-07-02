const { ethers } = require("hardhat");
const hre = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("🚀 DEPLOYING NADRAFFLE V6 - ULTRA SECURE SYSTEM");
  console.log("=" * 60);
  
  // Use direct provider for Monad testnet
  let deployer;
  if (hre.network.name === "monadTestnet") {
    const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
    deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  } else {
    [deployer] = await ethers.getSigners();
  }
  
  console.log("\n📊 DEPLOYMENT DETAILS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏗️  Deploying contracts with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} MON`);
  
  if (parseFloat(ethers.formatEther(balance)) < 1.0) {
    console.log("❌ Insufficient balance! Need at least 1 MON for deployment");
    return;
  }
  
  // Deployment parameters
  const deploymentParams = {
    feeAddress: deployer.address, // Use deployer as initial fee address
    creationFee: ethers.parseEther("0.1"), // 0.1 MON
    platformFeePercentage: 250, // 2.5%
    minDuration: 3600, // 1 hour
    maxDuration: 30 * 24 * 3600 // 30 days
  };
  
  console.log("\n⚙️  DEPLOYMENT PARAMETERS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Fee Address: ${deploymentParams.feeAddress}`);
  console.log(`💰 Creation Fee: ${ethers.formatEther(deploymentParams.creationFee)} MON`);
  console.log(`📊 Platform Fee: ${deploymentParams.platformFeePercentage / 100}%`);
  console.log(`⏰ Min Duration: ${deploymentParams.minDuration / 3600} hours`);
  console.log(`⏰ Max Duration: ${deploymentParams.maxDuration / (24 * 3600)} days`);
  
  try {
    console.log("\n🔨 Deploying NadRaffle V6...");
    
    // Get the contract factory
    const NadRaffleV6 = await ethers.getContractFactory("NadRaffleV6", deployer);
    
    // Deploy the contract
    const nadRaffle = await NadRaffleV6.deploy(
      deploymentParams.feeAddress,
      deploymentParams.creationFee,
      deploymentParams.platformFeePercentage,
      deploymentParams.minDuration,
      deploymentParams.maxDuration
    );
    
    console.log("⏳ Waiting for deployment confirmation...");
    await nadRaffle.waitForDeployment();
    
    const contractAddress = await nadRaffle.getAddress();
    const deploymentTx = nadRaffle.deploymentTransaction();
    
    console.log("\n✅ DEPLOYMENT SUCCESS!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🧾 Transaction Hash: ${deploymentTx.hash}`);
    console.log(`⛽ Gas Used: ${deploymentTx.gasLimit}`);
    
    // Wait for additional confirmations
    console.log("\n⏳ Waiting for additional confirmations...");
    const receipt = await deploymentTx.wait(3);
    console.log(`✅ Confirmed in block: ${receipt.blockNumber}`);
    
    // Verify deployment
    console.log("\n🔍 VERIFYING DEPLOYMENT:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const owner = await nadRaffle.owner();
    const feeAddress = await nadRaffle.feeAddress();
    const creationFee = await nadRaffle.creationFee();
    const platformFee = await nadRaffle.platformFeePercentage();
    const totalRaffles = await nadRaffle.totalRaffles();
    
    console.log(`👑 Owner: ${owner}`);
    console.log(`💰 Fee Address: ${feeAddress}`);
    console.log(`💵 Creation Fee: ${ethers.formatEther(creationFee)} MON`);
    console.log(`📊 Platform Fee: ${platformFee / 100}%`);
    console.log(`🎫 Total Raffles: ${totalRaffles}`);
    
    // Save deployment info
    const deploymentInfo = {
      network: "monadTestnet",
      contractAddress: contractAddress,
      transactionHash: deploymentTx.hash,
      blockNumber: receipt.blockNumber,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      gasUsed: receipt.gasUsed.toString(),
      parameters: {
        feeAddress: deploymentParams.feeAddress,
        creationFee: ethers.formatEther(deploymentParams.creationFee),
        platformFeePercentage: deploymentParams.platformFeePercentage,
        minDuration: deploymentParams.minDuration,
        maxDuration: deploymentParams.maxDuration
      },
      contractDetails: {
        owner: owner,
        feeAddress: feeAddress,
        creationFee: ethers.formatEther(creationFee),
        platformFeePercentage: Number(platformFee),
        totalRaffles: Number(totalRaffles)
      }
    };
    
    const filename = `nadraffle-v6-deployment-${Date.now()}.json`;
    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n💾 Deployment info saved to: ${filename}`);
    
    // Test basic functionality
    console.log("\n🧪 TESTING BASIC FUNCTIONALITY:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    try {
      // Test view functions
      const activeRaffles = await nadRaffle.getActiveRaffleIds();
      const expiredRaffles = await nadRaffle.getExpiredRaffleIds();
      const soldOutRaffles = await nadRaffle.getSoldOutRaffleIds();
      
      console.log(`✅ Active Raffles: ${activeRaffles.length}`);
      console.log(`✅ Expired Raffles: ${expiredRaffles.length}`);
      console.log(`✅ Sold Out Raffles: ${soldOutRaffles.length}`);
      console.log("✅ All view functions working correctly");
      
    } catch (error) {
      console.log("⚠️  Warning: Some view functions failed:", error.message);
    }
    
    console.log("\n🎯 FINALIZER SETUP INSTRUCTIONS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Update finalizer-v6-ultra-fast.js with contract address:");
    console.log(`   CONTRACT_ADDRESS = "${contractAddress}"`);
    console.log("2. Start the finalizer:");
    console.log("   node finalizer-v6-ultra-fast.js");
    console.log("3. Monitor finalizer logs for proper operation");
    
    console.log("\n🔧 ADMIN COMMANDS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("// Set fee address (if needed)");
    console.log(`await nadRaffle.setFeeAddress("0x...newFeeAddress");`);
    console.log("// Update fees (if needed)");
    console.log(`await nadRaffle.setCreationFee(ethers.parseEther("0.2"));`);
    console.log(`await nadRaffle.setPlatformFeePercentage(300); // 3%`);
    
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📍 Contract deployed at: ${contractAddress}`);
    console.log("🚀 NadRaffle V6 is ready for production use!");
    console.log("🔒 Ultra-secure with 2-phase finalization");
    console.log("⚡ Gas-optimized for maximum efficiency");
    console.log("💰 Profitable with 0.1 MON creation fee");
    
  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.error("💡 Solution: Add more MON to deployer account");
    } else if (error.message.includes("gas")) {
      console.error("💡 Solution: Increase gas limit or gas price");
    } else if (error.message.includes("revert")) {
      console.error("💡 Solution: Check constructor parameters");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }); 