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

// In-memory cache for NFT metadata
const metadataCache = new Map<string, {
  data: NFTMetadata | null;
  timestamp: number;
  error?: string;
}>();

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Helper function to generate cache key
function getCacheKey(contractAddress: string, tokenId: string): string {
  return `${contractAddress.toLowerCase()}-${tokenId}`;
}

// Helper function to check if cache entry is valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
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
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
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
async function fetchNFTMetadata(uri: string, tokenId?: string): Promise<NFTMetadata | null> {
  try {
    let httpUrl = convertIpfsUrl(uri);
    
    console.log('🔍 fetchNFTMetadata called:', {
      uri,
      tokenId,
      httpUrl
    });
    
    // Special handling for AllDomains - append tokenId if URL ends with /
    if (httpUrl.endsWith('/') && tokenId) {
      httpUrl = `${httpUrl}${tokenId}`;
      console.log('📎 AllDomains: Appended tokenId to URL:', httpUrl);
    }
    
    console.log('🌐 Final URL to fetch:', httpUrl);
    
    const response = await fetch(httpUrl);
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const metadata = await response.json();
    
    console.log('✅ Metadata fetched:', {
      name: metadata.name,
      image: metadata.image
    });
    
    return {
      tokenId: metadata.tokenId || tokenId || '',
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

// Hook to get owned NFTs with metadata for a specific collection using Transfer events
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
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('❌ NFT loading timeout after 10 seconds');
        setError('Loading timeout - please refresh');
        setIsLoading(false);
      }, 10000); // 10 second timeout
      
      try {
        console.log('🔍 Starting NFT fetch for:', ownerAddress);
        
        // Method 1: Use Transfer events (but with limits for speed)
        const fromBlock = BigInt(Math.max(0, Date.now() - 30 * 24 * 60 * 60 * 1000)); // Last 30 days only
        const toBlock = 'latest';
        
        console.log('📅 Scanning events from block:', fromBlock.toString());
        
        let ownedTokenIds: string[] = [];
        
        try {
          // Get Transfer events with timeout
          const [transfersToUser, transfersFromUser] = await Promise.race([
            Promise.all([
              publicClient.getLogs({
                address: contractAddress as `0x${string}`,
                event: {
                  type: 'event',
                  name: 'Transfer',
                  inputs: [
                    { name: 'from', type: 'address', indexed: true },
                    { name: 'to', type: 'address', indexed: true },
                    { name: 'tokenId', type: 'uint256', indexed: true }
                  ]
                },
                args: { to: ownerAddress as `0x${string}` },
                fromBlock,
                toBlock
              }),
              publicClient.getLogs({
                address: contractAddress as `0x${string}`,
                event: {
                  type: 'event',
                  name: 'Transfer',
                  inputs: [
                    { name: 'from', type: 'address', indexed: true },
                    { name: 'to', type: 'address', indexed: true },
                    { name: 'tokenId', type: 'uint256', indexed: true }
                  ]
                },
                args: { from: ownerAddress as `0x${string}` },
                fromBlock,
                toBlock
              })
            ]),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Event scan timeout')), 5000)
            )
          ]) as [any[], any[]];

          console.log('📨 Transfer TO user:', transfersToUser.length);
          console.log('📤 Transfer FROM user:', transfersFromUser.length);

          // Process transfers to build current ownership map
          const tokenOwnership = new Map<string, boolean>();

          transfersToUser.forEach(log => {
            const tokenId = log.args?.tokenId?.toString();
            if (tokenId) {
              tokenOwnership.set(tokenId, true);
            }
          });

          transfersFromUser.forEach(log => {
            const tokenId = log.args?.tokenId?.toString();
            if (tokenId) {
              tokenOwnership.set(tokenId, false);
            }
          });

          ownedTokenIds = Array.from(tokenOwnership.entries())
            .filter(([_, isOwned]) => isOwned)
            .map(([tokenId, _]) => tokenId);

          console.log('🎯 From events:', ownedTokenIds);
        } catch (eventError) {
          console.log('⚠️ Event scan failed/timeout, using fallback:', eventError);
        }

        // Always try fallback method if events didn't work or found nothing
        if (ownedTokenIds.length === 0) {
          console.log('🔄 Using tokenOfOwnerByIndex fallback...');
          
          try {
            const balance = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: 'balanceOf',
              args: [ownerAddress as `0x${string}`]
            });

            const balanceNum = Number(balance);
            console.log('👛 Balance:', balanceNum);

            if (balanceNum > 0) {
              // Get first few tokens quickly, then validate
              const maxTokens = Math.min(balanceNum, 10); // Limit for speed
              
              for (let i = 0; i < maxTokens; i++) {
                try {
                  const tokenId = await publicClient.readContract({
                    address: contractAddress as `0x${string}`,
                    abi: ERC721_ABI,
                    functionName: 'tokenOfOwnerByIndex',
                    args: [ownerAddress as `0x${string}`, BigInt(i)]
                  });
                  
                  ownedTokenIds.push(tokenId.toString());
                  console.log('✅ Token from index:', tokenId.toString());
                } catch (error) {
                  console.log('❌ Error at index', i, '- stopping');
                  break;
                }
              }
            }
          } catch (error) {
            console.log('❌ Fallback failed:', error);
            throw new Error('Failed to load NFTs - please refresh the page');
          }
        }

        console.log('🏆 Final token IDs:', ownedTokenIds);
        clearTimeout(timeoutId);

        if (ownedTokenIds.length === 0) {
          setNfts([]);
          setIsLoading(false);
          return;
        }

        // Initialize NFTs array
        const nftArray: NFTWithMetadata[] = ownedTokenIds.map(tokenId => ({
          address: contractAddress,
          tokenId,
          metadata: null,
          isLoading: true
        }));
        
        setNfts(nftArray);

        // Fetch metadata quickly (parallel but limited)
        const metadataPromises = ownedTokenIds.slice(0, 5).map(async (tokenId, index) => {
          try {
            // Convert tokenId to BigInt safely
            let tokenIdBigInt: bigint;
            try {
              // Handle scientific notation and large numbers
              if (tokenId.includes('e') || tokenId.includes('E')) {
                // Parse scientific notation to regular number string
                const num = Number(tokenId);
                if (isNaN(num) || !isFinite(num)) {
                  throw new Error('Invalid token ID format');
                }
                // Convert to string without scientific notation
                tokenIdBigInt = BigInt(Math.floor(num));
              } else {
                // Direct conversion for regular number strings
                tokenIdBigInt = BigInt(tokenId);
              }
            } catch (e) {
              console.error('Failed to convert tokenId to BigInt:', tokenId, e);
              throw new Error('Invalid token ID format');
            }
            
            const tokenURI = await retryWithBackoff(async () => {
              console.log('🔗 Fetching tokenURI for:', {
                contractAddress,
                tokenId,
                tokenIdBigInt: tokenIdBigInt.toString()
              });
              
              const uri = await publicClient.readContract({
                address: contractAddress as `0x${string}`,
                abi: ERC721_ABI,
                functionName: 'tokenURI',
                args: [tokenIdBigInt]
              });
              
              console.log('📄 TokenURI received:', uri);
              return uri;
            });

            const metadata = await fetchNFTMetadata(tokenURI, tokenId);
            
            setNfts(prev => prev.map((nft, i) => 
              i === index 
                ? { ...nft, metadata, isLoading: false }
                : nft
            ));
          } catch (error) {
            console.error(`Metadata error for ${tokenId}:`, error);
            setNfts(prev => prev.map((nft, i) => 
              i === index 
                ? { ...nft, isLoading: false, error: 'Failed to load' }
                : nft
            ));
          }
        });

        await Promise.all(metadataPromises);
        
      } catch (error) {
        console.error('❌ NFT fetch error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load NFTs');
        clearTimeout(timeoutId);
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

    const cacheKey = getCacheKey(contractAddress, tokenId);
    
    // Check cache first
    const cached = metadataCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('📋 Using cached NFT metadata for', tokenId);
      setMetadata(cached.data);
      setError(cached.error || null);
      setIsLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await rateLimiter.throttle();
        
        // Convert tokenId to BigInt safely
        let tokenIdBigInt: bigint;
        try {
          // Handle scientific notation and large numbers
          if (tokenId.includes('e') || tokenId.includes('E')) {
            // Parse scientific notation to regular number string
            const num = Number(tokenId);
            if (isNaN(num) || !isFinite(num)) {
              throw new Error('Invalid token ID format');
            }
            // Convert to string without scientific notation
            tokenIdBigInt = BigInt(Math.floor(num));
          } else {
            // Direct conversion for regular number strings
            tokenIdBigInt = BigInt(tokenId);
          }
        } catch (e) {
          console.error('Failed to convert tokenId to BigInt:', tokenId, e);
          throw new Error('Invalid token ID format');
        }
        
        // Get tokenURI with retry logic
        const tokenURI = await retryWithBackoff(async () => {
          console.log('🔗 Fetching tokenURI for:', {
            contractAddress,
            tokenId,
            tokenIdBigInt: tokenIdBigInt.toString()
          });
          
          const uri = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: ERC721_ABI,
            functionName: 'tokenURI',
            args: [tokenIdBigInt]
          });
          
          console.log('📄 TokenURI received:', uri);
          return uri;
        });

        // Fetch metadata from URI
        const fetchedMetadata = await fetchNFTMetadata(tokenURI, tokenId);
        
        // Cache the result
        metadataCache.set(cacheKey, {
          data: fetchedMetadata,
          timestamp: Date.now()
        });
        
        setMetadata(fetchedMetadata);
      } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        const errorMessage = error instanceof Error && error.message.includes('429') 
          ? 'Rate limited - please wait and try again' 
          : (error instanceof Error ? error.message : 'Unknown error');
        
        // Cache the error too
        metadataCache.set(cacheKey, {
          data: null,
          timestamp: Date.now(),
          error: errorMessage
        });
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [contractAddress, tokenId, publicClient]);

  return { metadata, isLoading, error };
} 