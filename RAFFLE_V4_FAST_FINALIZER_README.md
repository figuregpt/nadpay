# NadRaffle V4 Fast Finalizer

Otomatik raffle finalization sistemi V4 Fast kontratlar için.

## Özellikler

### ⚡ V4 Fast Özellikleri
- **2 dakikalık reveal window** (1 saat yerine)
- **Monad'ın 0.5s block time'ına optimize edilmiş**
- **Ultra-secure randomness** ile güvenli kazanan seçimi
- **Otomatik sold-out detection**

### 🤖 Finalizer İşlevleri
1. **Sold Out Detection**: Tüm biletler satıldığında otomatik tespit
2. **Expired Raffle Detection**: Süre dolan raffle'ları tespit
3. **Randomness Commitment**: Otomatik randomness commitment başlatma
4. **Winner Reveal**: 2 dakika sonra kazanan açıklama
5. **Emergency Selection**: Gerektiğinde acil durum kazanan seçimi

## Kurulum

### 1. Environment Kurulumu
```bash
# .env dosyasında
PRIVATE_KEY=your_private_key_here
```

### 2. Bağımlılıklar
```bash
npm install
```

## Kullanım

### Otomatik Cron Job (Önerilen)
```bash
# Her 1 dakikada bir çalışır
node scripts/raffle-v4-fast-finalizer.js

# Özel interval ile
node scripts/raffle-v4-fast-finalizer.js --interval 2
```

### Manuel Tetikleme
```bash
# Tek seferlik çalıştırma
node scripts/raffle-v4-fast-finalizer.js --once
```

## Çalışma Mantığı

### 1. Sold Out Durumu
```
Raffle Sold Out → Finalizer Detect → Randomness Commit → 2 Dakika Wait → Winner Reveal
```

### 2. Expired Durumu  
```
Raffle Expired → Finalizer Detect → Randomness Commit → 2 Dakika Wait → Winner Reveal
```

### 3. Timeline
- **T+0**: Sold out/expired detection
- **T+0**: Randomness commitment (otomatik)
- **T+2min**: Winner reveal ready
- **T+2min**: Finalizer reveals winner

## Kontrat Adresi

**V4 Fast Contract**: `0xb7a8e84F06124D2E444605137E781cDd7ac480fa`

## Monitoring

### Loglar
```bash
🚀 [2025-01-XX] Starting V4 Fast raffle processing...
💰 Wallet Balance: 1.234 MON
🔍 Checking 5 total raffles for commitment needs...
🎲 Found 1 raffles needing commitment:
  - Raffle #2: "Test Raffle" (SOLD OUT, 10/10 tickets)
🎯 Found 1 raffles ready for reveal:
  - Raffle #1: "Previous Raffle" (5 tickets sold)
🎉 Winner selected: 0x1234...5678
✅ No raffles ready for winner reveal
⏰ [2025-01-XX] V4 Fast processing completed
```

### Durum Kontrolleri
- ✅ **Wallet balance check** (minimum 0.01 MON)
- ✅ **Gas estimation** her transaction için
- ✅ **Error handling** ve retry logic
- ✅ **Graceful shutdown** SIGINT/SIGTERM ile

## Production Deployment

### PM2 ile
```bash
# Install PM2
npm install -g pm2

# Start finalizer
pm2 start scripts/raffle-v4-fast-finalizer.js --name "v4-fast-finalizer"

# Monitor
pm2 logs v4-fast-finalizer
pm2 status
```

### Docker ile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "scripts/raffle-v4-fast-finalizer.js"]
```

## Güvenlik

### Private Key
- ✅ Environment variable kullanın
- ✅ `.env` dosyasını git'e eklemeyin
- ✅ Production'da secret management kullanın

### Wallet Balance
- ✅ Minimum 0.01 MON tutun
- ✅ Low balance warning'leri takip edin
- ✅ Auto-refill sistemi kurun

### Gas Management
- ✅ %20 gas buffer otomatik eklenir
- ✅ Gas estimation her transaction için
- ✅ Transaction batching (max 5 per cycle)

## Troubleshooting

### Common Issues

#### 1. "Insufficient funds"
```bash
# Solution: Add more MON to finalizer wallet
# Check balance:
node -e "//console.log(await ethers.provider.getBalance('YOUR_WALLET_ADDRESS'))"
```

#### 2. "Nonce expired"
```bash
# Solution: Wait for next cycle, auto-retry
# Or restart finalizer
```

#### 3. "No raffles need processing"
```bash
# Normal - no action needed
# Finalizer will continue monitoring
```

## API Integration

### Manual Trigger via HTTP
```javascript
const { RaffleV4FastFinalizer } = require('./scripts/raffle-v4-fast-finalizer');

const finalizer = new RaffleV4FastFinalizer();
await finalizer.triggerOnce();
```

## Performance

### Metrics
- **Check Interval**: 1 minute (configurable)
- **Processing Time**: ~10-30 seconds per cycle
- **Gas Usage**: ~50-100k gas per raffle
- **Network**: Monad Testnet (0.5s blocks)

### Optimization
- ✅ Parallel raffle checking
- ✅ Smart batching (max 5 per cycle)
- ✅ Gas estimation caching
- ✅ Error recovery

## Support

### Logs Location
```bash
# PM2 logs
~/.pm2/logs/

# Direct logs
stdout/stderr during execution
```

### Contact
- **GitHub Issues**: Create issue with logs
- **Discord**: #dev-support
- **Email**: dev@nadpay.com

---

**⚡ V4 Fast Finalizer - Optimized for Monad's Lightning Speed** 