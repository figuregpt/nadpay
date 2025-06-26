const { ethers } = require('hardhat');

async function main() {
  console.log("🔍 Testing Raffle ID 0 vs ID 1...");
  
  const contractAddress = "0x755c6402938a039828fe3b6c7C54A07Ea7115C42";
  
  // Simple ABI for testing
  const testAbi = [
    "function getTotalRaffles() view returns (uint256)",
    "function getRaffle(uint256 raffleId) view returns (tuple(uint256 id, address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, uint256 ticketPrice, address ticketPaymentToken, uint256 maxTickets, uint256 ticketsSold, uint256 totalEarned, uint256 expirationTime, bool autoDistributeOnSoldOut, address winner, uint8 status, bool rewardClaimed, uint256 createdAt))"
  ];
  
  try {
    const [signer] = await ethers.getSigners();
    const contract = new ethers.Contract(contractAddress, testAbi, signer);
    
    console.log("📊 Contract Address:", contractAddress);
    
    // Check total raffles
    const totalRaffles = await contract.getTotalRaffles();
    console.log("📈 Total Raffles:", totalRaffles.toString());
    
    // Test ID 0
    console.log("\n🎯 Testing Raffle ID 0:");
    try {
      const raffle0 = await contract.getRaffle(0);
      console.log("ID 0 - Title:", raffle0.title || "(empty)");
      console.log("ID 0 - Creator:", raffle0.creator);
      console.log("ID 0 - Ticket Price:", raffle0.ticketPrice.toString());
      console.log("ID 0 - Max Tickets:", raffle0.maxTickets.toString());
      console.log("ID 0 - Status:", raffle0.status.toString());
      
      if (raffle0.title && raffle0.title !== "") {
        console.log("✅ ID 0 has data!");
      } else {
        console.log("❌ ID 0 is empty");
      }
    } catch (error) {
      console.log("❌ Error reading ID 0:", error.message);
    }
    
    // Test ID 1
    console.log("\n🎯 Testing Raffle ID 1:");
    try {
      const raffle1 = await contract.getRaffle(1);
      console.log("ID 1 - Title:", raffle1.title || "(empty)");
      console.log("ID 1 - Creator:", raffle1.creator);
      console.log("ID 1 - Ticket Price:", raffle1.ticketPrice.toString());
      console.log("ID 1 - Max Tickets:", raffle1.maxTickets.toString());
      console.log("ID 1 - Status:", raffle1.status.toString());
      
      if (raffle1.title && raffle1.title !== "") {
        console.log("✅ ID 1 has data!");
      } else {
        console.log("❌ ID 1 is empty");
      }
    } catch (error) {
      console.log("❌ Error reading ID 1:", error.message);
    }
    
    // Show URL mappings
    console.log("\n🔗 URL Mappings:");
    console.log("For ID 0: /raffle/2bcfabf597e46966");
    console.log("For ID 1: /raffle/bbcc814a93a1e9c6 (current URL)");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main().catch(console.error); 