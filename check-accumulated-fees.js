const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("💰 CHECKING ACCUMULATED FEES IN ALL CONTRACTS");
  console.log("=".repeat(55));
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const deployer = wallet.address;
  const targetWallet = "0xddadef163ad373f9a0e7bec3bc5f4d0c61d247b1";
  
  console.log("👤 Deployer (You):", deployer);
  console.log("🎯 Target Wallet:", targetWallet);
  console.log("");
  
  let totalFeesFound = ethers.parseEther("0");
  
  // 1. NadPay V2 - Fees go directly to target wallet (should be 0)
  console.log("💳 NadPay V2 Contract:");
  try {
    const nadpayBalance = await provider.getBalance("0x091f3ae2E54584BE7195E2A8C5eD3976d0851905");
    console.log(`   📍 Contract Balance: ${ethers.formatEther(nadpayBalance)} MON`);
    console.log(`   ✅ Status: Fees go directly to target wallet (expected: 0)`);
    if (nadpayBalance > 0) {
      console.log("   ⚠️ UNUSUAL: This should be 0 since fees auto-transfer");
      totalFeesFound += nadpayBalance;
    }
  } catch (error) {
    console.log("   ❌ Error checking NadPay:", error.message);
  }
  console.log("");
  
  // 2. NadRaffle V4 - Fees go to contract owner (deployer)
  console.log("🎫 NadRaffle V4 Contract:");
  try {
    const raffleBalance = await provider.getBalance("0xa874905B117242eC6c966E35B18985e9242Bb633");
    console.log(`   📍 Contract Balance: ${ethers.formatEther(raffleBalance)} MON`);
    console.log(`   💡 Raffle fees go to owner (you), not contract`);
    if (raffleBalance > 0) {
      console.log("   💰 This might be escrowed raffle rewards, not fees");
      totalFeesFound += raffleBalance;
    }
  } catch (error) {
    console.log("   ❌ Error checking NadRaffle:", error.message);
  }
  console.log("");
  
  // 3. NadSwap V3 - Fees accumulate in contract
  console.log("🔄 NadSwap V3 Contract:");
  try {
    const swapBalance = await provider.getBalance("0x0ebDFAFbef16A22eA8ffaba4DdA051AC4df8f979");
    console.log(`   📍 Contract Balance: ${ethers.formatEther(swapBalance)} MON`);
    console.log(`   💡 These are accumulated fees from swap proposals`);
    if (swapBalance > 0) {
      console.log("   🔧 Action: Can withdraw with 'node withdraw-specific-fees.js 3'");
      totalFeesFound += swapBalance;
    } else {
      console.log("   ✅ No fees accumulated (all withdrawn)");
    }
  } catch (error) {
    console.log("   ❌ Error checking NadSwap:", error.message);
  }
  console.log("");
  
  // 4. Check your balance (contains raffle fees)
  console.log("👤 Your Wallet (Raffle fees come here):");
  try {
    const deployerBalance = await provider.getBalance(deployer);
    console.log(`   💰 Your Balance: ${ethers.formatEther(deployerBalance)} MON`);
    console.log(`   💡 This includes all raffle fees earned (2.5% each ticket)`);
  } catch (error) {
    console.log("   ❌ Error checking your balance:", error.message);
  }
  console.log("");
  
  // 5. Check target wallet
  console.log("🎯 Target Wallet (Should receive fees):");
  try {
    const targetBalance = await provider.getBalance(targetWallet);
    console.log(`   💰 Target Balance: ${ethers.formatEther(targetBalance)} MON`);
    console.log(`   ✅ This includes all NadPay fees (2% each purchase)`);
  } catch (error) {
    console.log("   ❌ Error checking target wallet:", error.message);
  }
  console.log("");
  
  // Summary
  console.log("📊 PARA KAYBOLMADI - İŞTE NEREDE:");
  console.log("━".repeat(45));
  console.log("✅ NadPay fees → Target wallet'a gidiyor (otomatik)");
  console.log("💰 NadRaffle fees → Senin wallet'ında (manual transfer gerek)");
  console.log("📦 NadSwap fees → Contract'ta bekliyor (withdraw gerek)");
  console.log(`🔍 Total in contracts: ${ethers.formatEther(totalFeesFound)} MON`);
  
  console.log("");
  console.log("🔧 PARA TOPLAMAK İÇİN:");
  console.log("1. 💸 Senin wallet'tan target wallet'a transfer et (raffle fees)");
  console.log("2. 📤 NadSwap'tan withdraw et: node withdraw-specific-fees.js 3");
  console.log("3. 💸 Withdrawn paraları target wallet'a transfer et");
  
  // Calculate rough total platform activity
  console.log("");
  console.log("📈 PLATFORM AKTİVİTE TAHMİNİ:");
  try {
    const nadpayABI = ["function getTotalLinks() external view returns (uint256)"];
    const raffleABI = ["function getTotalRaffles() external view returns (uint256)"];
    const swapABI = ["function getTotalProposals() external view returns (uint256)"];
    
    const nadpayContract = new ethers.Contract("0x091f3ae2E54584BE7195E2A8C5eD3976d0851905", nadpayABI, provider);
    const raffleContract = new ethers.Contract("0xa874905B117242eC6c966E35B18985e9242Bb633", raffleABI, provider);
    const swapContract = new ethers.Contract("0x0ebDFAFbef16A22eA8ffaba4DdA051AC4df8f979", swapABI, provider);
    
    const totalLinks = await nadpayContract.getTotalLinks();
    const totalRaffles = await raffleContract.getTotalRaffles();
    const totalSwaps = await swapContract.getTotalProposals();
    
    console.log(`🔗 Total Payment Links: ${totalLinks}`);
    console.log(`🎫 Total Raffles: ${totalRaffles}`);
    console.log(`🔄 Total Swap Proposals: ${totalSwaps}`);
    console.log("💡 Her transaction'dan fee gelmiş olmalı!");
    
  } catch (error) {
    console.log("❌ Error getting activity stats:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌", error);
    process.exit(1);
  }); 