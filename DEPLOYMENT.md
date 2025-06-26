# NadPay Contract Deployment Guide

## Prerequisites

1. **Monad Testnet MON Tokens**: You need MON tokens for deployment
   - Get testnet tokens from Monad faucet
   - Ensure you have enough for gas fees

2. **Private Key**: Export your wallet private key
   - ⚠️ **NEVER** commit private keys to git
   - Use a dedicated deployment wallet

## Deployment Steps

### 1. Set Environment Variables

Create a `.env.local` file in the project root:

```bash
# Deployment Configuration
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# MongoDB (optional - for database fallback)
MONGODB_URI=your_mongodb_connection_string

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Deploy Contract

```bash
# Compile contract
npm run compile

# Deploy to Monad Testnet
npm run deploy:testnet
```

### 3. Update Contract Address

After successful deployment:

1. Copy the deployed contract address from the terminal output
2. Update `src/lib/contract.ts`:
   ```typescript
   "address": "0xYourDeployedContractAddress",
   ```

### 4. Verify Deployment

The deployment script will:
- Deploy the NadPay contract
- Save deployment info to `deployment-monadTestnet.json`
- Attempt to verify the contract on Monad Explorer

## Contract Features

- **Payment Link Creation**: Users can create payment links with custom parameters
- **Decentralized Purchases**: All transactions are on-chain
- **Platform Fee**: 1% fee (configurable by owner, max 5%)
- **Security**: ReentrancyGuard and access controls
- **Events**: All actions emit events for frontend integration

## Network Configuration

- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Explorer**: https://testnet.monadexplorer.com

## Post-Deployment

1. Test contract functions:
   - Create a payment link
   - Make a test purchase
   - Verify events are emitted

2. Update frontend:
   - Ensure contract address is correct
   - Test all contract interactions
   - Verify error handling

## Troubleshooting

### Common Issues

1. **"factory runner does not support sending transactions"**
   - Solution: Set PRIVATE_KEY in environment variables

2. **"insufficient funds for gas"**
   - Solution: Get more MON tokens from faucet

3. **"nonce too low"**
   - Solution: Reset account nonce in wallet

### Verification Issues

If contract verification fails:
1. Check if the contract source matches exactly
2. Ensure Solidity version is correct (0.8.20)
3. Constructor arguments must match deployment

## Security Considerations

- Use a dedicated deployment wallet
- Never commit private keys
- Test thoroughly on testnet before mainnet
- Consider using a multisig for contract ownership

## Contract Addresses

### NadPay (Payment Links)
- **Monad Testnet**: `0x17c31F99b27c10fbFF0aA241202DF687377DC24A`

### NadRaffle (Raffle System) 
- **Monad Testnet**: `0x3F5701E0d8c7e98106e63B5E45B6F88B0453d74e`
- **Features**: Native MON token rewards, NFT rewards, auto-distribution
- **Platform Fee**: 2% (200 basis points)
- **Deployment Block**: 22854210

## Support

If you encounter issues:
1. Check Monad Discord for network status
2. Verify your wallet has sufficient MON
3. Ensure you're connected to the correct network 