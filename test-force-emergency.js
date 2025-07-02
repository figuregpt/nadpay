const { ethers } = require('hardhat');

async function main() {
  //console.log("🚨 Force Emergency Winner Selection...");
  
  const contractAddress = "0x755c6402938a039828fe3b6c7C54A07Ea7115C42";
  const raffleId = 0;
  
  const UltraSecureABI = require('./src/hooks/ultra-secure-abi.json');
  
  try {
    const [signer] = await ethers.getSigners();
    const contract = new ethers.Contract(contractAddress, UltraSecureABI, signer);
    
    //console.log("📊 Contract Address:", contractAddress);
    //console.log("🎫 Raffle ID:", raffleId);
    //console.log("👤 Signer:", signer.address);
    
    // Get current status
    const raffle = await contract.getRaffle(raffleId);
    const randomnessCommit = await contract.getRandomnessCommit(raffleId);
    
    //console.log("\n📊 Current Status:");
    //console.log("Status:", raffle.status.toString());
    //console.log("Tickets Sold:", raffle.ticketsSold.toString());
    //console.log("Winner:", raffle.winner);
    //console.log("Reveal Deadline:", new Date(Number(randomnessCommit.revealDeadline) * 1000).toLocaleString());
    
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(randomnessCommit.revealDeadline) - now;
    
    //console.log("Current Time:", new Date(now * 1000).toLocaleString());
    //console.log("Time Left:", timeLeft, "seconds");
    
    if (timeLeft > 0) {
      //console.log("\n⏰ Reveal deadline not passed yet.");
      //console.log("💡 OPTIONS:");
      //console.log("  1. Wait", Math.floor(timeLeft / 60), "minutes", timeLeft % 60, "seconds");
      //console.log("  2. Use the new FAST contract: 0xb7a8e84F06124D2E444605137E781cDd7ac480fa");
      //console.log("  3. Contact contract owner to manually trigger emergency");
      
      // Check if we're the owner
      const owner = await contract.owner();
      if (owner.toLowerCase() === signer.address.toLowerCase()) {
        //console.log("\n👑 You are the contract owner!");
        //console.log("🔧 You could potentially add an emergency override function");
      }
    } else {
      //console.log("\n🚨 Attempting emergency winner selection...");
      try {
        const tx = await contract.emergencySelectWinner(raffleId);
        //console.log("Emergency TX:", tx.hash);
        await tx.wait();
        //console.log("✅ Emergency winner selected!");
        
        // Check updated status
        const updatedRaffle = await contract.getRaffle(raffleId);
        //console.log("🏆 Winner:", updatedRaffle.winner);
      } catch (error) {
        //console.log("❌ Emergency selection failed:", error.message);
      }
    }
    
  } catch (error) {
    //console.error("❌ Script failed:", error.message);
  }
}

main().catch(//console.error); 