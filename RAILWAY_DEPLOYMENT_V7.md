# Railway Deployment Guide for NadRaffle V7

## Overview
This guide covers the deployment of the NadRaffle platform with V7 finalizer support to Railway.

## Architecture
The deployment runs two processes using PM2:
1. **Next.js Web Application** - The main web interface
2. **V7 Raffle Finalizer** - Automated raffle completion service

## Environment Variables Required

Add these environment variables in your Railway project settings:

### Core Application
```
NODE_ENV=production
NEXT_PUBLIC_ENABLE_TESTNETS=true
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<your_project_id>
NEXT_PUBLIC_ALCHEMY_API_KEY=<your_alchemy_key>
```

### Database
```
DATABASE_URL=<your_database_url>
```

### Authentication
```
JWT_SECRET=<your_jwt_secret>
NEXTAUTH_URL=https://<your-railway-domain>
NEXTAUTH_SECRET=<your_nextauth_secret>
```

### Twitter Integration
```
TWITTER_CLIENT_ID=<your_twitter_client_id>
TWITTER_CLIENT_SECRET=<your_twitter_client_secret>
```

### Blockchain/Finalizer
```
PRIVATE_KEY=<bot_wallet_private_key>
RPC_URL=https://testnet-rpc.monad.xyz
```

## Deployment Process

1. **Ensure all code is committed:**
   ```bash
   git add .
   git commit -m "Deploy V7 with finalizer to Railway"
   git push origin main
   ```

2. **Railway will automatically:**
   - Build the Docker image using the Dockerfile
   - Install dependencies
   - Build the Next.js application
   - Start both web app and finalizer using PM2

## Monitoring

### Check Application Logs
- Web App: Look for process name `nadpay-web`
- Finalizer: Look for process name `raffle-v7-finalizer`

### Finalizer Configuration
- **Check Interval**: 60 seconds (safe for production)
- **Max Restarts**: 10
- **Memory Limit**: 500MB
- **Logs**: Stored in `/app/logs/`

## Cost Control Measures

1. **60-second interval**: Prevents excessive RPC calls
2. **Memory limit**: Auto-restarts if memory leak occurs
3. **Max restarts**: Prevents infinite restart loops
4. **Restart delay**: 30 seconds between restarts

## Health Checks

The deployment includes:
- Health check endpoint: `/api/health`
- Health check timeout: 60 seconds
- Automatic restart on failure

## Troubleshooting

### If finalizer is not running:
1. Check Railway logs for PM2 output
2. Verify PRIVATE_KEY environment variable is set
3. Ensure bot wallet has sufficient MON balance

### If web app is not accessible:
1. Check PORT environment variable (Railway sets this automatically)
2. Verify all Next.js environment variables are set
3. Check build logs for any errors

## Security Notes

- Never commit private keys to git
- Use Railway's environment variables for all secrets
- The bot wallet should only contain funds needed for gas
- Monitor bot wallet balance regularly

## Scaling

To adjust finalizer frequency:
- Edit `ecosystem.config.js`
- Change `--interval 60` to desired seconds
- Redeploy to Railway

## Support

For issues:
1. Check Railway deployment logs
2. Monitor PM2 process status
3. Verify all environment variables are set correctly 