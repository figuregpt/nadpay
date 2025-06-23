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

        // Get all owned token IDs
        const tokenIds: string[] = [];
        for (let i = 0; i < balanceNum; i++) {
          try {
            const tokenId = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [ownerAddress as `0x${string}`, BigInt(i)]
            });
            tokenIds.push(tokenId.toString());
          } catch (error) {
            console.error(`Error fetching token at index ${i}:`, error);
            // Some contracts might not support tokenOfOwnerByIndex
            // In that case, we'll need to use a different approach
          }
        }

        // Initialize NFTs array
        const nftArray: NFTWithMetadata[] = tokenIds.map(tokenId => ({
          address: contractAddress,
          tokenId,
          metadata: null,
          isLoading: true
        }));
        
        setNfts(nftArray);

        // Fetch metadata for each token
        const metadataPromises = tokenIds.map(async (tokenId, index) => {
          try {
            // Get tokenURI
            const tokenURI = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: 'tokenURI',
              args: [BigInt(tokenId)]
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
            setNfts(prev => prev.map((nft, i) => 
              i === index 
                ? { ...nft, isLoading: false, error: 'Failed to load metadata' }
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
        // Get tokenURI
        const tokenURI = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'tokenURI',
          args: [BigInt(tokenId)]
        });

        // Fetch metadata from URI
        const fetchedMetadata = await fetchNFTMetadata(tokenURI);
        setMetadata(fetchedMetadata);
      } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [contractAddress, tokenId, publicClient]);

  return { metadata, isLoading, error };
} 