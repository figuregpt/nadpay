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
    const balanceNumber = parseFloat(balance) / Math.pow(10, decimals);
    
    if (balanceNumber === 0) return '0';
    if (balanceNumber < 0.0001) return '< 0.0001';
    if (balanceNumber < 1) return balanceNumber.toFixed(4);
    if (balanceNumber < 1000) return balanceNumber.toFixed(2);
    if (balanceNumber < 1000000) return `${(balanceNumber / 1000).toFixed(1)}K`;
    return `${(balanceNumber / 1000000).toFixed(1)}M`;
  };

  // Real function to fetch token balance
  const fetchTokenBalance = async (token: KnownToken): Promise<TokenBalance> => {
    // For MON (native token), use real balance from wagmi
    if (token.symbol === 'MON') {
      console.log('Fetching MON balance...', {
        nativeBalance: nativeBalance?.formatted,
        nativeBalanceValue: nativeBalance?.value.toString(),
        isNativeLoading
      });
      
      if (nativeBalance) {
        const balanceString = nativeBalance.value.toString();
        const formattedBalance = nativeBalance.formatted;

        console.log('MON balance found:', {
          raw: balanceString,
          formatted: formattedBalance,
          decimals: token.decimals
        });

        return {
          ...token,
          balance: balanceString,
          formattedBalance: parseFloat(formattedBalance).toFixed(4),
          isLoading: false,
        };
      } else {
        console.log('No MON balance or still loading');
        return {
          ...token,
          balance: '0',
          formattedBalance: '0.0000',
          isLoading: isNativeLoading,
        };
      }
    }
    
    // For other tokens, try to fetch real balance from contract
    if (publicClient && address && token.address !== "0x0000000000000000000000000000000000000000") {
      try {
        console.log(`Fetching ${token.symbol} balance from contract ${token.address}...`);
        
        const balance = await publicClient.readContract({
          address: token.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        });
        
        const balanceString = balance.toString();
        const formattedBalance = formatTokenBalance(balanceString, token.decimals);
        
        console.log(`${token.symbol} balance:`, {
          raw: balanceString,
          formatted: formattedBalance
        });

        return {
          ...token,
          balance: balanceString,
          formattedBalance,
          isLoading: false,
        };
      } catch (error) {
        console.warn(`Failed to fetch ${token.symbol} balance:`, error);
        return {
          ...token,
          balance: '0',
          formattedBalance: '0',
          isLoading: false,
          error: `Failed to fetch balance: ${error}`,
        };
      }
    }

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
    // For now, return zero ownership since we don't have real NFT contracts deployed
    // This can be implemented when real NFT contracts are available
    if (publicClient && address && nft.address !== "0x0000000000000000000000000000000000000000") {
      try {
        console.log(`Fetching ${nft.name} NFT balance from contract ${nft.address}...`);
        
        const balance = await publicClient.readContract({
          address: nft.address as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        });
        
        const totalOwned = Number(balance);
        const ownedTokens: string[] = [];
        
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
        
        console.log(`${nft.name} NFT balance:`, {
          totalOwned,
          ownedTokens
        });

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
    if (!address || !isConnected) {
      // Initialize empty balances when not connected
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

    setIsLoading(true);

    try {
      // Initialize with loading state
      setTokenBalances(KNOWN_TOKENS.map(token => ({
        ...token,
        balance: '0',
        formattedBalance: '0',
        isLoading: true,
      })));

      setNftBalances(KNOWN_NFTS.map(nft => ({
        ...nft,
        ownedTokens: [],
        totalOwned: 0,
        isLoading: true,
      })));

      // Fetch token balances
      const tokenPromises = KNOWN_TOKENS.map(token => fetchTokenBalance(token));
      const tokenResults = await Promise.allSettled(tokenPromises);
      
      const tokenBalancesData = tokenResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            ...KNOWN_TOKENS[index],
            balance: '0',
            formattedBalance: '0',
            isLoading: false,
            error: 'Failed to fetch balance',
          };
        }
      });

      // Fetch NFT balances
      const nftPromises = KNOWN_NFTS.map(nft => fetchNFTBalance(nft));
      const nftResults = await Promise.allSettled(nftPromises);
      
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