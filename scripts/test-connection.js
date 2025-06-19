const hre = require("hardhat");

async function main() {
  try {
    console.log("Testing Monad Testnet connection...");
    console.log("Network:", hre.network.name);
    
    // Get signers
    const signers = await hre.ethers.getSigners();
    console.log("Number of signers:", signers.length);
    
    if (signers.length > 0) {
      const deployer = signers[0];
      console.log("Deployer address:", deployer.address);
      
      // Check balance
      const balance = await hre.ethers.provider.getBalance(deployer.address);
      console.log("Balance:", hre.ethers.formatEther(balance), "MON");
      
      // Check network info
      const network = await hre.ethers.provider.getNetwork();
      console.log("Chain ID:", network.chainId.toString());
      console.log("Network name:", network.name);
    } else {
      console.log("❌ No signers found - check PRIVATE_KEY in .env.local");
    }
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 