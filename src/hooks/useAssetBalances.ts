import { useState, useEffect } from 'react';
import { useAccount, useBalance, usePublicClient } from 'wagmi';
import { KNOWN_TOKENS, KNOWN_NFTS, KnownToken, KnownNFT } from '../lib/knownAssets';

export interface TokenBalance extends KnownToken {
  balance: string;
  formattedBalance: string;
  isLoading: boolean;
  error?: string;
}

export interface NFTBalance extends KnownNFT {
  ownedTokens: string[];
  totalOwned: number;
  isLoading: boolean;
  error?: string;
}

// Rate limiting and caching
const RATE_LIMIT_DELAY = 0; // Remove rate limiting for parallel fetching
const CACHE_DURATION = 300000; // 5 minutes cache
const balanceCache = new Map<string, { data: any; timestamp: number }>();

// Helper to add delay between calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ERC-20 ABI for balance checking
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC-721 ABI for NFT checking
const ERC721_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useAssetBalances() {
  const { address, isConnected } = useAccount();
  const { data: nativeBalance, isLoading: isNativeLoading } = useBalance({
    address: address,
  });
  const publicClient = usePublicClient();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [nftBalances, setNftBalances] = useState<NFTBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Format token balance with proper decimals
  const formatTokenBalance = (balance: string, decimals: number): string => {
    try {
      const balanceNumber = parseFloat(balance) / Math.pow(10, decimals);
      
      if (balanceNumber === 0) return '0';
      if (balanceNumber < 0.0001) return '< 0.0001';
      if (balanceNumber < 1) return balanceNumber.toFixed(4);
      if (balanceNumber < 1000) return balanceNumber.toFixed(2);
      if (balanceNumber < 1000000) return `${(balanceNumber / 1000).toFixed(1)}K`;
      return `${(balanceNumber / 1000000).toFixed(1)}M`;
    } catch (error) {
      console.error('Error formatting balance:', error, 'balance:', balance, 'decimals:', decimals);
      return '0';
    }
  };

  // Check cache first
  const getCachedBalance = (cacheKey: string) => {
    const cached = balanceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  // Cache balance result
  const setCachedBalance = (cacheKey: string, data: any) => {
    balanceCache.set(cacheKey, { data, timestamp: Date.now() });
  };

  // Real function to fetch token balance with rate limiting and caching
  const fetchTokenBalance = async (token: KnownToken, delayMs: number = 0): Promise<TokenBalance> => {
    // Add delay for rate limiting
    if (delayMs > 0) {
      await delay(delayMs);
    }
    
    // For MON (native token), use wagmi native balance if available, otherwise use consistent approach
    if (token.symbol === 'MON' || token.address === "0x0000000000000000000000000000000000000000") {
      // Try to use wagmi native balance first (faster when available)
      if (nativeBalance && nativeBalance.value !== undefined && !isNativeLoading) {
        const balanceString = nativeBalance.value.toString();
        const formattedBalance = formatTokenBalance(balanceString, token.decimals);

        return {
          ...token,
          balance: balanceString,
          formattedBalance,
          isLoading: false,
        };
      }
      
      // Fallback: Treat MON like other tokens for consistency
      // Check cache first
      const cacheKey = `native-${address}`;
      const cachedResult = getCachedBalance(cacheKey);
      if (cachedResult) {
        return {
          ...token,
          ...cachedResult,
          isLoading: false,
        };
      }
      
      // Use publicClient to get native balance if wagmi fails
      if (publicClient && address) {
        try {
          const balance = await publicClient.getBalance({
            address: address as `0x${string}`
          });
          
          const balanceString = balance.toString();
          const formattedBalance = formatTokenBalance(balanceString, token.decimals);

          const result = {
            balance: balanceString,
            formattedBalance,
          };

          // Cache the result
          setCachedBalance(cacheKey, result);

          return {
            ...token,
            ...result,
            isLoading: false,
          };
        } catch (error) {
          // For MON, always show it even if balance fetch fails
          return {
            ...token,
            balance: '0',
            formattedBalance: 'Rate Limited',
            isLoading: false,
            error: `Failed to fetch MON balance`,
          };
        }
      }
      
      // Final fallback for MON
      return {
        ...token,
        balance: '0',
        formattedBalance: '0',
        isLoading: isNativeLoading,
      };
    }
    
    // Check cache first for other tokens
    const cacheKey = `${token.address}-${address}`;
    const cachedResult = getCachedBalance(cacheKey);
    if (cachedResult) {
      return {
        ...token,
        ...cachedResult,
        isLoading: false,
      };
    }
    
    // For other tokens, try to fetch real balance from contract
    if (publicClient && address && token.address !== "0x0000000000000000000000000000000000000000") {
      try {
        const balance = await publicClient.readContract({
          address: token.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        });
        
        const balanceString = balance.toString();
        const formattedBalance = formatTokenBalance(balanceString, token.decimals);

        const result = {
          balance: balanceString,
          formattedBalance,
        };

        // Cache the result
        setCachedBalance(cacheKey, result);

        return {
          ...token,
          ...result,
          isLoading: false,
        };
      } catch (error) {
        // Silently handle rate limiting for non-critical tokens
        
        // For important tokens like CHOG, return with error but still show in UI
        if (token.symbol === 'CHOG' || token.symbol === 'MON') {
          return {
            ...token,
            balance: '0',
            formattedBalance: 'Rate Limited',
            isLoading: false,
            error: `Rate limited or network error`,
          };
        }
        
        return {
          ...token,
          balance: '0',
          formattedBalance: '0',
          isLoading: false,
          error: `Failed to fetch balance: ${error}`,
        };
      }
    }

    // No public client or invalid address
    // Return zero balance if no public client or invalid address
    return {
      ...token,
      balance: '0',
      formattedBalance: '0',
      isLoading: false,
    };
  };

  // Real function to fetch NFT balance
  const fetchNFTBalance = async (nft: KnownNFT): Promise<NFTBalance> => {
    if (publicClient && address && nft.address !== "0x0000000000000000000000000000000000000000") {
      try {
        const balance = await publicClient.readContract({
          address: nft.address as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        });
        
        const totalOwned = Number(balance);
        const ownedTokens: string[] = [];
        
        // Debug: NFT balance
        // console.log(`🔍 NFT Balance Debug for ${nft.name}:`, {
        //   contract: nft.address,
        //   user: address,
        //   totalOwned
        // });
        
        // If user owns NFTs, try to get token IDs (this might fail for some contracts)
        if (totalOwned > 0) {
          try {
            for (let i = 0; i < Math.min(totalOwned, 10); i++) { // Limit to 10 for performance
              const tokenId = await publicClient.readContract({
                address: nft.address as `0x${string}`,
                abi: ERC721_ABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [address as `0x${string}`, BigInt(i)]
              });
              
              // console.log(`🎯 Token at index ${i}:`, tokenId.toString());
              ownedTokens.push(tokenId.toString());
            }
          } catch (error) {
            console.warn(`Could not fetch token IDs for ${nft.name}:`, error);
            // Generate placeholder token IDs
            for (let i = 0; i < totalOwned; i++) {
              ownedTokens.push(`${i + 1}`);
            }
          }
        }

        // console.log(`✅ Final ownedTokens for ${nft.name}:`, ownedTokens);

        return {
          ...nft,
          ownedTokens,
          totalOwned,
          isLoading: false,
        };
      } catch (error) {
        console.warn(`Failed to fetch ${nft.name} NFT balance:`, error);
        return {
          ...nft,
          ownedTokens: [],
          totalOwned: 0,
          isLoading: false,
          error: `Failed to fetch NFT balance: ${error}`,
        };
      }
    }

    // Return zero ownership if no public client or invalid address
    return {
      ...nft,
      ownedTokens: [],
      totalOwned: 0,
      isLoading: false,
    };
  };

  // Fetch all balances
  const fetchAllBalances = async () => {
    // Debug: fetchAllBalances
    // console.log('🚀 fetchAllBalances called', { address, isConnected });
    
    if (!address || !isConnected) {
      // console.log('❌ No address or not connected, setting empty balances');
      // Initialize with MON visible even when not connected
      setTokenBalances(KNOWN_TOKENS.map(token => ({
        ...token,
        balance: '0',
        formattedBalance: '0',
        isLoading: false,
      })));

      setNftBalances(KNOWN_NFTS.map(nft => ({
        ...nft,
        ownedTokens: [],
        totalOwned: 0,
        isLoading: false,
      })));
      return;
    }

    // console.log('✅ Starting balance fetch for address:', address);
    setIsLoading(true);

    try {
      // Initialize with MON and CHOG immediately visible (assume they have these)
      setTokenBalances(KNOWN_TOKENS.map(token => ({
        ...token,
        balance: '0',
        formattedBalance: token.symbol === 'MON' || token.symbol === 'CHOG' ? 'Loading...' : '0',
        isLoading: token.symbol === 'MON' || token.symbol === 'CHOG',
      })));

      setNftBalances(KNOWN_NFTS.map(nft => ({
        ...nft,
        ownedTokens: [],
        totalOwned: 0,
        isLoading: true,
      })));

      // Fetch MON balance immediately and update UI
      const monToken = KNOWN_TOKENS.find(t => t.symbol === 'MON');
      if (monToken) {
        fetchTokenBalance(monToken, 0).then(monBalance => {
          setTokenBalances(prev => prev.map(token => 
            token.symbol === 'MON' ? monBalance : token
          ));
        });
      }

      // Fetch all tokens in parallel (no delays)
      const tokenPromises = KNOWN_TOKENS.map(token => fetchTokenBalance(token, 0));
      const tokenResults = await Promise.allSettled(tokenPromises);
      
      const tokenBalancesData = tokenResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // For important tokens, still show them
          const token = KNOWN_TOKENS[index];
          if (token.symbol === 'MON' || token.symbol === 'CHOG') {
            return {
              ...token,
              balance: '0',
              formattedBalance: 'Network Error',
              isLoading: false,
              error: 'Failed to fetch balance',
            };
          }
          return {
            ...KNOWN_TOKENS[index],
            balance: '0',
            formattedBalance: '0',
            isLoading: false,
            error: 'Failed to fetch balance',
          };
        }
      });

      // Fetch NFT balances in parallel
      // console.log('🎯 Starting NFT balance fetch for', KNOWN_NFTS.length, 'collections');
      const nftPromises = KNOWN_NFTS.map(nft => fetchNFTBalance(nft));
      const nftResults = await Promise.allSettled(nftPromises);
      
      // Debug: NFT results
      // console.log('🎯 NFT results:', nftResults.map((result, index) => ({
      //   collection: KNOWN_NFTS[index].name,
      //   status: result.status,
      //   totalOwned: result.status === 'fulfilled' ? result.value.totalOwned : 0
      // })));
      
      const nftBalancesData = nftResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            ...KNOWN_NFTS[index],
            ownedTokens: [],
            totalOwned: 0,
            isLoading: false,
            error: 'Failed to fetch NFT balance',
          };
        }
      });

      setTokenBalances(tokenBalancesData);
      setNftBalances(nftBalancesData);
      
      // Debug: Final NFT balances
      // console.log('✅ Final NFT balances set:', nftBalancesData.map(nft => ({
      //   name: nft.name,
      //   totalOwned: nft.totalOwned,
      //   ownedTokens: nft.ownedTokens
      // })));
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balances when address changes or native balance updates
  useEffect(() => {
    fetchAllBalances();
  }, [address, isConnected, nativeBalance, publicClient]);

  // Refresh function
  const refresh = () => {
    fetchAllBalances();
  };

  return {
    tokenBalances,
    nftBalances,
    isLoading,
    refresh,
  };
} 