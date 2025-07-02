const { ethers } = require("hardhat");

async function main() {
  //console.log("🎫 Checking NadRaffle V2 Contract...");
  
  const contractAddress = "0x136bC59567f12a49F8485f3E76CbAd13f3bB56cF";
  
  // Minimal ABI for checking
  const abi = [
    "function getTotalRaffles() external view returns (uint256)",
    "function getUserRaffles(address user) external view returns (uint256[])",
    "function getRaffle(uint256 raffleId) external view returns (tuple(uint256 id, address creator, string title, string description, string imageHash, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, address ticketPaymentToken, uint256 ticketPrice, uint256 maxTickets, uint256 maxTicketsPerWallet, uint256 expirationTime, bool autoDistributeOnSoldOut, uint256 ticketsSold, uint256 totalEarned, address winner, uint8 status, uint256 createdAt, bool rewardClaimed))"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, ethers.provider);
  
  try {
    // Check total raffles
    const totalRaffles = await contract.getTotalRaffles();
    //console.log("✅ Total Raffles:", totalRaffles.toString());
    
    // Check specific raffle IDs
    for (let i = 0; i < Math.min(5, Number(totalRaffles)); i++) {
      try {
        const raffle = await contract.getRaffle(i);
        //console.log(`\n🎫 Raffle ${i}:`);
        //console.log("  Creator:", raffle.creator);
        //console.log("  Title:", raffle.title);
        //console.log("  Ticket Price:", ethers.formatEther(raffle.ticketPrice));
        //console.log("  Ticket Payment Token:", raffle.ticketPaymentToken);
        //console.log("  Reward Type:", raffle.rewardType === 0 ? 'TOKEN' : 'NFT');
        //console.log("  Reward Amount:", ethers.formatEther(raffle.rewardAmount));
        //console.log("  Status:", raffle.status === 0 ? 'ACTIVE' : raffle.status === 1 ? 'ENDED' : 'CANCELLED');
        //console.log("  Tickets Sold:", raffle.ticketsSold.toString());
      } catch (error) {
        //console.log(`❌ Raffle ${i} not found or error:`, error.message);
      }
    }
    
    // Test creator raffles with a sample address
    const testAddress = "0x00D3a6670a1E5226d6b5dc524e3243e7741C8460"; // Your wallet address
    try {
      const creatorRaffles = await contract.getUserRaffles(testAddress);
      //console.log(`\n👤 Creator Raffles for ${testAddress}:`, creatorRaffles.length);
      creatorRaffles.forEach((raffleId, index) => {
        //console.log(`  Raffle ID ${index}: ${raffleId.toString()}`);
      });
    } catch (error) {
      //console.log("❌ Error getting creator raffles:", error.message);
    }
    
  } catch (error) {
    //console.error("❌ Contract Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 