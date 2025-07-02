const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("💸 FINALIZER COST EXPLOSION CALCULATOR");
  console.log("=".repeat(50));
  console.log("");
  
  // Current data points
  const currentRaffles = 19;
  const costFor19Raffles = 10; // MON
  const costPerRaffle = costFor19Raffles / currentRaffles;
  
  console.log("📊 CURRENT SITUATION:");
  console.log(`🎫 Total Raffles: ${currentRaffles}`);
  console.log(`💰 Total Cost: ${costFor19Raffles} MON`);
  console.log(`📈 Cost Per Raffle: ${costPerRaffle.toFixed(3)} MON`);
  console.log("");
  
  console.log("🚨 COST EXPLOSION SCENARIOS:");
  console.log("━".repeat(45));
  
  const scenarios = [50, 100, 200, 500, 1000, 2000, 5000];
  
  scenarios.forEach(raffleCount => {
    const totalCost = raffleCount * costPerRaffle;
    const percentIncrease = ((raffleCount - currentRaffles) / currentRaffles * 100).toFixed(0);
    
    console.log(`🎯 ${raffleCount.toString().padStart(4)} raffles → ${totalCost.toFixed(1).padStart(6)} MON (${percentIncrease}% increase)`);
    
    if (totalCost > 100) {
      console.log(`     ⚠️  DANGER: ${totalCost.toFixed(0)} MON = $${(totalCost * 0.1).toFixed(0)} USD at $0.10/MON`);
    }
  });
  
  console.log("");
  console.log("💡 FINALIZER MECHANICS:");
  console.log("━".repeat(45));
  console.log("✅ Each expired raffle = 2-3 transactions");
  console.log("✅ commitRandomness() = ~0.15 MON gas");
  console.log("✅ emergencySelectWinner() = ~0.15 MON gas"); 
  console.log("✅ finalizeExpiredRaffles() = ~0.2 MON gas");
  console.log("✅ Total per raffle ≈ 0.5 MON");
  console.log("");
  
  console.log("⏰ TIMING PROBLEM:");
  console.log("━".repeat(45));
  console.log("🤖 Script runs every 1 minute");
  console.log("📦 maxBatchSize = 10 raffles per run");
  console.log("🔄 100 raffles = 10 runs = 10 minutes");
  console.log("💸 But ALL expire at same time = MASSIVE cost spike!");
  console.log("");
  
  console.log("🚨 WORST CASE SCENARIO:");
  console.log("━".repeat(45));
  console.log("📅 Platform gets popular");
  console.log("🎫 1000 raffles created per day");  
  console.log("⏰ All expire within hours of each other");
  console.log("💥 Finalizer processes 1000 × 0.5 = 500 MON in one day!");
  console.log("💰 At $0.10/MON = $50 USD per day just for finalization!");
  console.log("");
  
  console.log("🛡️ IMMEDIATE SOLUTIONS:");
  console.log("━".repeat(45));
  console.log("1. 🚫 STOP the finalizer immediately:");
  console.log("   pm2 stop raffle-finalizer");
  console.log("   pm2 delete raffle-finalizer");
  console.log("");
  console.log("2. 💰 Set gas limit per day:");
  console.log("   Max 1 MON per day for finalization");
  console.log("");
  console.log("3. 🔧 Fix finalizer logic:");
  console.log("   - Only process 1-2 raffles per run");
  console.log("   - Run every 10 minutes, not 1 minute");
  console.log("   - Add balance check before each run");
  console.log("");
  console.log("4. 💡 Better solution - Automatic finalization:");
  console.log("   - Let users finalize their own raffles");
  console.log("   - Charge fee for auto-finalization");
  console.log("   - Only emergency finalize high-value raffles");
  console.log("");
  
  console.log("📈 PROJECTED COSTS:");
  console.log("━".repeat(45));
  console.log("📊 Linear growth model:");
  console.log("   Current: 19 raffles = 10 MON");
  console.log("   Next month: 50 raffles = 26 MON"); 
  console.log("   Growing platform: 200 raffles = 105 MON");
  console.log("   Popular platform: 1000 raffles = 526 MON");
  console.log("");
  console.log("💸 At current MON price ($0.10):");
  console.log("   1000 raffles = $52.6 USD just for gas!");
  console.log("");
  
  console.log("🔧 SCRIPT MUST BE STOPPED NOW!");
  console.log("💀 Otherwise you'll lose hundreds of MON as platform grows!");
  
  // Check current balance vs future needs
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  const currentBalance = await provider.getBalance(wallet.address);
  const balanceInMON = parseFloat(ethers.formatEther(currentBalance));
  
  console.log("");
  console.log("💰 BALANCE CHECK:");
  console.log("━".repeat(45));
  console.log(`💳 Current Balance: ${balanceInMON.toFixed(3)} MON`);
  
  scenarios.forEach(raffleCount => {
    const requiredBalance = raffleCount * costPerRaffle;
    if (requiredBalance > balanceInMON) {
      console.log(`⚠️  ${raffleCount} raffles need ${requiredBalance.toFixed(1)} MON - YOU DON'T HAVE ENOUGH!`);
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌", error);
    process.exit(1);
  }); 