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
  },
  {
    address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea", // Example community token
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    logo: "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/usdc.png/public",
    description: "",
    verified: true
  },
  {
    address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D", // Example community token
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    logo: "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/images.png/public",
    description: "",
    verified: true
  },
  {
    address: "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50", // Example community token
    name: "Moyaki",
    symbol: "YAKI",
    decimals: 18,
    logo: "https://imagedelivery.net/tWwhAahBw7afBzFUrX5mYQ/6679b698-a845-412b-504b-23463a3e1900/public",
    description: "",
    verified: true
  },
  {
    address: "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714", // Example community token
    name: "Molandak",
    symbol: "DAK",
    decimals: 18,
    logo: "https://imagedelivery.net/tWwhAahBw7afBzFUrX5mYQ/27759359-9374-4995-341c-b2636a432800/public",
    description: "",
    verified: true
  }
];

// Known NFT collections on Monad testnet (ADMIN CONTROLLED)
export const KNOWN_NFTS: KnownNFT[] = [

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
    address: "0x846B6EaE59b84108eB64DdD54f013b68D112917d",
    name: "FrensNads",
    description: "",
    image: "https://img-cdn.magiceden.dev/rs:fill:400:0:0/plain/https%3A%2F%2Fimg.reservoir.tools%2Fimages%2Fv2%2Fmonad-testnet%2Fi9YO%252F4yHXUdJsWcTqhqvf4N%252FOFFE2gUD7SCSwVPFg4mjTtUVrGCuQf930w%252F4MDZsLiiQRib%252BKrGtFUk08ExcIr9thKzElN4CElEMjAupE8I%253D",
    website: "",
    verified: true,
    totalSupply: 333
  },
  {
    address: "0xC5c9425D733b9f769593bd2814B6301916f91271",
    name: "Purple Frens",
    description: "",
    image: "https://bafybeic7qtumkpusmadwyhrhd6ce3ilj6fcumemf7dgyflqhwb2qyy6vwm.ipfs.w3s.link/purple_frens_cover.png",
    website: "",
    verified: true,
    totalSupply: 1111
  },
  {
    address: "0xfCF06eB434762aeD4B55300DAC713c6Bc3484117",
    name: "Spikes",
    description: "",
    image: "https://img-cdn.magiceden.dev/rs:fill:400:0:0/plain/https%3A%2F%2Fimg.reservoir.tools%2Fimages%2Fv2%2Fmonad-testnet%2Fi9YO%252F4yHXUdJsWcTqhqvf0aTPGa7dMbaoJpVINCUIuTbYpz%252FAM0ZI38bbmW5peeVIgH4fvhO%252Fqgc3c%252Bvqag4utIVFcylE0oHY%252Bz0sS4qeqGr1xW%252BSbXlJkImE0K8ke9V5W54iuvOLtY6FXTTK4A8kQ%253D%253D",
    website: "",
    verified: true,
    totalSupply: 3333
  },
  {
    address: "0x000000009e44eBa131196847C685F20Cd4b68aC4",
    name: "FELIX",
    description: "",
    image: "%https://img-cdn.magiceden.dev/rs:fill:400:0:0/plain/https%3A%2F%2Fimg.reservoir.tools%2Fimages%2Fv2%2Fmonad-testnet%2F6qPHZoEj3nB9yhHygcTgQX9aLzKmRR%252B7DM893auPFu3W91AG0KQvlXsAo27GpZwSlZuu%252FqkXUTC%252BPPI%252Bi%252BkV%252FfapbdD209GEO8qdJHe%252B9aPQ7EIRSHWGTXlTPxOO4whI7dei7Smt1pmWUObL4rOhUw%253D%253D",
    website: "",
    verified: true,
    totalSupply: 2000
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