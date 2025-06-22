const hre = require("hardhat");

async function main() {
  console.log("Deploying NadPay contract to Monad Testnet...");

  // Get the signer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MON");

  // Get the ContractFactory and Signers here.
  const NadPay = await hre.ethers.getContractFactory("NadPay");
  
  // Deploy the contract
  console.log("Deploying contract...");
  const nadpay = await NadPay.deploy();
  
  console.log("Waiting for deployment...");
  await nadpay.waitForDeployment();
  
  const contractAddress = await nadpay.getAddress();
  
  console.log("✅ NadPay deployed to:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("⛽ Deployer:", deployer.address);
  
  // Verify on explorer (if available)
  if (hre.network.name !== "hardhat") {
    console.log("⏳ Waiting for block confirmations...");
    await nadpay.deploymentTransaction().wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on explorer");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deploymentBlock: await hre.ethers.provider.getBlockNumber(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString()
  };
  
  fs.writeFileSync(
    `deployment-${hre.network.name}.json`, 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("📄 Deployment info saved to deployment-" + hre.network.name + ".json");
  console.log("\n🚀 Contract is ready to use!");
  console.log("📋 Contract Address:", contractAddress);
  console.log("🔗 Explorer:", `https://testnet.monadexplorer.com/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 