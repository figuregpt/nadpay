const hre = require("hardhat");

async function main() {
  console.log("Deploying NadSwap contract...");

  // Deploy the contract
  const NadSwap = await hre.ethers.getContractFactory("NadSwap");
  const nadSwap = await NadSwap.deploy();

  await nadSwap.waitForDeployment();

  const contractAddress = await nadSwap.getAddress();
  console.log("NadSwap deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    contractName: "NadSwap",
    contractAddress: contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address,
    version: "v2.0.0", // Updated version without native token support
    features: [
      "ERC20 token swaps",
      "NFT swaps", 
      "1-hour proposal duration",
      "0.1 MON proposal fee",
      "Escrow system",
      "No native token support"
    ]
  };

  const fs = require('fs');
  const deploymentPath = `nadswap-v2-deployment-${hre.network.name}.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${deploymentPath}`);

  // Verify on block explorer if not local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await nadSwap.deploymentTransaction().wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified on block explorer");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 