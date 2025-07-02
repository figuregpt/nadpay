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
    "function totalCount() external view returns (uint256)",
    "function getCreatorLinkCount(address creator) external view returns (uint256)"
  ];
  
  const nadPayContract = new ethers.Contract(nadPayAddress, nadPayAbi, provider);
  
  try {
    const totalLinks = await nadPayContract.totalCount();
    console.log("📄 Total Payment Links:", totalLinks.toString());
    
    const userLinks = await nadPayContract.getCreatorLinkCount(walletAddress);
    console.log("💰 User Payment Links:", userLinks.toString());
  } catch (error) {
    console.error("❌ Payment Links Error:", error.message);
  }
  
  console.log("=====================================");
  
  // Check Raffles (NadRaffle V4)
  const nadRaffleAddress = "0xa874905B117242eC6c966E35B18985e9242Bb633";
  const nadRaffleAbi = [
    "function totalCount() external view returns (uint256)",
    "function getActiveRaffleCount() external view returns (uint256)",
    "function raffles(uint256) external view returns (address creator, string memory title, string memory description, uint256 ticketPrice, address ticketTokenAddress, uint256 maxTickets, uint256 endTime, bool isActive, address winner, uint256 createdAt, uint256 ticketsSold, uint256 prizeAmount, address prizeTokenAddress, uint256 nftTokenId, address nftContractAddress)"
  ];
  
  const nadRaffleContract = new ethers.Contract(nadRaffleAddress, nadRaffleAbi, provider);
  
  try {
    const totalRaffles = await nadRaffleContract.totalCount();
    console.log("🎟️ Total Raffles:", totalRaffles.toString());
    
    const activeRaffles = await nadRaffleContract.getActiveRaffleCount();
    console.log("🎯 Active Raffles:", activeRaffles.toString());
    
    let userRaffles = 0;
    for (let i = 0; i < totalRaffles; i++) {
      try {
        const raffle = await nadRaffleContract.raffles(i);
        if (raffle.creator.toLowerCase() === walletAddress.toLowerCase()) {
          userRaffles++;
          console.log(`  ✅ Raffle ${i}: ${raffle.title} (${raffle.isActive ? 'Active' : 'Ended'})`);
        }
      } catch (e) {
        console.log(`  ❌ Error reading raffle ${i}:`, e.message);
      }
    }
    console.log("🎫 User Raffles:", userRaffles);
  } catch (error) {
    console.error("❌ Raffles Error:", error.message);
  }
  
  console.log("=====================================");
  
  // Check Tickets (participation in raffles)
  const ticketsAbi = [
    "function userTickets(address user, uint256 raffleId) external view returns (uint256)",
    "function totalCount() external view returns (uint256)",
    "function ticketCount(uint256 raffleId) external view returns (uint256)"
  ];
  
  const ticketsContract = new ethers.Contract(nadRaffleAddress, ticketsAbi, provider);
  
  try {
    const totalRaffles = await ticketsContract.totalCount();
    let totalTickets = 0;
    
    for (let i = 0; i < totalRaffles; i++) {
      try {
        const userTicketsInRaffle = await ticketsContract.userTickets(walletAddress, i);
        if (userTicketsInRaffle > 0) {
          totalTickets += Number(userTicketsInRaffle);
          console.log(`  🎫 Raffle ${i}: ${userTicketsInRaffle} tickets`);
        }
      } catch (e) {
        // Ignore errors for individual ticket checks
      }
    }
    console.log("🎟️ Total User Tickets:", totalTickets);
  } catch (error) {
    console.error("❌ Tickets Error:", error.message);
  }
  
  console.log("=====================================");
  console.log("✅ Check completed!");
}

main().catch(console.error); 