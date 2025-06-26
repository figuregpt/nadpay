# Railway Deployment Guide for NadPay V4 Fast System

This guide explains how to deploy NadPay with V4 Fast automated raffle finalizer to Railway.

## 🚀 Quick Deployment

### Prerequisites
1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

### Deploy All Services
```bash
npm run deploy:railway
```

## 📋 Manual Deployment Steps

### 1. Create Railway Project
```bash
railway init
```

### 2. Deploy Services Individually

#### Web Application
```bash
railway up --service nadpay-web
```

#### V4 Fast Raffle Finalizer
```bash
railway up --service raffle-v4-fast-finalizer
```

## ⚙️ Environment Variables

Set these in Railway dashboard for each service:

### Required for V4 Fast Finalizer
- `PRIVATE_KEY`: Wallet private key (without 0x prefix) for finalizer transactions
- `NODE_ENV`: Set to `production`

### Optional
- `NEXT_PUBLIC_APP_URL`: Your Railway domain URL

## 📊 Monitoring

### Check Service Status
```bash
railway status
```

### View Logs
```bash
# V4 Fast raffle finalizer logs
railway logs --service raffle-v4-fast-finalizer

# Web application logs
railway logs --service nadpay-web
```

### Real-time Log Monitoring
```bash
railway logs --service raffle-v4-fast-finalizer --follow
```

## 🔧 Service Configuration

### V4 Fast Raffle Finalizer
- **Interval**: 1 minute (optimized for 2-minute reveal windows)
- **Memory**: 500MB max
- **Auto-restart**: Enabled with 5s delay
- **Health check**: 300s timeout
- **Features**:
  - ⚡ 2-minute reveal window
  - 🛡️ Ultra-secure randomness
  - 🚀 Active raffle filtering
  - 📊 Performance optimized (max 50 raffles/cycle)

## 🚨 Troubleshooting

### Common Issues

1. **Finalizer not running**
   ```bash
   railway logs --service raffle-v4-fast-finalizer
   ```

2. **Private key issues**
   - Ensure `PRIVATE_KEY` is set without `0x` prefix
   - Check wallet has sufficient MON for gas fees

3. **Service restart loops**
   - Check logs for error details
   - Verify environment variables are correct

### Restart Services
```bash
railway redeploy --service raffle-v4-fast-finalizer
```

## 📈 Performance Monitoring

### Key Metrics to Monitor
- V4 Fast finalizer execution (1-minute intervals)
- 2-minute reveal window handling
- Emergency winner selection
- Gas costs per transaction
- Active raffle processing efficiency

### Log Patterns to Watch
- `✅ Successfully committed randomness` - Randomness commitment
- `🏆 Winner selected for raffle` - Winner selection
- `🚨 Emergency selection triggered` - Emergency cases
- `⏳ Reveal window active` - 2-minute countdown
- `💰 Wallet balance:` - Gas monitoring
- `🔍 Checking X active raffles` - Performance metrics

## 🔄 Updates and Maintenance

### Deploy Updates
```bash
git push origin main
npm run deploy:railway
```

### Update Single Service
```bash
railway up --service raffle-v4-fast-finalizer
```

### Environment Variable Updates
1. Go to Railway dashboard
2. Select service
3. Go to Variables tab
4. Update values
5. Service will auto-restart

## 💡 Best Practices

1. **Monitor wallet balance** - Ensure finalizer wallet has sufficient MON
2. **Check logs regularly** - Monitor for V4 Fast specific patterns
3. **Set up alerts** - Use Railway's notification features
4. **Backup configuration** - Keep environment variables documented
5. **Test V4 Fast features** - Verify 2-minute reveal windows work

## 🔥 V4 Fast Features

### Ultra-Secure Randomness
- Commit-reveal scheme with 2-minute window
- Emergency selection for failed reveals
- Optimized for Monad's 0.5s block time

### Performance Optimizations
- Active raffle filtering (no need to check all raffles)
- Batch processing (max 50 raffles per cycle)
- Smart caching to avoid reprocessing

### Fast Winner Selection
- 2-minute reveal window vs 1-hour in other versions
- Automatic emergency selection after deadline
- Real-time countdown for users

## 📞 Support

If you encounter issues:
1. Check V4 Fast finalizer logs first
2. Verify environment variables
3. Ensure wallet has sufficient balance
4. Check Railway service status
5. Monitor 2-minute reveal windows

## 🔗 Useful Links

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- [V4 Fast Finalizer README](./RAFFLE_V4_FAST_FINALIZER_README.md) 