const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  //console.log("🚀 Manual Expired Raffle Finalizer");
  //console.log("This script will manually finalize expired raffles in the current contract");
  
  // Use Monad testnet provider
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractAddress = "0x225f2C16360e18BcAa36Fc3d0d3197e6756117d6"; // V4 Fast FIXED contract
  
  const abi = [
    "function getActiveRaffles() external view returns (uint256[])",
    "function getRaffle(uint256 raffleId) external view returns (tuple(uint256 id, address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, uint256 ticketPrice, address ticketPaymentToken, uint256 maxTickets, uint256 ticketsSold, uint256 totalEarned, uint256 expirationTime, bool autoDistributeOnSoldOut, address winner, uint8 status, bool rewardClaimed, uint256 createdAt))",
    "function getRandomnessCommit(uint256 raffleId) external view returns (tuple(bytes32 commitment, uint256 commitTime, bool revealed, uint256 revealDeadline))",
    "function commitRandomness(uint256 raffleId, bytes32 commitment) external",
    "function emergencySelectWinner(uint256 raffleId) external",
    "event RandomnessCommitted(uint256 indexed raffleId, bytes32 commitment, uint256 revealDeadline)",
    "event RaffleEnded(uint256 indexed raffleId, address indexed winner, uint256 winningTicketNumber, bytes32 randomHash)"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  //console.log("👤 Using wallet:", wallet.address);
  
  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  //console.log("💰 Wallet Balance:", ethers.formatEther(balance), "MON");
  
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("❌ Insufficient balance");
  }
  
  // Get expired raffles
  //console.log("\n🔍 Finding expired raffles...");
  const activeRaffleIds = await contract.getActiveRaffles();
  const currentTime = Math.floor(Date.now() / 1000);
  const expiredRaffles = [];
  
  for (const raffleId of activeRaffleIds) {
    try {
      const raffle = await contract.getRaffle(raffleId);
      const isExpired = currentTime >= Number(raffle.expirationTime);
      const hasTickets = Number(raffle.ticketsSold) > 0;
      const hasWinner = raffle.winner !== '0x0000000000000000000000000000000000000000';
      
      if (isExpired && hasTickets && !hasWinner) {
        // Check if randomness is already committed
        try {
          const commitment = await contract.getRandomnessCommit(raffleId);
          const hasCommitment = commitment.commitment !== '0x0000000000000000000000000000000000000000000000000000000000000000';
          
          expiredRaffles.push({
            id: Number(raffleId),
            title: raffle.title,
            ticketsSold: Number(raffle.ticketsSold),
            maxTickets: Number(raffle.maxTickets),
            expirationTime: Number(raffle.expirationTime),
            hasCommitment: hasCommitment,
            revealDeadline: Number(commitment.revealDeadline),
            revealed: commitment.revealed
          });
        } catch (commitError) {
          // If no commitment found, add to list
          expiredRaffles.push({
            id: Number(raffleId),
            title: raffle.title,
            ticketsSold: Number(raffle.ticketsSold),
            maxTickets: Number(raffle.maxTickets),
            expirationTime: Number(raffle.expirationTime),
            hasCommitment: false,
            revealDeadline: 0,
            revealed: false
          });
        }
      }
    } catch (error) {
      //console.log(`❌ Error checking raffle ${raffleId}:`, error.message);
    }
  }
  
  if (expiredRaffles.length === 0) {
    //console.log("✅ No expired raffles found");
    return;
  }
  
  //console.log(`\n🎯 Found ${expiredRaffles.length} expired raffles:`);
  expiredRaffles.forEach(raffle => {
    const expiredDate = new Date(raffle.expirationTime * 1000).toLocaleString();
    const status = raffle.hasCommitment ? "HAS COMMITMENT" : "NEEDS COMMITMENT";
    //console.log(`  - Raffle #${raffle.id}: "${raffle.title}" (${raffle.ticketsSold}/${raffle.maxTickets} tickets, expired: ${expiredDate}) [${status}]`);
  });
  
  // Process each expired raffle
  for (const raffle of expiredRaffles) {
    //console.log(`\n🔄 Processing raffle #${raffle.id}: "${raffle.title}"`);
    
    try {
      // Step 1: Commit randomness if not already committed
      if (!raffle.hasCommitment) {
        //console.log("🎲 Committing randomness...");
        
        // Generate a manual commitment
        const nonce = Math.floor(Math.random() * 1000000000);
        const commitment = ethers.keccak256(ethers.toUtf8Bytes(nonce.toString()));
        
        //console.log(`  - Generated nonce: ${nonce}`);
        //console.log(`  - Commitment: ${commitment}`);
        
        const gasEstimate = await contract.commitRandomness.estimateGas(raffle.id, commitment);
        const tx = await contract.commitRandomness(raffle.id, commitment, {
          gasLimit: gasEstimate * BigInt(120) / BigInt(100)
        });
        
        //console.log(`📤 Commitment transaction: ${tx.hash}`);
        const receipt = await tx.wait();
        //console.log(`✅ Randomness committed! Gas used: ${receipt.gasUsed.toString()}`);
        
        // Wait 3 minutes for reveal deadline to pass (contract has 2-minute window)
        //console.log("⏳ Waiting 3 minutes for reveal deadline to pass...");
        await new Promise(resolve => setTimeout(resolve, 180000)); // 3 minutes
        
      } else if (!raffle.revealed && currentTime > raffle.revealDeadline) {
        //console.log("✅ Randomness already committed, reveal deadline passed");
      } else if (!raffle.revealed) {
        const remainingTime = raffle.revealDeadline - currentTime;
        //console.log(`⏳ Waiting ${Math.ceil(remainingTime / 60)} minutes for reveal deadline...`);
        await new Promise(resolve => setTimeout(resolve, (remainingTime + 10) * 1000));
      }
      
      // Step 2: Emergency select winner
      //console.log("🎯 Selecting winner via emergency selection...");
      
      const gasEstimate = await contract.emergencySelectWinner.estimateGas(raffle.id);
      const tx = await contract.emergencySelectWinner(raffle.id, {
        gasLimit: gasEstimate * BigInt(120) / BigInt(100)
      });
      
      //console.log(`📤 Emergency selection transaction: ${tx.hash}`);
      const receipt = await tx.wait();
      //console.log(`✅ Winner selected! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Parse events to get winner
      const raffleEndedEvents = receipt.logs.filter(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed && parsed.name === 'RaffleEnded';
        } catch {
          return false;
        }
      });
      
      if (raffleEndedEvents.length > 0) {
        const parsed = contract.interface.parseLog(raffleEndedEvents[0]);
        //console.log(`🎉 Winner: ${parsed.args.winner}`);
        //console.log(`🎫 Winning Ticket: ${parsed.args.winningTicketNumber}`);
      }
      
      //console.log(`✅ Raffle #${raffle.id} successfully finalized!`);
      
      // Add delay between raffles
      if (expiredRaffles.indexOf(raffle) < expiredRaffles.length - 1) {
        //console.log("⏱️  Waiting 10 seconds before next raffle...");
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
    } catch (error) {
      //console.error(`❌ Error processing raffle ${raffle.id}:`, error.message);
      //console.log("Continuing with next raffle...");
    }
  }
  
  //console.log("\n🎊 All expired raffles processed!");
  //console.log("The winners have been selected and rewards should be distributed automatically.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Script failed:", error);
    process.exit(1);
  }); 