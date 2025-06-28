"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, Trophy, ArrowLeft, Ticket, Users, Clock, Gift, Star, Search, ChevronLeft, ChevronRight, Sun, Moon, Bell, Plus, X } from "lucide-react";
import { useAccount, useBalance, useSwitchChain, usePublicClient, useWalletClient } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useTheme } from "next-themes";
import { useRaffleV3, formatRaffleV3, NADRAFFLE_V4_FAST_CONTRACT } from "@/hooks/useNadRaffleV4FastContract";
import { decodePredictableSecureRaffleId, createPredictableSecureRaffleId } from "@/lib/linkUtils";
import { formatEther, parseEther } from "viem";
import { getKnownToken } from "@/lib/knownAssets";
import { useNFTMetadata } from "@/hooks/useNFTMetadata";
import { useUserRaffles } from "@/hooks/useUserRaffles";
import Link from "next/link";

export default function RaffleContent() {
  const params = useParams();
  const secureRaffleId = params.raffleId as string;
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  // Decode secure raffle ID to get internal ID
  const internalRaffleId = decodePredictableSecureRaffleId(secureRaffleId);
  const raffleId = internalRaffleId !== null ? internalRaffleId : 0;
  
  console.log('🎫 RaffleContent Debug:', {
    secureRaffleId,
    internalRaffleId,
    raffleId
  });
  
  // All hooks must be called at the top level
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({
    address: address,
    chainId: 10143, // Monad Testnet
  });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Use V3 hook for raffle data with refetch capability
  const { data: raffleData, isLoading: loadingRaffle, error: raffleError, refetch: refetchRaffleData } = useRaffleV3(raffleId);
  
  // Also check ID 0 for auto-redirect
  const { data: raffle0Data } = useRaffleV3(0);

  // Auto-redirect logic: if current raffle is empty but ID 0 has data, redirect
  useEffect(() => {
    if (!loadingRaffle && raffleData && raffle0Data) {
      const currentRaffleEmpty = !Array.isArray(raffleData) || !raffleData[2] || raffleData[2] === ''; // title is empty
      const raffle0HasData = Array.isArray(raffle0Data) && raffle0Data[2] && raffle0Data[2] !== ''; // title exists
      
      if (currentRaffleEmpty && raffle0HasData && raffleId !== 0) {
        console.log('🔄 Auto-redirecting to correct raffle (ID 0)');
        const correctUrl = createPredictableSecureRaffleId(0);
        router.push(`/raffle/${correctUrl}`);
        return;
      }
    }
  }, [raffleData, raffle0Data, loadingRaffle, raffleId, router]);

  // Get user tickets with refetch capability
  const { data: userTickets, refetch: refetchUserTickets } = useReadContract({
    address: NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_V4_FAST_CONTRACT.abi,
    functionName: 'getUserTickets',
    args: address ? [BigInt(raffleId), address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && raffleId >= 0,
      refetchInterval: 5000, // Auto refetch every 5 seconds
    },
  });

  // Get all raffle tickets to show participants with refetch capability
  const { data: allTickets, refetch: refetchAllTickets } = useReadContract({
    address: NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_V4_FAST_CONTRACT.abi,
    functionName: 'getRaffleTickets',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId >= 0,
      refetchInterval: 5000, // Auto refetch every 5 seconds
    },
  });

  // Get randomness commitment for reveal countdown
  const { data: randomnessCommitment } = useReadContract({
    address: NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_V4_FAST_CONTRACT.abi,
    functionName: 'randomnessCommitments',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId >= 0,
    },
  });

  // Get reveal deadline for countdown
  const { data: revealDeadline } = useReadContract({
    address: NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_V4_FAST_CONTRACT.abi,
    functionName: 'revealDeadlines',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId >= 0,
    },
  });

  // State for countdown timer
  const [revealCountdown, setRevealCountdown] = useState<string | null>(null);
  
  // State for real-time updates
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Purchase tickets functionality using writeContract
  const { writeContract, data: purchaseHash, isPending: purchasing, error: purchaseError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  });

  // Claim reward functionality
  const { writeContract: claimRewardWrite, data: claimHash, isPending: claiming, error: claimError } = useWriteContract();
  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimHash,
  });
  
  const [quantity, setQuantity] = useState(1);
  
  // Notifications and My Tickets state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  
  // Toast notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({ type: 'success', message: '', show: false });

  // Show notification function
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };
  
  // User raffles hook
  const { 
    userTickets: allUserTickets, 
    notifications, 
    getUnreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification 
  } = useUserRaffles(address);
  
  const purchaseTickets = async (raffleId: number, ticketQuantity: number, ticketPriceInEther: string) => {
    if (!raffle) throw new Error('Raffle not loaded');
    
    const totalPrice = parseEther((parseFloat(ticketPriceInEther) * ticketQuantity).toString());
    const isNativePayment = raffle.ticketPaymentToken === '0x0000000000000000000000000000000000000000';
    
    return writeContract({
      address: NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`,
      abi: NADRAFFLE_V4_FAST_CONTRACT.abi,
      functionName: 'purchaseTickets',
      args: [BigInt(raffleId), BigInt(ticketQuantity)],
      value: isNativePayment ? totalPrice : BigInt(0), // Only send MON if native payment
    });
  };
  
  // Participants UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [participantsPerPage] = useState(10);

  // Convert contract data to display format
  const raffle = raffleData ? formatRaffleV3(raffleData) : null;
  
  // Debug raffle data
  if (raffle) {
    console.log('🔍 Raw raffle data from contract:', raffleData);
    console.log('🎯 Formatted raffle data:', raffle);
    console.log('📊 Key values:', {
      ticketPrice: raffle.ticketPrice.toString(),
      maxTickets: raffle.maxTickets.toString(),
      ticketsSold: raffle.ticketsSold.toString(),
      rewardAmount: raffle.rewardAmount.toString(),
      expirationTime: raffle.expirationTime.toString(),
      status: raffle.status
    });
  }

  // Fetch NFT metadata if reward is NFT
  const shouldFetchNFT = raffle?.rewardType === 1;
  const { metadata: nftMetadata, isLoading: nftLoading } = useNFTMetadata(
    shouldFetchNFT ? raffle.rewardTokenAddress : '',
    shouldFetchNFT ? raffle.rewardAmount.toString() : ''
  );

  const loading = loadingRaffle;

  console.log('🎫 Raffle Data Debug:', {
    raffleData,
    raffle,
    loading,
    raffleError,
    userTickets: userTickets?.toString(),
    allTickets: Array.isArray(allTickets) ? allTickets.length : 0
  });

  // Handle successful purchase and auto refresh
  useEffect(() => {
    if (isConfirmed) {
      // Immediately refetch all data instead of page reload
      const refetchData = async () => {
        try {
          await Promise.all([
            refetchRaffleData(),
            refetchUserTickets(),
            refetchAllTickets(),
          ]);
          console.log('✅ Data refreshed after successful purchase');
        } catch (error) {
          console.error('❌ Error refreshing data:', error);
          // Fallback to page reload if refetch fails
          window.location.reload();
        }
      };
      
      // Small delay to ensure transaction is processed
      setTimeout(refetchData, 1000);
    }
  }, [isConfirmed, refetchRaffleData, refetchUserTickets, refetchAllTickets]);

  const handleClaimReward = async () => {
    if (!raffle || !address) return;
    
    try {
      await claimRewardWrite({
        address: NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_V4_FAST_CONTRACT.abi,
        functionName: 'claimReward',
        args: [BigInt(raffleId)],
      });
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  const handlePurchaseTickets = async () => {
    if (!isConnected || !raffle || !address) {
      showNotification('error', 'Please connect your wallet');
      return;
    }

    if (chain?.id !== 10143) {
      showNotification('error', 'Please switch to Monad Testnet');
      return;
    }

    try {
      const ticketPriceInEther = formatEther(raffle.ticketPrice);
      const totalPrice = parseFloat(ticketPriceInEther) * quantity;
      const totalPriceWei = parseEther((totalPrice).toString());
      const isNativePayment = raffle.ticketPaymentToken === '0x0000000000000000000000000000000000000000';
      
      // Check user's balance (for native token only, for ERC20 we'll check differently)
      if (isNativePayment && balance && parseFloat(balance.formatted) < totalPrice) {
        showNotification('error', 'Insufficient MON balance');
        return;
      }

      // If it's not native payment (MON), we need to handle ERC20 token approval
      if (!isNativePayment) {
        try {
          // First check ERC20 token balance
          const tokenBalance = await publicClient?.readContract({
            address: raffle.ticketPaymentToken as `0x${string}`,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ],
            functionName: 'balanceOf',
            args: [address as `0x${string}`]
          });

          if (!tokenBalance || tokenBalance < totalPriceWei) {
            const tokenSymbol = getPaymentTokenSymbol();
            showNotification('error', `Insufficient ${tokenSymbol} balance`);
            return;
          }

          // Then check if we have enough allowance
          const allowance = await publicClient?.readContract({
            address: raffle.ticketPaymentToken as `0x${string}`,
            abi: [
              {
                name: 'allowance',
                type: 'function',
                stateMutability: 'view',
                inputs: [
                  { name: 'owner', type: 'address' },
                  { name: 'spender', type: 'address' }
                ],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ],
            functionName: 'allowance',
            args: [address as `0x${string}`, NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`]
          });

          // If allowance is insufficient, request approval
          if (!allowance || allowance < totalPriceWei) {
            const approvalHash = await writeContract({
              address: raffle.ticketPaymentToken as `0x${string}`,
              abi: [
                {
                  name: 'approve',
                  type: 'function',
                  stateMutability: 'nonpayable',
                  inputs: [
                    { name: 'spender', type: 'address' },
                    { name: 'amount', type: 'uint256' }
                  ],
                  outputs: [{ name: '', type: 'bool' }]
                }
              ],
              functionName: 'approve',
              args: [NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`, totalPriceWei]
            });

            // Wait for approval transaction to be confirmed
            if (publicClient) {
              console.log('⏳ Waiting for approval confirmation...');
              // Wait a bit for the transaction to be processed
              await new Promise(resolve => setTimeout(resolve, 2000));
              console.log('✅ Approval confirmed, proceeding with purchase...');
              
              // Additional delay to ensure blockchain state is updated
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Verify approval was successful by checking allowance again
              const newAllowance = await publicClient?.readContract({
                address: raffle.ticketPaymentToken as `0x${string}`,
                abi: [
                  {
                    name: 'allowance',
                    type: 'function',
                    stateMutability: 'view',
                    inputs: [
                      { name: 'owner', type: 'address' },
                      { name: 'spender', type: 'address' }
                    ],
                    outputs: [{ name: '', type: 'uint256' }]
                  }
                ],
                functionName: 'allowance',
                args: [address as `0x${string}`, NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`]
              });
              
              if (!newAllowance || newAllowance < totalPriceWei) {
                throw new Error('Approval verification failed. Please try again.');
              }
              
              console.log('✅ Approval verified, allowance sufficient');
            }
          }
        } catch (approvalError) {
          console.error('Approval failed:', approvalError);
          showNotification('error', 'Token approval failed. Please try again.');
          return;
        }
      }

      // Now proceed with ticket purchase
      await purchaseTickets(raffleId, quantity, ticketPriceInEther);
    } catch (error) {
      console.error('Purchase failed:', error);
      showNotification('error', 'Purchase failed. Please try again.');
    }
  };

  const getUserTicketCount = () => {
    return userTickets ? Number(userTickets) : 0;
  };

  // Analyze participants data
  const getParticipantsData = () => {
    if (!allTickets || !raffle) return [];
    
    // Group tickets by buyer address
    const participantMap = new Map<string, number>();
    
    (allTickets as any[]).forEach((ticket: any) => {
      const buyer = ticket.buyer;
      participantMap.set(buyer, (participantMap.get(buyer) || 0) + 1);
    });
    
    // Convert to array with possibility calculation
    const totalTickets = Number(raffle.ticketsSold || 0);
    
    return Array.from(participantMap.entries()).map(([address, ticketCount]) => ({
      address,
      ticketCount,
      possibility: totalTickets > 0 ? ((ticketCount / totalTickets) * 100).toFixed(2) : '0.00'
    })).sort((a, b) => b.ticketCount - a.ticketCount); // Sort by ticket count descending
  };

  const participants = getParticipantsData();
  
  // Filter and paginate participants
  const filteredParticipants = participants.filter(participant =>
    participant.address.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredParticipants.length / participantsPerPage);
  const startIndex = (currentPage - 1) * participantsPerPage;
  const endIndex = startIndex + participantsPerPage;
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex);
  
  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const canPurchase = () => {
    if (!raffle || !isConnected) return false;
    
    // Check if raffle is active
    if (raffle.status !== 0) return false; // 0 = ACTIVE
    
    // Check if expired
    if (isExpired()) return false;
    
    // Check if sold out
    const ticketsSold = Number(raffle.ticketsSold || 0);
    const maxTickets = Number(raffle.maxTickets || 0);
    if (ticketsSold >= maxTickets) {
      return false;
    }
    
    // Check if quantity exceeds available tickets
    if (quantity > (maxTickets - ticketsSold)) {
      return false;
    }
    
    return true;
  };

  const getRaffleStatus = () => {
    if (!raffle) return 'Unknown';
    
    // Check if sold out
    const ticketsSold = Number(raffle.ticketsSold || 0);
    const maxTickets = Number(raffle.maxTickets || 0);
    const isSoldOut = ticketsSold >= maxTickets;
    
    // Check if expired
    const isRaffleExpired = isExpired();
    
    // Check if there's a winner
    const winner = raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' ? raffle.winner : null;
    
    if (winner) {
      return 'Winner Found';
    }
    
    // 🎯 NEW: Check for "Selecting Winner" state
    // This happens when raffle is ended (sold out or expired) but no winner selected yet
    if ((isSoldOut || isRaffleExpired) && !winner && raffle.status === 0) {
      return 'Selecting Winner';
    }
    
    // 🎯 NEW: Check for "Refunded" state (cancelled with 0 tickets)
    if (raffle.status === 2 && Number(raffle.ticketsSold || 0) === 0) {
      return 'Refunded';
    }
    
    if (isSoldOut || isRaffleExpired || raffle.status === 1) {
      return 'Ended';
    }
    
    if (isSoldOut) {
      return 'Sold Out';
    }
    
    switch (raffle.status) {
      case 0: return 'Active';
      case 1: return 'Ended';
      case 2: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getRewardTypeText = () => {
    if (!raffle) return 'Unknown';
    return raffle.rewardType === 0 ? 'Token' : 'NFT';
  };

  const isExpired = () => {
    if (!raffle || Number(raffle.expirationTime || 0) === 0) return false;
    return Date.now() > Number(raffle.expirationTime) * 1000;
  };

  const getTimeRemaining = () => {
    if (!raffle || Number(raffle.expirationTime || 0) === 0) return null;
    
    const now = Date.now();
    const expiration = Number(raffle.expirationTime) * 1000;
    const remaining = expiration - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getPaymentTokenSymbol = () => {
    if (!raffle) return 'MON';
    
    if (raffle.ticketPaymentToken === '0x0000000000000000000000000000000000000000') {
      return 'MON';
    }
    
    const knownToken = getKnownToken(raffle.ticketPaymentToken);
    return knownToken?.symbol || 'TOKEN';
  };

  const getRewardTokenSymbol = () => {
    if (!raffle) return 'MON';
    
    if (raffle.rewardTokenAddress === '0x0000000000000000000000000000000000000000') {
      return 'MON';
    }
    
    const knownToken = getKnownToken(raffle.rewardTokenAddress);
    return knownToken?.symbol || 'TOKEN';
  };

  // Reveal countdown functions
  const getRevealTimeRemaining = () => {
    if (!revealDeadline || Number(revealDeadline) === 0) return null;
    
    const now = Date.now();
    const deadline = Number(revealDeadline) * 1000;
    const remaining = deadline - now;
    
    if (remaining <= 0) return 'Ready';
    
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const isRevealReady = () => {
    if (!revealDeadline || Number(revealDeadline) === 0) return false;
    return Date.now() >= Number(revealDeadline) * 1000;
  };

  const hasRandomnessCommitment = () => {
    return randomnessCommitment && randomnessCommitment !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  };

  // Update reveal countdown every second
  useEffect(() => {
    if (!hasRandomnessCommitment() || !revealDeadline) return;

    const updateCountdown = () => {
      const timeRemaining = getRevealTimeRemaining();
      setRevealCountdown(timeRemaining);
    };

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [revealDeadline, randomnessCommitment]);

  // Timer for real-time time remaining updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // Early return if raffle ID is invalid
  if (internalRaffleId === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Raffle Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The raffle link you're looking for doesn't exist or has been removed.
          </p>
          <a
            href="/app"
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading raffle...</p>
        </div>
      </div>
    );
  }

  if (raffleError || !raffle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Raffle Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {raffleError?.message || 'This raffle does not exist or has been removed.'}
          </p>
          <a 
            href="/app"
            className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
          <div className={`p-4 rounded-lg shadow-lg border max-w-sm ${
            notification.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
              : notification.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {notification.type === 'error' && (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {notification.type === 'info' && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="flex-shrink-0 ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link 
                href="/rafflehouse"
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm sm:text-base font-medium">Back to RaffleHouse</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Navigation Links */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link 
                  href="/"
                  className="hidden sm:block px-2 lg:px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                >
                  Home
                </Link>
                <Link 
                  href="/app/dashboard"
                  className="px-2 lg:px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/nadpay"
                  className="px-2 lg:px-3 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                >
                  NadPay
                </Link>
                <Link 
                  href="/nadswap"
                  className="px-2 lg:px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                >
                  NadSwap
                </Link>
              </div>
            
              {/* My Tickets Button */}
              {isConnected && (
                <div className="relative">
                  <button
                    onClick={() => setShowMyTickets(!showMyTickets)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors relative"
                  >
                    <Ticket className="w-4 h-4" />
                    {allUserTickets.filter(ticket => ticket.status === 0).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {allUserTickets.filter(ticket => ticket.status === 0).length}
                      </span>
                    )}
                  </button>
                </div>
              )}
            
              {/* Notifications Button */}
              {isConnected && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors relative"
                  >
                    <Bell className="w-4 h-4" />
                    {getUnreadCount() > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {getUnreadCount()}
                      </span>
                    )}
                  </button>
                </div>
              )}
            
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            
              {/* Custom Wallet Button */}
              <div className="relative">
                <ConnectKitButton.Custom>
                  {({ show, truncatedAddress, ensName }) => (
                    <button
                      onClick={show}
                      className="flex items-center space-x-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {ensName ? ensName.slice(0, 2) : address?.slice(2, 4).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium hidden sm:inline">
                        {ensName || truncatedAddress}
                      </span>
                    </button>
                  )}
                </ConnectKitButton.Custom>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Raffle Content - Left Side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6">
            {/* Raffle Header */}
            <div className="text-center mb-6">
              {raffle.rewardType === 1 ? (
                // NFT Raffle - Keep Trophy
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
              ) : (
                // Token Raffle - Use Coin Logo
                <div className="w-16 h-16 bg-white dark:bg-dark-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg border border-gray-200 dark:border-dark-600">
                  {(() => {
                    const token = getKnownToken(raffle.rewardTokenAddress);
                    if (token?.logo) {
                      return (
                        <img 
                          src={token.logo} 
                          alt={token.symbol}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            // Fallback to text if image fails
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-10 h-10 bg-gray-100 dark:bg-dark-600 rounded-full flex items-center justify-center">
                                  <span class="text-lg font-bold text-gray-700 dark:text-gray-300">${token.symbol.charAt(0)}</span>
                                </div>
                              `;
                            }
                          }}
                        />
                      );
                    } else {
                      // Fallback to symbol letter
                      return (
                        <div className="w-10 h-10 bg-gray-100 dark:bg-dark-600 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                            {getRewardTokenSymbol().charAt(0)}
                          </span>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {raffle.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                {raffle.description}
              </p>
              
              {/* Status Badge */}
              <div className="flex items-center justify-center space-x-2 mt-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  getRaffleStatus() === 'Active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : getRaffleStatus() === 'Selecting Winner'
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-400 animate-pulse'
                    : getRaffleStatus() === 'Winner Found'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : getRaffleStatus() === 'Refunded'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : getRaffleStatus() === 'Ended'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {getRaffleStatus() === 'Selecting Winner' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                      Selecting Winner
                    </>
                  ) : getRaffleStatus() === 'Refunded' ? (
                    <>
                      <ArrowLeft className="w-3 h-3 inline-block mr-2" />
                      Refunded
                    </>
                  ) : (
                    getRaffleStatus()
                  )}
                </span>

                {/* Reveal Countdown - Show when raffle is ended/sold out but winner not selected yet */}
                {(getRaffleStatus() === 'Ended' || (Number(raffle.ticketsSold || 0) >= Number(raffle.maxTickets || 0))) && 
                 raffle.winner === '0x0000000000000000000000000000000000000000' && 
                 hasRandomnessCommitment() && 
                 revealCountdown && 
                 revealCountdown !== 'Ready' ? (
                  <span className="px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white animate-pulse shadow-lg">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Winner reveal in: {revealCountdown}
                  </span>
                ) : null}

                {/* Ready to Reveal */}
                {(getRaffleStatus() === 'Ended' || (Number(raffle.ticketsSold || 0) >= Number(raffle.maxTickets || 0))) && 
                 raffle.winner === '0x0000000000000000000000000000000000000000' && 
                 hasRandomnessCommitment() && 
                 isRevealReady() ? (
                  <span className="px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-bounce shadow-lg">
                    <Star className="w-4 h-4 inline mr-2" />
                    Ready to reveal winner!
                  </span>
                ) : null}
                
                {raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    <Star className="w-4 h-4 inline mr-1" />
                    Winner: {raffle.winner.slice(0, 6)}...{raffle.winner.slice(-4)}
                  </span>
                )}
              </div>
            </div>

            {/* NFT Showcase - Only for NFT rewards */}
            {raffle.rewardType === 1 && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
                    {/* NFT Image */}
                    <div className="flex-shrink-0">
                      {nftLoading ? (
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : nftMetadata?.image ? (
                        <img
                          src={nftMetadata.image}
                          alt={nftMetadata.name || 'NFT'}
                          className="w-20 h-20 rounded-lg object-cover border-2 border-white dark:border-gray-700 shadow-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <Gift className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* NFT Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {nftMetadata?.name || `NFT #${raffle.rewardAmount.toString()}`}
                          </h3>
                          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1.5">
                            Token ID: {raffle.rewardAmount.toString()}
                          </p>
                          {nftMetadata?.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {nftMetadata.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>Contract: {raffle.rewardTokenAddress.slice(0, 6)}...{raffle.rewardTokenAddress.slice(-4)}</span>
                            <span>•</span>
                            <span>ERC-721</span>
                          </div>
                        </div>
                        
                        {/* Prize Badge */}
                        <div className="flex-shrink-0">
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-lg">
                            🏆 Prize NFT
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Raffle Stats - Enhanced */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center space-x-3">
                  {raffle.rewardType === 1 ? (
                    // NFT Reward - Keep Gift icon
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    // Token Reward - Use coin logo
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                      {getRewardTokenSymbol() === 'MON' ? (
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-500">M</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-500">{getRewardTokenSymbol().charAt(0)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Reward</p>
                    {raffle.rewardType === 1 ? (
                      // NFT Reward
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                          {nftMetadata?.name || `NFT #${raffle.rewardAmount.toString()}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {raffle.rewardAmount.toString()}
                        </p>
                      </div>
                    ) : (
                      // Token Reward
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {formatEther(raffle.rewardAmount || BigInt(0))} {getRewardTokenSymbol()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Ticket Price</p>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">
                      {formatEther(raffle.ticketPrice || BigInt(0))} {getPaymentTokenSymbol()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Tickets Sold</p>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">
                      {raffle.ticketsSold?.toString() || '0'}/{raffle.maxTickets?.toString() || '0'}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (Number(raffle.ticketsSold || 0) / Number(raffle.maxTickets || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Time Left section - only show if not sold out */}
              {Number(raffle.ticketsSold || 0) < Number(raffle.maxTickets || 0) && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Time Left</p>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {getTimeRemaining() || 'No limit'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User's Tickets */}
            {isConnected && getUserTicketCount() > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-sm text-purple-800 dark:text-purple-200">
                    You own {getUserTicketCount()} ticket{getUserTicketCount() !== 1 ? 's' : ''} in this raffle
                  </span>
                </div>
              </div>
            )}

            {/* Winner Section - Compact */}
            {raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-600 rounded-lg p-4 mb-4"
              >
                {/* Compact Winner Display */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-800 dark:text-green-200">
                        Winner: {raffle.winner.slice(0, 6)}...{raffle.winner.slice(-4)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Prize: {raffle.rewardType === 1 ? (
                          `NFT #${raffle.rewardAmount.toString()}`
                        ) : (
                          `${formatEther(raffle.rewardAmount || BigInt(0))} ${getRewardTokenSymbol()}`
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {address?.toLowerCase() === raffle.winner.toLowerCase() && (
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
                        <Star className="w-3 h-3 mr-1" />
                        That's You! 🎉
                      </span>
                      {!raffle.rewardClaimed && (
                        <button
                          onClick={handleClaimReward}
                          disabled={claiming || isClaimConfirming}
                          className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-xs"
                        >
                          {claiming || isClaimConfirming ? (
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Claiming...</span>
                            </div>
                          ) : (
                            <span>Claim Prize</span>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Message for non-winners */}
                {address?.toLowerCase() !== raffle.winner.toLowerCase() && (
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                    <p className="text-xs text-green-600 dark:text-green-400 text-center">
                      Better luck next time! 🍀
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Purchase Section */}
            {!isConnected ? (
              <div className="text-center">
                <ConnectKitButton.Custom>
                  {({ show }) => (
                    <button
                      onClick={show}
                      className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg"
                    >
                      <Wallet className="w-5 h-5 inline mr-2" />
                      Connect Wallet to Participate
                    </button>
                  )}
                </ConnectKitButton.Custom>
              </div>
            ) : chain?.id !== 10143 ? (
              /* Wrong Network */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Wrong Network
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Please switch to Monad Testnet to continue
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Current: {chain?.name} • Required: Monad Testnet
                </p>
                <button
                  onClick={() => switchChain({ chainId: 10143 })}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold"
                >
                  Switch to Monad Testnet
                </button>
              </div>
            ) : !canPurchase() ? (
              <div className="text-center">
                {/* Sold Out - Special Treatment - Only show if no winner announced */}
                {Number(raffle.ticketsSold || 0) >= Number(raffle.maxTickets || 0) && raffle.winner === '0x0000000000000000000000000000000000000000' ? (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Ticket className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-1 text-center">
                        Sold Out!
                      </h3>
                      <p className="text-red-600 dark:text-red-400 mb-3 text-center text-sm">
                        All tickets sold! Winner will be revealed soon.
                      </p>
                      
                                             {/* Show winner selection status if sold out but winner not selected */}
                       {raffle.winner === '0x0000000000000000000000000000000000000000' && (
                         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                           <div className="flex items-center justify-center space-x-2 mb-1">
                             <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                             <span className="font-medium text-blue-900 dark:text-blue-200 text-sm">Selecting Winner</span>
                           </div>
                           <p className="text-blue-700 dark:text-blue-300 text-center text-xs">
                             Winner will be announced shortly! ⚡
                           </p>
                         </div>
                       )}
                    </div>
                  </div>
                ) : (
                  /* Other cases (expired, ended, etc.) */
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                    <p className="text-gray-600 dark:text-gray-400">
                      {raffle.status !== 0 ? 'This raffle has ended' :
                       isExpired() ? 'This raffle has expired' :
                       quantity > (Number(raffle.maxTickets || 0) - Number(raffle.ticketsSold || 0)) ? `Only ${Number(raffle.maxTickets || 0) - Number(raffle.ticketsSold || 0)} tickets remaining` :
                       'You have reached the maximum tickets per wallet'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Tickets
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={Number(raffle.maxTickets || 0) - Number(raffle.ticketsSold || 0)}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(
                        Number(raffle.maxTickets || 0) - Number(raffle.ticketsSold || 0),
                        quantity + 1
                      ))}
                      className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Total: {(parseFloat(formatEther(raffle.ticketPrice || BigInt(0))) * quantity).toFixed(4).replace(/\.?0+$/, '')} {getPaymentTokenSymbol()}
                  </p>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={handlePurchaseTickets}
                  disabled={purchasing || isConfirming}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : isConfirming ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Confirming...</span>
                    </div>
                  ) : (
                    `Buy ${quantity} Ticket${quantity !== 1 ? 's' : ''}`
                  )}
                </button>

                {purchaseError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      Error: {purchaseError.message}
                    </p>
                  </div>
                )}
              </div>
            )}

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Powered by <span className="font-medium text-purple-600 dark:text-purple-400">NadPay</span> on Monad Blockchain
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Participants Sidebar - Right Side */}
            {participants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-1"
              >
                <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 sticky top-8 max-h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Users className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                      Participants
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {participants.length.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Search */}
                  {participants.length > 5 && (
                    <div className="relative mb-4">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                    {/* Participants List */}
                    <div className="divide-y divide-gray-200 dark:divide-gray-600">
                      {currentParticipants.map((participant, index) => {
                        const originalIndex = participants.findIndex(p => p.address === participant.address);
                        return (
                          <div key={participant.address} className="bg-white dark:bg-dark-800 px-3 py-2 hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  #{originalIndex + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-mono text-xs font-medium text-gray-900 dark:text-white truncate">
                                    {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                                  </p>
                                  {participant.address.toLowerCase() === address?.toLowerCase() && (
                                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                      You
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white">{participant.ticketCount}</p>
                                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">{participant.possibility}%</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Pagination for sidebar */}
                    {totalPages > 1 && (
                      <div className="bg-white dark:bg-dark-800 px-3 py-2 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {startIndex + 1}-{Math.min(endIndex, filteredParticipants.length)} of {filteredParticipants.length}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="p-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {currentPage}/{totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="p-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Summary Stats */}
                   <div className="mt-4 grid grid-cols-1 gap-3">
                    <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Participants</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{participants.length.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Avg Tickets/Wallet</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {participants.length > 0 ? (participants.reduce((sum, p) => sum + p.ticketCount, 0) / participants.length).toFixed(1) : '0'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Top Holder</p>
                      <p className="font-semibold text-purple-600 dark:text-purple-400">
                        {participants.length > 0 ? `${participants[0].possibility}%` : '0%'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

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
          </div>

          <div className="max-h-80 overflow-y-auto">
            {allUserTickets.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tickets purchased yet</p>
              </div>
            ) : (
              allUserTickets.slice(0, 20).map((ticket) => (
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
              ))
            )}
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed top-16 right-4 z-50 w-96 max-w-[90vw] bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-xl">
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                {getUnreadCount() > 0 && (
                  <button
                    onClick={() => {
                      markAllAsRead();
                    }}
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
              notifications.slice(0, 20).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 dark:border-dark-700 last:border-b-0 ${
                    !notif.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                                             <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                         {(notif as any).title || 'Notification'}
                       </p>
                       <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                         {(notif as any).message || 'No message'}
                       </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => clearNotification(notif.id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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