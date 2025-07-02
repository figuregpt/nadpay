const { ethers } = require("ethers");
require("dotenv").config({ path: './nadpay/.env' });

// ═══════════════════════════════════════════════════════════════════
//                         CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  // Contract details (UPDATE AFTER DEPLOYMENT)
  CONTRACT_ADDRESS: "0x51bA8C7AFA1bf51cCba0Abf0Da56f4e5c07D351A", // NadRaffle V6 Monad Testnet
  
  // Network configuration
  RPC_URL: "https://testnet-rpc.monad.xyz",
  NETWORK_NAME: "Monad Testnet",
  CHAIN_ID: 41,
  
  // Finalizer settings
  CHECK_INTERVAL: 30000, // 30 seconds (fast for sold out detection)
  MAX_GAS_PRICE: ethers.parseUnits("100", "gwei"), // Max gas price
  GAS_LIMIT: 250000, // Gas limit for finalization
  
  // Monitoring settings
  LOG_LEVEL: "INFO", // DEBUG, INFO, WARN, ERROR
  SAVE_LOGS: true,
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
};

// Contract ABI (only functions we need)
const RAFFLE_ABI = [
  "function getSoldOutRaffleIds() external view returns (uint256[])",
  "function getExpiredRaffleIds() external view returns (uint256[])",
  "function finalizeSoldOutRaffle(uint256 raffleId) external",
  "function finalizeExpiredRaffle(uint256 raffleId) external",
  "function getRaffleDetails(uint256 raffleId) external view returns (tuple(address creator, uint256 ticketPrice, uint256 maxTickets, uint256 soldTickets, uint256 startTime, uint256 endTime, uint256 rewardAmount, uint8 rewardType, address rewardTokenAddress, uint256 rewardTokenId, uint8 state, address winner))",
  "function totalRaffles() external view returns (uint256)",
  "event RaffleCompleted(uint256 indexed raffleId, address indexed winner, uint256 rewardAmount)",
  "event RaffleCancelled(uint256 indexed raffleId, address indexed creator, uint256 refundAmount)",
  "event RaffleSoldOut(uint256 indexed raffleId)"
];

// ═══════════════════════════════════════════════════════════════════
//                         ULTRA FAST FINALIZER
// ═══════════════════════════════════════════════════════════════════

class UltraFastFinalizer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, RAFFLE_ABI, this.wallet);
    
    this.stats = {
      totalChecks: 0,
      soldOutFinalized: 0,
      expiredFinalized: 0,
      errors: 0,
      totalGasUsed: 0n,
      totalCostMON: 0,
      startTime: Date.now()
    };
    
    this.isRunning = false;
    this.logs = [];
    
    this.log("🚀 Ultra Fast Finalizer V6 Initialized", "INFO");
    this.log(`📍 Contract: ${CONFIG.CONTRACT_ADDRESS}`, "INFO");
    this.log(`👤 Bot Address: ${this.wallet.address}`, "INFO");
    this.log(`🌐 Network: ${CONFIG.NETWORK_NAME}`, "INFO");
  }
  
  // ═══════════════════════════════════════════════════════════════════
  //                         LOGGING SYSTEM
  // ═══════════════════════════════════════════════════════════════════
  
  log(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    // Console output with colors
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      RESET: '\x1b[0m'   // Reset
    };
    
    console.log(`${colors[level] || colors.INFO}${logEntry}${colors.RESET}`);
    
    // Store logs
    if (CONFIG.SAVE_LOGS) {
      this.logs.push({ timestamp, level, message });
      
      // Keep only last 1000 logs
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(-1000);
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  //                         MAIN FINALIZER LOGIC
  // ═══════════════════════════════════════════════════════════════════
  
  async runFinalizationCycle() {
    this.stats.totalChecks++;
    
    try {
      this.log("🔍 Starting finalization cycle...", "DEBUG");
      
      // PRIORITY 1: Check sold out raffles (URGENT - instant finalization needed)
      const soldOutIds = await this.getSoldOutRaffles();
      
      if (soldOutIds.length > 0) {
        this.log(`🎯 URGENT: ${soldOutIds.length} sold out raffles found!`, "INFO");
        await this.processSoldOutRaffles(soldOutIds);
      }
      
      // PRIORITY 2: Check expired raffles (normal timing)
      const expiredIds = await this.getExpiredRaffles();
      
      if (expiredIds.length > 0) {
        this.log(`⏰ ${expiredIds.length} expired raffles found`, "INFO");
        await this.processExpiredRaffles(expiredIds);
      }
      
      if (soldOutIds.length === 0 && expiredIds.length === 0) {
        this.log("✅ No raffles ready for finalization", "DEBUG");
      }
      
      // Update stats
      await this.updateStatistics();
      
    } catch (error) {
      this.stats.errors++;
      this.log(`❌ Finalization cycle error: ${error.message}`, "ERROR");
      
      if (error.message.includes("network")) {
        this.log("🌐 Network issue detected, will retry next cycle", "WARN");
      }
    }
  }
  
  async getSoldOutRaffles() {
    try {
      const soldOutIds = await this.contract.getSoldOutRaffleIds();
      this.log(`📊 Found ${soldOutIds.length} sold out raffles`, "DEBUG");
      return soldOutIds;
    } catch (error) {
      this.log(`❌ Error getting sold out raffles: ${error.message}`, "ERROR");
      return [];
    }
  }
  
  async getExpiredRaffles() {
    try {
      const expiredIds = await this.contract.getExpiredRaffleIds();
      this.log(`📊 Found ${expiredIds.length} expired raffles`, "DEBUG");
      return expiredIds;
    } catch (error) {
      this.log(`❌ Error getting expired raffles: ${error.message}`, "ERROR");
      return [];
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  //                     SOLD OUT RAFFLE PROCESSING
  // ═══════════════════════════════════════════════════════════════════
  
  async processSoldOutRaffles(raffleIds) {
    for (const raffleId of raffleIds) {
      await this.finalizeSoldOutRaffle(raffleId);
      
      // Small delay between transactions to avoid nonce conflicts
      await this.delay(1000);
    }
  }
  
  async finalizeSoldOutRaffle(raffleId) {
    const startTime = Date.now();
    
    try {
      this.log(`🚀 INSTANT FINALIZATION: Raffle ${raffleId} (SOLD OUT)`, "INFO");
      
      // Get raffle details for logging
      const raffleDetails = await this.contract.getRaffleDetails(raffleId);
      this.log(`📋 Raffle ${raffleId}: ${raffleDetails.soldTickets}/${raffleDetails.maxTickets} tickets sold`, "DEBUG");
      
      // Check gas price
      const gasPrice = await this.provider.getFeeData();
      if (gasPrice.gasPrice > CONFIG.MAX_GAS_PRICE) {
        this.log(`⚠️  High gas price detected: ${ethers.formatUnits(gasPrice.gasPrice, "gwei")} gwei`, "WARN");
      }
      
      // Execute finalization with retry mechanism
      const tx = await this.executeWithRetry(
        () => this.contract.finalizeSoldOutRaffle(raffleId, {
          gasLimit: CONFIG.GAS_LIMIT,
          gasPrice: gasPrice.gasPrice
        }),
        `finalize sold out raffle ${raffleId}`
      );
      
      if (!tx) return; // Failed after retries
      
      this.log(`⏳ Transaction sent: ${tx.hash}`, "DEBUG");
      
      // Wait for confirmation
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      const gasCost = gasUsed * receipt.gasPrice;
      const costMON = parseFloat(ethers.formatEther(gasCost));
      
      // Update statistics
      this.stats.soldOutFinalized++;
      this.stats.totalGasUsed += gasUsed;
      this.stats.totalCostMON += costMON;
      
      // Check if successful
      const completedEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === "RaffleCompleted";
        } catch {
          return false;
        }
      });
      
      if (completedEvent) {
        const processingTime = Date.now() - startTime;
        this.log(`🏆 SUCCESS: Raffle ${raffleId} completed in ${processingTime}ms`, "INFO");
        this.log(`⛽ Gas: ${gasUsed.toLocaleString()} | Cost: ${costMON.toFixed(6)} MON`, "INFO");
        this.log(`🎉 Winner selected instantly for sold out raffle!`, "INFO");
      } else {
        this.log(`⚠️  Raffle ${raffleId} finalized but no completion event found`, "WARN");
      }
      
    } catch (error) {
      this.log(`❌ Failed to finalize sold out raffle ${raffleId}: ${error.message}`, "ERROR");
      
      if (error.message.includes("already finalized")) {
        this.log(`ℹ️  Raffle ${raffleId} was already finalized by another transaction`, "INFO");
      } else if (error.message.includes("gas")) {
        this.log(`⛽ Gas issue for raffle ${raffleId}, will retry next cycle`, "WARN");
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  //                     EXPIRED RAFFLE PROCESSING
  // ═══════════════════════════════════════════════════════════════════
  
  async processExpiredRaffles(raffleIds) {
    for (const raffleId of raffleIds) {
      await this.finalizeExpiredRaffle(raffleId);
      
      // Small delay between transactions
      await this.delay(1000);
    }
  }
  
  async finalizeExpiredRaffle(raffleId) {
    try {
      this.log(`⏰ FINALIZING EXPIRED: Raffle ${raffleId}`, "INFO");
      
      // Get raffle details
      const raffleDetails = await this.contract.getRaffleDetails(raffleId);
      const hasTickets = raffleDetails.soldTickets > 0;
      
      this.log(`📋 Raffle ${raffleId}: ${raffleDetails.soldTickets} tickets sold, ${hasTickets ? 'has winner' : 'will refund'}`, "DEBUG");
      
      // Check gas price
      const gasPrice = await this.provider.getFeeData();
      
      // Execute finalization
      const tx = await this.executeWithRetry(
        () => this.contract.finalizeExpiredRaffle(raffleId, {
          gasLimit: CONFIG.GAS_LIMIT,
          gasPrice: gasPrice.gasPrice
        }),
        `finalize expired raffle ${raffleId}`
      );
      
      if (!tx) return;
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      const gasCost = gasUsed * receipt.gasPrice;
      const costMON = parseFloat(ethers.formatEther(gasCost));
      
      // Update statistics
      this.stats.expiredFinalized++;
      this.stats.totalGasUsed += gasUsed;
      this.stats.totalCostMON += costMON;
      
      // Check result
      const events = receipt.logs.map(log => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null;
        }
      }).filter(e => e);
      
      const completedEvent = events.find(e => e.name === "RaffleCompleted");
      const cancelledEvent = events.find(e => e.name === "RaffleCancelled");
      
      if (completedEvent) {
        this.log(`🏆 COMPLETED: Raffle ${raffleId} - Winner selected!`, "INFO");
      } else if (cancelledEvent) {
        this.log(`❌ CANCELLED: Raffle ${raffleId} - No tickets sold, refunded`, "INFO");
      }
      
      this.log(`⛽ Gas: ${gasUsed.toLocaleString()} | Cost: ${costMON.toFixed(6)} MON`, "INFO");
      
    } catch (error) {
      this.log(`❌ Failed to finalize expired raffle ${raffleId}: ${error.message}`, "ERROR");
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  //                         UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════
  
  async executeWithRetry(operation, description) {
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        this.log(`❌ Attempt ${attempt}/${CONFIG.MAX_RETRIES} failed for ${description}: ${error.message}`, "WARN");
        
        if (attempt < CONFIG.MAX_RETRIES) {
          this.log(`⏳ Retrying in ${CONFIG.RETRY_DELAY / 1000} seconds...`, "INFO");
          await this.delay(CONFIG.RETRY_DELAY);
        } else {
          this.log(`💀 All retry attempts failed for ${description}`, "ERROR");
          return null;
        }
      }
    }
  }
  
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async updateStatistics() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceMON = parseFloat(ethers.formatEther(balance));
      
      const uptime = Date.now() - this.stats.startTime;
      const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);
      
      // Log stats every 100 cycles
      if (this.stats.totalChecks % 100 === 0) {
        this.log("\n📊 FINALIZER STATISTICS:", "INFO");
        this.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "INFO");
        this.log(`⏰ Uptime: ${uptimeHours} hours`, "INFO");
        this.log(`🔍 Total Checks: ${this.stats.totalChecks}`, "INFO");
        this.log(`🎯 Sold Out Finalized: ${this.stats.soldOutFinalized}`, "INFO");
        this.log(`⏰ Expired Finalized: ${this.stats.expiredFinalized}`, "INFO");
        this.log(`❌ Errors: ${this.stats.errors}`, "INFO");
        this.log(`⛽ Total Gas Used: ${this.stats.totalGasUsed.toLocaleString()}`, "INFO");
        this.log(`💰 Total Cost: ${this.stats.totalCostMON.toFixed(6)} MON`, "INFO");
        this.log(`💳 Bot Balance: ${balanceMON.toFixed(6)} MON`, "INFO");
        
        if (balanceMON < 0.1) {
          this.log("⚠️  LOW BALANCE WARNING! Please add more MON to bot wallet", "WARN");
        }
      }
      
    } catch (error) {
      this.log(`❌ Error updating statistics: ${error.message}`, "ERROR");
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  //                         MAIN EXECUTION
  // ═══════════════════════════════════════════════════════════════════
  
  async start() {
    // Validation checks
    if (CONFIG.CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      this.log("❌ FATAL: Please update CONTRACT_ADDRESS in the configuration!", "ERROR");
      process.exit(1);
    }
    
    if (!process.env.PRIVATE_KEY) {
      this.log("❌ FATAL: PRIVATE_KEY not found in environment variables!", "ERROR");
      process.exit(1);
    }
    
    // Test connection
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceMON = parseFloat(ethers.formatEther(balance));
      
      this.log(`💰 Bot balance: ${balanceMON.toFixed(6)} MON`, "INFO");
      
      if (balanceMON < 0.01) {
        this.log("❌ FATAL: Insufficient balance! Need at least 0.01 MON for gas", "ERROR");
        process.exit(1);
      }
      
      // Test contract connection
      const totalRaffles = await this.contract.totalRaffles();
      this.log(`📊 Contract connected: ${totalRaffles} total raffles`, "INFO");
      
    } catch (error) {
      this.log(`❌ FATAL: Connection test failed: ${error.message}`, "ERROR");
      process.exit(1);
    }
    
    this.isRunning = true;
    this.log(`🚀 Ultra Fast Finalizer started with ${CONFIG.CHECK_INTERVAL / 1000}s intervals`, "INFO");
    this.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "INFO");
    
    // Main execution loop
    setInterval(async () => {
      if (this.isRunning) {
        await this.runFinalizationCycle();
      }
    }, CONFIG.CHECK_INTERVAL);
    
    // Graceful shutdown handlers
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
  }
  
  shutdown(signal) {
    this.log(`🛑 Received ${signal}, shutting down gracefully...`, "INFO");
    this.isRunning = false;
    
    // Final statistics
    const uptime = Date.now() - this.stats.startTime;
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);
    
    this.log("\n📊 FINAL STATISTICS:", "INFO");
    this.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "INFO");
    this.log(`⏰ Total Uptime: ${uptimeHours} hours`, "INFO");
    this.log(`🔍 Total Checks: ${this.stats.totalChecks}`, "INFO");
    this.log(`🎯 Sold Out Finalized: ${this.stats.soldOutFinalized}`, "INFO");
    this.log(`⏰ Expired Finalized: ${this.stats.expiredFinalized}`, "INFO");
    this.log(`💰 Total Cost: ${this.stats.totalCostMON.toFixed(6)} MON`, "INFO");
    this.log("🔒 Finalizer stopped safely", "INFO");
    
    process.exit(0);
  }
}

// ═══════════════════════════════════════════════════════════════════
//                              STARTUP
// ═══════════════════════════════════════════════════════════════════

console.log("🎯 NADRAFFLE V6 ULTRA FAST FINALIZER");
console.log("═══════════════════════════════════════════════════════════════════");

const finalizer = new UltraFastFinalizer();
finalizer.start().catch(error => {
  console.error("💥 Finalizer startup failed:", error);
  process.exit(1);
}); 