const { ethers } = require("hardhat");
require("dotenv").config();

class RaffleV4FastFinalizer {
  constructor() {
    // Use Monad testnet provider
    this.provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contractAddress = "0xb7a8e84F06124D2E444605137E781cDd7ac480fa"; // V4 Fast contract
    
    this.abi = [
      "function getActiveRaffles() external view returns (uint256[])",
      "function getTotalRaffles() external view returns (uint256)",
      "function getRaffle(uint256 raffleId) external view returns (tuple(uint256 id, address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, uint256 ticketPrice, address ticketPaymentToken, uint256 maxTickets, uint256 ticketsSold, uint256 totalEarned, uint256 expirationTime, bool autoDistributeOnSoldOut, address winner, uint8 status, bool rewardClaimed, uint256 createdAt))",
      "function getRandomnessCommit(uint256 raffleId) external view returns (tuple(bytes32 commitment, uint256 commitTime, bool revealed, uint256 revealDeadline))",
      "function isRaffleExpired(uint256 raffleId) external view returns (bool)",
      "function isReadyForReveal(uint256 raffleId) external view returns (bool)",
      "function commitRandomness(uint256 raffleId, bytes32 commitment) external",
      "function revealAndSelectWinner(uint256 raffleId, uint256 nonce) external",
      "function emergencySelectWinner(uint256 raffleId) external",
      "event RandomnessCommitted(uint256 indexed raffleId, bytes32 commitment, uint256 revealDeadline)",
      "event RandomnessRevealed(uint256 indexed raffleId, uint256 nonce, address winner)",
      "event RaffleEnded(uint256 indexed raffleId, address indexed winner, uint256 winningTicketNumber, bytes32 randomHash)"
    ];
    
    this.contract = new ethers.Contract(this.contractAddress, this.abi, this.wallet);
    this.isRunning = false;
    this.revealWindow = 2 * 60; // 2 minutes in seconds
    this.commitments = new Map(); // Store our randomness commitments
    this.processedRaffles = new Set(); // Cache processed raffle IDs to avoid reprocessing
    this.maxBatchSize = 50; // Process max 50 raffles per cycle
  }

  async checkWalletBalance() {
    const balance = await this.provider.getBalance(this.wallet.address);
    const balanceInMON = ethers.formatEther(balance);
    
    console.log(`💰 Wallet Balance: ${balanceInMON} MON`);
    
    if (balance < ethers.parseEther("0.01")) {
      console.log("⚠️  Low balance warning! Less than 0.01 MON remaining.");
      return false;
    }
    
    return true;
  }

  generateRandomNonce() {
    return Math.floor(Math.random() * 1000000000);
  }

  async getRafflesThatNeedCommitment() {
    try {
      // Use getActiveRaffles() instead of checking all raffles
      const activeRaffleIds = await this.contract.getActiveRaffles();
      const rafflesNeedingCommitment = [];
      const currentTime = Math.floor(Date.now() / 1000);

      console.log(`🔍 Checking ${activeRaffleIds.length} active raffles for commitment needs...`);

      // Limit batch size for performance
      const raffleIdsToCheck = activeRaffleIds.slice(0, this.maxBatchSize);
      if (activeRaffleIds.length > this.maxBatchSize) {
        console.log(`⚠️  Processing first ${this.maxBatchSize} raffles (${activeRaffleIds.length} total)`);
      }

      for (const raffleId of raffleIdsToCheck) {
        try {
          const raffle = await this.contract.getRaffle(raffleId);
          
          // Check if raffle has no winner yet (should be true for active raffles)
          if (raffle.winner === '0x0000000000000000000000000000000000000000') {
            const isSoldOut = Number(raffle.ticketsSold) >= Number(raffle.maxTickets);
            const isExpired = currentTime >= Number(raffle.expirationTime);
            
            // Only process if sold out or expired
            if (isSoldOut || isExpired) {
              // Check if randomness commitment exists
              try {
                const commitment = await this.contract.getRandomnessCommit(raffleId);
                
                if (!commitment.commitment || commitment.commitment === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                  rafflesNeedingCommitment.push({
                    id: Number(raffleId),
                    title: raffle.title,
                    ticketsSold: Number(raffle.ticketsSold),
                    maxTickets: Number(raffle.maxTickets),
                    isSoldOut,
                    isExpired,
                    expirationTime: Number(raffle.expirationTime)
                  });
                }
              } catch (commitError) {
                // If getRandomnessCommit fails, assume it needs commitment
                rafflesNeedingCommitment.push({
                  id: Number(raffleId),
                  title: raffle.title,
                  ticketsSold: Number(raffle.ticketsSold),
                  maxTickets: Number(raffle.maxTickets),
                  isSoldOut,
                  isExpired,
                  expirationTime: Number(raffle.expirationTime)
                });
              }
            }
          }
        } catch (error) {
          console.log(`❌ Error checking raffle ${raffleId}:`, error.message);
        }
      }

      return rafflesNeedingCommitment;
    } catch (error) {
      console.error("❌ Error getting raffles needing commitment:", error.message);
      return [];
    }
  }

  async getRafflesReadyForReveal() {
    try {
      // Use getActiveRaffles() instead of checking all raffles
      const activeRaffleIds = await this.contract.getActiveRaffles();
      const rafflesReadyForReveal = [];
      const currentTime = Math.floor(Date.now() / 1000);

      console.log(`🔍 Checking ${activeRaffleIds.length} active raffles for reveal readiness...`);

      // Limit batch size for performance
      const raffleIdsToCheck = activeRaffleIds.slice(0, this.maxBatchSize);
      if (activeRaffleIds.length > this.maxBatchSize) {
        console.log(`⚠️  Processing first ${this.maxBatchSize} raffles (${activeRaffleIds.length} total)`);
      }

      for (const raffleId of raffleIdsToCheck) {
        try {
          const raffle = await this.contract.getRaffle(raffleId);
          
          // Check if raffle has no winner yet (should be true for active raffles)
          if (raffle.winner === '0x0000000000000000000000000000000000000000') {
            try {
              // First check if there's a randomness commitment
              const commitment = await this.contract.getRandomnessCommit(raffleId);
              const revealDeadline = Number(commitment.revealDeadline);
              
              // Only proceed if reveal deadline has passed
              if (revealDeadline > 0 && currentTime > revealDeadline) {
                console.log(`⏰ Raffle ${raffleId} reveal deadline passed (${new Date(revealDeadline * 1000).toLocaleString()})`);
                
                rafflesReadyForReveal.push({
                  id: Number(raffleId),
                  title: raffle.title,
                  ticketsSold: Number(raffle.ticketsSold),
                  revealDeadline: revealDeadline,
                  nonce: this.commitments.get(Number(raffleId)) || null
                });
              } else if (revealDeadline > 0) {
                const remainingTime = revealDeadline - currentTime;
                console.log(`⏳ Raffle ${raffleId} reveal window active, ${Math.ceil(remainingTime / 60)} minutes remaining`);
              }
              
            } catch (commitError) {
              // No commitment found, check if we need emergency selection
              const isSoldOut = Number(raffle.ticketsSold) >= Number(raffle.maxTickets);
              const isExpired = currentTime >= Number(raffle.expirationTime);
              
              if (isSoldOut || isExpired) {
                console.log(`🚨 Raffle ${raffleId} needs emergency selection (${isSoldOut ? 'sold out' : 'expired'})`);
                
                rafflesReadyForReveal.push({
                  id: Number(raffleId),
                  title: raffle.title,
                  ticketsSold: Number(raffle.ticketsSold),
                  revealDeadline: 0,
                  nonce: null
                });
              }
            }
          }
        } catch (error) {
          console.log(`❌ Error checking raffle ${raffleId} for reveal:`, error.message);
        }
      }

      return rafflesReadyForReveal;
    } catch (error) {
      console.error("❌ Error getting raffles ready for reveal:", error.message);
      return [];
    }
  }

  async commitRandomnessForRaffles(raffles) {
    for (const raffle of raffles) {
      try {
        console.log(`🎲 Committing randomness for raffle #${raffle.id}: "${raffle.title}"`);
        
        const nonce = this.generateRandomNonce();
        const commitment = ethers.keccak256(ethers.toUtf8Bytes(nonce.toString()));
        
        // Store our nonce for later reveal
        this.commitments.set(raffle.id, nonce);
        
        console.log(`  - Nonce: ${nonce}`);
        console.log(`  - Commitment: ${commitment}`);
        
        // V4 Fast contracts require manual randomness commitment
        try {
          const gasEstimate = await this.contract.commitRandomness.estimateGas(raffle.id, commitment);
          const tx = await this.contract.commitRandomness(raffle.id, commitment, {
            gasLimit: gasEstimate * BigInt(120) / BigInt(100)
          });
          
          console.log(`📤 Commitment transaction: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(`✅ Randomness committed! Gas used: ${receipt.gasUsed.toString()}`);
          
          // Add delay between transactions
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (commitError) {
          console.log(`⚠️  Could not commit randomness (may be auto-committed): ${commitError.message}`);
          // Continue - the contract might handle commitment automatically
        }
        
      } catch (error) {
        console.error(`❌ Error committing randomness for raffle ${raffle.id}:`, error.message);
      }
    }
  }

  async revealWinnersForRaffles(raffles) {
    for (const raffle of raffles) {
      try {
        console.log(`🎯 Revealing winner for raffle #${raffle.id}: "${raffle.title}"`);
        
        if (!raffle.nonce) {
          console.log(`❌ No nonce stored for raffle ${raffle.id}, using emergency selection`);
          
          const gasEstimate = await this.contract.emergencySelectWinner.estimateGas(raffle.id);
          const tx = await this.contract.emergencySelectWinner(raffle.id, {
            gasLimit: gasEstimate * BigInt(120) / BigInt(100)
          });
          
          console.log(`📤 Emergency selection transaction: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(`✅ Emergency selection confirmed! Gas used: ${receipt.gasUsed.toString()}`);
          
        } else {
          console.log(`  - Using nonce: ${raffle.nonce}`);
          
          const gasEstimate = await this.contract.revealAndSelectWinner.estimateGas(raffle.id, raffle.nonce);
          const tx = await this.contract.revealAndSelectWinner(raffle.id, raffle.nonce, {
            gasLimit: gasEstimate * BigInt(120) / BigInt(100)
          });
          
          console.log(`📤 Reveal transaction: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(`✅ Winner revealed! Gas used: ${receipt.gasUsed.toString()}`);
          
          // Parse events to get winner
          const winnerEvents = receipt.logs.filter(log => {
            try {
              const parsed = this.contract.interface.parseLog(log);
              return parsed && parsed.name === 'RaffleEnded';
            } catch {
              return false;
            }
          });
          
          if (winnerEvents.length > 0) {
            const parsed = this.contract.interface.parseLog(winnerEvents[0]);
            console.log(`🎉 Winner selected: ${parsed.args.winner}`);
          }
        }
        
        // Remove stored nonce and mark as processed
        this.commitments.delete(raffle.id);
        this.processedRaffles.add(raffle.id);
        
      } catch (error) {
        console.error(`❌ Error revealing winner for raffle ${raffle.id}:`, error.message);
      }
    }
  }

  async getRafflesNeedingRewardDistribution() {
    try {
      // Check recent raffles for reward distribution needs
      const totalRaffles = await this.contract.getTotalRaffles();
      const rafflesNeedingReward = [];
      const currentTime = Math.floor(Date.now() / 1000);

      // Check last 100 raffles for reward distribution
      const startId = Math.max(0, Number(totalRaffles) - 100);
      
      console.log(`🔍 Checking raffles ${startId} to ${totalRaffles} for reward distribution...`);

      for (let raffleId = startId; raffleId < totalRaffles; raffleId++) {
        try {
          const raffle = await this.contract.getRaffle(raffleId);
          
          // Check if raffle has winner but reward not distributed
          if (raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' && 
              !raffle.rewardClaimed && raffle.status === 1) { // status 1 = ended
            
            // Check if it's been some time since winner selection (avoid immediate distribution)
            const timeSinceEnd = currentTime - Number(raffle.createdAt);
            if (timeSinceEnd > 60) { // Wait at least 1 minute
              rafflesNeedingReward.push({
                id: Number(raffleId),
                title: raffle.title,
                winner: raffle.winner,
                rewardType: Number(raffle.rewardType),
                rewardAmount: raffle.rewardAmount.toString(),
                rewardTokenAddress: raffle.rewardTokenAddress
              });
            }
          }
        } catch (error) {
          // Skip individual raffle errors
        }
      }

      return rafflesNeedingReward;
    } catch (error) {
      console.error("❌ Error getting raffles needing reward distribution:", error.message);
      return [];
    }
  }

  async distributeRewards(raffles) {
    for (const raffle of raffles) {
      try {
        console.log(`🎁 Distributing reward for raffle #${raffle.id}: "${raffle.title}"`);
        console.log(`  - Winner: ${raffle.winner}`);
        console.log(`  - Reward Type: ${raffle.rewardType === 0 ? 'Token' : 'NFT'}`);
        
        const gasEstimate = await this.contract.distributeReward.estimateGas(raffle.id);
        const tx = await this.contract.distributeReward(raffle.id, {
          gasLimit: gasEstimate * BigInt(120) / BigInt(100)
        });
        
        console.log(`📤 Reward distribution transaction: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Reward distributed! Gas used: ${receipt.gasUsed.toString()}`);
        
        // Add delay between transactions
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error distributing reward for raffle ${raffle.id}:`, error.message);
      }
    }
  }

  async processRaffles() {
    if (this.isRunning) {
      console.log("⏳ Finalizer already running, skipping...");
      return;
    }

    this.isRunning = true;
    const timestamp = new Date().toISOString();
    console.log(`\n🚀 [${timestamp}] Starting V4 Fast raffle processing...`);

    try {
      // Check wallet balance first
      const hasBalance = await this.checkWalletBalance();
      if (!hasBalance) {
        console.log("❌ Insufficient balance, skipping processing");
        return;
      }

      // Step 1: Get raffles that need randomness commitment
      const rafflesNeedingCommitment = await this.getRafflesThatNeedCommitment();
      
      if (rafflesNeedingCommitment.length > 0) {
        console.log(`🎲 Found ${rafflesNeedingCommitment.length} raffles needing commitment:`);
        rafflesNeedingCommitment.forEach(raffle => {
          const status = raffle.isSoldOut ? "SOLD OUT" : "EXPIRED";
          console.log(`  - Raffle #${raffle.id}: "${raffle.title}" (${status}, ${raffle.ticketsSold}/${raffle.maxTickets} tickets)`);
        });
        
        await this.commitRandomnessForRaffles(rafflesNeedingCommitment);
      } else {
        console.log("✅ No raffles need randomness commitment");
      }

      // Step 2: Get raffles ready for winner reveal
      const rafflesReadyForReveal = await this.getRafflesReadyForReveal();
      
      if (rafflesReadyForReveal.length > 0) {
        console.log(`🎯 Found ${rafflesReadyForReveal.length} raffles ready for reveal:`);
        rafflesReadyForReveal.forEach(raffle => {
          console.log(`  - Raffle #${raffle.id}: "${raffle.title}" (${raffle.ticketsSold} tickets sold)`);
        });
        
        await this.revealWinnersForRaffles(rafflesReadyForReveal);
      } else {
        console.log("✅ No raffles ready for winner reveal");
      }

      // Step 3: Get raffles needing reward distribution
      const rafflesNeedingReward = await this.getRafflesNeedingRewardDistribution();
      
      if (rafflesNeedingReward.length > 0) {
        console.log(`🎁 Found ${rafflesNeedingReward.length} raffles needing reward distribution:`);
        rafflesNeedingReward.forEach(raffle => {
          console.log(`  - Raffle #${raffle.id}: "${raffle.title}" (Winner: ${raffle.winner.slice(0, 6)}...${raffle.winner.slice(-4)})`);
        });
        
        await this.distributeRewards(rafflesNeedingReward);
      } else {
        console.log("✅ No raffles need reward distribution");
      }

    } catch (error) {
      console.error("❌ Processing error:", error.message);
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        console.log("💸 Insufficient funds for transaction");
      } else if (error.code === 'NONCE_EXPIRED') {
        console.log("🔄 Nonce expired, will retry next cycle");
      } else {
        console.log("🔍 Full error:", error);
      }
    } finally {
      this.isRunning = false;
      
      // Cleanup: Remove old processed raffles (keep last 1000)
      if (this.processedRaffles.size > 1000) {
        const sortedIds = Array.from(this.processedRaffles).sort((a, b) => b - a);
        this.processedRaffles = new Set(sortedIds.slice(0, 1000));
        console.log(`🧹 Cleaned up processed raffles cache (kept last 1000)`);
      }
      
      console.log(`⏰ [${new Date().toISOString()}] V4 Fast processing completed\n`);
    }
  }

  startCronJob(intervalMinutes = 1) {
    console.log(`🤖 Starting V4 Fast Raffle Finalizer`);
    console.log(`📍 Contract: ${this.contractAddress}`);
    console.log(`👤 Wallet: ${this.wallet.address}`);
    console.log(`⏰ Interval: Every ${intervalMinutes} minutes`);
    console.log(`🌐 Network: Monad Testnet`);
    console.log(`⚡ Reveal Window: ${this.revealWindow / 60} minutes`);
    console.log(`📦 Max Batch Size: ${this.maxBatchSize} raffles`);
    console.log("=" * 50);

    // Run immediately once
    this.processRaffles();

    // Then run every N minutes
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(() => {
      this.processRaffles();
    }, intervalMs);
  }

  // Manual trigger method
  async triggerOnce() {
    console.log("🎯 Manual V4 Fast trigger activated");
    await this.processRaffles();
  }
}

// Usage
async function main() {
  const finalizer = new RaffleV4FastFinalizer();
  
  // Check if this is a manual run or cron job
  const args = process.argv.slice(2);
  
  if (args.includes('--once')) {
    // Manual single run
    await finalizer.triggerOnce();
    process.exit(0);
  } else {
    // Start cron job
    const interval = args.includes('--interval') ? 
      parseInt(args[args.indexOf('--interval') + 1]) || 1 : 1;
    
    finalizer.startCronJob(interval);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down V4 Fast finalizer...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Gracefully shutting down V4 Fast finalizer...');
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RaffleV4FastFinalizer }; 