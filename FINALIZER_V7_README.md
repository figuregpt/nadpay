# NadRaffle V7 Ultra Fast Finalizer

## Overview
The Ultra Fast Finalizer V7 is an automated bot that monitors and finalizes raffles on the NadRaffle V7 Multi-Token contract. It supports all V7 features including multi-token payment systems.

## Key Features
- 🚀 **Instant Sold Out Detection**: Finalizes raffles immediately when all tickets are sold
- ⏰ **Expired Raffle Processing**: Automatically handles expired raffles
- 💰 **Multi-Token Support**: Works with raffles using any ERC20 token for payments
- 📊 **Real-time Statistics**: Tracks performance and costs
- 🔄 **Auto-retry Logic**: Handles network issues gracefully
- 🎯 **Gas Optimization**: Efficient transaction management

## V7 Contract Details
- **Contract Address**: `0xBd32ce277D91b6beD459454C7964528f54A54f75`
- **Network**: Monad Testnet
- **Features**: Multi-token ticket payments (MON, USDC, CHOG, etc.)

## Configuration
```javascript
const CONFIG = {
  CONTRACT_ADDRESS: "0xBd32ce277D91b6beD459454C7964528f54A54f75",
  RPC_URL: "https://testnet-rpc.monad.xyz",
  CHECK_INTERVAL: 30000, // 30 seconds
  MAX_GAS_PRICE: ethers.parseUnits("100", "gwei"),
  GAS_LIMIT: 250000
};
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install ethers dotenv
   ```

2. **Configure Environment**
   Create `.env` file in `nadpay/` directory:
   ```
   PRIVATE_KEY=your_bot_wallet_private_key
   ```

3. **Fund Bot Wallet**
   - Send at least 0.1 MON to the bot wallet for gas fees
   - The bot will warn when balance is low

4. **Run the Finalizer**
   ```bash
   node finalizer-v7-ultra-fast.js
   ```

## How It Works

### Phase 1: Sold Out Detection
- Monitors `RaffleSoldOut` events
- Immediately calls `finalizeSoldOutRaffle()`
- Selects winner and distributes rewards

### Phase 2: Expired Raffle Processing
- Checks for expired raffles every 30 seconds
- Calls `finalizeExpiredRaffle()`
- Either selects winner or refunds creator

## Statistics Dashboard
The finalizer logs performance metrics every 100 cycles:
- Total checks performed
- Raffles finalized (sold out vs expired)
- Gas usage and costs
- Bot wallet balance
- Error tracking

## Security Features
- Rate limiting to prevent spam
- Gas price monitoring
- Automatic retry on failures
- Graceful shutdown handling
- Transaction nonce management

## Logs
- **INFO**: General operational messages
- **WARN**: Issues that need attention
- **ERROR**: Critical failures
- **DEBUG**: Detailed transaction info

## Cost Estimation
- Average finalization: ~0.01 MON
- Sold out finalization: ~250,000 gas
- Expired finalization: ~200,000 gas

## Monitoring
The bot provides real-time feedback:
```
🚀 INSTANT FINALIZATION: Raffle 123 (SOLD OUT)
💰 Payment token: 0x09c7EFE03b8fCfa20E9DDda051c4f9C5c93Ef826 (CHOG)
🏆 SUCCESS: Raffle 123 completed in 2345ms
⛽ Gas: 245,123 | Cost: 0.008234 MON
```

## Troubleshooting

### Common Issues
1. **"Invalid raffle ID"**: Raffle already finalized
2. **"Gas price too high"**: Wait for network congestion to clear
3. **"Insufficient balance"**: Add more MON to bot wallet

### Emergency Stop
Press `Ctrl+C` to gracefully shutdown the finalizer.

## Maintenance
- Check logs regularly for errors
- Monitor bot wallet balance
- Update gas limits if needed
- Backup logs periodically

## Support
For issues or questions about the V7 finalizer:
- Check contract status on explorer
- Review bot logs for errors
- Ensure sufficient MON balance 