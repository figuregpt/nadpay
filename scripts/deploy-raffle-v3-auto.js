const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  ////{
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
  //// Display important information
  ////`);
  //////.then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 