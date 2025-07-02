const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  //console.log("Starting NadSwap deployment...");

  // Get the contract factory
  const NadSwap = await ethers.getContractFactory("NadSwap");

  // Deploy the contract
  //console.log("Deploying NadSwap contract...");
  const nadSwap = await NadSwap.deploy();
  // Wait for deployment to be mined
  await nadSwap.waitForDeployment();

  const contractAddress = await nadSwap.getAddress();
  //console.log("NadSwap deployed to:", contractAddress);

  // Get deployment transaction details
  const deployTx = nadSwap.deploymentTransaction();
  //console.log("Deployment transaction hash:", deployTx.hash);
  //console.log("Gas used:", deployTx.gasLimit.toString());

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    transactionHash: deployTx.hash,
    blockNumber: deployTx.blockNumber,
    gasUsed: deployTx.gasLimit.toString(),
    network: "monadTestnet",
    deployedAt: new Date().toISOString(),
    contractName: "NadSwap"
  };

  // Write to file
  const filename = "nadswap-deployment-monadTestnet.json";
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  //console.log(`Deployment info saved to ${filename}`);

  // Verify contract (if supported)
  //console.log("Deployment completed successfully!");
  //console.log("Contract address:", contractAddress);
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("Deployment failed:", error);
    process.exit(1);
  }); 