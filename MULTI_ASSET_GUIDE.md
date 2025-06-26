# Multi-Asset Support Guide 🪙

This guide explains the new multi-coin/NFT support feature developed for NadPay and NadRaffle platforms.

## 🚀 New Features

### ✅ Curated Asset List
- No longer limited to just $MON
- ERC-20 tokens and NFT collections are manually curated by admins
- Only verified and trusted assets are available

### ✅ Smart Asset Selector
- Combined token and NFT selection in one interface
- Search and filtering capabilities
- Verified assets with visual previews
- Category-based organization

### ✅ Admin-Controlled System
- Asset list managed exclusively by platform admins
- All assets are verified and trusted
- No user-submitted assets to ensure security
- Categorized for easy discovery

## 📋 How to Use

### 1. Creating Raffles with Asset Selection

```typescript
// Reward selection now works like this:
- Asset Selector opens
- Switch between Token or NFT tabs
- Search for desired asset or browse by category
- Select asset from curated list
- Enter amount/tokenId based on selected asset type
```

### 2. Available Assets

**Tokens:**
- Native MON (Monad)
- USDC (USD Coin)
- WETH (Wrapped Ethereum)
- MCT (Monad Community Token)
- More tokens added by admins as ecosystem grows

**NFTs:**
- Monad Genesis NFTs
- Monad Builders Collection
- Community Art Collection
- More collections added by admins

### 3. Asset Management (Admin Only)

```javascript
// Code examples:

// Get all tokens
import { getAllTokens, getAllNFTs } from '@/lib/knownAssets';
const tokens = getAllTokens();
const nfts = getAllNFTs();

// Search assets
import { searchTokens, searchNFTs } from '@/lib/knownAssets';
const results = searchTokens('USDC');

// Get by category
import { getTokensByCategory } from '@/lib/knownAssets';
const stablecoins = getTokensByCategory('STABLECOINS');
```

## 🔧 Technical Details

### Asset Definitions

```typescript
// Token Interface
interface KnownToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  description?: string;
  coingeckoId?: string;
  website?: string;
  verified: boolean; // Always true for admin curated
}

// NFT Interface
interface KnownNFT {
  address: string;
  name: string;
  description?: string;
  image?: string;
  website?: string;
  verified: boolean; // Always true for admin curated
  floorPrice?: string;
  totalSupply?: number;
}
```

### Categories

**Token Categories:**
- `STABLECOINS`: USDC, USDT, DAI
- `WRAPPED`: WETH, WBTC
- `GOVERNANCE`: DAO tokens
- `MEMECOINS`: Meme tokens
- `DEFI`: DeFi protocol tokens

**NFT Categories:**
- `GENESIS`: First collections
- `COMMUNITY`: Community NFTs
- `GAMING`: Gaming NFTs
- `ART`: Art collections
- `UTILITY`: Utility NFTs

## 💾 Data Storage

- **Curated Assets**: Stored in `knownAssets.ts` file
- **Admin Managed**: All assets verified and maintained by admins
- **No Local Storage**: No user-submitted assets stored locally

## 🎯 Use Cases

### 1. Stablecoin Payments
```javascript
// Creating payment link with USDC
const selectedAsset = {
  type: 'token',
  data: { name: 'USD Coin', symbol: 'USDC', address: '0x...' }
};
```

### 2. NFT Raffles
```javascript
// Creating NFT raffle
const selectedAsset = {
  type: 'nft',
  data: { name: 'Cool Collection', address: '0x...' }
};
const tokenId = '1234'; // Specific NFT
```

### 3. Community Tokens
```javascript
// Using community token for rewards
const selectedAsset = {
  type: 'token',
  data: { name: 'Monad Community Token', symbol: 'MCT', address: '0x...' }
};
```

## 🛡️ Security Features

1. **Admin Verification**: All assets are manually verified by admins
2. **Contract Validation**: All addresses are verified contract addresses
3. **Trusted Assets Only**: No user-submitted or unverified assets
4. **Curated Experience**: Only quality, legitimate projects included

## 🚦 Future Plans

- [ ] Additional verified tokens as Monad ecosystem grows
- [ ] More NFT collections from trusted projects
- [ ] Price feed integration for tokens
- [ ] Advanced filtering/sorting options
- [ ] Multi-chain support
- [ ] Asset analytics and statistics

## 🐛 Known Limitations

1. Native MON not yet supported for raffle rewards (contract limitation)
2. Asset list updates require code deployment
3. Asset logos/images from external URLs
4. Price information manually maintained

## 💡 Best Practices

1. **For Developers**: Contact admins to request new asset additions
2. **For Users**: Only use assets from the curated list
3. **For Verification**: Check the green verified badge on assets
4. **For Support**: Contact support for asset-related questions

## 📞 Support

For asset list related issues:
- Open GitHub Issues
- Contact admin team via Discord
- Submit asset addition requests through proper channels

---

This system makes NadPay/NadRaffle platforms much more flexible and useful while maintaining security and trust. You can now create payment links and raffles with any supported ERC-20 token or NFT collection! 🎉 