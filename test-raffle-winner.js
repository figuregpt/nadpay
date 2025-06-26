const { ethers } = require('hardhat');

async function main() {
  console.log("🎯 Checking Raffle Winner Status...");
  
  const contractAddress = "0x755c6402938a039828fe3b6c7C54A07Ea7115C42";
  const raffleId = 0;
  
  // Import the Ultra-Secure ABI
  const UltraSecureABI = require('./src/hooks/ultra-secure-abi.json');
  
  try {
    const [signer] = await ethers.getSigners();
    const contract = new ethers.Contract(contractAddress, UltraSecureABI, signer);
    
    console.log("📊 Contract Address:", contractAddress);
    console.log("🎫 Raffle ID:", raffleId);
    console.log("👤 Signer:", signer.address);
    
    // Get raffle details
    const raffle = await contract.getRaffle(raffleId);
    console.log("\n🎫 Raffle Details:");
    console.log("Title:", raffle.title);
    console.log("Creator:", raffle.creator);
    console.log("Max Tickets:", raffle.maxTickets.toString());
    console.log("Tickets Sold:", raffle.ticketsSold.toString());
    console.log("Status:", raffle.status.toString()); // 0=ACTIVE, 1=ENDED, 2=CANCELLED
    console.log("Winner:", raffle.winner);
    console.log("Reward Claimed:", raffle.rewardClaimed);
    console.log("Expiration:", new Date(Number(raffle.expirationTime) * 1000).toLocaleString());
    
    // Check randomness commit status
    try {
      const randomnessCommit = await contract.getRandomnessCommit(raffleId);
      console.log("\n🎲 Randomness Status:");
      console.log("Commitment:", randomnessCommit.commitment);
      console.log("Commit Time:", new Date(Number(randomnessCommit.commitTime) * 1000).toLocaleString());
      console.log("Revealed:", randomnessCommit.revealed);
      console.log("Reveal Deadline:", new Date(Number(randomnessCommit.revealDeadline) * 1000).toLocaleString());
      
      const now = Math.floor(Date.now() / 1000);
      const canReveal = randomnessCommit.commitment !== "0x0000000000000000000000000000000000000000000000000000000000000000" && 
                       !randomnessCommit.revealed && 
                       now <= Number(randomnessCommit.revealDeadline);
      const needsEmergency = randomnessCommit.commitment !== "0x0000000000000000000000000000000000000000000000000000000000000000" && 
                            !randomnessCommit.revealed && 
                            now > Number(randomnessCommit.revealDeadline);
      
      console.log("Current Time:", new Date(now * 1000).toLocaleString());
      console.log("Can Reveal:", canReveal);
      console.log("Needs Emergency Selection:", needsEmergency);
      
      // Check what actions are available
      const isReadyForReveal = await contract.isReadyForReveal(raffleId);
      const isReadyForEmergency = await contract.isReadyForEmergencySelection(raffleId);
      
      console.log("\n🔧 Available Actions:");
      console.log("Ready for Reveal:", isReadyForReveal);
      console.log("Ready for Emergency:", isReadyForEmergency);
      
      // Try to trigger winner selection
      if (isReadyForEmergency || needsEmergency) {
        console.log("\n🚨 Attempting emergency winner selection...");
        try {
          const tx = await contract.emergencySelectWinner(raffleId);
          console.log("Emergency TX:", tx.hash);
          await tx.wait();
          console.log("✅ Emergency winner selected!");
        } catch (error) {
          console.log("❌ Emergency selection failed:", error.message);
        }
      } else if (isReadyForReveal && canReveal) {
        console.log("\n🎯 Reveal deadline not passed yet. Cannot use emergency selection.");
        console.log("💡 You need to wait until reveal deadline passes or find the correct nonce.");
        console.log("⏰ Reveal deadline:", new Date(Number(randomnessCommit.revealDeadline) * 1000).toLocaleString());
      } else if (raffle.ticketsSold >= raffle.maxTickets && raffle.status.toString() === "0") {
        console.log("\n🎲 Raffle is sold out but no randomness committed. Trying to commit...");
        try {
          // This might be called automatically, but let's try manual trigger
          const tx = await contract.commitRandomnessForRaffle(raffleId);
          console.log("Commit TX:", tx.hash);
          await tx.wait();
          console.log("✅ Randomness committed! Wait 1 hour then reveal.");
        } catch (error) {
          console.log("❌ Commit failed:", error.message);
        }
      }
      
    } catch (error) {
      console.log("❌ Error checking randomness:", error.message);
    }
    
    // Get updated raffle status
    console.log("\n🔄 Checking updated raffle status...");
    const updatedRaffle = await contract.getRaffle(raffleId);
    console.log("Updated Status:", updatedRaffle.status.toString());
    console.log("Updated Winner:", updatedRaffle.winner);
    
  } catch (error) {
    console.error("❌ Script failed:", error.message);
  }
}

main().catch(console.error); 