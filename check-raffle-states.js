const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("🔍 RAFFLE STATE ANALYSIS");
  console.log("=".repeat(50));
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const contractAddress = "0xa874905B117242eC6c966E35B18985e9242Bb633";
  const abi = [
    "function getActiveRaffles() external view returns (uint256[])",
    "function getTotalRaffles() external view returns (uint256)",
    "function getRaffle(uint256 raffleId) external view returns (tuple(uint256 id, address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, uint256 ticketPrice, address ticketPaymentToken, uint256 maxTickets, uint256 ticketsSold, uint256 totalEarned, uint256 expirationTime, bool autoDistributeOnSoldOut, address winner, uint8 status, bool rewardClaimed, uint256 createdAt))"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  console.log("🎯 Contract:", contractAddress);
  console.log("");
  
  // Get total raffles
  const totalRaffles = await contract.getTotalRaffles();
  console.log(`📊 Total Raffles Ever Created: ${totalRaffles}`);
  
  // Get active raffles
  const activeRaffleIds = await contract.getActiveRaffles();
  console.log(`🟢 Currently Active Raffles: ${activeRaffleIds.length}`);
  console.log("");
  
  // Analyze all raffles
  const currentTime = Math.floor(Date.now() / 1000);
  
  const raffleStates = {
    active: [],
    expired_no_winner: [],
    expired_with_winner: [],
    finished: [],
    cancelled: [],
    no_tickets: []
  };
  
  console.log("🔍 Analyzing all raffles...");
  
  for (let i = 0; i < totalRaffles; i++) {
    try {
      const raffle = await contract.getRaffle(i);
      
      const isExpired = currentTime >= Number(raffle.expirationTime);
      const hasTickets = Number(raffle.ticketsSold) > 0;
      const hasWinner = raffle.winner !== '0x0000000000000000000000000000000000000000';
      const status = Number(raffle.status);
      
      const raffleInfo = {
        id: i,
        title: raffle.title.substring(0, 30) + '...',
        ticketsSold: Number(raffle.ticketsSold),
        maxTickets: Number(raffle.maxTickets),
        hasWinner: hasWinner,
        status: status,
        isExpired: isExpired,
        winner: raffle.winner
      };
      
      if (status === 2) {
        raffleStates.cancelled.push(raffleInfo);
      } else if (!hasTickets) {
        raffleStates.no_tickets.push(raffleInfo);
      } else if (hasWinner) {
        raffleStates.finished.push(raffleInfo);
      } else if (isExpired) {
        raffleStates.expired_no_winner.push(raffleInfo);
      } else {
        raffleStates.active.push(raffleInfo);
      }
      
    } catch (error) {
      console.log(`❌ Error checking raffle ${i}:`, error.message);
    }
  }
  
  console.log("");
  console.log("📊 RAFFLE STATE BREAKDOWN:");
  console.log("━".repeat(50));
  
  console.log(`🟢 ACTIVE (${raffleStates.active.length}): Running, not expired`);
  if (raffleStates.active.length > 0) {
    raffleStates.active.slice(0, 3).forEach(r => {
      console.log(`   - #${r.id}: ${r.title} (${r.ticketsSold}/${r.maxTickets} tickets)`);
    });
    if (raffleStates.active.length > 3) console.log(`   ... and ${raffleStates.active.length - 3} more`);
  }
  
  console.log(`🟡 EXPIRED NO WINNER (${raffleStates.expired_no_winner.length}): Needs finalization`);
  if (raffleStates.expired_no_winner.length > 0) {
    raffleStates.expired_no_winner.slice(0, 3).forEach(r => {
      console.log(`   - #${r.id}: ${r.title} (${r.ticketsSold} tickets, NEEDS FINALIZATION)`);
    });
    if (raffleStates.expired_no_winner.length > 3) console.log(`   ... and ${raffleStates.expired_no_winner.length - 3} more`);
  }
  
  console.log(`✅ FINISHED (${raffleStates.finished.length}): Already has winner`);
  if (raffleStates.finished.length > 0) {
    raffleStates.finished.slice(0, 3).forEach(r => {
      console.log(`   - #${r.id}: ${r.title} (Winner: ${r.winner.substring(0, 8)}...)`);
    });
    if (raffleStates.finished.length > 3) console.log(`   ... and ${raffleStates.finished.length - 3} more`);
  }
  
  console.log(`❌ CANCELLED (${raffleStates.cancelled.length}): Status = 2`);
  console.log(`⚪ NO TICKETS (${raffleStates.no_tickets.length}): Never sold any tickets`);
  
  console.log("");
  console.log("💸 FINALIZER PROCESSING LOGIC:");
  console.log("━".repeat(50));
  
  // Check what finalizer would process
  const finalizerTargets = [];
  
  // From the finalizer script logic:
  // 1. Processes raffles that are expired AND have no winner
  // 2. Processes raffles that are sold out AND have no winner
  
  for (const raffle of [...raffleStates.active, ...raffleStates.expired_no_winner]) {
    const isSoldOut = raffle.ticketsSold >= raffle.maxTickets;
    const needsFinalization = raffle.isExpired || isSoldOut;
    
    if (needsFinalization && !raffle.hasWinner && raffle.ticketsSold > 0) {
      finalizerTargets.push({
        ...raffle,
        reason: raffle.isExpired ? 'EXPIRED' : 'SOLD_OUT'
      });
    }
  }
  
  console.log(`🎯 Raffles Finalizer Would Process: ${finalizerTargets.length}`);
  finalizerTargets.forEach(r => {
    console.log(`   - #${r.id}: ${r.title} (${r.reason}, ${r.ticketsSold} tickets)`);
  });
  
  console.log("");
  console.log("🚨 WASTE ANALYSIS:");
  console.log("━".repeat(50));
  
  const wasteScenarios = [
    {
      name: "GOOD: Only process needed raffles",
      count: finalizerTargets.length,
      costPerRaffle: 0.526,
      description: "Only expired/sold-out raffles without winners"
    },
    {
      name: "BAD: Process ALL raffles",
      count: Number(totalRaffles),
      costPerRaffle: 0.526,
      description: "Including finished raffles (WASTE!)"
    },
    {
      name: "WORST: Process finished raffles repeatedly",
      count: raffleStates.finished.length * 10, // 10x repeat
      costPerRaffle: 0.526,
      description: "Re-processing already finished raffles"
    }
  ];
  
  wasteScenarios.forEach(scenario => {
    const totalCost = scenario.count * scenario.costPerRaffle;
    console.log(`${scenario.name}:`);
    console.log(`   Raffles: ${scenario.count}`);
    console.log(`   Cost: ${totalCost.toFixed(1)} MON`);
    console.log(`   Reason: ${scenario.description}`);
    console.log("");
  });
  
  console.log("✅ GOOD NEWS:");
  console.log(`   Finished raffles (${raffleStates.finished.length}) should NOT be processed`);
  console.log(`   Only ${finalizerTargets.length} raffles actually need finalization`);
  console.log("");
  
  console.log("⚠️  POTENTIAL WASTE:");
  console.log("   If finalizer has bugs, it might process finished raffles");
  console.log("   Each unnecessary transaction = 0.526 MON wasted");
  console.log(`   ${raffleStates.finished.length} finished raffles × 0.526 = ${(raffleStates.finished.length * 0.526).toFixed(1)} MON potential waste`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌", error);
    process.exit(1);
  }); 