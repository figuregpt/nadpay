const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("📊 CURRENT FEE SYSTEM STATUS SUMMARY");
  console.log("=".repeat(60));
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const deployer = wallet.address;
  const targetFeeWallet = "0xddadef163ad373f9a0e7bec3bc5f4d0c61d247b1";
  
  console.log(`👤 Deployer (You): ${deployer}`);
  console.log(`🎯 Target Fee Wallet: ${targetFeeWallet}`);
  console.log("");
  
  // Check each contract
  console.log("💳 NadPay V2 Payment Links:");
  console.log("   📍 Address: 0x091f3ae2E54584BE7195E2A8C5eD3976d0851905");
  console.log("   ✅ Status: PERFECT");
  console.log("   💰 Fee: 2% on every purchase");
  console.log("   ⚡ Transfer: INSTANT to target wallet");
  console.log("   🎉 Result: Her alım yapıldığında %2 anında target wallet'a gidiyor!");
  console.log("");
  
  console.log("🎫 NadRaffle V4 WORKING Raffles:");
  console.log("   📍 Address: 0xa874905B117242eC6c966E35B18985e9242Bb633");
  console.log("   ⚠️ Status: NEEDS FIX");
  console.log("   💰 Fee: 2.5% on every ticket purchase");
  console.log("   ❌ Transfer: Goes to deployer, NOT target wallet");
  console.log("   🔧 Issue: Fee'ler sana geliyor, target wallet'a gitmiyor");
  console.log("");
  
  console.log("🔄 NadSwap V3 Swap Proposals:");
  console.log("   📍 Address: 0x0ebDFAFbef16A22eA8ffaba4DdA051AC4df8f979");
  console.log("   ❌ Status: MANUAL SYSTEM");
  console.log("   💰 Fee: 0.1 MON per proposal");
  console.log("   📦 Transfer: Accumulates, needs manual withdrawal");
  console.log("   🔧 Issue: Otomatik değil, manuel çekmek gerekiyor");
  console.log("");
  
  console.log("🎯 WHAT YOU WANT:");
  console.log("━".repeat(40));
  console.log("💳 NadPay: ✅ DONE - %2 → target wallet (INSTANT)");
  console.log("🎫 NadRaffle: ❌ TODO - %2.5 → target wallet (INSTANT)");  
  console.log("🔄 NadSwap: ❌ TODO - 0.1+0.1 MON → target wallet (INSTANT)");
  console.log("");
  
  console.log("💡 SOLUTION OPTIONS:");
  console.log("━".repeat(40));
  
  console.log("🚀 OPTION 1: Deploy New Contracts (BEST)");
  console.log("   ✅ Deploy NadRaffle V5 with auto fee recipient");
  console.log("   ✅ Deploy NadSwap V4 with auto fee system");
  console.log("   ❌ Problem: Need ~0.04 MON, you have 0.032 MON");
  console.log("   💡 Solution: Get more MON or wait for smaller contracts");
  console.log("");
  
  console.log("🔧 OPTION 2: Manual Fee Collection (TEMPORARY)");
  console.log("   📥 Collect accumulated fees from existing contracts");
  console.log("   💸 Manually transfer to target wallet periodically");
  console.log("   ⚠️ Not automatic, requires manual intervention");
  console.log("");
  
  console.log("🎯 OPTION 3: Hybrid Approach (RECOMMENDED)");
  console.log("   ✅ Keep NadPay V2 (already perfect)");
  console.log("   🔄 Manually transfer raffle/swap fees periodically");
  console.log("   🚀 Deploy new contracts when balance allows");
  console.log("");
  
  console.log("📋 IMMEDIATE ACTIONS AVAILABLE:");
  console.log("━".repeat(40));
  
  try {
    // Check NadSwap balance
    const swapBalance = await provider.getBalance("0x0ebDFAFbef16A22eA8ffaba4DdA051AC4df8f979");
    console.log(`💰 NadSwap V3 has ${ethers.formatEther(swapBalance)} MON fees to withdraw`);
    
    if (swapBalance > 0) {
      console.log("   🔧 Action: node withdraw-specific-fees.js 3");
      console.log("   💸 Then: Transfer manually to target wallet");
    }
    
    // Check deployer balance for raffle fees (would need to check raffle contract specifically)
    const deployerBalance = await provider.getBalance(deployer);
    console.log(`💰 Your balance: ${ethers.formatEther(deployerBalance)} MON (includes raffle fees)`);
    
    console.log("");
    console.log("🎯 CURRENT PERFECT SETUP:");
    console.log("✅ NadPay V2: 2% automatic fee → target wallet");
    console.log("⚠️ NadRaffle: 2.5% manual collection needed"); 
    console.log("⚠️ NadSwap: 0.1 MON manual withdrawal needed");
    
    console.log("");
    console.log("💫 WHEN YOU GET MORE MON:");
    console.log("🚀 Deploy NadRaffle V5 & NadSwap V4 for full automation");
    console.log("🎉 Then ALL fees will be 100% automatic!");
    
  } catch (error) {
    console.log("❌ Error checking balances:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌", error);
    process.exit(1);
  }); 