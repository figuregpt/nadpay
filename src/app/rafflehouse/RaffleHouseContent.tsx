"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Trophy, Search, Clock, Users, Coins, ArrowLeft, Plus, Moon, Sun, Link2, Bell, Ticket, X } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { NADRAFFLE_V7_CONTRACT, useActiveRaffleIdsV7, useTotalRafflesV7, useRaffleV7, formatRaffleV7, formatPriceV7 } from "@/hooks/useNadRaffleV7Contract";
import { createPredictableSecureRaffleId } from "@/lib/linkUtils";
import { getKnownToken, getKnownNFT, isKnownToken, isKnownNFT } from "@/lib/knownAssets";
import { useNFTMetadata } from "@/hooks/useNFTMetadata";
import { useUserRaffles } from "@/hooks/useUserRaffles";
import TwitterProfile from "@/components/TwitterProfile";
import CreatorProfile from "@/components/CreatorProfile";
import { useCreatorProfile, preloadCreatorProfiles } from "@/hooks/useCreatorProfile";
import Navbar from "@/components/Navbar";

interface RaffleItem {
  id: string;
  internalId: number;
  creator: string;
  title: string;
  description: string;
  rewardType: number;
  rewardTokenAddress: string;
  rewardAmount: string;
  rawRewardAmount: bigint; // Raw amount for NFT tokenId
  ticketPaymentToken: string;
  ticketPrice: string;
  maxTickets: number;
  ticketsSold: number;
  status: number;
  expirationTime: number;
  createdAt: number;
  winner?: string; // Winner address for ended raffles
  timeRemaining?: string;
  participantCount?: number;
}

type SortOption = 'newest' | 'ending-soon' | 'most-popular' | 'oldest';
type FilterOption = 'all' | 'active' | 'ended' | 'token-rewards' | 'nft-rewards';

// NFT-aware reward section component
function NFTAwareRewardSection({ raffle }: { raffle: RaffleItem }) {
  // For NFT, we need the raw tokenId (BigInt converted to string)
  const tokenId = raffle.rewardType === 2 ? raffle.rawRewardAmount.toString() : '';
  
  const { metadata, isLoading: nftLoading } = useNFTMetadata(
    raffle.rewardType === 2 ? raffle.rewardTokenAddress : '',
    tokenId
  );

  // Get creator profile to check verification status (cached from preload)
  const { profile: creatorProfile } = useCreatorProfile(raffle.creator);

  const getRewardImage = () => {
    if (raffle.rewardType === 2) {
      // NFT reward
      if (metadata?.image) {
        return metadata.image;
      }
      return createPlaceholderSVG('NFT', '#8B5CF6', '#FFFFFF');
    } else {
      // Token reward
      const token = getKnownToken(raffle.rewardTokenAddress);
      
      if (token?.logo) {
        return token.logo; // Use the actual logo URL from knownAssets
      }
      
      return createPlaceholderSVG(token?.symbol || 'TOKEN', '#3B82F6', '#FFFFFF');
    }
  };

  const getRewardDisplayText = () => {
    // Check if reward has a token address (non-native token)
    if (raffle.rewardTokenAddress && raffle.rewardTokenAddress !== '0x0000000000000000000000000000000000000000') {
      const knownToken = getKnownToken(raffle.rewardTokenAddress);
      const knownNFT = getKnownNFT(raffle.rewardTokenAddress);
      
      if (knownToken) {
        // It's a known ERC-20 token - use rawRewardAmount for amount
        return `${formatPriceV7(raffle.rawRewardAmount)} ${knownToken.symbol}`;
      } else if (knownNFT || raffle.rewardType === 2) {
        // It's a known NFT collection or NFT type
        return '1 NFT';
      } else {
        // Unknown token - use rawRewardAmount for amount
        return `${formatPriceV7(raffle.rawRewardAmount)} TOKEN`;
      }
    } else {
      // Native MON token - use rewardAmount field
      return `${raffle.rewardAmount} MON`;
    }
  };

  const getNFTDisplayName = (raffle: RaffleItem) => {
    if (raffle.rewardType === 2) {
      // For NFT, try to extract name from description or use title
      if (raffle.description) {
        // Look for common NFT patterns like "Collection Name #123"
        const nftPattern = /([^#]+)#?(\d+)?/;
        const match = raffle.description.match(nftPattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return raffle.title || "NFT";
    }
    return "";
  };

  // Base64 encoded SVG placeholders to avoid external requests
  const createPlaceholderSVG = (text: string, bgColor: string, textColor: string) => {
    const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${bgColor}" rx="8"/>
      <text x="32" y="38" font-family="Arial, sans-serif" font-size="10" font-weight="bold" 
            text-anchor="middle" fill="${textColor}">${text}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };



  return (
    <>
      {/* Reward Image - Square with Hover Overlay and Verified Badge */}
      <div className="mb-4 relative group">
        <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-700 flex items-center justify-center relative">
          {raffle.rewardType === 2 && nftLoading ? (
            // NFT Loading state with standard spinner
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
          ) : (
            <img 
              src={getRewardImage()} 
              alt={raffle.rewardType === 2 ? 'NFT Reward' : 'Token Reward'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = createPlaceholderSVG(
                  raffle.rewardType === 2 ? 'NFT' : 'TOKEN', 
                  '#6B7280', 
                  '#FFFFFF'
                );
              }}
            />
          )}
          
          {/* Verified Badge - Top Left of Image (if Twitter is connected) */}
          {creatorProfile && (
            <div className="absolute top-2 left-2 bg-blue-500 rounded-full p-1 shadow-lg z-20 border-2 border-white">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}

          {/* Winner Badge - Bottom of Image (if raffle has winner) */}
          {raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-600 to-green-500 text-white p-2 z-20">
              <div className="flex items-center justify-center space-x-1">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold">Winner: {raffle.winner.slice(0, 6)}...{raffle.winner.slice(-4)}</span>
              </div>
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
            <button className="px-3 py-2 bg-white text-gray-900 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg text-sm">
              View Raffle
            </button>
          </div>
        </div>
      </div>

      {/* Status Badge Only */}
      <div className="flex justify-center mb-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          raffle.status === 2 && raffle.ticketsSold === 0
            ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            : raffle.ticketsSold >= raffle.maxTickets 
            ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
            : raffle.timeRemaining === 'Ended' || raffle.status === 1 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
        }`}>
          {raffle.status === 2 && raffle.ticketsSold === 0
            ? 'Refunded'
            : raffle.ticketsSold >= raffle.maxTickets 
            ? 'Sold Out' 
            : raffle.timeRemaining === 'Ended' || raffle.status === 1 
              ? 'Ended' 
              : 'Active'}
        </span>
      </div>
    </>
  );
}

export default function RaffleHouseContent() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  const [raffles, setRaffles] = useState<RaffleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('ending-soon');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreRaffles, setHasMoreRaffles] = useState(true);
  const RAFFLES_PER_PAGE = 12; // Smaller batch size
  
  // Infinite scroll ref
  const infiniteScrollRef = useRef<HTMLDivElement>(null);
  
  // Notifications and My Tickets state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'active' | 'ended'>('all');
  
  // User raffles hook
  const { 
    userTickets, 
    notifications, 
    getUnreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification 
  } = useUserRaffles(address);

  const { data: totalRaffles } = useTotalRafflesV7();

  // Helper functions
  const getTimeRemaining = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    if (seconds > 0) return `${seconds}s`;
    return 'Ending soon';
  };

  const getRewardToken = (raffle: RaffleItem) => {
    if (raffle.rewardTokenAddress === '0x0000000000000000000000000000000000000000') {
      return { symbol: 'MON', name: 'Monad', logo: '/monad-logo.svg' };
    }
    const token = getKnownToken(raffle.rewardTokenAddress);
    return token || { symbol: 'TOKEN', name: 'Unknown Token', logo: undefined };
  };

  const getRewardDisplay = (raffle: RaffleItem) => {
    // Check if reward has a token address (non-native token)
    if (raffle.rewardTokenAddress && raffle.rewardTokenAddress !== '0x0000000000000000000000000000000000000000') {
      const knownToken = getKnownToken(raffle.rewardTokenAddress);
      const knownNFT = getKnownNFT(raffle.rewardTokenAddress);
      
      if (knownToken) {
        // It's a known ERC-20 token - use rawRewardAmount for amount (which is rewardTokenId in contract)
        return `${formatPriceV7(raffle.rawRewardAmount)} ${knownToken.symbol}`;
      } else if (knownNFT || raffle.rewardType === 2) {
        // It's a known NFT collection or NFT type
        return "1 NFT";
      } else {
        // Unknown token - use rawRewardAmount for amount
        return `${formatPriceV7(raffle.rawRewardAmount)} TOKEN`;
      }
    } else {
      // Native MON token - use rewardAmount field
      return `${raffle.rewardAmount} MON`;
    }
  };

  const getNFTDisplayName = (raffle: RaffleItem) => {
    if (raffle.rewardType === 2) {
      // For NFT, try to extract name from description or use title
      if (raffle.description) {
        // Look for common NFT patterns like "Collection Name #123"
        const nftPattern = /([^#]+)#?(\d+)?/;
        const match = raffle.description.match(nftPattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return raffle.title || "NFT";
    }
    return "";
  };

  // Base64 encoded SVG placeholders to avoid external requests
  const createPlaceholderSVG = (text: string, bgColor: string, textColor: string) => {
    const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${bgColor}" rx="8"/>
      <text x="32" y="38" font-family="Arial, sans-serif" font-size="10" font-weight="bold" 
            text-anchor="middle" fill="${textColor}">${text}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const getRewardImage = (raffle: RaffleItem) => {
    if (raffle.rewardType === 2) {
      // NFT - try to use IPFS hash if available, otherwise use NFT placeholder
      if (raffle.description && raffle.description.includes('ipfs://')) {
        const ipfsMatch = raffle.description.match(/ipfs:\/\/([a-zA-Z0-9]+)/);
        if (ipfsMatch) {
          return `https://ipfs.io/ipfs/${ipfsMatch[1]}`;
        }
      }
      return createPlaceholderSVG('NFT', '#8B5CF6', '#FFFFFF');
    } else {
      // Token - use token logo or create placeholder
      const token = getRewardToken(raffle);
      
      if (token.logo) {
        return token.logo; // Use the actual logo URL from knownAssets
      }
      
      return createPlaceholderSVG(token.symbol, '#3B82F6', '#FFFFFF');
    }
  };

  const getPaymentToken = (raffle: RaffleItem) => {
    if (raffle.ticketPaymentToken === '0x0000000000000000000000000000000000000000') {
      return { symbol: 'MON', name: 'Monad', logo: '/monad-logo.svg' };
    }
    const token = getKnownToken(raffle.ticketPaymentToken);
    return token || { symbol: 'TOKEN', name: 'Unknown Token', logo: undefined };
  };

  // Helper function to get raffle status for UI display
  const getRaffleDisplayStatus = (raffle: RaffleItem) => {
    const now = currentTime;
    const isExpired = now > raffle.expirationTime * 1000;
    const isSoldOut = raffle.ticketsSold >= raffle.maxTickets;
    const hasTickets = raffle.ticketsSold > 0;
    const hasWinner = raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000';

    // Priority order: Winner > Sold Out > Expired states > Active
    if (hasWinner) {
      return {
        status: 'winner-selected',
        label: 'Winner Selected',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        icon: 'trophy'
      };
    }

    if (isSoldOut && !isExpired) {
      return {
        status: 'sold-out',
        label: 'Sold Out',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        icon: 'clock'
      };
    }

    if (isExpired) {
      if (hasTickets) {
        // Expired with tickets -> selecting winner
        return {
          status: 'selecting-winner',
          label: 'Selecting Winner',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: 'refresh'
        };
      } else {
        // Expired with no tickets -> refunded
        return {
          status: 'refunded',
          label: 'Refunded',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: 'arrow-left'
        };
      }
    }

    // Active raffle
    return {
      status: 'active',
      label: 'Active',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      icon: 'clock'
    };
  };

  // Fetch raffles with pagination - wrapped in useCallback for dependencies
  const fetchRafflesPage = useCallback(async (page = 0, append = false) => {
    if (page === 0) setLoading(true);
    else setLoadingMore(true);
    
    try {
      if (!totalRaffles || Number(totalRaffles) === 0) {
        setRaffles([]);
        return;
      }

      const totalCount = Number(totalRaffles);
      const startIndex = Math.max(0, totalCount - 1 - (page * RAFFLES_PER_PAGE));
      const endIndex = Math.max(0, totalCount - 1 - ((page + 1) * RAFFLES_PER_PAGE - 1));
      
      // If no more raffles to load
      if (startIndex < 0) {
        return;
      }

      const rafflePromises = [];
      
      // Load in smaller batches to avoid overwhelming the RPC
      for (let i = startIndex; i >= endIndex; i--) {
        const promise = publicClient?.readContract({
                  address: NADRAFFLE_V7_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_V7_CONTRACT.abi,
          functionName: 'getRaffleDetails',
          args: [BigInt(i)],
        });
        rafflePromises.push(promise);
      }

      const raffleResults = await Promise.all(rafflePromises);
      const formattedRaffles = raffleResults
        .map((result: any, index: number) => {
          if (!result) return null;
          
          const raffleId = startIndex - index;
          const expirationTimeMs = Number(result.endTime) * 1000;
          const now = Date.now();
          const timeLeft = expirationTimeMs - now;
          
          // V7 contract returns: [creator, ticketPrice, ticketPaymentToken, maxTickets, soldTickets, startTime, endTime, rewardAmount, rewardType, rewardTokenAddress, rewardTokenId, state, winner]
          
          // Auto-generate title and description for V7
          const rewardType = Number(result.rewardType);
          
          // Smart reward display based on known assets
          let autoTitle = "";
          if (result.rewardTokenAddress && result.rewardTokenAddress !== '0x0000000000000000000000000000000000000000') {
            const knownToken = getKnownToken(result.rewardTokenAddress);
            const knownNFT = getKnownNFT(result.rewardTokenAddress);
            
            if (knownToken) {
              // It's a known ERC-20 token - use rewardTokenId for amount
              autoTitle = `Win ${formatPriceV7(result.rewardTokenId)} ${knownToken.symbol}`;
            } else if (knownNFT || rewardType === 2) {
              // It's a known NFT collection or NFT type
              autoTitle = `Win NFT #${result.rewardTokenId?.toString() || '???'}`;
            } else {
              // Unknown token - use rewardTokenId for amount
              autoTitle = `Win ${formatPriceV7(result.rewardTokenId)} TOKEN`;
            }
          } else {
            // Native MON token - use rewardAmount
            autoTitle = `Win ${formatPriceV7(result.rewardAmount)} MON`;
          }
          
          const autoDescription = `V7 Multi-Token Raffle - ${autoTitle}`;
          
          const secureId = createPredictableSecureRaffleId(raffleId);
          console.log(`🔗 V7 Raffle ${raffleId} -> Secure ID: ${secureId}`);
          
          return {
            id: secureId,
            internalId: raffleId,
            creator: result.creator,
            title: autoTitle,
            description: autoDescription,
            rewardType: rewardType,
            rewardTokenAddress: result.rewardTokenAddress,
            rewardAmount: formatPriceV7(result.rewardAmount),
            rawRewardAmount: result.rewardTokenId, // Use rewardTokenId for ERC20 amount / NFT tokenId
            ticketPaymentToken: result.ticketPaymentToken || '0x0000000000000000000000000000000000000000', // V7 supports any token
            ticketPrice: formatPriceV7(result.ticketPrice),
            maxTickets: Number(result.maxTickets),
            ticketsSold: Number(result.soldTickets),
            status: Number(result.state),
            expirationTime: Number(result.endTime),
            createdAt: Number(result.startTime),
            winner: result.winner !== '0x0000000000000000000000000000000000000000' ? result.winner : undefined,
            timeRemaining: timeLeft > 0 ? getTimeRemaining(timeLeft) : 'Ended',
            participantCount: Number(result.soldTickets),
          };
        })
        .filter(raffle => raffle !== null) as RaffleItem[];

      if (append) {
        setRaffles(prev => [...prev, ...formattedRaffles]);
      } else {
        setRaffles(formattedRaffles);
        setCurrentPage(0);
        setHasMoreRaffles(true); // Reset when fetching first page
      }
      
      // Check if we have more raffles to load
      if (formattedRaffles.length < RAFFLES_PER_PAGE) {
        setHasMoreRaffles(false);
      }
      
      // Only preload creator profiles for currently visible raffles
      if (formattedRaffles.length > 0) {
        const creatorAddresses = formattedRaffles.slice(0, 6).map(raffle => raffle.creator); // Only first 6
        preloadCreatorProfiles(creatorAddresses);
      }
      
    } catch (error) {
      console.error('Error fetching raffles:', error);
      if (!append) setRaffles([]);
    } finally {
      if (page === 0) setLoading(false);
      else setLoadingMore(false);
    }
  }, [publicClient, totalRaffles]);

  // Load more raffles function
  const loadMoreRaffles = () => {
    if (!loadingMore && !loading && hasMoreRaffles && publicClient && totalRaffles) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchRafflesPage(nextPage, true);
    }
  };

  useEffect(() => {
    if (publicClient && totalRaffles) {
      fetchRafflesPage(0, false);
    }
  }, [publicClient, totalRaffles, fetchRafflesPage]);

  // Optimized timer with raffle auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
      
      // Auto-refresh raffle data every 30 seconds (6 cycles)
      const shouldRefreshRaffles = Date.now() % 30000 < 5000; // Every 30 seconds
      if (shouldRefreshRaffles && publicClient && totalRaffles && !loading) {
        console.log('🔄 Auto-refreshing raffles for winner updates...');
        fetchRafflesPage(0, false);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(timer);
  }, [publicClient, totalRaffles, loading, fetchRafflesPage]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loadingMore && !loading && hasMoreRaffles) {
          loadMoreRaffles();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Start loading 100px before reaching the bottom
      }
    );

    if (infiniteScrollRef.current) {
      observer.observe(infiniteScrollRef.current);
    }

    return () => {
      if (infiniteScrollRef.current) {
        observer.unobserve(infiniteScrollRef.current);
      }
    };
  }, [loadingMore, loading, hasMoreRaffles]);

  // Filter and sort raffles
  const filteredAndSortedRaffles = useMemo(() => {
    let filtered = raffles;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(raffle =>
        raffle.title.toLowerCase().includes(query) ||
        raffle.description.toLowerCase().includes(query) ||
        raffle.creator.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (filterBy) {
      case 'active':
        filtered = filtered.filter(raffle => raffle.status === 0 && raffle.timeRemaining !== 'Ended');
        break;
      case 'ended':
        filtered = filtered.filter(raffle => raffle.status === 1 || raffle.timeRemaining === 'Ended');
        break;
      case 'token-rewards':
        filtered = filtered.filter(raffle => raffle.rewardType === 0);
        break;
      case 'nft-rewards':
        filtered = filtered.filter(raffle => raffle.rewardType === 2);
        break;
      // 'all' - no additional filtering
    }

    // Apply sorting
    switch (sortBy) {
      case 'ending-soon':
        filtered.sort((a, b) => {
          // Active raffles first, sorted by expiration time
          if (a.status === 0 && b.status !== 0) return -1;
          if (a.status !== 0 && b.status === 0) return 1;
          if (a.status === 0 && b.status === 0) {
            return a.expirationTime - b.expirationTime;
          }
          return b.createdAt - a.createdAt;
        });
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'most-popular':
        filtered.sort((a, b) => b.ticketsSold - a.ticketsSold);
        break;
    }

    // Default sorting for "All Raffles" should be newest first
    if (filterBy === 'all' && sortBy === 'ending-soon') {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    return filtered;
  }, [raffles, searchQuery, filterBy, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Navigation */}
      <Navbar 
        userTickets={userTickets} 
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero Section */}
        <section className="py-12 px-4 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-dark-900 dark:to-primary-950 rounded-xl mb-8">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
                      >
            <h1 className="text-display-lg md:text-display-xl font-inter text-gray-900 dark:text-white mb-4">
              Welcome to <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">RaffleHouse</span>
            </h1>
            <p className="text-body-xl font-inter text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join exciting raffles from creators around the world. Win tokens, NFTs, and exclusive rewards on Monad blockchain.
            </p>
            
            <div className="flex justify-center">
              <Link
                href="/rafflehouse/create"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-opacity text-body-lg font-inter font-semibold flex items-center justify-center shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Raffle
              </Link>
            </div>

          </motion.div>
        </div>
      </section>

      {/* Browse Section */}
        <section id="browse" className="py-12">
        <div className="container mx-auto">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search raffles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  className="px-4 py-3 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Raffles</option>
                  <option value="active">Active Only</option>
                  <option value="ended">Ended</option>
                  <option value="token-rewards">Token Rewards</option>
                  <option value="nft-rewards">NFT Rewards</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-3 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ending-soon">Ending Soon</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="most-popular">Most Popular</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAndSortedRaffles.length} raffle{filteredAndSortedRaffles.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Raffles Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-dark-700 animate-pulse">
                  <div className="aspect-square bg-gray-200 dark:bg-dark-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedRaffles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No raffles found' : 'No raffles yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery 
                  ? `No raffles match "${searchQuery}" with current filters`
                  : 'Be the first to create a raffle on RaffleHouse!'
                }
              </p>
              {!searchQuery && (
                <Link
                  href="/rafflehouse/create"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Raffle
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedRaffles.map((raffle) => (
                <motion.div
                  key={raffle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-fit"
                >
                  <div className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-200 group h-full flex flex-col">
                    {/* Clickable area for raffle details */}
                    <Link href={`/raffle/${createPredictableSecureRaffleId(raffle.internalId)}`} className="flex flex-col h-full cursor-pointer">
                      <NFTAwareRewardSection raffle={raffle} />

                      {/* Reward Display - Main Focus */}
                      <div className="mb-3 text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Prize</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {raffle.rewardType === 2 ? (
                            <div>
                              <div className="text-2xl font-bold">
                                {(() => {
                                  // Get token ID from rawRewardAmount (this is the actual NFT token ID)
                                  const tokenId = raffle.rawRewardAmount ? raffle.rawRewardAmount.toString() : "";
                                  
                                  // Determine collection name based on contract address
                                  let collectionName = "NFT";
                                  let tokenDisplay = tokenId;
                                  
                                  // Check if it's Nad Name Service
                                  if (raffle.rewardTokenAddress.toLowerCase() === "0x3019bf1dfb84e5b46ca9d0eec37de08a59a41308") {
                                    collectionName = "Nad Name Service";
                                    tokenDisplay = `m${tokenId}.nad`;
                                  } else {
                                    // For other NFTs, use generic format
                                    collectionName = "NFT Collection";
                                    tokenDisplay = `#${tokenId}`;
                                  }
                                  
                                  return collectionName;
                                })()}
                              </div>
                              <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                                {(() => {
                                  const tokenId = raffle.rawRewardAmount ? raffle.rawRewardAmount.toString() : "";
                                  
                                  // Check if it's Nad Name Service
                                  if (raffle.rewardTokenAddress.toLowerCase() === "0x3019bf1dfb84e5b46ca9d0eec37de08a59a41308") {
                                    return `m${tokenId}.nad`;
                                  } else {
                                    return `#${tokenId}`;
                                  }
                                })()}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                                NFT Reward
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-2xl font-bold">{getRewardDisplay(raffle)}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                                Token Reward
                              </div>
                            </div>
                          )}
                        </h3>
                      </div>

                      {/* Creator Profile - More Compact */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created by</div>
                        <CreatorProfile creatorAddress={raffle.creator} preventLink={true} />
                      </div>



                      {/* Stats Row - More Compact */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-2.5">
                          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-xs mb-0.5">
                            <Coins className="w-3 h-3" />
                            <span>Price</span>
                          </div>
                          <div className="font-bold text-xs text-gray-900 dark:text-white">
                            {raffle.ticketPrice} {getPaymentToken(raffle).symbol}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-2.5">
                          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-xs mb-0.5">
                            <Users className="w-3 h-3" />
                            <span>Sold</span>
                          </div>
                          <div className="font-bold text-xs text-gray-900 dark:text-white">
                            {raffle.ticketsSold}/{raffle.maxTickets}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar - Compact */}
                      <div className="mb-2">
                        <div className="bg-gray-200 dark:bg-dark-700 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min((raffle.ticketsSold / raffle.maxTickets) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {Math.round((raffle.ticketsSold / raffle.maxTickets) * 100)}% sold
                        </div>
                      </div>

                      {/* Status Section - Bottom Aligned */}
                      <div className="mt-auto">
                        {raffle.timeRemaining !== 'Ended' && raffle.status === 0 && raffle.ticketsSold < raffle.maxTickets && (
                          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                                <Clock className="w-3 h-3" />
                                <div>
                                  <div className="text-xs text-orange-500 dark:text-orange-400">Time Left</div>
                                  <div className="font-bold text-xs">
                                    {(() => {
                                      const timeLeft = (raffle.expirationTime * 1000) - currentTime;
                                      return timeLeft > 0 ? getTimeRemaining(timeLeft) : 'Ended';
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/raffle/${createPredictableSecureRaffleId(raffle.internalId)}`;
                                }}
                                className="px-2 py-1 bg-primary-500 hover:bg-primary-600 text-white text-xs rounded font-medium transition-colors"
                              >
                                Buy Ticket
                              </button>
                            </div>
                          </div>
                        )}

                        {(() => {
                          const displayStatus = getRaffleDisplayStatus(raffle);
                          
                          // Only show status card for non-active raffles
                          if (displayStatus.status === 'active') {
                            return null;
                          }

                          // Render appropriate icon
                          const renderIcon = () => {
                            switch (displayStatus.icon) {
                              case 'trophy':
                                return <Trophy className="w-3 h-3" />;
                              case 'refresh':
                                return (
                                  <div className="animate-spin">
                                    <Clock className="w-3 h-3" />
                                  </div>
                                );
                              case 'arrow-left':
                                return <ArrowLeft className="w-3 h-3" />;
                              default:
                                return <Clock className="w-3 h-3" />;
                            }
                          };

                          return (
                            <div className={`border rounded-lg p-2 ${displayStatus.bgColor}`}>
                              <div className={`flex items-center space-x-2 ${displayStatus.color}`}>
                                {renderIcon()}
                                <div>
                                  <div className="text-xs">Status</div>
                                  <div className="font-bold text-xs">
                                    {displayStatus.label}
                                    {displayStatus.status === 'selecting-winner' && (
                                      <div className="text-xs opacity-75 mt-0.5">
                                        Winner will be announced shortly! ⚡
                                      </div>
                                    )}
                                    {displayStatus.status === 'refunded' && (
                                      <div className="text-xs opacity-75 mt-0.5">
                                        Reward returned to creator
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          {!loading && filteredAndSortedRaffles.length > 0 && (
            <div ref={infiniteScrollRef} className="h-20 flex items-center justify-center mt-8">
              {loadingMore && hasMoreRaffles ? (
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                  <span>Loading more raffles...</span>
                </div>
              ) : !hasMoreRaffles ? (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-sm">🎉 You've reached the end!</div>
                  <div className="text-xs mt-1">No more raffles to load</div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed top-16 right-4 z-50 w-96 max-w-[90vw] bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-xl">
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                {getUnreadCount() > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-dark-700 last:border-b-0 ${
                    !notification.read ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            notification.type === 'winner'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {notification.type === 'winner' ? 'Winner' : 'Ended'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mb-2">
                        {notification.message}
                      </p>
                      <Link
                        href={`/raffle/${createPredictableSecureRaffleId(notification.raffleId)}`}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                        onClick={() => {
                          markAsRead(notification.id);
                          setShowNotifications(false);
                        }}
                      >
                        View Raffle
                      </Link>
                    </div>
                    <button
                      onClick={() => clearNotification(notification.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* My Tickets Dropdown */}
      {showMyTickets && (
        <div className="fixed top-16 right-4 z-50 w-96 max-w-[90vw] bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-xl">
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Tickets</h3>
              <button
                onClick={() => setShowMyTickets(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex space-x-2 mb-3">
              <button
                onClick={() => setTicketFilter('all')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  ticketFilter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTicketFilter('active')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  ticketFilter === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setTicketFilter('ended')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  ticketFilter === 'ended'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                Ended
              </button>
            </div>
            
            {/* View All Link */}
            <Link
              href="/dashboard"
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              onClick={() => setShowMyTickets(false)}
            >
              View all tickets in Dashboard →
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {(() => {
              // Filter tickets
              const filteredTickets = userTickets.filter(ticket => {
                if (ticketFilter === 'active') return ticket.status === 0;
                if (ticketFilter === 'ended') return ticket.status === 1;
                return true; // all
              });
              
              // Limit to last 20 tickets
              const limitedTickets = filteredTickets.slice(0, 20);
              
              return limitedTickets.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>
                    {ticketFilter === 'all' 
                      ? 'No tickets purchased yet'
                      : `No ${ticketFilter} tickets`
                    }
                  </p>
                  {ticketFilter === 'all' && (
                    <Link
                      href="/rafflehouse"
                      className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                      onClick={() => setShowMyTickets(false)}
                    >
                      Browse raffles
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {limitedTickets.map((ticket) => (
                    <div key={ticket.raffleId} className="p-4 border-b border-gray-100 dark:border-dark-700 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {ticket.raffleName}
                            </h4>
                            {ticket.isWinner && (
                              <span className="text-xs bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
                                Winner! 🎉
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <span>{ticket.ticketCount} ticket{ticket.ticketCount !== 1 ? 's' : ''}</span>
                            <span
                              className={`px-2 py-1 rounded-full ${
                                ticket.status === 0
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                            >
                              {ticket.status === 0 ? 'Active' : 'Ended'}
                            </span>
                          </div>
                          
                          {ticket.isWinner && (
                            <div className="mb-2">
                              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded">
                                Reward sent ✅
                              </span>
                            </div>
                          )}
                          
                          <Link
                            href={`/raffle/${createPredictableSecureRaffleId(ticket.raffleId)}`}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            onClick={() => setShowMyTickets(false)}
                          >
                            View Raffle
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredTickets.length > 20 && (
                    <div className="p-4 text-center border-t border-gray-200 dark:border-dark-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Showing 20 of {filteredTickets.length} {ticketFilter} tickets
                      </p>
                      <Link
                        href="/dashboard"
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                        onClick={() => setShowMyTickets(false)}
                      >
                        View all in Dashboard →
                      </Link>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showNotifications || showMyTickets) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowMyTickets(false);
          }}
        />
      )}
    </div>
  );
} 