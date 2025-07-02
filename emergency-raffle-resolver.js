const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  //console.log("🚨 EMERGENCY: Resolving Stuck Expired Raffles");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractAddress = "0xb7a8e84F06124D2E444605137E781cDd7ac480fa";
  
  const abi = [
    "function getActiveRaffles() external view returns (uint256[])",
    "function getRaffle(uint256 raffleId) external view returns (tuple(uint256 id, address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, uint256 ticketPrice, address ticketPaymentToken, uint256 maxTickets, uint256 ticketsSold, uint256 totalEarned, uint256 expirationTime, bool autoDistributeOnSoldOut, address winner, uint8 status, bool rewardClaimed, uint256 createdAt))",
    "function getRaffleTickets(uint256 raffleId) external view returns (tuple(uint256 raffleId, address buyer, uint256 ticketNumber, uint256 purchaseTime, bytes32 randomSeed)[])",
    "function owner() external view returns (address)",
    "function setEmergencyPause(bool paused) external",
    // Manual winner selection simulation
    "function emergencySelectWinner(uint256 raffleId) external"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  //console.log("👤 Using wallet:", wallet.address);
  //console.log("🔐 Contract owner:", await contract.owner());
  
  // Get stuck raffles
  const activeRaffleIds = await contract.getActiveRaffles();
  const currentTime = Math.floor(Date.now() / 1000);
  
  //console.log(`\n🔍 Found ${activeRaffleIds.length} active raffles`);
  
  const stuckRaffles = [];
  
  for (const raffleId of activeRaffleIds) {
    try {
      const raffle = await contract.getRaffle(raffleId);
      const isExpired = currentTime >= Number(raffle.expirationTime);
      const hasTickets = Number(raffle.ticketsSold) > 0;
      const hasWinner = raffle.winner !== '0x0000000000000000000000000000000000000000';
      
      if (isExpired && hasTickets && !hasWinner) {
        const tickets = await contract.getRaffleTickets(raffleId);
        stuckRaffles.push({
          id: Number(raffleId),
          title: raffle.title,
          creator: raffle.creator,
          ticketsSold: Number(raffle.ticketsSold),
          maxTickets: Number(raffle.maxTickets),
          rewardType: Number(raffle.rewardType),
          rewardAmount: ethers.formatEther(raffle.rewardAmount),
          rewardTokenAddress: raffle.rewardTokenAddress,
          expirationTime: Number(raffle.expirationTime),
          tickets: tickets,
          totalEarned: ethers.formatEther(raffle.totalEarned)
        });
      }
    } catch (error) {
      //console.log(`❌ Error checking raffle ${raffleId}:`, error.message);
    }
  }
  
  if (stuckRaffles.length === 0) {
    //console.log("✅ No stuck raffles found");
    return;
  }
  
  //console.log(`\n🎯 Found ${stuckRaffles.length} STUCK expired raffles:`);
  stuckRaffles.forEach(raffle => {
    const expiredDate = new Date(raffle.expirationTime * 1000).toLocaleString();
    //console.log(`\n📋 Raffle #${raffle.id}: "${raffle.title}"`);
    //console.log(`   Creator: ${raffle.creator}`);
    //console.log(`   Tickets: ${raffle.ticketsSold}/${raffle.maxTickets}`);
    //console.log(`   Reward: ${raffle.rewardAmount} ${raffle.rewardType === 0 ? 'MON' : 'NFT'}`);
    //console.log(`   Total Earned: ${raffle.totalEarned} MON`);
    //console.log(`   Expired: ${expiredDate}`);
    //console.log(`   Participants:`);
    
    // Group tickets by buyer
    const participants = {};
    raffle.tickets.forEach(ticket => {
      if (!participants[ticket.buyer]) {
        participants[ticket.buyer] = 0;
      }
      participants[ticket.buyer]++;
    });
    
    Object.entries(participants).forEach(([buyer, count]) => {
      //console.log(`     - ${buyer}: ${count} tickets`);
    });
  });
  
  //console.log("\n🛡️ OWNER EMERGENCY OPTIONS:");
  //console.log("1. Manual Winner Selection (risky - no randomness committed)");
  //console.log("2. Emergency Pause + Migration Plan"); 
  //console.log("3. Wait for contract upgrade");
  
  // Option 1: Try manual emergency selection (will likely fail but let's try)
  //console.log("\n🎲 Attempting EMERGENCY manual winner selection...");
  
  for (const raffle of stuckRaffles) {
    //console.log(`\n🔄 Processing raffle #${raffle.id}...`);
    
    try {
      // Generate a pseudo-random winner since we can't use normal randomness
      // Use block data + raffle data as randomness source
      const currentBlock = await provider.getBlockNumber();
      const blockData = await provider.getBlock(currentBlock);
      
      const pseudoRandom = ethers.keccak256(
        ethers.toUtf8Bytes(
          `${raffle.id}-${blockData.hash}-${blockData.timestamp}-${raffle.ticketsSold}`
        )
      );
      
      const winnerIndex = parseInt(pseudoRandom.slice(-8), 16) % raffle.ticketsSold;
      const winner = raffle.tickets[winnerIndex];
      
      //console.log(`🎯 Pseudo-random selection:`);
      //console.log(`   Block: ${currentBlock}`);
      //console.log(`   Random hash: ${pseudoRandom}`);
      //console.log(`   Winner index: ${winnerIndex}`);
      //console.log(`   Winner: ${winner.buyer} (ticket #${winner.ticketNumber})`);
      
      // NOTE: This is just showing who SHOULD win
      // The actual contract call will likely fail because no randomness committed
      //console.log(`⚠️  Cannot execute - contract requires randomness commitment`);
      
    } catch (error) {
      //console.error(`❌ Error processing raffle ${raffle.id}:`, error.message);
    }
  }
  
  //console.log("\n📋 RECOMMENDED SOLUTION:");
  //console.log("1. Deploy new fixed contract");
  //console.log("2. Manually select winners for stuck raffles");
  //console.log("3. Distribute rewards to selected winners");
  //console.log("4. Migrate to new contract for future raffles");
  
  //console.log("\n⚠️  NEXT STEPS:");
  //console.log("- Deploy V4 Fast Fixed contract");
  //console.log("- Use owner privileges to resolve stuck raffles");
  //console.log("- Ensure all participants get fair resolution");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Emergency script failed:", error);
    process.exit(1);
  }); 