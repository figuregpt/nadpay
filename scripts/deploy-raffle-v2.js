const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  //console.log("🚀 Deploying NadRaffleV2 contract to Monad Testnet...");

  // Get network
  const network = hre.network.name;
  //console.log(`📡 Network: ${network}`);

  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  //console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  //console.log(`💰 Deployer balance: ${hre.ethers.formatEther(balance)} MON`);

  if (balance < hre.ethers.parseEther("0.1")) {
    throw new Error("❌ Insufficient balance for deployment. Need at least 0.1 MON");
  }

  try {
    // Deploy NadRaffleV2
    //console.log("\n📦 Deploying NadRaffleV2 contract...");
    const NadRaffleV2 = await hre.ethers.getContractFactory("NadRaffleV2");
    
    const raffleV2 = await NadRaffleV2.deploy();
    await raffleV2.waitForDeployment();
    
    const raffleV2Address = await raffleV2.getAddress();
    //console.log(`✅ NadRaffleV2 deployed to: ${raffleV2Address}`);

    // Wait for a few confirmations
    //console.log("⏳ Waiting for confirmations...");
    await raffleV2.deploymentTransaction().wait(3);

    // Verify contract on explorer (if available)
    try {
      if (network !== "hardhat" && network !== "localhost") {
        //console.log("🔍 Verifying contract on block explorer...");
        await hre.run("verify:verify", {
          address: raffleV2Address,
          constructorArguments: [],
        });
        //console.log("✅ Contract verified!");
      }
    } catch (error) {
      //console.log("⚠️ Contract verification failed:", error.message);
    }

    // Save deployment info
    const deploymentInfo = {
      network: network,
      contractName: "NadRaffleV2",
      address: raffleV2Address,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      transactionHash: raffleV2.deploymentTransaction().hash,
      blockNumber: (await raffleV2.deploymentTransaction().wait()).blockNumber,
      gasUsed: (await raffleV2.deploymentTransaction().wait()).gasUsed.toString(),
      constructorArgs: [],
      abi: NadRaffleV2.interface.formatJson()
    };

    // Save to deployment file
    const deploymentPath = path.join(__dirname, '..', `raffle-v2-deployment-${network}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    //console.log(`💾 Deployment info saved to: ${deploymentPath}`);

    // Update hook file with new address
    const hookPath = path.join(__dirname, '..', 'src', 'hooks', 'useNadRaffleV2Contract.ts');
    if (fs.existsSync(hookPath)) {
      let hookContent = fs.readFileSync(hookPath, 'utf8');
      hookContent = hookContent.replace(
        /const RAFFLE_V2_CONTRACT_ADDRESS = "0x[0-9a-fA-F]*"/,
        `const RAFFLE_V2_CONTRACT_ADDRESS = "${raffleV2Address}"`
      );
      fs.writeFileSync(hookPath, hookContent);
      //console.log(`🔧 Updated hook file with new contract address`);
    }

    //console.log("\n🎉 Deployment completed successfully!");
    //console.log("📋 Summary:");
    //console.log(`   Contract: NadRaffleV2`);
    //console.log(`   Address: ${raffleV2Address}`);
    //console.log(`   Network: ${network}`);
    //console.log(`   Deployer: ${deployer.address}`);
    //console.log(`   Gas Used: ${(await raffleV2.deploymentTransaction().wait()).gasUsed.toString()}`);

    //console.log("\n🔧 Next steps:");
    //console.log("1. Update frontend to use V2 contract");
    //console.log("2. Test raffle creation with different tokens");
    //console.log("3. Deploy to production when ready");

    // Test basic functionality
    //console.log("\n🧪 Testing basic contract functionality...");
    
    try {
      const totalRaffles = await raffleV2.getTotalRaffles();
      //console.log(`✅ Total raffles: ${totalRaffles}`);
      
      const platformFee = await raffleV2.platformFeePercentage();
      //console.log(`✅ Platform fee: ${platformFee / 100}%`);
      
      const owner = await raffleV2.owner();
      //console.log(`✅ Contract owner: ${owner}`);
      
      //console.log("🎯 Contract is ready for use!");
    } catch (error) {
      //console.log("⚠️ Contract test failed:", error.message);
    }

  } catch (error) {
    //console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 