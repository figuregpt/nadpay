const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  ////{
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
  ////.then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 