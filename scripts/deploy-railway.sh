#!/bin/bash

# Railway Deployment Script for NadPay V4 Fast System
echo "🚂 Deploying NadPay V4 Fast to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Create or link to Railway project
echo "🔗 Setting up Railway project..."
if [ ! -f "railway.toml" ]; then
    echo "❌ railway.toml not found. Please run this script from the project root."
    exit 1
fi

# Deploy the services
echo "🚀 Deploying services to Railway..."

echo "📦 Deploying main web application..."
railway up --service nadpay-web

echo "⚡ Deploying V4 Fast raffle finalizer..."
railway up --service raffle-v4-fast-finalizer

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Railway dashboard:"
echo "   - PRIVATE_KEY (for finalizer wallet)"
echo "   - NEXT_PUBLIC_APP_URL (your Railway domain)"
echo "   - NODE_ENV=production"
echo ""
echo "2. Check service logs:"
echo "   railway logs --service nadpay-web"
echo "   railway logs --service raffle-v4-fast-finalizer"
echo ""
echo "3. Monitor V4 Fast finalizer status:"
echo "   - 2-minute reveal windows"
echo "   - Emergency winner selection"
echo "   - Active raffle processing"
echo ""
echo "🔥 V4 Fast Features:"
echo "   ⚡ 2-minute reveal window (optimized for Monad)"
echo "   🛡️  Ultra-secure randomness"
echo "   🚀 Active raffle filtering"
echo "   📊 Performance optimized" 