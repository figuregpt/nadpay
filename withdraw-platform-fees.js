const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  //console.log("💸 Withdrawing Platform Fees for Emergency Payout");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractAddress = "0xb7a8e84F06124D2E444605137E781cDd7ac480fa";
  
  const abi = [
    "function withdrawPlatformFees() external",
    "function owner() external view returns (address)"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  //console.log("👤 Using wallet:", wallet.address);
  //console.log("🔐 Contract owner:", await contract.owner());
  
  // Check contract balance
  const contractBalance = await provider.getBalance(contractAddress);
  //console.log(`💰 Contract balance: ${ethers.formatEther(contractBalance)} MON`);
  
  // Check our current balance
  const ourBalance = await provider.getBalance(wallet.address);
  //console.log(`💳 Our balance: ${ethers.formatEther(ourBalance)} MON`);
  
  if (contractBalance > ethers.parseEther("0.001")) {
    //console.log("\n🏦 Withdrawing platform fees...");
    
    try {
      const gasEstimate = await contract.withdrawPlatformFees.estimateGas();
      const tx = await contract.withdrawPlatformFees({
        gasLimit: gasEstimate * BigInt(120) / BigInt(100)
      });
      
      //console.log(`📤 Withdrawal transaction: ${tx.hash}`);
      const receipt = await tx.wait();
      //console.log(`✅ Platform fees withdrawn! Gas used: ${receipt.gasUsed.toString()}`);
      
      const newBalance = await provider.getBalance(wallet.address);
      const withdrawn = newBalance - ourBalance;
      //console.log(`💰 Withdrawn: ${ethers.formatEther(withdrawn)} MON`);
      //console.log(`💳 New balance: ${ethers.formatEther(newBalance)} MON`);
      
    } catch (error) {
      //console.error("❌ Failed to withdraw platform fees:", error.message);
    }
  } else {
    //console.log("⚠️  No significant platform fees to withdraw");
  }
  
  //console.log("\n📊 EMERGENCY FUNDING STATUS:");
  const finalBalance = await provider.getBalance(wallet.address);
  //console.log(`💳 Current balance: ${ethers.formatEther(finalBalance)} MON`);
  //console.log(`🎯 Required for payouts: 42.4 MON`);
  //console.log(`💸 Still needed: ${42.4 - parseFloat(ethers.formatEther(finalBalance))} MON`);
  
  if (finalBalance >= ethers.parseEther("42.4")) {
    //console.log("✅ Sufficient funds for full emergency payout!");
  } else {
    //console.log("❌ Still insufficient funds. Need alternative solution:");
    //console.log("  1. Reduce payout amounts");
    //console.log("  2. Partial payouts in phases");
    //console.log("  3. Find additional MON funding");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Withdrawal failed:", error);
    process.exit(1);
  }); 