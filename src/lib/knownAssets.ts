// Known assets configuration for Monad testnet
// This file contains hardcoded lists of popular tokens and NFT collections

export interface KnownToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  description?: string;
}

export interface KnownNFT {
  address: string;
  name: string;
  description?: string;
  image?: string;
  website?: string;
}

// Known ERC-20 tokens on Monad testnet
export const KNOWN_TOKENS: KnownToken[] = [
  {
    address: "0x0000000000000000000000000000000000000000", // Native MON token
    name: "Monad",
    symbol: "MON",
    decimals: 18,
    logo: "/monad-logo.svg",
    description: "Native Monad token"
  }
];

// Known NFT collections on Monad testnet
export const KNOWN_NFTS: KnownNFT[] = [
  // Add real NFT contract addresses here when available
  // Example format:
  // {
  //   address: "0x...",
  //   name: "Collection Name",
  //   description: "Collection description",
  //   image: "🎨",
  //   website: "https://..."
  // }
];

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