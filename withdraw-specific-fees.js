const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  //console.log("💸 Withdrawing Platform Fees from Specific Contract");
  
  // Use Monad testnet directly
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  
  // Use private key from nadpay/.env
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in nadpay/.env");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  //console.log("👤 Using wallet:", wallet.address);
  //console.log("🌐 Network: Monad Testnet");
  
  // All known contracts
  const contracts = [
    { name: "V4 WORKING", address: "0xa874905B117242eC6c966E35B18985e9242Bb633" },
    { name: "Ultra-Secure", address: "0x755c6402938a039828fe3b6c7C54A07Ea7115C42" },
    { name: "V4 Fast OLD", address: "0xb7a8e84F06124D2E444605137E781cDd7ac480fa" },
    { name: "V4 Fast FIXED", address: "0x225f2C16360e18BcAa36Fc3d0d3197e6756117d6" }
  ];
  
  const minimalABI = [
    "function owner() external view returns (address)",
    "function withdrawPlatformFees() external",
    "function platformFeePercentage() external view returns (uint256)"
  ];
  
  //console.log("\n💰 Available contracts for withdrawal:");
  contracts.forEach((contract, index) => {
    //console.log(`${index + 1}. ${contract.name}: ${contract.address}`);
  });
  
  // Get contract index from command line argument or default to all
  const contractIndex = process.argv[2];
  
  if (contractIndex && !isNaN(contractIndex)) {
    const selectedContract = contracts[parseInt(contractIndex) - 1];
    if (selectedContract) {
      await withdrawFromContract(selectedContract, provider, wallet);
    } else {
      //console.log("❌ Invalid contract index");
    }
  } else {
    //console.log("\n🔄 Checking and withdrawing from ALL contracts...");
    for (const contractInfo of contracts) {
      await withdrawFromContract(contractInfo, provider, wallet);
      // Wait between withdrawals
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function withdrawFromContract(contractInfo, provider, wallet) {
  //console.log(`\n🔍 Processing ${contractInfo.name}: ${contractInfo.address}`);
  
  try {
    const contract = new ethers.Contract(contractInfo.address, [
      "function owner() external view returns (address)",
      "function withdrawPlatformFees() external",
      "function platformFeePercentage() external view returns (uint256)"
    ], wallet);
    
    // Check contract balance BEFORE
    const balanceBefore = await provider.getBalance(contractInfo.address);
    //console.log(`💰 Contract balance: ${ethers.formatEther(balanceBefore)} MON`);
    
    if (balanceBefore <= ethers.parseEther("0.001")) {
      //console.log(`📭 No significant balance to withdraw`);
      return;
    }
    
    // Check if we are the owner
    try {
      const owner = await contract.owner();
      //console.log(`👑 Contract Owner: ${owner}`);
      
      if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        //console.log(`❌ You are NOT the owner. Cannot withdraw.`);
        return;
      }
      
      //console.log(`✅ You are the owner! Proceeding with withdrawal...`);
    } catch (e) {
      //console.log(`⚠️  Could not verify ownership:`, e.message);
      //console.log(`🔄 Attempting withdrawal anyway...`);
    }
    
    // Check our balance BEFORE
    const ourBalanceBefore = await provider.getBalance(wallet.address);
    //console.log(`💳 Your balance before: ${ethers.formatEther(ourBalanceBefore)} MON`);
    
    // Attempt withdrawal
    //console.log(`🏦 Attempting to withdraw platform fees...`);
    
    try {
      // Estimate gas first
      const gasEstimate = await contract.withdrawPlatformFees.estimateGas();
      //console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
      
      // Execute withdrawal
      const tx = await contract.withdrawPlatformFees({
        gasLimit: gasEstimate * BigInt(120) / BigInt(100), // 20% buffer
        gasPrice: ethers.parseUnits("50", "gwei") // Explicit gas price
      });
      
      //console.log(`📤 Withdrawal transaction: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      //console.log(`✅ Transaction confirmed! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Check balances AFTER
      const balanceAfter = await provider.getBalance(contractInfo.address);
      const ourBalanceAfter = await provider.getBalance(wallet.address);
      
      const withdrawn = ourBalanceAfter - ourBalanceBefore;
      const contractReduction = balanceBefore - balanceAfter;
      
      //console.log(`📊 RESULTS:`);
      //console.log(`   Contract balance after: ${ethers.formatEther(balanceAfter)} MON`);
      //console.log(`   Contract reduction: ${ethers.formatEther(contractReduction)} MON`);
      //console.log(`   Your balance after: ${ethers.formatEther(ourBalanceAfter)} MON`);
      //console.log(`   Net received: ${ethers.formatEther(withdrawn)} MON`);
      
      if (withdrawn > 0) {
        //console.log(`🎉 SUCCESS! Withdrew ${ethers.formatEther(withdrawn)} MON`);
      } else {
        //console.log(`⚠️  Withdrawal executed but no funds received (gas cost: ${ethers.formatEther(ourBalanceBefore - ourBalanceAfter)} MON)`);
      }
      
    } catch (txError) {
      //console.error(`❌ Withdrawal transaction failed:`, txError.message);
      
      // Check if it's a known error
      if (txError.message.includes("revert")) {
        //console.log(`💡 Possible reasons:`);
        //console.log(`   1. No platform fees accumulated yet`);
        //console.log(`   2. Fees already withdrawn`);
        //console.log(`   3. Contract paused or restricted`);
        //console.log(`   4. Different withdrawal function name`);
      }
    }
    
  } catch (error) {
    //console.log(`❌ Error processing ${contractInfo.name}:`, error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Script failed:", error);
    process.exit(1);
  });