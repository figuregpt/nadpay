const { ethers } = require('hardhat');

async function main() {
  console.log("🔍 Finding Correct Nonce for Raffle...");
  
  const contractAddress = "0x755c6402938a039828fe3b6c7C54A07Ea7115C42";
  const raffleId = 0;
  
  // Import the Ultra-Secure ABI
  const UltraSecureABI = require('./src/hooks/ultra-secure-abi.json');
  
  try {
    const [signer] = await ethers.getSigners();
    const contract = new ethers.Contract(contractAddress, UltraSecureABI, signer);
    
    console.log("📊 Contract Address:", contractAddress);
    console.log("🎫 Raffle ID:", raffleId);
    
    // Get current global nonce
    const currentGlobalNonce = await contract.globalNonce();
    console.log("🎲 Current Global Nonce:", currentGlobalNonce.toString());
    
    // Get raffle details
    const raffle = await contract.getRaffle(raffleId);
    const randomnessCommit = await contract.getRandomnessCommit(raffleId);
    
    console.log("🎫 Raffle Seed:", await contract.raffleSeeds(raffleId));
    console.log("🎲 Commitment:", randomnessCommit.commitment);
    console.log("⏰ Commit Time:", randomnessCommit.commitTime.toString());
    
    // The nonce used was likely currentGlobalNonce - 1 (since it was incremented during commit)
    const likelyNonce = currentGlobalNonce - BigInt(1);
    console.log("🎯 Likely Nonce (globalNonce - 1):", likelyNonce.toString());
    
    // Try to verify this nonce
    console.log("\n🔍 Trying to verify nonce...");
    
    // We need to simulate the exact commit conditions
    // But we don't have access to the exact block.difficulty and blockhash from commit time
    // This is why the reveal system is secure - you need to know the exact nonce from commit time
    
    console.log("❌ Cannot reliably reverse-engineer the nonce due to:");
    console.log("  1. block.difficulty at commit time is unknown");
    console.log("  2. blockhash(block.number - 1) at commit time is unknown");
    console.log("  3. These values change every block");
    
    console.log("\n💡 SOLUTION: Wait for reveal deadline to pass and use emergencySelectWinner");
    console.log("⏰ Reveal deadline:", new Date(Number(randomnessCommit.revealDeadline) * 1000).toLocaleString());
    console.log("⏰ Current time:", new Date().toLocaleString());
    
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(randomnessCommit.revealDeadline) - now;
    
    if (timeLeft > 0) {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      console.log(`⏳ Time until emergency selection: ${minutes}m ${seconds}s`);
    } else {
      console.log("✅ Emergency selection is now available!");
    }
    
  } catch (error) {
    console.error("❌ Script failed:", error.message);
  }
}

main().catch(console.error); 