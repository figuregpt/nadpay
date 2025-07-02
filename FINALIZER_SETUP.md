# V7 Finalizer Setup Instructions

## 1. Environment File

The finalizer uses the `.env` file in the root directory of the project.

## 2. Add Your Private Key

Make sure your `.env` file contains the `PRIVATE_KEY` variable with your bot wallet private key.

**IMPORTANT:**
- Do NOT include the `0x` prefix
- This wallet needs at least 0.1 MON for gas fees
- Keep this key secure and never commit it to git

## 3. Start the V7 Finalizer

### Run in foreground (see logs):
```bash
node finalizer-v7-ultra-fast.js
```

### Run in background:
```bash
nohup node finalizer-v7-ultra-fast.js > finalizer.log 2>&1 &
```

### Using PM2 (recommended for production):
```bash
npm install -g pm2
pm2 start finalizer-v7-ultra-fast.js --name "v7-finalizer"
pm2 save
pm2 startup
```

## 4. Monitor the Finalizer

### View logs (if running with nohup):
```bash
tail -f finalizer.log
```

### View PM2 logs:
```bash
pm2 logs v7-finalizer
```

### Check process status:
```bash
# For nohup
ps aux | grep finalizer-v7

# For PM2
pm2 status
```

## 5. Stop the Finalizer

### If running with nohup:
```bash
# Find process ID
ps aux | grep finalizer-v7
# Kill process
kill <PID>
```

### If running with PM2:
```bash
pm2 stop v7-finalizer
```

## V7 Finalizer Features

- **Contract Address**: `0xBd32ce277D91b6beD459454C7964528f54A54f75`
- **Network**: Monad Testnet
- **Check Interval**: 30 seconds
- **Features**:
  - Instant sold-out raffle finalization
  - Automatic expired raffle processing
  - Multi-token payment support
  - Gas optimization
  - Auto-retry on failures
  - Performance statistics

## Expected Output

When running correctly, you should see:

```
🎯 NADRAFFLE V7 ULTRA FAST FINALIZER (Multi-Token)
═══════════════════════════════════════════════════════════════════
[2024-01-26T10:30:45.123Z] [INFO] 🚀 Ultra Fast Finalizer V7 (Multi-Token) Initialized
[2024-01-26T10:30:45.124Z] [INFO] 📍 Contract: 0xBd32ce277D91b6beD459454C7964528f54A54f75
[2024-01-26T10:30:45.125Z] [INFO] 👤 Bot Address: 0x...
[2024-01-26T10:30:45.126Z] [INFO] 🌐 Network: Monad Testnet
[2024-01-26T10:30:45.500Z] [INFO] 💰 Bot balance: 0.150000 MON
[2024-01-26T10:30:45.600Z] [INFO] 📊 Contract connected: 1 total raffles
[2024-01-26T10:30:45.601Z] [INFO] 🚀 Ultra Fast Finalizer V7 started with 30s intervals
``` 