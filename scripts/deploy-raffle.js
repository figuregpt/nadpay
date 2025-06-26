const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  ////console.log("Deploying NadRaffle contract to Monad Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  ////console.log("Deploying contracts with the account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  ////console.log("Account balance:", ethers.formatEther(balance), "MON");

  // Deploy the contract
  const NadRaffle = await ethers.getContractFactory("NadRaffle");
  ////console.log("Deploying NadRaffle...");
  
  const nadRaffle = await NadRaffle.deploy();
  await nadRaffle.waitForDeployment();

  const contractAddress = await nadRaffle.getAddress();
  ////console.log("NadRaffle deployed to:", contractAddress);

  // Get transaction details
  const deploymentTx = nadRaffle.deploymentTransaction();
  const receipt = await deploymentTx.wait();
  
  ////console.log("Deployment transaction hash:", deploymentTx.hash);
  ////console.log("Block number:", receipt.blockNumber);
  ////console.log("Gas used:", receipt.gasUsed.toString());

  // Save deployment information
  const deploymentInfo = {
    network: "monadTestnet",
    contractName: "NadRaffle",
    contractAddress: contractAddress,
    deploymentBlock: receipt.blockNumber,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    chainId: "10143",
    transactionHash: deploymentTx.hash,
    gasUsed: receipt.gasUsed.toString()
  };

  const deploymentPath = path.join(__dirname, "..", "raffle-deployment-monadTestnet.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  ////console.log("Deployment info saved to:", deploymentPath);

  // Verify deployment
  ////console.log("\nVerifying deployment...");
  try {
    const totalRaffles = await nadRaffle.getTotalRaffles();
    const platformFee = await nadRaffle.platformFeePercentage();
    const owner = await nadRaffle.owner();
    
    ////console.log("Total raffles:", totalRaffles.toString());
    ////console.log("Platform fee:", platformFee.toString(), "basis points");
    ////console.log("Contract owner:", owner);
    ////console.log("✅ Contract verification successful!");
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
  }

  ////console.log("\n📝 Next steps:");
  ////console.log("1. Update src/lib/raffle-contract.ts with the new contract address");
  ////console.log("2. Generate ABI: npm run generate-raffle-abi");
  ////console.log("3. Test the contract functions");
  ////console.log("4. Update frontend to use the new contract");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 