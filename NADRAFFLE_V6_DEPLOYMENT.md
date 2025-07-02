# 🎯 NADRAFFLE V6 - ULTRA SECURE RAFFLE SYSTEM

**Production-ready raffle contract with 2-phase finalization and ultra-fast finalizer bot.**

## 🏗️ DEPLOYMENT GUIDE

### Step 1: Pre-Deployment Setup

```bash
# 1. Make sure you have enough MON in your wallet (at least 1 MON)
# 2. Verify environment variables are set
cat nadpay/.env

# Should contain:
PRIVATE_KEY=your_private_key_here
```

### Step 2: Deploy Contract

```bash
# Deploy NadRaffle V6 to Monad Testnet
node deploy-nadraffle-v6.js
```

**Expected Output:**
```
🚀 DEPLOYING NADRAFFLE V6 - ULTRA SECURE SYSTEM
📍 Contract deployed at: 0x...
✅ All view functions working correctly
🎯 FINALIZER SETUP INSTRUCTIONS: ...
```

### Step 3: Setup Finalizer Bot

```bash
# 1. Update contract address in finalizer
nano finalizer-v6-ultra-fast.js

# 2. Change this line:
CONTRACT_ADDRESS: "0x0000000000000000000000000000000000000000", 
# TO:
CONTRACT_ADDRESS: "0xYourDeployedContractAddress",

# 3. Start the finalizer
node finalizer-v6-ultra-fast.js
```

## 🚀 SYSTEM OVERVIEW

### 🔐 Security Features

- **2-Phase Finalization**: Sold out raffles are marked SOLD_OUT first, then finalized in separate transaction
- **Reentrancy Protection**: All state-changing functions protected with OpenZeppelin's ReentrancyGuard
- **Rate Limiting**: 1-second cooldown between purchases per user
- **Safe Transfers**: Graceful handling of failed transfers with pending claims system
- **Gas Griefing Protection**: Limited gas for external calls

### ⚡ Performance Features

- **Instant Sold Out Detection**: Raffles marked as SOLD_OUT immediately when last ticket is purchased
- **Ultra-Fast Finalizer**: 30-second cycles for quick sold out processing
- **Minimal Gas Usage**: ~100k gas per finalization = 0.0052 MON cost
- **Optimized View Functions**: Efficient raffle filtering and querying

### 💰 Economics

```
Revenue per Raffle:
├─ Creation Fee: +0.1 MON
├─ Platform Fee: +2.5% of ticket sales
└─ Net Profit: +0.0948 MON per raffle (after finalization cost)

Break-even: Only 5.2% of raffles need finalization to be profitable
```

## 🎫 RAFFLE TYPES SUPPORTED

### 1. MON Token Raffles
```javascript
// Create raffle with MON as reward
await contract.createRaffle(
  ethers.parseEther("0.01"), // Ticket price: 0.01 MON
  100,                       // Max tickets: 100
  24 * 3600,                // Duration: 24 hours
  0,                        // RewardType.MON_TOKEN
  ethers.ZeroAddress,       // No token address for MON
  ethers.parseEther("5")    // Reward: 5 MON
);
```

### 2. ERC20 Token Raffles
```javascript
// Create raffle with ERC20 tokens as reward
await contract.createRaffle(
  ethers.parseEther("0.001"), // Ticket price: 0.001 MON
  50,                         // Max tickets: 50
  12 * 3600,                 // Duration: 12 hours
  1,                         // RewardType.ERC20_TOKEN
  "0xTokenContractAddress",  // ERC20 token address
  ethers.parseUnits("1000", 18) // Reward: 1000 tokens
);
```

### 3. NFT Raffles
```javascript
// Create raffle with NFT as reward
await contract.createRaffle(
  ethers.parseEther("0.05"), // Ticket price: 0.05 MON
  20,                        // Max tickets: 20
  48 * 3600,                // Duration: 48 hours
  2,                        // RewardType.NFT_TOKEN
  "0xNFTContractAddress",   // NFT contract address
  123                       // NFT token ID
);
```

## 🤖 FINALIZER BOT OPERATION

### Monitoring Dashboard

The finalizer provides comprehensive logging:

```
📊 FINALIZER STATISTICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Uptime: 24.5 hours
🔍 Total Checks: 2940
🎯 Sold Out Finalized: 45
⏰ Expired Finalized: 28
❌ Errors: 2
⛽ Total Gas Used: 7,300,000
💰 Total Cost: 0.38 MON
💳 Bot Balance: 9.62 MON
```

### Finalizer Logic

```
Every 30 seconds:
├─ Priority 1: Check sold out raffles (urgent)
│  └─ Process immediately for instant winner announcement
├─ Priority 2: Check expired raffles (normal)
│  ├─ If has tickets → Select winner & transfer reward
│  └─ If no tickets → Refund creator
└─ Update statistics and monitor balance
```

## 🔧 ADMIN FUNCTIONS

### Basic Configuration

```javascript
// Update fees
await contract.setCreationFee(ethers.parseEther("0.15")); // 0.15 MON
await contract.setPlatformFeePercentage(300); // 3%

// Update fee address
await contract.setFeeAddress("0xNewFeeAddress");

// Update durations
await contract.setMinRaffleDuration(1800); // 30 minutes
await contract.setMaxRaffleDuration(7 * 24 * 3600); // 7 days
```

### Emergency Controls

```javascript
// Pause contract
await contract.pauseContract();

// Emergency state change
await contract.setRaffleState(raffleId, 4); // Set to EMERGENCY

// Emergency withdraw (only when paused)
await contract.emergencyWithdraw();

// Transfer ownership
await contract.transferOwnership("0xNewOwner");
```

## 📊 MONITORING & MAINTENANCE

### Health Checks

```bash
# Check contract status
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const contract = new ethers.Contract('CONTRACT_ADDRESS', ABI, provider);
contract.totalRaffles().then(total => console.log('Total Raffles:', total));
"

# Check finalizer balance
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
provider.getBalance('FINALIZER_ADDRESS').then(bal => 
  console.log('Finalizer Balance:', ethers.formatEther(bal), 'MON')
);
"
```

### Log Analysis

```bash
# Monitor finalizer logs
tail -f finalizer.log | grep "SUCCESS\|ERROR\|WARNING"

# Check gas costs
grep "Cost:" finalizer.log | tail -20

# Monitor statistics
grep "STATISTICS:" finalizer.log | tail -5
```

## 🚨 TROUBLESHOOTING

### Common Issues

#### 1. Finalizer Not Working
```bash
# Check if contract address is set correctly
grep "CONTRACT_ADDRESS" finalizer-v6-ultra-fast.js

# Verify bot has sufficient balance
node check-balance.js

# Check for errors in logs
grep "ERROR" finalizer.log | tail -10
```

#### 2. High Gas Costs
```bash
# Check current gas price
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
provider.getFeeData().then(data => 
  console.log('Gas Price:', ethers.formatUnits(data.gasPrice, 'gwei'), 'gwei')
);
"

# Adjust MAX_GAS_PRICE in finalizer config if needed
```

#### 3. Failed Transactions
```bash
# Check recent failed transactions
grep "Failed" finalizer.log | tail -5

# Verify contract is not paused
node -e "
const contract = new ethers.Contract('CONTRACT_ADDRESS', ABI, provider);
contract.paused().then(paused => console.log('Contract Paused:', paused));
"
```

## 🎯 BEST PRACTICES

### For Raffle Creators

1. **Choose Appropriate Duration**: 
   - Short raffles (1-6 hours): High engagement
   - Medium raffles (24-48 hours): Good visibility
   - Long raffles (7+ days): Risk of being forgotten

2. **Optimal Ticket Pricing**:
   - Target 50-200 tickets for good probability spread
   - Price tickets at 0.001-0.1 MON range for accessibility

3. **Reward Selection**:
   - MON rewards: Simple and universally valued
   - ERC20 rewards: Community tokens for engagement
   - NFT rewards: High-value, unique collectibles

### For Platform Operators

1. **Monitor Finalizer Health**:
   - Keep bot balance above 1 MON
   - Check logs every 24 hours
   - Set up alerts for errors

2. **Fee Optimization**:
   - Creation fee covers finalization costs
   - Platform fee provides sustainable revenue
   - Adjust based on network gas costs

3. **User Support**:
   - Guide users on pending reward claims
   - Help with failed NFT transfers
   - Provide clear documentation

## 📈 SCALING CONSIDERATIONS

### Performance at Scale

| Raffles | Daily Finalizations | Daily Cost | Revenue (0.1 MON fee) |
|---------|-------------------|------------|---------------------|
| 100     | ~15               | 0.078 MON  | 10 MON             |
| 1,000   | ~150              | 0.78 MON   | 100 MON            |
| 10,000  | ~1,500            | 7.8 MON    | 1,000 MON          |

### Optimization Strategies

1. **Batch Processing**: Group multiple finalizations in single transaction
2. **Gas Price Management**: Implement dynamic gas pricing
3. **Load Balancing**: Run multiple finalizer instances
4. **Caching**: Cache frequently accessed raffle data

## 🔒 SECURITY AUDIT CHECKLIST

- [x] Reentrancy protection on all state-changing functions
- [x] Integer overflow protection (Solidity ^0.8.19)
- [x] Access control on admin functions
- [x] Safe external calls with gas limits
- [x] Proper event emission for all state changes
- [x] Fallback mechanisms for failed transfers
- [x] Rate limiting on user actions
- [x] Validation of all user inputs
- [x] Emergency pause functionality
- [x] Ownership transfer capability

## 📞 SUPPORT

### Emergency Contacts

- **Contract Owner**: Check `contract.owner()`
- **Fee Address**: Check `contract.feeAddress()`
- **Finalizer Bot**: Monitor via logs

### Useful Commands

```bash
# Quick contract info
node scripts/contract-info.js

# Emergency stop finalizer
pkill -f "finalizer-v6-ultra-fast.js"

# Check pending rewards
node scripts/check-pending-rewards.js

# Manual finalization
node scripts/manual-finalize.js RAFFLE_ID
```

---

## 🎉 DEPLOYMENT COMPLETE!

**NadRaffle V6 is now ready for production use with:**
- ✅ Ultra-secure 2-phase finalization
- ✅ Profitable economics (0.0948 MON per raffle)
- ✅ Lightning-fast sold out processing
- ✅ Comprehensive monitoring and logging
- ✅ Full admin control and emergency features

**Go ahead and deploy the future of decentralized raffles!** 🚀 