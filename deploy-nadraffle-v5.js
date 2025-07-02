const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("🎫 Deploying NadRaffle V5 AutoFees Contract");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const deployer = new ethers.Wallet(privateKey, provider);
  
  console.log("👤 Deploying with account:", deployer.address);
  
  const balance = await provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MON");
  
  if (balance < ethers.parseEther("0.005")) {
    console.log("❌ Insufficient balance for deployment");
    return;
  }
  
  const targetWallet = "0xddadef163ad373f9a0e7bec3bc5f4d0c61d247b1";
  console.log("🎯 Fee recipient wallet:", targetWallet);
  
  console.log("\n🔄 Compiling and deploying NadRaffle V5...");
  
  try {
    const NadRaffleV5 = await ethers.getContractFactory("NadRaffleV5AutoFees", deployer);
    
    const contract = await NadRaffleV5.deploy(targetWallet);
    console.log("📤 Deployment tx sent:", contract.deploymentTransaction().hash);
    console.log("⏳ Waiting for confirmation...");
    
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log("✅ NadRaffle V5 deployed successfully!");
    console.log("📍 Contract address:", contractAddress);
    
    // Verify deployment
    const deployedFeeRecipient = await contract.feeRecipient();
    const deployedFeePercentage = await contract.platformFeePercentage();
    const owner = await contract.owner();
    
    console.log("\n📊 DEPLOYMENT VERIFICATION:");
    console.log(`👑 Owner: ${owner}`);
    console.log(`💰 Fee Recipient: ${deployedFeeRecipient}`);
    console.log(`📊 Fee Percentage: ${deployedFeePercentage} basis points (${Number(deployedFeePercentage)/100}%)`);
    console.log(`🎯 Target Match: ${deployedFeeRecipient.toLowerCase() === targetWallet.toLowerCase() ? '✅ CORRECT' : '❌ WRONG'}`);
    
    // Save deployment info
    const deploymentInfo = {
      contractName: "NadRaffleV5AutoFees",
      address: contractAddress,
      deployer: deployer.address,
      feeRecipient: deployedFeeRecipient,
      feePercentage: Number(deployedFeePercentage),
      deploymentHash: contract.deploymentTransaction().hash,
      deployedAt: new Date().toISOString(),
      network: "monadTestnet",
      features: [
        "✅ Automatic fee transfer to target wallet",
        "✅ 2.5% fee on every ticket purchase",
        "✅ Secure randomness system",
        "✅ Auto-claim rewards for winners",
        "✅ Enhanced security features"
      ]
    };
    
    const filename = `nadraffle-v5-auto-deployment-monadTestnet-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${filename}`);
    
    // Generate ABI file
    const artifact = await ethers.getContractFactory("NadRaffleV5AutoFees", deployer);
    const abi = artifact.interface.formatJson();
    fs.writeFileSync("NadRaffleV5-AutoFees.abi.json", abi);
    console.log("📄 ABI saved to: NadRaffleV5-AutoFees.abi.json");
    
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("━".repeat(50));
    console.log("🎫 NadRaffle V5 AutoFees Features:");
    console.log("• 💰 2.5% fee on every ticket purchase");
    console.log("• ⚡ Instant fee transfer to your wallet");
    console.log("• 🎲 Secure commit-reveal randomness");
    console.log("• 🏆 Auto-claim rewards for winners");
    console.log("• 🛡️ Enhanced security & anti-bot protection");
    console.log("• ⏰ Configurable reveal windows");
    console.log("• 🔄 Auto-finalization options");
    console.log("━".repeat(50));
    
    console.log("\n📋 NEXT STEPS:");
    console.log("1. ✅ NadPay V2: 2% fee → target wallet (DONE)");
    console.log("2. ✅ NadRaffle V5: 2.5% fee → target wallet (DONE)");
    console.log("3. 🔄 Deploy NadSwap V4: 0.1+0.1 MON → target wallet (NEXT)");
    console.log("4. 🔄 Update frontend to use new contracts");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    // Save error info
    const errorInfo = {
      error: error.message,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      balance: ethers.formatEther(balance)
    };
    
    const errorFilename = `deployment-error-${Date.now()}.json`;
    fs.writeFileSync(errorFilename, JSON.stringify(errorInfo, null, 2));
    console.log(`💾 Error details saved to: ${errorFilename}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 