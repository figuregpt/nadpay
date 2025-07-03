import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { getKnownNFT } from '@/lib/knownAssets';

interface NFTMetadata {
  tokenId: string;
  name: string;
  description?: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  contractAddress: string;
  collectionName?: string;
  isKnownCollection: boolean;
}

// Global cache for NFT metadata
const metadataCache = new Map<string, {
  data: NFTMetadata;
  timestamp: number;
}>();

// Cache duration: 30 minutes
const CACHE_DURATION = 30 * 60 * 1000;

// Helper to generate cache key
function getCacheKey(contractAddress: string, tokenId: string): string {
  return `${contractAddress.toLowerCase()}-${tokenId}`;
}

// Helper to convert IPFS URLs
function convertIpfsUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return url;
}

// Standard ERC-721 ABI for tokenURI
const ERC721_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export function useNFTMetadataEnhanced(contractAddress: string, tokenId: string) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const publicClient = usePublicClient();

  const fetchMetadata = useCallback(async () => {
    if (!contractAddress || !tokenId || !publicClient) {
      return;
    }

    const cacheKey = getCacheKey(contractAddress, tokenId);
    
    // Check cache first
    const cached = metadataCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log('📋 Using cached NFT metadata for', tokenId);
      setMetadata(cached.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedAddress = contractAddress.toLowerCase();
      const knownNFT = getKnownNFT(contractAddress);
      
      // Initialize metadata with known data
      let nftMetadata: NFTMetadata = {
        tokenId,
        name: `NFT #${tokenId}`,
        image: knownNFT?.image || '',
        contractAddress,
        collectionName: knownNFT?.name,
        isKnownCollection: !!knownNFT
      };

      // Special handling for different collections
      if (normalizedAddress === "0x3019bf1dfb84e5b46ca9d0eec37de08a59a41308") {
        // Nad Name Service
        nftMetadata.name = `m${tokenId}.nad`;
        nftMetadata.image = knownNFT?.image || '';
      } else {
        // Try to fetch from blockchain
        try {
          // Handle tokenId conversion for large numbers
          let tokenIdBigInt: bigint;
          const tokenIdStr = tokenId.toString();
          
          if (tokenIdStr.includes('e') || tokenIdStr.includes('E')) {
            // Scientific notation - use the number as is for display but skip blockchain call
            console.warn('⚠️ Scientific notation tokenId, using fallback:', tokenIdStr);
            nftMetadata.name = knownNFT ? `${knownNFT.name} #${tokenIdStr}` : `NFT #${tokenIdStr}`;
          } else {
            // Normal tokenId
            tokenIdBigInt = BigInt(tokenIdStr);
            
            const tokenURI = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: 'tokenURI',
              args: [tokenIdBigInt]
            });

            if (tokenURI && typeof tokenURI === 'string') {
              let metadataUrl = convertIpfsUrl(tokenURI);
              
              // Special handling for AllDomains
              if (normalizedAddress === "0x05b16393517026d6c635b6e87c256923e91caf90" && metadataUrl.endsWith('/')) {
                metadataUrl = `${metadataUrl}${tokenId}`;
              }
              
              // Fetch metadata
              const response = await fetch(metadataUrl);
              if (response.ok) {
                const fetchedMetadata = await response.json();
                
                // Update metadata with fetched data
                nftMetadata.name = fetchedMetadata.name || nftMetadata.name;
                nftMetadata.description = fetchedMetadata.description;
                nftMetadata.attributes = fetchedMetadata.attributes;
                
                if (fetchedMetadata.image) {
                  nftMetadata.image = convertIpfsUrl(fetchedMetadata.image);
                }
                
                // Special formatting for AllDomains
                if (normalizedAddress === "0x05b16393517026d6c635b6e87c256923e91caf90" && !nftMetadata.name.endsWith('.mon')) {
                  nftMetadata.name = `${nftMetadata.name}.mon`;
                }
              }
            }
          }
        } catch (blockchainError) {
          console.warn('Failed to fetch from blockchain, using known data:', blockchainError);
          // Use known NFT data as fallback
          if (knownNFT) {
            nftMetadata.name = `${knownNFT.name} #${tokenId}`;
          }
        }
      }

      // Ensure we always have an image
      if (!nftMetadata.image && knownNFT?.image) {
        nftMetadata.image = knownNFT.image;
      }

      // Cache the result
      metadataCache.set(cacheKey, {
        data: nftMetadata,
        timestamp: Date.now()
      });

      setMetadata(nftMetadata);
    } catch (err) {
      console.error('Error fetching NFT metadata:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Even on error, try to return known data
      const knownNFT = getKnownNFT(contractAddress);
      if (knownNFT) {
                 const fallbackMetadata: NFTMetadata = {
           tokenId,
           name: `${knownNFT.name} #${tokenId}`,
           image: knownNFT.image || '',
           contractAddress,
           collectionName: knownNFT.name,
           isKnownCollection: true
         };
        setMetadata(fallbackMetadata);
      }
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, tokenId, publicClient]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return { metadata, isLoading, error, refetch: fetchMetadata };
}

// Batch fetch function for performance
export async function fetchMultipleNFTMetadata(
  assets: Array<{ contractAddress: string; tokenId: string }>,
  publicClient: any
): Promise<Map<string, NFTMetadata>> {
  const results = new Map<string, NFTMetadata>();
  
  // Process in batches to avoid rate limiting
  const BATCH_SIZE = 5;
  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
    const batch = assets.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (asset) => {
        const cacheKey = getCacheKey(asset.contractAddress, asset.tokenId);
        
        // Check cache
        const cached = metadataCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
          results.set(cacheKey, cached.data);
          return;
        }
        
        // Fetch metadata (simplified version of the above logic)
        const knownNFT = getKnownNFT(asset.contractAddress);
        const metadata: NFTMetadata = {
          tokenId: asset.tokenId,
          name: knownNFT ? `${knownNFT.name} #${asset.tokenId}` : `NFT #${asset.tokenId}`,
          image: knownNFT?.image || '',
          contractAddress: asset.contractAddress,
          collectionName: knownNFT?.name,
          isKnownCollection: !!knownNFT
        };
        
        results.set(cacheKey, metadata);
        
        // Cache it
        metadataCache.set(cacheKey, {
          data: metadata,
          timestamp: Date.now()
        });
      })
    );
  }
  
  return results;
} 