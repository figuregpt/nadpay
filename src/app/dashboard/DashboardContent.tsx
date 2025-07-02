"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { 
  Wallet, 
  Link2, 
  ArrowLeft, 
  ShoppingCart, 
  Users, 
  Copy,
  ExternalLink,
  DollarSign,
  XCircle,
  Search,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Trophy
} from "lucide-react";
import { useAccount, usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { ConnectKitButton } from "connectkit";
import { useCreatorLinksV2, useDeactivatePaymentLinkV2, formatPaymentLinkV2, formatPriceV2, useTotalLinksV2 } from "@/hooks/useNadPayV2Contract";

// V2 ABI - sadece gerekli fonksiyonlar
const NADPAY_V2_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "linkId",
        "type": "uint256"
      }
    ],
    "name": "getPurchases",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "txHash",
            "type": "bytes32"
          }
        ],
        "internalType": "struct NadPayV2.Purchase[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
import { useCreatorRafflesV6, formatRaffleV6, formatPriceV6, RaffleInfoV6, RAFFLE_STATES_V6 } from "@/hooks/useNadRaffleV6Contract";
import { NADPAY_CONTRACT } from "@/lib/contract";
import { createPredictableSecureRaffleId } from "@/lib/linkUtils";
import { getKnownToken, getKnownNFT } from "@/lib/knownAssets";
import { useUserRaffles } from "@/hooks/useUserRaffles";
import TwitterProfile from "@/components/TwitterProfile";
import Navbar from "@/components/Navbar";

interface PaymentLinkData {
  linkId: string;
  _id: string;
  creator: string;
  title: string;
  description?: string; // Optional since removed in ultra-secure contract
  coverImage?: string; // Optional since removed in ultra-secure contract
  price: string;
  paymentToken: string; // New field for V2
  paymentTokenSymbol?: string; // Helper field
  totalSales: bigint;
  maxPerWallet: bigint;
  salesCount: bigint;
  totalEarned: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: bigint;
  creatorAddress: string;
  purchases: unknown[];
  uniqueBuyersCount?: number;
}

interface RaffleData {
  id: string;
  creator: string;
  title: string;
  description: string;
  rewardType: number;
  rewardAmount: string;
  rewardTokenAddress?: string; // Add this for token info
  ticketPrice: string;
  maxTickets: bigint;
  ticketsSold: bigint;
  totalEarned: string;
  status: number; // 0 = ACTIVE, 1 = ENDED, 2 = CANCELLED
  createdAt: string;
  expirationTime: bigint;
  winner?: string;
}

interface PurchaseData {
  _id: string;
  linkId: string;
  buyerAddress: string;
  creatorAddress: string;
  linkTitle: string;
  linkDescription?: string;
  price: string;
  paymentToken: string;
  paymentTokenSymbol?: string;
  quantity: number;
  totalPaid: string;
  purchaseDate: string;
  transactionHash: string;
  linkStatus: 'active' | 'expired' | 'inactive';
}

export default function DashboardContent() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const searchParams = useSearchParams();
  
  // Contract constants - V2 Ultra-Secure
  const CONTRACT_ADDRESS = "0xfeF2c348d0c8a14b558df27034526d87Ac1f9f25" as `0x${string}`;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'payment-links' | 'raffles' | 'my-tickets' | 'my-payments'>('payment-links');
  
  // Error and success states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // My Payments states
  const [myPurchases, setMyPurchases] = useState<PurchaseData[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseData[]>([]);
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState("");
  const [purchasePage, setPurchasePage] = useState(1);
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  
  // User points states for leaderboard stats
  const [userPoints, setUserPoints] = useState<any>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState<PaymentLinkData | null>(null);
  const [participantsSearchQuery, setParticipantsSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [participantsPerPage] = useState(20);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  
  // Pagination states
  const [paymentLinksPage, setPaymentLinksPage] = useState(1);
  const [rafflesPage, setRafflesPage] = useState(1);
  const [myTicketsPage, setMyTicketsPage] = useState(1);
  const itemsPerPage = 5;
  
  // Create secure link ID using internal ID + creator address as seed
  const createSecureLinkId = (internalId: number, creatorAddress: string): string => {
    // Use creator address as seed to ensure consistency
    const addressSeed = parseInt(creatorAddress.slice(-8), 16); // Last 8 chars of address as number
    const combined = `${internalId}_${addressSeed}_nadpay`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${addressSeed}_${Math.abs(hash).toString(16).slice(0, 8)}`;
  };
  
  // Contract hooks - Load all data immediately for better UX
  const { data: creatorLinksData, isLoading: loadingLinks, refetch, error: linksError } = useCreatorLinksV2(
    address, 
    true
  );
  const { data: totalLinks, error: totalLinksError } = useTotalLinksV2();
  
  // Debug logging
  console.log('🔍 Dashboard Debug:', {
    address,
    isConnected,
    creatorLinksData,
    loadingLinks,
    linksError: linksError?.message,
    totalLinks: totalLinks?.toString(),
    totalLinksError: totalLinksError?.message,
    contractAddress: CONTRACT_ADDRESS
  });
  // V6 contract - raffle hooks (load immediately)
  const {
    data: creatorRafflesData,
    isLoading: loadingRaffles,
    refetch: refetchRaffles,
  } = useCreatorRafflesV6(address);
  
  // Debug logging for raffles
  console.log('🎫 Raffle Debug: V6 hooks enabled', {
    creatorRafflesData,
    loadingRaffles
  });

  // Handle URL parameters for errors and success messages
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const handle = searchParams.get('handle');

    if (error) {
      switch (error) {
        case 'twitter_already_connected':
          setErrorMessage(
            handle 
              ? `Twitter account @${handle} is already connected to another wallet. Please disconnect it first to connect to this wallet.`
              : 'This Twitter account is already connected to another wallet. Please disconnect it first.'
          );
          break;
        case 'auth_failed':
          setErrorMessage('Twitter authentication failed. Please try again.');
          break;
        case 'token_failed':
          setErrorMessage('Failed to get Twitter access token. Please try again.');
          break;
        case 'user_failed':
          setErrorMessage('Failed to get Twitter user information. Please try again.');
          break;
        case 'callback_failed':
          setErrorMessage('Twitter connection failed. Please try again.');
          break;
        default:
          setErrorMessage('An error occurred during Twitter connection.');
      }
    }

    if (success) {
      switch (success) {
        case 'twitter_connected':
          setSuccessMessage('Twitter account connected successfully!');
          break;
        default:
          setSuccessMessage('Operation completed successfully!');
      }
    }

    // Clear messages after 10 seconds
    if (error || success) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Fetch user points and rank
  const fetchUserPoints = async () => {
    if (!address) return;
    
    setLoadingStats(true);
    try {
      const response = await fetch(`/api/points/${address}`);
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data);
        
        // Fetch leaderboard to get user rank
        const leaderboardResponse = await fetch('/api/leaderboard?limit=100');
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          const userInLeaderboard = leaderboardData.find(
            (user: any) => user.walletAddress.toLowerCase() === address.toLowerCase()
          );
          setUserRank(userInLeaderboard?.rank || null);
        }
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchUserPoints();
    }
  }, [address]);

  // Stats formatting helper
  const formatStatsPoints = (points: number) => {
    return points ? points.toFixed(1) : '0.0';
  };

  // Get my purchases from existing payment links data
  const fetchMyPurchases = async () => {
    if (!address || !publicClient || !paymentLinks || paymentLinks.length === 0) {
      return;
    }
    
    setLoadingPurchases(true);
    
    try {
      const allPurchases: PurchaseData[] = [];
      
      // Check each payment link for purchases by this address
      for (const link of paymentLinks) {
        try {
          // Get purchases for this payment link using same system as participants
          const purchases = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: NADPAY_V2_ABI,
            functionName: 'getPurchases',
            args: [BigInt(link.linkId)]
          }) as any[];

          if (!purchases || !Array.isArray(purchases)) {
            continue;
          }
          
          // Filter purchases by current address
          const myPurchasesForThisLink = purchases.filter((purchase: any) => 
            purchase.buyer?.toLowerCase() === address.toLowerCase()
          );
          
          // Convert to our format
          for (const purchase of myPurchasesForThisLink) {
            const tokenSymbol = link.paymentTokenSymbol || "MON";
            const purchaseAmount = Number(purchase.amount || 1);
            const unitPrice = parseFloat(link.price || '0');
            const totalPaid = (purchaseAmount * unitPrice).toFixed(4);
            
            allPurchases.push({
              _id: `${link.linkId}-${purchase.buyer}-${purchase.timestamp}`,
              linkId: link.linkId,
              buyerAddress: address,
              creatorAddress: link.creator,
              linkTitle: link.title,
              linkDescription: link.description || "",
              price: link.price,
              paymentToken: link.paymentToken,
              paymentTokenSymbol: tokenSymbol,
              quantity: purchaseAmount,
              totalPaid: totalPaid,
              purchaseDate: new Date(Number(purchase.timestamp) * 1000).toISOString(),
              transactionHash: purchase.txHash || "0x0000000000000000000000000000000000000000000000000000000000000000",
              linkStatus: link.isActive ? 'active' : 'inactive'
            });
          }
        } catch (error) {
          // Continue to next link if this one fails
          continue;
        }
      }
      
      // Group purchases by linkId (combine multiple purchases from same link)
      const groupedPurchases = allPurchases.reduce((acc, purchase) => {
        const existing = acc.find(p => p.linkId === purchase.linkId);
        
        if (existing) {
          // Combine with existing purchase
          existing.quantity += purchase.quantity;
          existing.totalPaid = (parseFloat(existing.totalPaid) + parseFloat(purchase.totalPaid)).toFixed(4);
          // Use the latest purchase date
          if (new Date(purchase.purchaseDate) > new Date(existing.purchaseDate)) {
            existing.purchaseDate = purchase.purchaseDate;
            existing.transactionHash = purchase.transactionHash;
          }
        } else {
          // First purchase for this link
          acc.push(purchase);
        }
        
        return acc;
      }, [] as PurchaseData[]);
      
      // Sort by purchase date (newest first)
      const sortedPurchases = groupedPurchases.sort((a, b) => 
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
      );
      
      setMyPurchases(sortedPurchases);
      
    } catch (error) {
      setMyPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  };

  // User tickets hook for My Tickets tab (load immediately)
  const { 
    userTickets, 
    notifications, 
    isLoading: loadingUserTickets 
  } = useUserRaffles(address);

  // User tickets loaded

  // No need for separate reward fetching - userTickets already include reward info

  // Format reward display using ticket data directly
  const formatRewardDisplay = (ticket: any) => {
    if (ticket.rewardType === undefined || ticket.rewardType === null) return 'Loading...';
    
    // V6 Contract RewardType values:
    // 0 = MON_TOKEN
    // 1 = ERC20_TOKEN (CHOG etc.)
    // 2 = NFT_TOKEN
    
    // Format reward based on type
    
    try {
      if (ticket.rewardType === 0) {
        // MON tokens - use rewardAmount field
        const amount = formatEther(BigInt(ticket.rewardAmount || 0));
        return `${amount} MON`;
              } else if (ticket.rewardType === 1) {
          // ERC20 tokens - NOW WORKING WITH PROPER rewardTokenAddress
          const tokenAddress = ticket.rewardToken?.toLowerCase();
          const rawAmount = BigInt(ticket.rewardTokenId || 0);
          
          if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
            return `${formatEther(rawAmount)} Unknown Token`;
          }
          
          // Get token from knownAssets (dynamic system)
          const knownToken = getKnownToken(tokenAddress);
          
          if (knownToken) {
            // Format based on token decimals
            let formattedAmount;
            if (knownToken.decimals === 18) {
              formattedAmount = formatEther(rawAmount);
            } else {
              // For tokens with different decimals (like USDC with 6 decimals)
              const divisor = BigInt(10 ** knownToken.decimals);
              const wholePart = rawAmount / divisor;
              const fractionalPart = rawAmount % divisor;
              formattedAmount = `${wholePart}.${fractionalPart.toString().padStart(knownToken.decimals, '0').replace(/0+$/, '') || '0'}`;
            }
            
            return `${formattedAmount} ${knownToken.symbol}`;
          }
          
          // Unknown token fallback
          const shortAddress = `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;
          return `${formatEther(rawAmount)} Token (${shortAddress})`;
        } else if (ticket.rewardType === 2) {
        // NFT tokens
        const tokenAddress = ticket.rewardToken;
        const tokenId = ticket.rewardTokenId?.toString() || '0';
        
        if (!tokenAddress) {
          return `NFT #${tokenId}`;
        }
        
                 // Check if it's a known NFT collection
         const knownNFT = getKnownNFT(tokenAddress);
         if (knownNFT) {
           return `${knownNFT.name} #${tokenId}`;
         }
        
        // For unknown NFT collections, show address
        const shortAddress = `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;
        return `NFT (${shortAddress}) #${tokenId}`;
      }
    } catch (error) {
      console.error(`❌ Error formatting reward display for raffle ${ticket.raffleId}:`, error);
      console.error('Ticket data:', ticket);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    return `Unknown Type (${ticket.rewardType})`;
  };
  const { 
    deactivatePaymentLink, 
    isConfirmed: deactivationConfirmed 
  } = useDeactivatePaymentLinkV2();
  
  // Raffle contract hook - endRaffle and cancelRaffle functionality temporarily disabled
  // These functions would need to be implemented in the V2 hook
  const endRaffle = (_raffleId: any) => {
    console.log('endRaffle not implemented for V2 yet');
  };
  const cancelRaffle = (_raffleId: any) => {
    console.log('cancelRaffle not implemented for V2 yet');
  };
  const isEndingRaffle = false;
  const isRaffleEnded = false;

    // Convert contract data to display format and sort by newest first - MEMOIZED to prevent infinite loops
  const paymentLinks: PaymentLinkData[] = useMemo(() => {
    return creatorLinksData ? creatorLinksData
      .map((link: unknown) => {
        try {
          const formatted = formatPaymentLinkV2(link);
          console.log('Raw link data:', link);
          console.log('Formatted link data:', formatted);
          console.log('uniqueBuyersCount from link:', (link as { uniqueBuyersCount?: number }).uniqueBuyersCount);
          
          const tokenSymbol = formatted.paymentToken === "0x0000000000000000000000000000000000000000" 
            ? "MON" 
            : getKnownToken(formatted.paymentToken)?.symbol || "TOKEN";
          
          return {
            ...formatted,
            linkId: (link as { linkId: { toString(): string } }).linkId.toString(), // Use actual linkId from contract
            _id: (link as { linkId: { toString(): string } }).linkId.toString(),
            creatorAddress: formatted.creator,
            price: formatPriceV2(formatted.price),
            totalEarned: formatPriceV2(formatted.totalEarned),
            paymentToken: formatted.paymentToken,
            paymentTokenSymbol: tokenSymbol,
            uniqueBuyersCount: (link as { uniqueBuyersCount?: number }).uniqueBuyersCount || 0, // Add this explicitly
            purchases: [], // Will be fetched separately if needed
            createdAt: formatted.createdAt ? new Date(Number(formatted.createdAt) * 1000).toISOString() : new Date().toISOString(),
            expiresAt: (formatted as any).expiresAt || BigInt(0),
          };
      } catch (error) {
        console.error('Error formatting payment link:', error, link);
        // Return a default object to prevent crashes
        return {
          linkId: '0',
          _id: '0',
          creator: '',
          title: 'Error Loading Link',
          description: 'This link could not be loaded',
          coverImage: '',
          price: '0',
          paymentToken: '0x0000000000000000000000000000000000000000',
          paymentTokenSymbol: 'MON',
          totalSales: BigInt(0),
          maxPerWallet: BigInt(0),
          salesCount: BigInt(0),
          totalEarned: '0',
          isActive: false,
          createdAt: new Date().toISOString(),
          expiresAt: BigInt(0),
          creatorAddress: '',
          purchases: [],
        };
      }
    })
      .sort((a: PaymentLinkData, b: PaymentLinkData) => {
        // Sort by linkId descending (newest first)
        return parseInt(b.linkId) - parseInt(a.linkId);
      }) : [];
  }, [creatorLinksData]);

  // Convert V6 raffle contract data to display format - MEMOIZED to prevent unnecessary re-renders
  console.log('creatorRafflesData V6:', creatorRafflesData);
  console.log('loadingRaffles:', loadingRaffles);
  console.log('address:', address);
  
  const raffles: RaffleData[] = useMemo(() => {
    return creatorRafflesData ? creatorRafflesData
      .map((raffle: RaffleInfoV6, index: number) => {
        try {
          console.log('Processing V6 raffle:', raffle);
          
          // Calculate total earned (tickets sold * ticket price)
          const totalEarned = raffle.soldTickets * raffle.ticketPrice;
          
          return {
            id: raffle.raffleId !== undefined ? raffle.raffleId.toString() : index.toString(),
            creator: raffle.creator || '',
            title: `V6 Raffle #${raffle.raffleId !== undefined ? raffle.raffleId : index}`, // V6 doesn't have title/description
            // Fix description to use correct field based on reward type
            description: `Reward: ${
              raffle.rewardType === 1 
                ? (() => {
                    const amount = formatPriceV6(raffle.rewardTokenId || BigInt(0));
                    const token = raffle.rewardTokenAddress 
                      ? getKnownToken(raffle.rewardTokenAddress.toLowerCase())
                      : null;
                    const symbol = token ? token.symbol : 'Tokens';
                    return `${amount} ${symbol}`;
                  })()
                : raffle.rewardType === 2
                ? (() => {
                    const tokenId = (raffle.rewardTokenId || BigInt(0)).toString();
                    const nft = raffle.rewardTokenAddress 
                      ? getKnownNFT(raffle.rewardTokenAddress.toLowerCase())
                      : null;
                    const name = nft ? nft.name : 'NFT';
                    return `${name} #${tokenId}`;
                  })()
                : formatPriceV6(raffle.rewardAmount) + ' MON'
            }`,
            rewardType: Number(raffle.rewardType) || 0,
            // For ERC20 tokens (type 1), amount is in rewardTokenId, not rewardAmount
            // For NFTs (type 2), show collection name + token ID instead of amount
            rewardAmount: raffle.rewardType === 1 
              ? formatPriceV6(raffle.rewardTokenId || BigInt(0))
              : raffle.rewardType === 2
              ? (() => {
                  const tokenId = (raffle.rewardTokenId || BigInt(0)).toString();
                  const nft = raffle.rewardTokenAddress 
                    ? getKnownNFT(raffle.rewardTokenAddress.toLowerCase())
                    : null;
                  const name = nft ? nft.name : 'NFT';
                  return `${name} #${tokenId}`;
                })()
              : formatPriceV6(raffle.rewardAmount),
            rewardTokenAddress: raffle.rewardTokenAddress, // Include token address for identifying specific tokens
            ticketPrice: formatPriceV6(raffle.ticketPrice),
            maxTickets: raffle.maxTickets || BigInt(0),
            ticketsSold: raffle.soldTickets || BigInt(0),
            totalEarned: formatPriceV6(totalEarned),
            status: Number(raffle.state) || 0, // V6 uses 'state' instead of 'status'
            createdAt: raffle.startTime ? new Date(Number(raffle.startTime) * 1000).toISOString() : new Date().toISOString(),
            expirationTime: raffle.endTime || BigInt(0),
            winner: raffle.winner !== '0x0000000000000000000000000000000000000000' ? raffle.winner : undefined,
          };
        } catch (error) {
          console.error('Error formatting V6 raffle data:', error, raffle);
          return {
            id: index.toString(),
            creator: '',
            title: 'Error Loading V6 Raffle',
            description: 'This raffle could not be loaded',
            rewardType: 0,
            rewardAmount: '0',
            ticketPrice: '0',
            maxTickets: BigInt(0),
            ticketsSold: BigInt(0),
            totalEarned: '0',
            status: 2, // CANCELLED
            createdAt: new Date().toISOString(),
            expirationTime: BigInt(0),
          };
        }
      })
      .sort((a: RaffleData, b: RaffleData) => {
        return parseInt(b.id) - parseInt(a.id);
      }) : [];
  }, [creatorRafflesData]);

  // Refetch when deactivation is confirmed
  const [hasRefetchedAfterDeactivation, setHasRefetchedAfterDeactivation] = useState(false);
  
  useEffect(() => {
    if (deactivationConfirmed && !hasRefetchedAfterDeactivation) {
      console.log('🔄 Refetching after deactivation...');
      // Force refresh to bypass rate limiting
      refetch(true);
      setHasRefetchedAfterDeactivation(true);
      
      // Reset the flag after a delay to allow for future deactivations
      setTimeout(() => {
        setHasRefetchedAfterDeactivation(false);
      }, 5000);
    }
  }, [deactivationConfirmed, refetch, hasRefetchedAfterDeactivation]);
  
  // Refetch when raffle is ended
  useEffect(() => {
    if (isRaffleEnded) {
      refetchRaffles();
    }
  }, [isRaffleEnded, refetchRaffles]);

  // Fetch purchases when payment links are loaded
  useEffect(() => {
    if (address && paymentLinks && paymentLinks.length > 0) {
      fetchMyPurchases();
    }
  }, [address, paymentLinks]);

  // Reset to page 1 when switching tabs or searching
  useEffect(() => {
    setPaymentLinksPage(1);
    setRafflesPage(1);
    setPurchasePage(1);
    
    // Fetch purchases when switching to my-payments tab
    if (activeTab === 'my-payments' && address && paymentLinks.length > 0) {
      fetchMyPurchases();
    }
  }, [activeTab, searchQuery, purchaseSearchQuery]);

  // Filter purchases based on search and date
  useEffect(() => {
    let filtered = myPurchases;

    // Search filter
    if (purchaseSearchQuery) {
      filtered = filtered.filter(purchase =>
        purchase.linkTitle.toLowerCase().includes(purchaseSearchQuery.toLowerCase()) ||
        purchase.creatorAddress.toLowerCase().includes(purchaseSearchQuery.toLowerCase()) ||
        purchase.transactionHash.toLowerCase().includes(purchaseSearchQuery.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const days = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(purchase =>
        new Date(purchase.purchaseDate) >= cutoffDate
      );
    }

    setFilteredPurchases(filtered);
    setPurchasePage(1); // Reset to first page when filtering
  }, [myPurchases, purchaseSearchQuery, dateFilter]);

  const copyLink = (linkId: string) => {
    if (!address) return;
    const secureId = createSecureLinkId(parseInt(linkId), address);
    const fullLink = `${window.location.origin}/pay/${secureId}`;
    navigator.clipboard.writeText(fullLink);
    alert('Payment link copied to clipboard!');
  };

  const isExpired = (link: PaymentLinkData) => {
    if (!link.expiresAt || Number(link.expiresAt) === 0) return false;
    return Date.now() > Number(link.expiresAt) * 1000;
  };

  const getLinkStatus = (link: PaymentLinkData) => {
    if (!link.isActive) {
      // Check if it was deactivated due to sold out
      if (Number(link.totalSales) > 0 && Number(link.salesCount) >= Number(link.totalSales)) {
        return 'Sold Out';
      }
      return 'Inactive';
    }
    if (isExpired(link)) return 'Expired';
    if (Number(link.totalSales) > 0 && Number(link.salesCount) >= Number(link.totalSales)) {
      return 'Sold Out';
    }
    return 'Active';
  };

  const getRaffleStatus = (raffle: RaffleData) => {
    const isExpired = isRaffleExpired(raffle);
    const ticketsSold = Number(raffle.ticketsSold);
    const maxTickets = Number(raffle.maxTickets);
    const isSoldOut = ticketsSold >= maxTickets;

    // V6 Smart Logic:
    // 1. If tickets sold > 0 and expired → "Finished" (yellow)
    // 2. If not expired and tickets not sold out → "Active" (green)
    // 3. If tickets sold = 0 and expired → "Cancelled" (red)
    // 4. If sold out and not expired → "Finished" (yellow)
    
    if (ticketsSold > 0 && (isExpired || isSoldOut)) {
      return 'Finished'; // Yellow - has sales, ended or sold out
    } else if (!isExpired && !isSoldOut) {
      return 'Active'; // Green - still running, tickets available
    } else if (ticketsSold === 0 && isExpired) {
      return 'Cancelled'; // Red - no sales and expired
    } else {
      // Fallback to old logic for edge cases
      switch (raffle.status) {
        case 0: return 'Active';
        case 1: return 'Finished';
        case 2: return 'Cancelled';
        case 3: return 'Cancelled'; // V6 EMERGENCY state
        default: return 'Unknown';
      }
    }
  };

  const getRewardTypeText = (rewardType: number) => {
    // V6 Contract RewardType values:
    // 0 = MON_TOKEN
    // 1 = ERC20_TOKEN
    // 2 = NFT_TOKEN
    switch (rewardType) {
      case 0: return 'MON';
      case 1: return 'ERC20';
      case 2: return 'NFT';
      default: return 'Unknown';
    }
  };

  const isRaffleExpired = (raffle: RaffleData) => {
    if (!raffle.expirationTime || Number(raffle.expirationTime) === 0) return false;
    return Date.now() > Number(raffle.expirationTime) * 1000;
  };

  const deactivateLink = async (linkId: string) => {
    if (!address) return;
    
    const confirmed = confirm('Are you sure you want to deactivate this payment link? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deactivatePaymentLink(parseInt(linkId));
    } catch (error) {
      console.error('Error deactivating payment link:', error);
      alert('Failed to deactivate payment link');
    }
  };

  const handleEndRaffle = async (raffleId: string) => {
    console.log('handleEndRaffle called with raffleId:', raffleId);
    
    if (!address) {
      console.log('No address, returning');
      return;
    }
    
    const raffle = raffles.find(r => r.id === raffleId);
    if (!raffle) {
      console.log('Raffle not found:', raffleId);
      return;
    }
    
    console.log('Found raffle:', raffle);
    
    let confirmMessage = 'Are you sure you want to end this raffle?';
    let actionType = 'end';
    
    if (raffle.ticketsSold === BigInt(0)) {
      confirmMessage += '\n\nNo tickets were sold. The raffle will be cancelled and the reward will be returned to you.';
      actionType = 'cancel';
    } else {
      confirmMessage += '\n\nTickets have been sold. A random winner will be selected and receive the reward.';
      actionType = 'end';
    }
    
    console.log('Showing confirmation dialog for action:', actionType);
    const confirmed = confirm(confirmMessage);
    if (!confirmed) {
      console.log('User cancelled');
      return;
    }

    console.log(`User confirmed, calling ${actionType}Raffle with ID:`, parseInt(raffleId));
    try {
      if (actionType === 'cancel') {
        await cancelRaffle(parseInt(raffleId));
        console.log('cancelRaffle called successfully');
      } else {
        await endRaffle(parseInt(raffleId));
        console.log('endRaffle called successfully');
      }
    } catch (error) {
      console.error(`Error ${actionType}ing raffle:`, error);
      alert(`Failed to ${actionType} raffle: ` + (error as Error).message);
    }
  };

  const exportToCSV = () => {
    if (filteredPaymentLinks.length === 0) {
      alert('No payment links to export');
      return;
    }

    // CSV headers
    const headers = ['Address', 'Amount', 'Price', 'Title', 'Description', 'Status', 'Created', 'Expires', 'Sales', 'Buyers', 'Earned'];
    
    // CSV data
    const csvData = filteredPaymentLinks.map(link => [
      `"${link.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${(link.description || 'No description').replace(/"/g, '""')}"`, // Escape quotes and handle undefined
      getLinkStatus(link),
      new Date(link.createdAt).toLocaleDateString(),
      link.expiresAt && Number(link.expiresAt) > 0
        ? new Date(Number(link.expiresAt) * 1000).toLocaleString()
        : 'Never',
      link.salesCount.toString(),
      (link.uniqueBuyersCount || 0).toString(),
              `${parseFloat(link.totalEarned).toFixed(4)} ${link.paymentTokenSymbol || 'MON'}`
    ]);

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nadpay-payment-links-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export purchases to CSV
  const exportPurchasesToCSV = () => {
    if (filteredPurchases.length === 0) {
      alert('No purchases to export');
      return;
    }

    const csvData = filteredPurchases.map(purchase => ({
      'Transaction Hash': purchase.transactionHash,
      'Link Title': purchase.linkTitle,
      'Creator': purchase.creatorAddress,
      'Unit Price': `${purchase.price} ${purchase.paymentTokenSymbol}`,
      'Quantity': purchase.quantity,
      'Total Paid': `${purchase.totalPaid} ${purchase.paymentTokenSymbol}`,
      'Purchase Date': new Date(purchase.purchaseDate).toLocaleDateString(),
      'Link Status': purchase.linkStatus,
      'Link ID': purchase.linkId
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `my-purchases-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showParticipants = (link: PaymentLinkData) => {
    setSelectedLink(link);
    setShowParticipantsModal(true);
    setParticipantsSearchQuery("");
    setCurrentPage(1);
  };

  // Load participants when modal opens
  useEffect(() => {
    if (selectedLink && showParticipantsModal) {
      setLoadingParticipants(true);
      getParticipantsFromContract(selectedLink.linkId)
        .then(participants => {
          setAllParticipants(participants);
          setLoadingParticipants(false);
        })
        .catch(error => {
          console.error('Error loading participants:', error);
          setAllParticipants([]);
          setLoadingParticipants(false);
        });
    }
  }, [selectedLink?.linkId, showParticipantsModal]);

  const closeParticipantsModal = () => {
    setShowParticipantsModal(false);
    setSelectedLink(null);
    setParticipantsSearchQuery("");
    setCurrentPage(1);
    setAllParticipants([]);
    setLoadingParticipants(false);
  };

  // Get participants from real contract data
  const getParticipantsFromContract = async (linkId: string) => {
    try {
      if (!publicClient || !selectedLink) return [];

      // Get payment link price
      const linkPrice = parseFloat(selectedLink.price || '0');

      // Get purchases for this payment link
      const purchases = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: NADPAY_V2_ABI,
        functionName: 'getPurchases',
        args: [BigInt(linkId)]
      });

      if (!purchases || !Array.isArray(purchases)) {
        return [];
      }

      // Group purchases by wallet address
      const participantMap = new Map();
      
      purchases.forEach((purchase: any, index: number) => {
        const address = purchase.buyer?.toLowerCase();
        if (!address) return;

        const purchaseAmount = Number(purchase.amount || 1);
        const totalSpentForPurchase = (purchaseAmount * linkPrice);

        if (participantMap.has(address)) {
          const existing = participantMap.get(address);
          existing.purchaseCount += purchaseAmount;
          existing.totalSpent = (parseFloat(existing.totalSpent) + totalSpentForPurchase).toFixed(4);
        } else {
          participantMap.set(address, {
            id: participantMap.size + 1,
            address: purchase.buyer,
            purchaseCount: purchaseAmount,
            totalSpent: totalSpentForPurchase.toFixed(4),
            txId: purchase.txHash || `0x${'0'.repeat(64)}`, // Use actual tx hash or placeholder
            rank: 0 // Will be set after sorting
          });
        }
      });

      // Convert to array and sort by total spent (highest first)
      const participants = Array.from(participantMap.values())
        .sort((a, b) => parseFloat(b.totalSpent) - parseFloat(a.totalSpent))
        .map((p, index) => ({ ...p, rank: index + 1 }));

      return participants;
    } catch (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
  };

  const exportParticipantsToCSV = async (link: PaymentLinkData) => {
    // TODO: Get real participants from contract
    const participants = await getParticipantsFromContract(link.linkId);

    if (participants.length === 0) {
      alert('No participants found for this payment link.');
      return;
    }

    const csvContent = [
      ['Rank', 'Wallet Address', 'Purchase Count', 'Total Spent (Token)', 'Total Spent (USD)', 'Transaction ID'].join(','),
      ...participants.map((p: any) => [
        p.rank,
        p.address,
        p.purchaseCount,
        p.totalSpent,
        (parseFloat(p.totalSpent) * 0.1).toFixed(2),
        p.txId
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link_download = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link_download.setAttribute('href', url);
    link_download.setAttribute('download', `${link.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_participants_${new Date().getTime()}.csv`);
    link_download.style.visibility = 'hidden';
    document.body.appendChild(link_download);
    link_download.click();
    document.body.removeChild(link_download);
  };



  // Filter functions
  const filteredPaymentLinks = paymentLinks.filter((link: PaymentLinkData) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      link.title.toLowerCase().includes(query) ||
      (link.description && link.description.toLowerCase().includes(query)) ||
      link.linkId.toString().includes(query) ||
      link.price.toString().includes(query)
    );
  });

  const filteredRaffles = raffles.filter((raffle: RaffleData) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      raffle.title.toLowerCase().includes(query) ||
      (raffle.description && raffle.description.toLowerCase().includes(query)) ||
      raffle.id.toString().includes(query) ||
      raffle.ticketPrice.toString().includes(query)
    );
  });

  // Pagination calculations
  const totalPaymentLinksPages = Math.ceil(filteredPaymentLinks.length / itemsPerPage);
  const paginatedPaymentLinks = filteredPaymentLinks.slice(
    (paymentLinksPage - 1) * itemsPerPage,
    paymentLinksPage * itemsPerPage
  );

  const totalRafflesPages = Math.ceil(filteredRaffles.length / itemsPerPage);
  const paginatedRaffles = filteredRaffles.slice(
    (rafflesPage - 1) * itemsPerPage,
    rafflesPage * itemsPerPage
  );

  // My Purchases pagination
  const totalPurchasesPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const paginatedPurchases = filteredPurchases.slice(
    (purchasePage - 1) * itemsPerPage,
    purchasePage * itemsPerPage
  );

  // Filter and paginate my tickets - show all tickets (including ended/cancelled where user won)
  const activeUserTickets = userTickets; // Show ALL tickets, not just active ones
  const filteredMyTickets = activeUserTickets
    .filter(ticket =>
      ticket.raffleName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    // Sort by raffleId in descending order (newest first)
    .sort((a, b) => b.raffleId - a.raffleId);

  const totalMyTicketsPages = Math.ceil(filteredMyTickets.length / itemsPerPage);
  const paginatedMyTickets = filteredMyTickets.slice(
    (myTicketsPage - 1) * itemsPerPage,
    myTicketsPage * itemsPerPage
  );

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void; 
  }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-2 rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-primary-500 text-white'
                : page === '...'
                ? 'text-gray-400 cursor-default'
                : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const getTotalStats = () => {
    // NadPay Stats
    const totalEarned = paymentLinks.reduce((sum: number, link: PaymentLinkData) => {
      const earned = typeof link.totalEarned === 'string' ? parseFloat(link.totalEarned) : 0;
      return sum + (isNaN(earned) ? 0 : earned);
    }, 0);
    const totalSales = paymentLinks.reduce((sum: number, link: PaymentLinkData) => {
      const sales = typeof link.salesCount === 'bigint' ? Number(link.salesCount) : 
                   typeof link.salesCount === 'number' ? link.salesCount : 0;
      return sum + sales;
    }, 0);
    const totalBuyers = paymentLinks.reduce((sum: number, link: PaymentLinkData) => {
      return sum + (link.uniqueBuyersCount || 0);
    }, 0);

    // NadRaffle Stats
    const raffleEarned = raffles.reduce((sum: number, raffle: RaffleData) => {
      const earned = typeof raffle.totalEarned === 'string' ? parseFloat(raffle.totalEarned) : 0;
      return sum + (isNaN(earned) ? 0 : earned);
    }, 0);
    const totalTicketsSold = raffles.reduce((sum: number, raffle: RaffleData) => {
      const tickets = typeof raffle.ticketsSold === 'bigint' ? Number(raffle.ticketsSold) : 0;
      return sum + tickets;
    }, 0);
    const totalParticipants = raffles.reduce((sum: number, raffle: RaffleData) => {
      // Estimate participants (assuming average 2 tickets per participant)
      const tickets = typeof raffle.ticketsSold === 'bigint' ? Number(raffle.ticketsSold) : 0;
      return sum + Math.ceil(tickets / 2);
    }, 0);
    const activeRaffles = raffles.filter((raffle: RaffleData) => getRaffleStatus(raffle) === 'Active').length;

    return { 
      totalEarned, 
      totalSales, 
      totalBuyers,
      raffleEarned,
      totalTicketsSold,
      totalParticipants,
      activeRaffles
    };
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your wallet to view your payment links and earnings dashboard.
          </p>
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button
                onClick={show}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold"
              >
                Connect Wallet
              </button>
            )}
          </ConnectKitButton.Custom>
          <div className="mt-6">
            <a 
              href="/"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Remove the global loading state - render UI immediately with skeleton loaders

  // Skeleton loader component for stats cards
  const StatsCardSkeleton = () => (
    <div className="bg-white dark:bg-dark-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-dark-700">
      <div className="flex items-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-dark-700 rounded-lg animate-pulse"></div>
        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
          <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded animate-pulse mb-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-20"></div>
        </div>
      </div>
    </div>
  );

  // Skeleton loader for table rows
  const TableRowSkeleton = () => (
    <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-dark-700 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-64 mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-32"></div>
        </div>
        <div className="flex space-x-2 ml-4">
          <div className="h-8 w-16 bg-gray-200 dark:bg-dark-700 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-200 dark:bg-dark-700 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-dark-700">
        <div>
          <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-20"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-20"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-20"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-20"></div>
        </div>
      </div>
    </div>
  );

  // Only calculate stats when we have payment links data loaded
  const stats = loadingLinks ? {
    totalEarned: 0,
    totalSales: 0,
    totalBuyers: 0,
    raffleEarned: 0,
    totalTicketsSold: 0,
    totalParticipants: 0,
    activeRaffles: 0
  } : getTotalStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Navbar showTicketsButton={false} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message Banner */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                  Twitter Connection Error
                </p>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 ml-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Success Message Banner */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <div className="flex items-start">
              <div className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0">
                ✓
              </div>
              <div className="flex-1">
                <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                  Success
                </p>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  {successMessage}
                </p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 ml-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Combined Profile & Stats Section */}
        <div className="mb-8">
          <TwitterProfile 
            showStats={true}
            userPoints={userPoints}
            userRank={userRank}
            loadingStats={loadingStats}
            onRefreshStats={fetchUserPoints}
            formatStatsPoints={formatStatsPoints}
          />
        </div>



        {/* Tab Navigation */}
        <div className="mb-8">
          {/* Desktop - Single Row */}
          <div className="hidden sm:flex space-x-1 bg-gray-100 dark:bg-dark-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('payment-links')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'payment-links'
                  ? 'bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Link2 className="w-4 h-4" />
                <span>Payment Links ({paymentLinks.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my-payments')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'my-payments'
                  ? 'bg-white dark:bg-dark-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>My Payments ({myPurchases.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('raffles')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'raffles'
                  ? 'bg-white dark:bg-dark-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">🎫</span>
                <span>Raffles ({raffles.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'my-tickets'
                  ? 'bg-white dark:bg-dark-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">🎟️</span>
                <span>My Tickets ({activeUserTickets.length})</span>
              </div>
            </button>
          </div>
          
          {/* Mobile - 2x2 Grid */}
          <div className="sm:hidden grid grid-cols-2 gap-1 bg-gray-100 dark:bg-dark-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('payment-links')}
              className={`px-3 py-4 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'payment-links'
                  ? 'bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Link2 className="w-5 h-5 mx-auto mb-1" />
              <div className="text-center">
                <div>Payment</div>
                <div>Links ({paymentLinks.length})</div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my-payments')}
              className={`px-3 py-4 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'my-payments'
                  ? 'bg-white dark:bg-dark-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <ShoppingCart className="w-5 h-5 mx-auto mb-1" />
              <div className="text-center">
                <div>My</div>
                <div>Payments ({myPurchases.length})</div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('raffles')}
              className={`px-3 py-4 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'raffles'
                  ? 'bg-white dark:bg-dark-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="text-xl block mb-1">🎫</span>
              <div className="text-center">
                <div>Raffles</div>
                <div>({raffles.length})</div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`px-3 py-4 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'my-tickets'
                  ? 'bg-white dark:bg-dark-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="text-xl block mb-1">🎟️</span>
              <div className="text-center">
                <div>My</div>
                <div>Tickets ({activeUserTickets.length})</div>
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <a
            href="/nadpay"
            className="inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:opacity-90 transition-opacity font-semibold text-sm"
          >
            <Link2 className="w-5 h-5 mr-2" />
            <span>Create New Link</span>
          </a>
          <a
            href="/rafflehouse/create"
            className="inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-semibold text-sm"
          >
            <span className="text-lg mr-2">🎫</span>
            <span>Create New Raffle</span>
          </a>
        </div>

        {/* Payment Links */}
        {activeTab === 'payment-links' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700"
        >
          <div className="p-6 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Payment Links
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage and track all your payment links
                </p>
              </div>
              {paymentLinks.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={exportToCSV}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export CSV
                  </button>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search links..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
            {searchQuery && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Found {filteredPaymentLinks.length} of {paymentLinks.length} links
              </div>
            )}
          </div>

          {loadingLinks ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="p-6">
                <TableRowSkeleton />
              </div>
              <div className="p-6">
                <TableRowSkeleton />
              </div>
              <div className="p-6">
                <TableRowSkeleton />
              </div>
            </div>
          ) : paymentLinks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No payment links yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first payment link to start earning on Monad
              </p>
              <a
                href="/nadpay"
                className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Create Payment Link
              </a>
            </div>
          ) : filteredPaymentLinks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No links found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                No payment links match your search &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedPaymentLinks.map((link: PaymentLinkData, index: number) => (
                <motion.div
                  key={link._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {link.title}
                        </h3>
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                          getLinkStatus(link) === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : getLinkStatus(link) === 'Sold Out'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : getLinkStatus(link) === 'Expired'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {getLinkStatus(link)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {link.description}
                      </p>
                      
                      {/* Stats Row */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {link.price} {link.paymentTokenSymbol || 'MON'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Sold</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {link.totalSales > 0 ? `${link.salesCount}/${link.totalSales}` : link.salesCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Buyers</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {link.uniqueBuyersCount || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Earned</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {parseFloat(link.totalEarned).toFixed(4)} {link.paymentTokenSymbol || 'MON'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(link.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Expires</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {link.expiresAt && Number(link.expiresAt) > 0
                              ? new Date(Number(link.expiresAt) * 1000).toLocaleString()
                              : 'Never'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => copyLink(link.linkId)}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Copy Link</span>
                          <span className="sm:hidden">Copy</span>
                        </button>
                        <a
                          href={`/pay/${createSecureLinkId(parseInt(link.linkId), address || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </a>
                        <button
                          onClick={() => showParticipants(link)}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Participants</span>
                          <span className="sm:hidden">Buyers</span>
                        </button>
                        {getLinkStatus(link) === 'Active' && (
                          <button
                            onClick={() => deactivateLink(link.linkId)}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Deactivate</span>
                            <span className="sm:hidden">End</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Payment Links Pagination */}
          <PaginationControls
            currentPage={paymentLinksPage}
            totalPages={totalPaymentLinksPages}
            onPageChange={setPaymentLinksPage}
          />
        </motion.div>
        )}

        {/* Raffles Section */}
        {activeTab === 'raffles' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Your Raffles
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Manage and track all your raffles
                </p>
      </div>
              {raffles.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
    </div>
                    <input
                      type="text"
                      placeholder="Search raffles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
              {searchQuery && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Found {filteredRaffles.length} of {raffles.length} raffles
                </div>
              )}
            </div>

            {loadingRaffles ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="p-6">
                  <TableRowSkeleton />
                </div>
                <div className="p-6">
                  <TableRowSkeleton />
                </div>
                <div className="p-6">
                  <TableRowSkeleton />
                </div>
              </div>
            ) : raffles.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎫</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No raffles yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first raffle to start engaging your community
                </p>
                <a
                  href="/rafflehouse/create"
                  className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Create Raffle
                </a>
              </div>
            ) : filteredRaffles.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No raffles found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  No raffles match your search &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedRaffles.map((raffle: RaffleData, index: number) => (
                  <motion.div
                    key={raffle.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                    className="p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {raffle.title}
                          </h3>
                          <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                                                          getRaffleStatus(raffle) === 'Active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : getRaffleStatus(raffle) === 'Finished'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {getRaffleStatus(raffle)}
                          </span>
                          {raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                              Winner: {raffle.winner.slice(0, 6)}...{raffle.winner.slice(-4)}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {raffle.description}
                        </p>
                        
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Reward Type</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {getRewardTypeText(raffle.rewardType)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Reward Amount</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {raffle.rewardAmount} {
                              raffle.rewardType === 0 
                                ? 'MON' 
                                : raffle.rewardType === 1 
                                ? (() => {
                                    // Get token symbol from known tokens
                                    const token = raffle.rewardTokenAddress 
                                      ? getKnownToken(raffle.rewardTokenAddress.toLowerCase())
                                      : null;
                                    return token ? token.symbol : 'Tokens';
                                  })()
                                : '' // NFT info already included in rewardAmount
                            }
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Ticket Price</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {raffle.ticketPrice} MON
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Tickets Sold</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {raffle.ticketsSold.toString()}/{raffle.maxTickets.toString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Earned</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {raffle.totalEarned} MON
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(raffle.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`/raffle/${createPredictableSecureRaffleId(parseInt(raffle.id))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">View Raffle</span>
                            <span className="sm:hidden">View</span>
                          </a>
                          {getRaffleStatus(raffle) === 'Active' && (
                            <button
                              onClick={() => handleEndRaffle(raffle.id)}
                              disabled={isEndingRaffle}
                              className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isEndingRaffle ? 'Ending...' : (
                                <>
                                  <span className="hidden sm:inline">End Raffle</span>
                                  <span className="sm:hidden">End</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Raffles Pagination */}
            <PaginationControls
              currentPage={rafflesPage}
              totalPages={totalRafflesPages}
              onPageChange={setRafflesPage}
            />
          </motion.div>
        )}

        {/* My Tickets */}
        {activeTab === 'my-tickets' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700"
        >
          <div className="p-6 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  My Raffle Tickets
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  All raffles you've participated in
                </p>
              </div>
              {userTickets.length > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
            {searchQuery && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Found {filteredMyTickets.length} of {activeUserTickets.length} tickets
              </div>
            )}
          </div>

          {loadingUserTickets ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="p-6">
                <TableRowSkeleton />
              </div>
              <div className="p-6">
                <TableRowSkeleton />
              </div>
              <div className="p-6">
                <TableRowSkeleton />
              </div>
            </div>
                        ) : activeUserTickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎟️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tickets yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You haven't participated in any raffles yet. Browse and join exciting raffles!
              </p>
              <a
                href="/rafflehouse"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Browse Raffles
              </a>
            </div>
          ) : filteredMyTickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tickets found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                No tickets match your search &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedMyTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.raffleId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {ticket.raffleName}
                        </h3>
                        {ticket.isWinner && (
                          <span className="ml-3 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            🎉 Winner!
                          </span>
                        )}
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                          ticket.status === 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {ticket.status === 0 ? 'Active' : 'Finished'}
                        </span>
                      </div>
                      
                      {/* Ticket Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Tickets Owned</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {ticket.ticketCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {ticket.status === 0 ? 'Active' : 'Finished'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Result</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {ticket.isWinner ? (
                              <span className="text-green-600 dark:text-green-400">Winner! 🎉</span>
                            ) : ticket.status === 1 ? (
                              <span className="text-gray-600 dark:text-gray-400">Not won</span>
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400">Pending</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Reward</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            <span className="text-primary-600 dark:text-primary-400">
                              {formatRewardDisplay(ticket)}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Reward Status</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {ticket.isWinner ? (
                              <span className="text-green-600 dark:text-green-400">Sent ✅</span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">N/A</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Special Messages */}
                      {ticket.isWinner && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-green-800 dark:text-green-300 text-sm font-medium">
                            🎉 Congratulations! You won this raffle. Reward sent automatically!
                          </p>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`/raffle/${createPredictableSecureRaffleId(ticket.raffleId)}`}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Raffle
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* My Tickets Pagination */}
          {totalMyTicketsPages > 1 && (
            <PaginationControls
              currentPage={myTicketsPage}
              totalPages={totalMyTicketsPages}
              onPageChange={setMyTicketsPage}
            />
          )}
          </motion.div>
        )}

        {/* My Payments */}
        {activeTab === 'my-payments' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700"
        >
          <div className="p-6 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  My Payments
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Payment links you've purchased from
                </p>
              </div>
              {myPurchases.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={exportPurchasesToCSV}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export CSV
                  </button>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search payments..."
                      value={purchaseSearchQuery}
                      onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                      className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Date Filter */}
            {myPurchases.length > 0 && (
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Filter by date:</span>
                <div className="flex space-x-1">
                  {[
                    { key: 'all', label: 'All' },
                    { key: '7days', label: '7 days' },
                    { key: '30days', label: '30 days' },
                    { key: '90days', label: '90 days' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setDateFilter(filter.key as any)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        dateFilter === filter.key
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(purchaseSearchQuery || dateFilter !== 'all') && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Found {filteredPurchases.length} of {myPurchases.length} purchases
              </div>
            )}
          </div>

          {loadingPurchases ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="p-6">
                <TableRowSkeleton />
              </div>
              <div className="p-6">
                <TableRowSkeleton />
              </div>
              <div className="p-6">
                <TableRowSkeleton />
              </div>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {myPurchases.length === 0 ? 'No payments yet' : 'No matching purchases'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {myPurchases.length === 0 
                  ? "You haven't purchased from any payment links yet. Browse available payment links!"
                  : "No purchases match your current filters. Try adjusting your search or date filter."
                }
              </p>
              {myPurchases.length === 0 && (
                <a
                  href="/nadpay"
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Browse Payment Links
                </a>
              )}
            </div>
          ) : (
            <div>
              {/* Purchase Statistics */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border-b border-gray-200 dark:border-dark-700">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {filteredPurchases.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Purchases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {(() => {
                        const total = filteredPurchases.reduce((sum, p) => sum + parseFloat(p.totalPaid), 0);
                        return total.toFixed(4);
                      })()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Spent (MON)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {(() => {
                        const avg = filteredPurchases.reduce((sum, p) => sum + parseFloat(p.totalPaid), 0) / filteredPurchases.length;
                        return avg.toFixed(4);
                      })()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Spent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {new Set(filteredPurchases.map(p => p.creatorAddress)).size}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Unique Creators</div>
                  </div>
                </div>
              </div>

              {/* Purchase List */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedPurchases.map((purchase: PurchaseData, index: number) => (
                <motion.div
                  key={purchase._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {purchase.linkTitle}
                        </h3>
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                          purchase.linkStatus === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : purchase.linkStatus === 'expired'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {purchase.linkStatus === 'active' ? 'Active' : purchase.linkStatus === 'expired' ? 'Expired' : 'Inactive'}
                        </span>
                      </div>
                      {purchase.linkDescription && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {purchase.linkDescription}
                        </p>
                      )}
                      
                      {/* Purchase Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Unit Price</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {purchase.price} {purchase.paymentTokenSymbol || 'MON'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Quantity</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {purchase.quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Paid</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {purchase.totalPaid} {purchase.paymentTokenSymbol || 'MON'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Purchase Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(purchase.purchaseDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Creator</p>
                          <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                            {purchase.creatorAddress.slice(0, 6)}...{purchase.creatorAddress.slice(-4)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`/pay/${purchase.linkId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Link
                        </a>
                        <a
                          href={`https://monad-testnet.g.alchemy.com/tx/${purchase.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Transaction
                        </a>
                        <button
                          onClick={() => copyLink(purchase.transactionHash)}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy TX Hash
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              </div>

              {/* Pagination for My Purchases */}
              {totalPurchasesPages > 1 && (
                <div className="p-6 border-t border-gray-200 dark:border-dark-700">
                  <PaginationControls
                    currentPage={purchasePage}
                    totalPages={totalPurchasesPages}
                    onPageChange={setPurchasePage}
                  />
                </div>
              )}
            </div>
          )}
          </motion.div>
        )}
      </div>

      {/* Participants Modal */}
      {showParticipantsModal && selectedLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-dark-700">
              {/* Mobile: Close button in top right */}
              <div className="flex items-center justify-between mb-4 sm:hidden">
                <div></div>
                <button
                  onClick={closeParticipantsModal}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Desktop layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    Participants - {selectedLink.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                    View and manage participants for this payment link
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => exportParticipantsToCSV(selectedLink)}
                    className="inline-flex items-center px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                  {/* Desktop close button */}
                  <button
                    onClick={closeParticipantsModal}
                    className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search participants by wallet address..."
                    value={participantsSearchQuery}
                    onChange={(e) => {
                      setParticipantsSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-dark-800">
              {(() => {
                const filteredParticipants = allParticipants.filter((p: any) =>
                  p.address.toLowerCase().includes(participantsSearchQuery.toLowerCase())
                );

                // Pagination calculations
                const totalPages = Math.ceil(filteredParticipants.length / participantsPerPage);
                const startIndex = (currentPage - 1) * participantsPerPage;
                const endIndex = startIndex + participantsPerPage;
                const currentParticipants = filteredParticipants.slice(startIndex, endIndex);

                // Reset to page 1 if current page is out of bounds
                if (currentPage > totalPages && totalPages > 0) {
                  setCurrentPage(1);
                }

                const getTotalRevenue = () => {
                  if (allParticipants.length === 0) return "0.0000";
                  const totalSpent = allParticipants.reduce((sum: number, p: any) => sum + parseFloat(p.totalSpent), 0);
                  return totalSpent.toFixed(4);
                };

                const getAverageSpent = () => {
                  if (allParticipants.length === 0) return "0.0000";
                  const totalSpent = allParticipants.reduce((sum: number, p: any) => sum + parseFloat(p.totalSpent), 0);
                  return (totalSpent / allParticipants.length).toFixed(4);
                };

                if (loadingParticipants) {
                  return (
                    <div className="flex items-center justify-center h-96 bg-white dark:bg-dark-800">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading participants...</p>
                      </div>
                    </div>
                  );
                }

                return filteredParticipants.length === 0 ? (
                  <div className="flex items-center justify-center h-96 bg-white dark:bg-dark-800">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {participantsSearchQuery ? 'No participants found' : 'No participants yet'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {participantsSearchQuery 
                          ? `No participants match "${participantsSearchQuery}"`
                          : 'Participants will appear here when someone purchases from this link'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Stats Summary */}
                    <div className="p-3 sm:p-6 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                        <div className="text-center">
                          <p className="text-lg sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {allParticipants.length.toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <span className="hidden sm:inline">Total Participants</span>
                            <span className="sm:hidden">Total</span>
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                            {getAverageSpent()} MON
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <span className="hidden sm:inline">Average Spent</span>
                            <span className="sm:hidden">Average</span>
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {allParticipants.reduce((sum: number, p: any) => sum + p.purchaseCount, 0).toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <span className="hidden sm:inline">Total Purchases</span>
                            <span className="sm:hidden">Purchases</span>
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {getTotalRevenue()} MON
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <span className="hidden sm:inline">Total Revenue</span>
                            <span className="sm:hidden">Revenue</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-hidden bg-white dark:bg-dark-800">
                      <div className="h-96 overflow-y-auto overflow-x-auto bg-white dark:bg-dark-800">
                        <table className="min-w-full w-full">
                          <thead className="bg-gray-50 dark:bg-dark-800 sticky top-0 z-10">
                            <tr>
                              <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[60px]">
                                Rank
                              </th>
                              <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[180px]">
                                Wallet Address
                              </th>
                              <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                                Purchases
                              </th>
                              <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                                Total Spent
                              </th>
                              <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                                Transaction ID
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {currentParticipants.map((participant: any) => (
                              <tr key={participant.address} className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <div className="flex items-center justify-center">
                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                      participant.rank <= 3 
                                        ? participant.rank === 1 
                                          ? 'bg-yellow-500' 
                                          : participant.rank === 2 
                                          ? 'bg-gray-400' 
                                          : 'bg-orange-600'
                                        : 'bg-gradient-to-r from-primary-500 to-primary-600'
                                    }`}>
                                      {participant.rank <= 3 ? (
                                        participant.rank === 1 ? '🥇' : participant.rank === 2 ? '🥈' : '🥉'
                                      ) : (
                                        <span className="text-[10px] sm:text-xs">{participant.rank}</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mr-2 sm:mr-3 flex-shrink-0">
                                      {participant.address.slice(2, 4).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-mono text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                        <span className="hidden sm:inline">{participant.address.slice(0, 10)}...{participant.address.slice(-8)}</span>
                                        <span className="sm:hidden">{participant.address.slice(0, 6)}...{participant.address.slice(-4)}</span>
                                      </p>
                                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                        ID: {participant.id}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <div className="flex items-center justify-center">
                                    <span className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                      {participant.purchaseCount}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                    {participant.totalSpent} {selectedLink?.paymentTokenSymbol || 'MON'}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                    ${(parseFloat(participant.totalSpent) * 0.1).toFixed(2)}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <div className="text-[10px] sm:text-xs font-mono text-gray-600 dark:text-gray-400 mb-1">
                                    <span className="hidden sm:inline">{participant.txId.slice(0, 10)}...{participant.txId.slice(-8)}</span>
                                    <span className="sm:hidden">{participant.txId.slice(0, 6)}...{participant.txId.slice(-4)}</span>
                                  </div>
                                  <button
                                    onClick={() => window.open(`https://testnet.monadexplorer.com/tx/${participant.txId}`, '_blank')}
                                    className="text-[10px] sm:text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                                  >
                                    <span className="hidden sm:inline">View on Explorer</span>
                                    <span className="sm:hidden">View</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pagination or Summary */}
                    <div className="p-3 sm:p-6 border-t border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-800">
                      {totalPages > 1 ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                            <span className="hidden sm:inline">Showing {startIndex + 1}-{Math.min(endIndex, filteredParticipants.length)} of {filteredParticipants.length} participants</span>
                            <span className="sm:hidden">{startIndex + 1}-{Math.min(endIndex, filteredParticipants.length)} of {filteredParticipants.length}</span>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="p-1.5 sm:p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            
                            {/* Page Numbers */}
                            <div className="flex items-center space-x-0.5 sm:space-x-1">
                              {(() => {
                                const getPageNumbers = () => {
                                  const pages = [];
                                  const maxVisible = 7;
                                  
                                  if (totalPages <= maxVisible) {
                                    for (let i = 1; i <= totalPages; i++) {
                                      pages.push(i);
                                    }
                                  } else {
                                    if (currentPage <= 4) {
                                      for (let i = 1; i <= 5; i++) pages.push(i);
                                      pages.push('...');
                                      pages.push(totalPages);
                                    } else if (currentPage >= totalPages - 3) {
                                      pages.push(1);
                                      pages.push('...');
                                      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                                    } else {
                                      pages.push(1);
                                      pages.push('...');
                                      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                                      pages.push('...');
                                      pages.push(totalPages);
                                    }
                                  }
                                  return pages;
                                };

                                return getPageNumbers().map((page, index) => (
                                  page === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-1 sm:px-3 py-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">...</span>
                                  ) : (
                                    <button
                                      key={page}
                                      onClick={() => setCurrentPage(page as number)}
                                      className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                        currentPage === page
                                          ? 'bg-primary-500 text-white'
                                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  )
                                ));
                              })()}
                            </div>

                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="p-1.5 sm:p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <span>Total: <strong className="text-gray-900 dark:text-white">{filteredParticipants.length}</strong></span>
                            <span className="mx-2">•</span>
                            <span>Revenue: <strong className="text-green-600 dark:text-green-400">{getTotalRevenue()} MON</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-6 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                  <span>Total: <strong className="text-gray-900 dark:text-white">{selectedLink.uniqueBuyersCount || 0}</strong></span>
                  <span className="hidden sm:inline">•</span>
                  <span>Revenue: <strong className="text-green-600 dark:text-green-400">{selectedLink.totalEarned} {selectedLink.paymentTokenSymbol || 'MON'}</strong></span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Updated: <strong>Just now</strong></span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setParticipantsSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    <span className="hidden sm:inline">Reset Filters</span>
                    <span className="sm:hidden">Reset</span>
                  </button>
                  <button
                    onClick={closeParticipantsModal}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-xs sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 