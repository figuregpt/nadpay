const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const walletAddress = "0x00D3a6670a1E5226d6b5dc524e3243e7741C8460";
  
  console.log("🔍 Checking data for wallet:", walletAddress);
  console.log("=====================================");
  
  // Check Payment Links (NadPay V2)
  const nadPayAddress = "0xfeF2c348d0c8a14b558df27034526d87Ac1f9f25";
  const nadPayAbi = [
    "function getTotalLinks() external view returns (uint256)",
    "function getCreatorLinks(address creator) external view returns (uint256[])"
  ];
  
  const nadPayContract = new ethers.Contract(nadPayAddress, nadPayAbi, provider);
  
  try {
    const totalLinks = await nadPayContract.getTotalLinks();
    console.log("📄 Total Payment Links:", totalLinks.toString());
    
    const userLinks = await nadPayContract.getCreatorLinks(walletAddress);
    console.log("💰 User Payment Links:", userLinks.length);
    
    if (userLinks.length > 0) {
      console.log("   Link IDs:", userLinks.map(id => id.toString()).join(", "));
    }
  } catch (error) {
    console.error("❌ Payment Links Error:", error.message);
  }
  
  console.log("=====================================");
  
  // Check Raffles (NadRaffle V4)
  const nadRaffleAddress = "0xa874905B117242eC6c966E35B18985e9242Bb633";
  const nadRaffleAbi = [
    "function getTotalRaffles() external view returns (uint256)",
    "function getRaffle(uint256 raffleId) external view returns (tuple(uint256 id, address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, uint256 ticketPrice, address ticketPaymentToken, uint256 maxTickets, uint256 ticketsSold, uint256 totalEarned, uint256 expirationTime, bool autoDistributeOnSoldOut, address winner, uint8 status, bool rewardClaimed, uint256 createdAt))"
  ];
  
  const nadRaffleContract = new ethers.Contract(nadRaffleAddress, nadRaffleAbi, provider);
  
  try {
    const totalRaffles = await nadRaffleContract.getTotalRaffles();
    console.log("🎟️ Total Raffles:", totalRaffles.toString());
    
    let userRaffles = 0;
    let userTickets = 0;
    
    // Check each raffle to see if user is creator or has tickets
    for (let i = 0; i < Math.min(Number(totalRaffles), 50); i++) { // Limit to 50 for performance
      try {
        const raffle = await nadRaffleContract.getRaffle(i);
        
        // Check if user is creator
        if (raffle.creator.toLowerCase() === walletAddress.toLowerCase()) {
          userRaffles++;
          console.log(`  ✅ Created Raffle ${i}: "${raffle.title}" (Status: ${raffle.status})`);
        }
        
        // For tickets, we'd need the ticketsPurchasedByWallet function
        // But let's try a simple approach first
        
      } catch (e) {
        // Skip individual raffle errors
        console.log(`  ⚠️  Could not read raffle ${i}`);
      }
    }
    
    console.log("🎫 User Created Raffles:", userRaffles);
    
    // Try to get tickets with different approach
    const ticketsAbi = [
      "function ticketsPurchasedByWallet(uint256 raffleId, address wallet) external view returns (uint256)"
    ];
    
    const ticketsContract = new ethers.Contract(nadRaffleAddress, ticketsAbi, provider);
    
    for (let i = 0; i < Math.min(Number(totalRaffles), 20); i++) { // Check first 20 raffles for tickets
      try {
        const ticketsInRaffle = await ticketsContract.ticketsPurchasedByWallet(i, walletAddress);
        if (Number(ticketsInRaffle) > 0) {
          userTickets += Number(ticketsInRaffle);
          console.log(`  🎫 Raffle ${i}: ${ticketsInRaffle} tickets`);
        }
      } catch (e) {
        // Skip individual ticket check errors
      }
    }
    
    console.log("🎟️ Total User Tickets:", userTickets);
    
  } catch (error) {
    console.error("❌ Raffles Error:", error.message);
  }
  
  console.log("=====================================");
  console.log("✅ Check completed!");
  console.log(`📊 Summary for ${walletAddress}:`);
  console.log(`   💰 Payment Links: Check above`);
  console.log(`   🎫 Raffles: Check above`);
  console.log(`   🎟️ Tickets: Check above`);
}

main().catch(console.error); 