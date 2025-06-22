import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
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

  // Mock function to simulate token balance fetching
  const fetchTokenBalance = async (token: KnownToken): Promise<TokenBalance> => {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // For MON (native token), simulate a realistic balance
    if (token.symbol === 'MON') {
      const mockBalance = Math.random() * 100 + 10; // 10-110 MON
      const balanceString = (mockBalance * Math.pow(10, token.decimals)).toString();
      const formattedBalance = formatTokenBalance(balanceString, token.decimals);

      return {
        ...token,
        balance: balanceString,
        formattedBalance,
        isLoading: false,
      };
    }
    
    // For other tokens, mock random balance
    const mockBalance = Math.random() * 10000;
    const balanceString = (mockBalance * Math.pow(10, token.decimals)).toString();
    const formattedBalance = formatTokenBalance(balanceString, token.decimals);

    return {
      ...token,
      balance: balanceString,
      formattedBalance,
      isLoading: false,
    };
  };

  // Mock function to simulate NFT balance fetching
  const fetchNFTBalance = async (nft: KnownNFT): Promise<NFTBalance> => {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Mock random NFT ownership for demonstration
    const totalOwned = Math.floor(Math.random() * 5); // 0-4 NFTs
    const ownedTokens: string[] = [];
    
    for (let i = 0; i < totalOwned; i++) {
      ownedTokens.push((Math.floor(Math.random() * 10000) + 1).toString());
    }

    return {
      ...nft,
      ownedTokens,
      totalOwned,
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

  // Fetch balances when address changes
  useEffect(() => {
    fetchAllBalances();
  }, [address, isConnected]);

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