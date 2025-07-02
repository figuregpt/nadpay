const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  //// Get signers
  const [deployer] = await hre.ethers.getSigners();
  //// Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  //if (balance < hre.ethers.parseEther("0.1")) {
    throw new Error("❌ Insufficient balance for deployment. Need at least 0.1 MON");
  }

  try {
    // Deploy NadRaffleV2
    //// Wait for a few confirmations
    ////{
      //.toISOString(),
      transactionHash: raffleV2.deploymentTransaction().hash,
      blockNumber: (await raffleV2.deploymentTransaction().wait()).blockNumber,
      gasUsed: (await raffleV2.deploymentTransaction().wait()).gasUsed.toString(),
      constructorArgs: [],
      abi: NadRaffleV2.interface.formatJson()
    };

    // Save to deployment file
    const deploymentPath = path.join(__dirname, '..', `raffle-v2-deployment-${network}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    //// Update hook file with new address
    const hookPath = path.join(__dirname, '..', 'src', 'hooks', 'useNadRaffleV2Contract.ts');
    if (fs.existsSync(hookPath)) {
      let hookContent = fs.readFileSync(hookPath, 'utf8');
      hookContent = hookContent.replace(
        /const RAFFLE_V2_CONTRACT_ADDRESS = "0x[0-9a-fA-F]*"/,
        `const RAFFLE_V2_CONTRACT_ADDRESS = "${raffleV2Address}"`
      );
      fs.writeFileSync(hookPath, hookContent);
      ////////////const platformFee = await raffleV2.platformFeePercentage();
      //const owner = await raffleV2.owner();
      ////{
      //{
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