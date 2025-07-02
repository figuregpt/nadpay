const { ethers } = require("ethers");
require("dotenv").config();

class RaffleV4FastFinalizer {
  constructor() {
    // Check environment variables
    if (!process.env.PRIVATE_KEY) {
      throw new Error("❌ PRIVATE_KEY environment variable not found!");
    }
    
    //// Use Monad testnet provider
    this.provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contractAddress = "0xa874905B117242eC6c966E35B18985e9242Bb633"; // V4 WORKING contract
    
    this.abi = [
      "function getActiveRaffleIds() external view returns (uint256[])",
      "function getTotalRaffles() external view returns (uint256)",
      "function getRaffle(uint256 raffleId) external view returns (tuple(uint256 id, address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, uint256 ticketPrice, address ticketPaymentToken, uint256 maxTickets, uint256 ticketsSold, uint256 totalEarned, uint256 expirationTime, bool autoDistributeOnSoldOut, address winner, uint8 status, bool rewardClaimed, uint256 createdAt))",
      "function randomnessCommits(uint256 raffleId) external view returns (tuple(bytes32 commitment, uint256 commitTime, bool revealed, uint256 revealDeadline))",
      "function commitRandomness(uint256 raffleId, bytes32 commitment) external",
      "function commitRandomnessForExpiredRaffle(uint256 raffleId) external",
      "function commitRandomnessForRaffle(uint256 raffleId) external",
      "function finalizeExpiredRaffles() external",
      "function revealAndSelectWinner(uint256 raffleId, uint256 nonce) external",
      "function emergencySelectWinner(uint256 raffleId) external",
      "event RandomnessCommitted(uint256 indexed raffleId, bytes32 commitment, uint256 revealDeadline)",
      "event RandomnessRevealed(uint256 indexed raffleId, uint256 nonce, address winner)",
      "event RaffleEnded(uint256 indexed raffleId, address indexed winner, uint256 winningTicketNumber, bytes32 randomHash)"
    ];
    
    this.contract = new ethers.Contract(this.contractAddress, this.abi, this.wallet);
    this.isRunning = false;
    this.revealWindow = 30; // 30 seconds (updated from 2 minutes for production)
    this.commitments = new Map(); // Store our randomness commitments
    this.processedRaffles = new Set(); // Cache processed raffle IDs to avoid reprocessing
    this.maxBatchSize = 10; // Process max 10 raffles per cycle (reduced for rate limiting)
    this.requestDelay = 500; // 500ms delay between RPC requests
  }

  async checkWalletBalance() {
    const balance = await this.provider.getBalance(this.wallet.address);
    const balanceInMON = ethers.formatEther(balance);
    
    //if (balance < ethers.parseEther("0.01")) {
      //{
    return Math.floor(Math.random() * 1000000000);
  }

  // Add delay between RPC requests to avoid rate limiting
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getRafflesThatNeedCommitment() {
    try {
      // Use getActiveRaffleIds() instead of checking all raffles
      const activeRaffleIds = await this.contract.getActiveRaffleIds();
      const rafflesNeedingCommitment = [];
      const currentTime = Math.floor(Date.now() / 1000);

      //// Limit batch size for performance
      const raffleIdsToCheck = activeRaffleIds.slice(0, this.maxBatchSize);
      if (activeRaffleIds.length > this.maxBatchSize) {
        //`);
      }

      for (const raffleId of raffleIdsToCheck) {
        try {
          // Add delay to avoid rate limiting
          await this.delay(this.requestDelay);
          const raffle = await this.contract.getRaffle(raffleId);
          
          // ✅ Skip if raffle is already cancelled (status = 2)
          if (raffle.status === 2n) {
            //continue;
          }
          
          // Check if raffle has no winner yet (should be true for active raffles)
          if (raffle.winner === '0x0000000000000000000000000000000000000000') {
            const isSoldOut = Number(raffle.ticketsSold) >= Number(raffle.maxTickets);
            const isExpired = currentTime >= Number(raffle.expirationTime);
            
            // Only process if sold out or expired
            if (isSoldOut || isExpired) {
              // Check if randomness commitment exists
              try {
                const commitment = await this.contract.randomnessCommits(raffleId);
                
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
          //}
      }

      return rafflesNeedingCommitment;
    } catch (error) {
      //console.error("❌ Error getting raffles needing commitment:", error.message);
      return [];
    }
  }

  async getRafflesReadyForReveal() {
    try {
      // Check both active raffles AND recent raffles to catch expired ones
      const totalRaffles = await this.contract.getTotalRaffles();
      const activeRaffleIds = await this.contract.getActiveRaffleIds();
      
      // Also check last 20 raffles to catch recently expired ones
      const recentRaffleIds = [];
      const startId = Math.max(0, Number(totalRaffles) - 20);
      for (let i = startId; i < Number(totalRaffles); i++) {
        recentRaffleIds.push(BigInt(i));
      }
      
      // Combine and deduplicate
      const allRaffleIds = [...new Set([...activeRaffleIds, ...recentRaffleIds])];
      
      const rafflesReadyForReveal = [];
      const currentTime = Math.floor(Date.now() / 1000);

      //for reveal readiness...`);

      // Limit batch size for performance
      const raffleIdsToCheck = allRaffleIds.slice(0, this.maxBatchSize);
      if (allRaffleIds.length > this.maxBatchSize) {
        //`);
      }

      for (const raffleId of raffleIdsToCheck) {
        try {
          // Add delay to avoid rate limiting
          await this.delay(this.requestDelay);
          const raffle = await this.contract.getRaffle(raffleId);
          
          // ✅ Skip if raffle is already cancelled (status = 2)
          if (raffle.status === 2n) {
            //continue;
          }
          
          // Check if raffle has no winner yet (should be true for active raffles)
          if (raffle.winner === '0x0000000000000000000000000000000000000000') {
            const isSoldOut = Number(raffle.ticketsSold) >= Number(raffle.maxTickets);
            const isExpired = currentTime >= Number(raffle.expirationTime);
            
            // Check expired raffles first, regardless of commitment status
            if (isExpired && Number(raffle.ticketsSold) > 0) {
              //rafflesReadyForReveal.push({
                id: Number(raffleId),
                title: raffle.title,
                ticketsSold: Number(raffle.ticketsSold),
                revealDeadline: 0,
                nonce: null
              });
              continue;
            }
            
            // Then check for commitment-based reveals
            try {
              // First check if there's a randomness commitment
              const commitment = await this.contract.randomnessCommits(raffleId);
              const revealDeadline = Number(commitment.revealDeadline);
              
              // Only proceed if reveal deadline has passed
              if (revealDeadline > 0 && currentTime > revealDeadline) {
                //.toLocaleString()})`);
                
                rafflesReadyForReveal.push({
                  id: Number(raffleId),
                  title: raffle.title,
                  ticketsSold: Number(raffle.ticketsSold),
                  revealDeadline: revealDeadline,
                  nonce: this.commitments.get(Number(raffleId)) || null
                });
              } else if (revealDeadline > 0) {
                const remainingTime = revealDeadline - currentTime;
                const timeDisplay = remainingTime >= 60 
                  ? `${Math.ceil(remainingTime / 60)} minutes` 
                  : `${remainingTime} seconds`;
                //}
              
            } catch (commitError) {
              // No commitment found, check if we need emergency selection
              if (isSoldOut) {
                //rafflesReadyForReveal.push({
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
          //}
      }

      return rafflesReadyForReveal;
    } catch (error) {
      //console.error("❌ Error getting raffles ready for reveal:", error.message);
      return [];
    }
  }

  async commitRandomnessForRaffles(raffles) {
    for (const raffle of raffles) {
      try {
        const status = raffle.isExpired ? "EXPIRED" : "SOLD OUT";
        //// Use different approach for expired vs sold out raffles
        if (raffle.isExpired) {
          // For expired raffles, use the dedicated function (no manual commitment needed)
          ////const receipt = await tx.wait();
            //} catch (expiredError) {
            //continue;
          }
          
        } else {
          // For sold out raffles, use manual commitment (original logic)
          const nonce = this.generateRandomNonce();
          const commitment = ethers.keccak256(ethers.toUtf8Bytes(nonce.toString()));
          
          // Store our nonce for later reveal
          this.commitments.set(raffle.id, nonce);
          
          ////try {
            const gasEstimate = await this.contract.commitRandomness.estimateGas(raffle.id, commitment);
            const tx = await this.contract.commitRandomness(raffle.id, commitment, {
              gasLimit: gasEstimate * BigInt(120) / BigInt(100)
            });
            
            //const receipt = await tx.wait();
            //} catch (commitError) {
            //// Continue - the contract might handle commitment automatically
          }
        }
        
        // Add delay between transactions
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        //console.error(`❌ Error committing randomness for raffle ${raffle.id}:`, error.message);
      }
    }
  }

  async revealWinnersForRaffles(raffles) {
    for (const raffle of raffles) {
      try {
        //if (!raffle.nonce) {
          //const gasEstimate = await this.contract.emergencySelectWinner.estimateGas(raffle.id);
          const tx = await this.contract.emergencySelectWinner(raffle.id, {
            gasLimit: gasEstimate * BigInt(120) / BigInt(100)
          });
          
          //const receipt = await tx.wait();
          //} else {
          //const gasEstimate = await this.contract.revealAndSelectWinner.estimateGas(raffle.id, raffle.nonce);
          const tx = await this.contract.revealAndSelectWinner(raffle.id, raffle.nonce, {
            gasLimit: gasEstimate * BigInt(120) / BigInt(100)
          });
          
          //const receipt = await tx.wait();
          //// Parse events to get winner
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
            //}
        }
        
        // Remove stored nonce and mark as processed
        this.commitments.delete(raffle.id);
        this.processedRaffles.add(raffle.id);
        
      } catch (error) {
        //console.error(`❌ Error revealing winner for raffle ${raffle.id}:`, error.message);
      }
    }
  }

  // ✅ REMOVED: Reward distribution functions - now automatic in FIXED contract
  // The new contract automatically distributes rewards when winners are selected via:
  // - revealAndSelectWinner() -> auto reward distribution
  // - emergencySelectWinner() -> auto reward distribution

  async processRaffles() {
    if (this.isRunning) {
      //.toISOString();
    //try {
      // Check wallet balance first
      const hasBalance = await this.checkWalletBalance();
      if (!hasBalance) {
        //// This handles: no-ticket cancellation + expired randomness commitment
      try {
        ////await tx.wait();
        //{
        //const rafflesNeedingCommitment = await this.getRafflesThatNeedCommitment();
      const soldOutRaffles = rafflesNeedingCommitment.filter(r => r.isSoldOut && !r.isExpired);
      
      if (soldOutRaffles.length > 0) {
        //soldOutRaffles.forEach(raffle => {
          //`);
        });
        
        await this.commitRandomnessForRaffles(soldOutRaffles);
      } else {
        //const rafflesReadyForReveal = await this.getRafflesReadyForReveal();
      
      if (rafflesReadyForReveal.length > 0) {
        //rafflesReadyForReveal.forEach(raffle => {
          //`);
        });
        
        await this.revealWinnersForRaffles(rafflesReadyForReveal);
      } else {
        //} catch (error) {
      //console.error("❌ Processing error:", error.message);
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        //{
        //}
    } finally {
      this.isRunning = false;
      
      // Cleanup: Remove old processed raffles (keep last 1000)
      if (this.processedRaffles.size > 1000) {
        const sortedIds = Array.from(this.processedRaffles).sort((a, b) => b - a);
        this.processedRaffles = new Set(sortedIds.slice(0, 1000));
        //.toISOString()}] V4 Fast processing completed\n`);
    }
  }

  startCronJob(intervalMinutes = 3) {
    ////////////}

  // Manual trigger method
  async triggerOnce() {
    //{
  //if (args.includes('--once')) {
      // Manual single run
      //? 
        parseInt(args[args.indexOf('--interval') + 1]) || 3 : 3;
      
      //`);
      finalizer.startCronJob(interval);
    }
  } catch (error) {
    //console.error("💥 Finalizer startup failed:", error.message);
    //}
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  //process.on('SIGTERM', () => {
  //if (require.main === module) {
  main().catch(//console.error);
}

module.exports = { RaffleV4FastFinalizer }; 