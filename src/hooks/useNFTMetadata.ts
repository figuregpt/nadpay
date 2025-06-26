import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';

export interface NFTMetadata {
  tokenId: string;
  name: string;
  description?: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface NFTWithMetadata {
  address: string;
  tokenId: string;
  metadata: NFTMetadata | null;
  isLoading: boolean;
  error?: string;
}

// Rate limiting helper
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number = 10, timeWindow: number = 1000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);
      
      if (waitTime > 0) {
        console.log(`🕐 Rate limiting: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(Date.now());
  }
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a rate limit error
      const isRateLimit = error instanceof Error && 
        (error.message.includes('429') || 
         error.message.includes('rate limit') || 
         error.message.includes('request limit'));
      
      if (isRateLimit && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError!;
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(5, 2000); // 5 requests per 2 seconds

// Standard ERC-721 ABI for tokenURI
const ERC721_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Helper function to convert IPFS URL to HTTP gateway
function convertIpfsUrl(url: string): string {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return url;
}

// Helper function to fetch metadata from URI
async function fetchNFTMetadata(uri: string): Promise<NFTMetadata | null> {
  try {
    const httpUrl = convertIpfsUrl(uri);
    const response = await fetch(httpUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const metadata = await response.json();
    
    return {
      tokenId: metadata.tokenId || '',
      name: metadata.name || 'Unnamed NFT',
      description: metadata.description,
      image: convertIpfsUrl(metadata.image || ''),
      attributes: metadata.attributes || []
    };
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

// Hook to get owned NFTs with metadata for a specific collection
export function useOwnedNFTsWithMetadata(contractAddress: string, ownerAddress?: string) {
  const [nfts, setNfts] = useState<NFTWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!contractAddress || !ownerAddress || !publicClient) {
      setNfts([]);
      return;
    }

    const fetchOwnedNFTs = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get balance of owner
        const balance = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'balanceOf',
          args: [ownerAddress as `0x${string}`]
        });

        const balanceNum = Number(balance);
        if (balanceNum === 0) {
          setNfts([]);
          setIsLoading(false);
          return;
        }

        // Get all owned token IDs with rate limiting
        const tokenIds: string[] = [];
        for (let i = 0; i < balanceNum; i++) {
          try {
            await rateLimiter.throttle();
            
            const tokenId = await retryWithBackoff(async () => {
              return await publicClient.readContract({
                address: contractAddress as `0x${string}`,
                abi: ERC721_ABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [ownerAddress as `0x${string}`, BigInt(i)]
              });
            });
            
            console.log(`🎯 useOwnedNFTsWithMetadata - Token at index ${i}:`, tokenId.toString());
            tokenIds.push(tokenId.toString());
          } catch (error) {
            console.error(`Error fetching token at index ${i}:`, error);
            // Some contracts might not support tokenOfOwnerByIndex
            // In that case, we'll need to use a different approach
          }
        }

        console.log(`✅ useOwnedNFTsWithMetadata - Final tokenIds:`, tokenIds);

        // Initialize NFTs array
        const nftArray: NFTWithMetadata[] = tokenIds.map(tokenId => ({
          address: contractAddress,
          tokenId,
          metadata: null,
          isLoading: true
        }));
        
        setNfts(nftArray);

        // Fetch metadata for each token with rate limiting
        const metadataPromises = tokenIds.map(async (tokenId, index) => {
          try {
            await rateLimiter.throttle();
            
            // Get tokenURI with retry logic
            const tokenURI = await retryWithBackoff(async () => {
              return await publicClient.readContract({
                address: contractAddress as `0x${string}`,
                abi: ERC721_ABI,
                functionName: 'tokenURI',
                args: [BigInt(tokenId)]
              });
            });

            // Fetch metadata from URI
            const metadata = await fetchNFTMetadata(tokenURI);
            
            // Update the specific NFT in the array
            setNfts(prev => prev.map((nft, i) => 
              i === index 
                ? { ...nft, metadata, isLoading: false }
                : nft
            ));
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId}:`, error);
            const errorMessage = error instanceof Error && error.message.includes('429') 
              ? 'Rate limited - please wait and try again' 
              : 'Failed to load metadata';
              
            setNfts(prev => prev.map((nft, i) => 
              i === index 
                ? { ...nft, isLoading: false, error: errorMessage }
                : nft
            ));
          }
        });

        await Promise.all(metadataPromises);
      } catch (error) {
        console.error('Error fetching owned NFTs:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnedNFTs();
  }, [contractAddress, ownerAddress, publicClient]);

  return { nfts, isLoading, error };
}

// Hook to get metadata for a specific NFT
export function useNFTMetadata(contractAddress: string, tokenId: string) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!contractAddress || !tokenId || !publicClient) {
      setMetadata(null);
      return;
    }

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await rateLimiter.throttle();
        
        // Get tokenURI with retry logic
        const tokenURI = await retryWithBackoff(async () => {
          return await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: ERC721_ABI,
            functionName: 'tokenURI',
            args: [BigInt(tokenId)]
          });
        });

        // Fetch metadata from URI
        const fetchedMetadata = await fetchNFTMetadata(tokenURI);
        setMetadata(fetchedMetadata);
      } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        const errorMessage = error instanceof Error && error.message.includes('429') 
          ? 'Rate limited - please wait and try again' 
          : (error instanceof Error ? error.message : 'Unknown error');
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [contractAddress, tokenId, publicClient]);

  return { metadata, isLoading, error };
} 