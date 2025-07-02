const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("💸 TRANSFERRING ALL FEES TO TARGET WALLET");
  console.log("=".repeat(45));
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const targetWallet = "0xddadef163ad373f9a0e7bec3bc5f4d0c61d247b1";
  
  console.log("👤 From (You):", wallet.address);
  console.log("🎯 To (Target):", targetWallet);
  console.log("");
  
  // Check current balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Your current balance: ${ethers.formatEther(balance)} MON`);
  
  // Reserve some for gas
  const gasReserve = ethers.parseEther("0.01"); // 0.01 MON for gas
  const transferAmount = balance - gasReserve;
  
  if (transferAmount <= 0) {
    console.log("❌ Not enough balance to transfer after gas reserve");
    return;
  }
  
  console.log(`🔥 Gas reserve: ${ethers.formatEther(gasReserve)} MON`);
  console.log(`📤 Transfer amount: ${ethers.formatEther(transferAmount)} MON`);
  console.log("");
  
  console.log("⚠️  CONFIRM: Transfer all fees to target wallet? (y/n)");
  console.log("💡 This will transfer your raffle fees to the target wallet");
  console.log("");
  
  // For safety, require manual confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Type "yes" to confirm: ', async (answer) => {
    if (answer.toLowerCase() === 'yes') {
      try {
        console.log("🚀 Sending transaction...");
        
        const tx = await wallet.sendTransaction({
          to: targetWallet,
          value: transferAmount,
          gasLimit: 21000,
          gasPrice: ethers.parseUnits("0.1", "gwei")
        });
        
        console.log("⏳ Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        
        console.log("✅ SUCCESS!");
        console.log(`📋 Transaction: ${tx.hash}`);
        console.log(`💰 Transferred: ${ethers.formatEther(transferAmount)} MON`);
        console.log(`🎯 To: ${targetWallet}`);
        
        // Check new balances
        const newBalance = await provider.getBalance(wallet.address);
        const targetBalance = await provider.getBalance(targetWallet);
        
        console.log("");
        console.log("📊 NEW BALANCES:");
        console.log(`👤 Your balance: ${ethers.formatEther(newBalance)} MON`);
        console.log(`🎯 Target balance: ${ethers.formatEther(targetBalance)} MON`);
        
      } catch (error) {
        console.log("❌ Transfer failed:", error.message);
      }
    } else {
      console.log("❌ Transfer cancelled");
    }
    rl.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("❌", error);
  process.exit(1);
}); 