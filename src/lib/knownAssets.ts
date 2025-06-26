// Known assets configuration for Monad testnet
// This file contains curated lists of tokens and NFT collections managed by admins

export interface KnownToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  description?: string;
  coingeckoId?: string; // For price fetching
  website?: string;
  verified: boolean;
}

export interface KnownNFT {
  address: string;
  name: string;
  description?: string;
  image?: string;
  website?: string;
  verified: boolean;
  floorPrice?: string; // In MON
  totalSupply?: number;
}

// Native MON token (address 0x0 represents native token)
export const NATIVE_MON: KnownToken = {
  address: "0x0000000000000000000000000000000000000000",
  name: "Monad",
  symbol: "MON",
  decimals: 18,
  logo: "/monad-logo.svg",
  description: "Native Monad token - gas and payment currency",
  verified: true
};

// Known ERC-20 tokens on Monad testnet (ADMIN CONTROLLED)
export const KNOWN_TOKENS: KnownToken[] = [
  NATIVE_MON,
  // Add more tokens here as they become available
  {
    address: "0xe0590015a873bf326bd645c3e1266d4db41c4e6b", // Example community token
    name: "Chog",
    symbol: "CHOG",
    decimals: 18,
    logo: "https://imagedelivery.net/tWwhAahBw7afBzFUrX5mYQ/5d1206c2-042c-4edc-9f8b-dcef2e9e8f00/public",
    description: "",
    verified: true
  }  // 
  // ✅ NEW TOKEN EXAMPLE - Copy this format:
  // {
  //   address: "0xe0590015a873bf326bd645c3e1266d4db41c4e6b",        // ← Real deployed contract address
  //   name: "Chog",                     // ← From contract name() function
  //   symbol: "CHOG",                              // ← From contract symbol() function  
  //   decimals: 18,                               // ← From contract decimals() function
  //   logo: "https://your-cdn.com/logo.png",      // ← Optional: Logo URL
  //   description: "Your token description",       // ← Optional: Brief description
  //   coingeckoId: "your-token-coingecko-id",     // ← Optional: For price feeds
  //   website: "https://yourtoken.com",           // ← Optional: Project website
  //   verified: true                              // ← Always true for admin-added tokens
  // },
];

// Known NFT collections on Monad testnet (ADMIN CONTROLLED)
export const KNOWN_NFTS: KnownNFT[] = [
  {
    address: "0x4567890123456789012345678901234567890123",
    name: "Monad Genesis NFTs",
    description: "First NFT collection on Monad testnet",
    image: "https://via.placeholder.com/300x300/6366f1/ffffff?text=Genesis",
    website: "https://genesis.monad.xyz",
    verified: true,
    floorPrice: "1.5",
    totalSupply: 10000
  },
  {
    address: "0x3019BF1dfB84E5b46Ca9D0eEC37dE08a59A41308",
    name: "Nad Name Service",
    description: "",
    image: "https://nad.domains/_next/static/media/icon-white.c3edcfb6.svg",
    website: "",
    verified: true,
    totalSupply: 4869316
  },
  {
    address: "0x5678901234567890123456789012345678901234",
    name: "Monad Builders",
    description: "NFTs for early Monad builders and contributors",
    image: "https://via.placeholder.com/300x300/10b981/ffffff?text=Builder",
    website: "https://builders.monad.xyz",
    verified: true,
    floorPrice: "0.8",
    totalSupply: 5000
  },
  {
    address: "0x6789012345678901234567890123456789012345",
    name: "Community Art Collection",
    description: "Community-driven art NFT collection",
    image: "https://via.placeholder.com/300x300/f59e0b/ffffff?text=Art",
    verified: true,
    totalSupply: 2500
  }
];

// Token categories for UI organization
export const TOKEN_CATEGORIES = {
  STABLECOINS: ['USDC', 'USDT', 'DAI'],
  WRAPPED: ['WETH', 'WBTC'],
  GOVERNANCE: ['MCT'],
  MEMECOINS: [],
  DEFI: []
};

// NFT categories
export const NFT_CATEGORIES = {
  GENESIS: ['Monad Genesis NFTs'],
  COMMUNITY: ['Monad Builders', 'Community Art Collection'],
  GAMING: [],
  ART: ['Community Art Collection'],
  UTILITY: []
};

// Helper function to get token by address
export function getKnownToken(address: string): KnownToken | undefined {
  return KNOWN_TOKENS.find(token => 
    token.address.toLowerCase() === address.toLowerCase()
  );
}

// Helper function to get NFT collection by address
export function getKnownNFT(address: string): KnownNFT | undefined {
  return KNOWN_NFTS.find(nft => 
    nft.address.toLowerCase() === address.toLowerCase()
  );
}

// Helper function to check if an address is a known token
export function isKnownToken(address: string): boolean {
  return getKnownToken(address) !== undefined;
}

// Helper function to check if an address is a known NFT
export function isKnownNFT(address: string): boolean {
  return getKnownNFT(address) !== undefined;
}

// Get tokens by category
export function getTokensByCategory(category: keyof typeof TOKEN_CATEGORIES): KnownToken[] {
  const symbols = TOKEN_CATEGORIES[category];
  return KNOWN_TOKENS.filter(token => (symbols as string[]).includes(token.symbol));
}

// Get NFTs by category
export function getNFTsByCategory(category: keyof typeof NFT_CATEGORIES): KnownNFT[] {
  const names = NFT_CATEGORIES[category];
  return KNOWN_NFTS.filter(nft => (names as string[]).includes(nft.name));
}

// Get verified tokens only
export function getVerifiedTokens(): KnownToken[] {
  return KNOWN_TOKENS.filter(token => token.verified);
}

// Get verified NFTs only
export function getVerifiedNFTs(): KnownNFT[] {
  return KNOWN_NFTS.filter(nft => nft.verified);
}

// Search tokens by name or symbol
export function searchTokens(query: string): KnownToken[] {
  const lowercaseQuery = query.toLowerCase();
  return KNOWN_TOKENS.filter(token => 
    token.name.toLowerCase().includes(lowercaseQuery) ||
    token.symbol.toLowerCase().includes(lowercaseQuery)
  );
}

// Search NFTs by name
export function searchNFTs(query: string): KnownNFT[] {
  const lowercaseQuery = query.toLowerCase();
  return KNOWN_NFTS.filter(nft => 
    nft.name.toLowerCase().includes(lowercaseQuery) ||
    (nft.description && nft.description.toLowerCase().includes(lowercaseQuery))
  );
}

// Get all tokens (admin curated only)
export function getAllTokens(): KnownToken[] {
  return KNOWN_TOKENS;
}

// Get all NFTs (admin curated only)
export function getAllNFTs(): KnownNFT[] {
  return KNOWN_NFTS;
} 