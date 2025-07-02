const hre = require("hardhat");
const fs = require('fs');

async function main() {
  //console.log("🚀 Deploying NadSwapV3 (Escrow-based Swap Contract)...");

  // Get the contract factory
  const NadSwapV3 = await hre.ethers.getContractFactory("NadSwapV3");

  // Deploy the contract
  //console.log("📦 Deploying contract...");
  const nadSwapV3 = await NadSwapV3.deploy();

  // Wait for deployment to complete
  await nadSwapV3.waitForDeployment();

  const contractAddress = await nadSwapV3.getAddress();
  //console.log("✅ NadSwapV3 deployed to:", contractAddress);

  // Get deployment transaction details
  const deploymentTx = nadSwapV3.deploymentTransaction();
  //console.log("📋 Deployment transaction hash:", deploymentTx.hash);

  // Wait for a few block confirmations
  //console.log("⏳ Waiting for block confirmations...");
  await deploymentTx.wait(3);

  // Get contract details
  const proposalFee = await nadSwapV3.proposalFee();
  const proposalDuration = await nadSwapV3.proposalDuration();
  
  //console.log("\n📊 Contract Configuration:");
  //console.log("- Proposal Fee:", hre.ethers.formatEther(proposalFee), "MON");
  //console.log("- Proposal Duration:", Number(proposalDuration) / 3600, "hours");

  // Save deployment info
  const deploymentInfo = {
    contractName: "NadSwapV3",
    contractAddress: contractAddress,
    deploymentTxHash: deploymentTx.hash,
    blockNumber: deploymentTx.blockNumber,
    deployer: deploymentTx.from,
    deployedAt: new Date().toISOString(),
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    proposalFee: hre.ethers.formatEther(proposalFee),
    proposalDuration: Number(proposalDuration),
    features: [
      "Escrow-based asset swaps",
      "Native MON support",
      "ERC20 token support", 
      "ERC721 NFT support",
      "Auto-expiration after 1 hour",
      "Manual cancellation",
      "Emergency withdrawal"
    ]
  };

  const fileName = `nadswap-v3-deployment-${hre.network.name}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  //console.log(`💾 Deployment info saved to: ${fileName}`);

  // Verify contract on explorer if not local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    //console.log("🔍 Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      //console.log("✅ Contract verified successfully!");
    } catch (error) {
      //console.log("❌ Verification failed:", error.message);
      //console.log("You can verify manually later with:");
      //console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
    }
  }

  //console.log("\n🎉 Deployment completed successfully!");
  //console.log("\n📝 Next steps:");
  //console.log("1. Update frontend contract address and ABI");
  //console.log("2. Test contract functions");
  //console.log("3. Update documentation");
  
  //console.log("\n🔧 Contract Functions:");
  //console.log("- createProposal(): Create swap proposal with escrow");
  //console.log("- acceptProposal(): Accept and execute swap");
  //console.log("- cancelProposal(): Cancel and retrieve assets");
  //console.log("- expireProposal(): Expire and return assets");
  //console.log("- emergencyWithdraw(): Emergency asset recovery");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 