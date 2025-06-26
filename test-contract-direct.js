const { ethers } = require('ethers');

async function main() {
  console.log("🔍 Testing Ultra-Secure Contract with Correct RPC...");
  
  const contractAddress = "0x755c6402938a039828fe3b6c7C54A07Ea7115C42";
  const yourAddress = "0x00D3a6670a1E5226d6b5dc524e3243e7741C8460";
  
  // Use the same RPC as frontend
  const provider = new ethers.JsonRpcProvider("https://testnet1.monad.xyz");
  
  // Simple ABI for testing
  const testAbi = [
    "function getTotalRaffles() view returns (uint256)",
    "function getRaffle(uint256 raffleId) view returns (tuple(uint256 id, address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, uint256 ticketPrice, address ticketPaymentToken, uint256 maxTickets, uint256 ticketsSold, uint256 totalEarned, uint256 expirationTime, bool autoDistributeOnSoldOut, address winner, uint8 status, bool rewardClaimed, uint256 createdAt))",
    "function owner() view returns (address)"
  ];
  
  try {
    const contract = new ethers.Contract(contractAddress, testAbi, provider);
    
    console.log("📊 Contract Address:", contractAddress);
    console.log("🌐 RPC URL: https://testnet1.monad.xyz");
    console.log("👤 Your Address:", yourAddress);
    
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    console.log("📝 Contract Code Length:", code.length);
    
    if (code === "0x") {
      console.log("❌ CONTRACT NOT FOUND AT THIS ADDRESS!");
      console.log("🔍 The contract may not be deployed or address is wrong.");
      return;
    } else {
      console.log("✅ Contract exists at this address");
    }
    
    // Check owner
    try {
      const owner = await contract.owner();
      console.log("👑 Contract Owner:", owner);
      console.log("🎯 Is Your Address Owner:", owner.toLowerCase() === yourAddress.toLowerCase());
    } catch (error) {
      console.log("❌ Owner check failed:", error.message);
    }
    
    // Check total raffles
    try {
      const totalRaffles = await contract.getTotalRaffles();
      console.log("📈 Total Raffles:", totalRaffles.toString());
      
      if (totalRaffles > 0) {
        console.log("\n🎫 Checking each raffle:");
        
        for (let i = 0; i < Math.min(totalRaffles, 5); i++) { // Max 5 raffles
          try {
            const raffle = await contract.getRaffle(i);
            console.log(`\n--- Raffle ID ${i} ---`);
            console.log("Title:", raffle.title || "(empty)");
            console.log("Creator:", raffle.creator);
            console.log("Reward Type:", raffle.rewardType.toString());
            console.log("Reward Amount:", raffle.rewardAmount.toString());
            console.log("Ticket Price:", raffle.ticketPrice.toString());
            console.log("Max Tickets:", raffle.maxTickets.toString());
            console.log("Tickets Sold:", raffle.ticketsSold.toString());
            console.log("Status:", raffle.status.toString());
            
            if (raffle.title && raffle.title !== "") {
              console.log("✅ This raffle has data!");
            } else {
              console.log("❌ This raffle is empty");
            }
          } catch (error) {
            console.log(`❌ Error reading raffle ${i}:`, error.message);
          }
        }
      } else {
        console.log("❌ No raffles found in contract!");
        console.log("💡 You may need to create a raffle first.");
      }
    } catch (error) {
      console.log("❌ getTotalRaffles failed:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
  }
}

main().catch(console.error); 