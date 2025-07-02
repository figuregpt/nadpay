const hre = require("hardhat");

async function main() {
  //console.log("🚀 Deploying NadPay V2 contract to Monad Testnet...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  //console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  //console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MON");

  if (balance < hre.ethers.parseEther("0.1")) {
    //console.warn("⚠️  Low balance! Make sure you have enough MON for deployment");
  }

  try {
    // Deploy NadPay V2
    //console.log("\n📦 Deploying NadPayV2 contract...");
    const NadPayV2 = await hre.ethers.getContractFactory("NadPayV2");
    
    const nadPayV2 = await NadPayV2.deploy();
    await nadPayV2.waitForDeployment();

    const nadPayV2Address = await nadPayV2.getAddress();
    //console.log("✅ NadPayV2 deployed to:", nadPayV2Address);

    // Verify deployment
    //console.log("\n🔍 Verifying deployment...");
    const code = await hre.ethers.provider.getCode(nadPayV2Address);
    if (code === "0x") {
      throw new Error("Contract deployment failed - no code at address");
    }
    //console.log("✅ Contract code verified at address");

    // Test basic functionality
    //console.log("\n🧪 Testing basic functionality...");
    
    // Check initial state
    const totalLinks = await nadPayV2.getTotalLinks();
    //console.log("📊 Initial total links:", totalLinks.toString());
    
    const platformFee = await nadPayV2.platformFee();
    //console.log("💳 Platform fee:", platformFee.toString(), "basis points");
    
    const feeRecipient = await nadPayV2.feeRecipient();
    //console.log("🏦 Fee recipient:", feeRecipient);

    // Save deployment info
    const deploymentInfo = {
      network: "monadTestnet",
      contractName: "NadPayV2",
      address: nadPayV2Address,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      blockNumber: await hre.ethers.provider.getBlockNumber(),
      platformFee: platformFee.toString(),
      feeRecipient: feeRecipient,
      features: [
        "Multi-token payments (MON + ERC20)",
        "SafeERC20 integration",
        "Enhanced events with payment token info",
        "Emergency token withdrawal"
      ]
    };

    // Write deployment info to file
    const fs = require('fs');
    fs.writeFileSync(
      'nadpay-v2-deployment-monadTestnet.json',
      JSON.stringify(deploymentInfo, null, 2)
    );

    //console.log("\n🎉 NadPay V2 deployment completed successfully!");
    //console.log("📄 Deployment info saved to: nadpay-v2-deployment-monadTestnet.json");
    
    //console.log("\n📋 Summary:");
    //console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    //console.log("🏷️  Contract: NadPayV2");
    //console.log("🌐 Network: Monad Testnet");
    //console.log("📍 Address:", nadPayV2Address);
    //console.log("👤 Deployer:", deployer.address);
    //console.log("💰 Platform Fee:", platformFee.toString(), "basis points (1%)");
    //console.log("🏦 Fee Recipient:", feeRecipient);
    //console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    //console.log("\n🔗 Next steps:");
    //console.log("1. Update frontend to use new V2 contract address");
    //console.log("2. Update useNadPayContract.ts with V2 ABI and address");
    //console.log("3. Test multi-token payment functionality");
    //console.log("4. Update Web3AppContent.tsx to remove V1 compatibility warnings");

    //console.log("\n🌟 New V2 Features:");
    //console.log("• Multi-token payments (MON + any ERC20)");
    //console.log("• Enhanced events with payment token information");
    //console.log("• SafeERC20 for secure token transfers");
    //console.log("• Emergency token withdrawal for admin");

  } catch (error) {
    //console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("💥 Deployment script failed:", error);
    process.exit(1);
  }); 