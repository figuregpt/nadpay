# NadPay Ecosystem Contract Deployment Guide

## Prerequisites

1. **Monad Testnet MON Tokens**: You need MON tokens for deployment
   - Get testnet tokens from Monad faucet
   - Ensure you have enough for gas fees (typically 0.1-0.5 MON per contract)

2. **Private Key**: Export your wallet private key
   - ⚠️ **NEVER** commit private keys to git
   - Use a dedicated deployment wallet for security

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

## Ecosystem Features

### NadPay V2 Ultra-Secure
- **Multi-Token Payments**: Support for MON and ERC20 tokens
- **Ultra-Secure Architecture**: Reentrancy protection, rate limiting
- **Emergency Controls**: Pause functionality and withdrawal limits
- **Low Platform Fee**: 2% fee on all transactions

### NadRaffle V7 Multi-Token
- **Multi-Token Ticket Payments**: Accept any ERC20 token (MON, USDC, CHOG, etc.)
- **Automatic Reward Distribution**: No manual claiming required
- **2-Phase Security**: Sold out → winner selection → automatic distribution
- **Ultra-Fast Finalizer**: Automated bot for instant raffle completion

### NadSwap V3 Ultra-Secure
- **Escrow-Based Trading**: Secure peer-to-peer asset swaps
- **Multi-Asset Support**: Trade ERC20 tokens and NFTs
- **Automatic Expiration**: Proposals expire after set duration
- **Gas Griefing Protection**: Safe external calls with gas limits

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

## Current Contract Addresses

### NadPay V2 Ultra-Secure (Payment Links)
- **Monad Testnet**: `0xfeF2c348d0c8a14b558df27034526d87Ac1f9f25`
- **Features**: Multi-token payments, ultra-secure contracts, rate limiting
- **Platform Fee**: 2%
- **Security**: Reentrancy protection, emergency controls

### NadRaffle V7 Multi-Token (Raffle System)
- **Monad Testnet**: `0xBd32ce277D91b6beD459454C7964528f54A54f75`
- **Features**: Multi-token ticket payments (MON, USDC, CHOG, etc.), automatic reward distribution
- **Platform Fee**: 2.5%
- **Security**: 2-phase finalization, ultra-fast finalizer bot

### NadSwap V3 Ultra-Secure (Asset Trading)
- **Monad Testnet**: `0x982403dcb43b6aaD6E5425CC360fDBbc81FB6a3f`
- **Features**: Escrow-based swaps, multi-asset support, automatic expiration
- **Platform Fee**: 0.1 MON per proposal
- **Security**: Safe transfers, gas griefing protection

## Support

If you encounter issues:
1. Check Monad Discord for network status
2. Verify your wallet has sufficient MON
3. Ensure you're connected to the correct network 