"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, Trophy, ArrowLeft, Ticket, Users, Clock, Gift, Star, Search, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { useAccount, useBalance, useSwitchChain, usePublicClient, useWalletClient } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useTheme } from "next-themes";
import { useRaffleV3, formatRaffleV3, NADRAFFLE_V3_CONTRACT } from "@/hooks/useNadRaffleV3Contract";
import { decodePredictableSecureRaffleId } from "@/lib/linkUtils";
import { formatEther, parseEther } from "viem";
import { getKnownToken } from "@/lib/knownAssets";
import { useNFTMetadata } from "@/hooks/useNFTMetadata";

export default function RaffleContent() {
  const params = useParams();
  const secureRaffleId = params.raffleId as string;
  const { theme, setTheme } = useTheme();
  
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
  
  // Use V3 hook for raffle data
  const { data: raffleData, isLoading: loadingRaffle, error: raffleError } = useRaffleV3(raffleId);

  // Get user tickets
  const { data: userTickets } = useReadContract({
    address: NADRAFFLE_V3_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_V3_CONTRACT.abi,
    functionName: 'getUserTickets',
    args: address ? [BigInt(raffleId), address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && raffleId > 0,
    },
  });

  // Get all raffle tickets to show participants
  const { data: allTickets } = useReadContract({
    address: NADRAFFLE_V3_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_V3_CONTRACT.abi,
    functionName: 'getRaffleTickets',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId > 0,
    },
  });

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
  
  const purchaseTickets = async (raffleId: number, ticketQuantity: number, ticketPriceInEther: string) => {
    if (!raffle) throw new Error('Raffle not loaded');
    
    const totalPrice = parseEther((parseFloat(ticketPriceInEther) * ticketQuantity).toString());
    const isNativePayment = raffle.ticketPaymentToken === '0x0000000000000000000000000000000000000000';
    
    return writeContract({
      address: NADRAFFLE_V3_CONTRACT.address as `0x${string}`,
      abi: NADRAFFLE_V3_CONTRACT.abi,
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
      alert('Tickets purchased successfully!');
      // Force page refresh to update data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isConfirmed]);

  const handleClaimReward = async () => {
    if (!raffle || !address) return;
    
    try {
      await claimRewardWrite({
        address: NADRAFFLE_V3_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_V3_CONTRACT.abi,
        functionName: 'claimReward',
        args: [BigInt(raffleId)],
      });
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  const handlePurchaseTickets = async () => {
    if (!isConnected || !raffle || !address) {
      alert('Please connect your wallet');
      return;
    }

    if (chain?.id !== 10143) {
      alert('Please switch to Monad Testnet');
      return;
    }

    try {
      const ticketPriceInEther = formatEther(raffle.ticketPrice);
      const totalPrice = parseFloat(ticketPriceInEther) * quantity;
      
      // Check user's balance
      if (balance && parseFloat(balance.formatted) < totalPrice) {
        alert('Insufficient balance');
        return;
      }

      await purchaseTickets(raffleId, quantity, ticketPriceInEther);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
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
    
    // Check wallet limit
    if (Number(raffle.maxTicketsPerWallet || 0) > 0) {
      const userCount = getUserTicketCount();
      return userCount + quantity <= Number(raffle.maxTicketsPerWallet || 0);
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
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
      {/* NadPay Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/app" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">NadRaffle</h1>
              </div>
            </a>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex items-center p-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <a 
                href="/app"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
              >
                <Trophy className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Create Your Raffle</span>
                <span className="sm:hidden">Create</span>
              </a>
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
              <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-8">
            {/* Raffle Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {raffle.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {raffle.description}
              </p>
              
              {/* Status Badge */}
              <div className="flex items-center justify-center space-x-2 mt-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  getRaffleStatus() === 'Active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : getRaffleStatus() === 'Ended'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {getRaffleStatus()}
                </span>
                
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
              <div className="mb-8">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                    {/* NFT Image */}
                    <div className="flex-shrink-0">
                      {nftLoading ? (
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : nftMetadata?.image ? (
                        <img
                          src={nftMetadata.image}
                          alt={nftMetadata.name || 'NFT'}
                          className="w-24 h-24 rounded-xl object-cover border-2 border-white dark:border-gray-700 shadow-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                  <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
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
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {nftMetadata?.name || `NFT #${raffle.rewardAmount.toString()}`}
                          </h3>
                          <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                            Token ID: {raffle.rewardAmount.toString()}
                          </p>
                          {nftMetadata?.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {nftMetadata.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Contract: {raffle.rewardTokenAddress.slice(0, 6)}...{raffle.rewardTokenAddress.slice(-4)}</span>
                            <span>•</span>
                            <span>ERC-721</span>
                          </div>
                        </div>
                        
                        {/* Prize Badge */}
                        <div className="flex-shrink-0">
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                            🏆 Prize NFT
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Raffle Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Gift className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reward</p>
                {raffle.rewardType === 1 ? (
                  // NFT Reward
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {nftMetadata?.name || `NFT #${raffle.rewardAmount.toString()}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Token ID: {raffle.rewardAmount.toString()}
                    </p>
                  </div>
                ) : (
                  // Token Reward
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatEther(raffle.rewardAmount || BigInt(0))} {getRewardTokenSymbol()}
                  </p>
                )}
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Price</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatEther(raffle.ticketPrice || BigInt(0))} {getPaymentTokenSymbol()}
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tickets Sold</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {raffle.ticketsSold?.toString() || '0'}/{raffle.maxTickets?.toString() || '0'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time Left</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {getTimeRemaining() || 'No limit'}
                </p>
              </div>
            </div>

            {/* User's Tickets */}
            {isConnected && getUserTicketCount() > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-purple-800 dark:text-purple-200">
                    You own {getUserTicketCount()} ticket{getUserTicketCount() !== 1 ? 's' : ''} in this raffle
                  </span>
                </div>
              </div>
            )}

            {/* Winner Section */}
            {raffle.status === 1 && raffle.winner !== '0x0000000000000000000000000000000000000000' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Winner Announced!
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      {raffle.winner.slice(0, 6)}...{raffle.winner.slice(-4)}
                    </p>
                  </div>
                </div>
                
                {address?.toLowerCase() === raffle.winner.toLowerCase() && !raffle.rewardClaimed && (
                  <button
                    onClick={handleClaimReward}
                    disabled={claiming || isClaimConfirming}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {claiming || isClaimConfirming ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{claiming ? 'Claiming...' : 'Confirming...'}</span>
                      </div>
                    ) : (
                      'Claim Your Reward'
                    )}
                  </button>
                )}

                {address?.toLowerCase() === raffle.winner.toLowerCase() && raffle.rewardClaimed && (
                  <div className="text-center">
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      🎉 Reward claimed successfully!
                    </p>
                  </div>
                )}
              </div>
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
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    {raffle.status !== 0 ? 'This raffle has ended' :
                     isExpired() ? 'This raffle has expired' :
                     Number(raffle.ticketsSold || 0) >= Number(raffle.maxTickets || 0) ? 'Sold Out - All tickets have been sold' :
                     quantity > (Number(raffle.maxTickets || 0) - Number(raffle.ticketsSold || 0)) ? `Only ${Number(raffle.maxTickets || 0) - Number(raffle.ticketsSold || 0)} tickets remaining` :
                     'You have reached the maximum tickets per wallet'}
                  </p>
                </div>
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
                      max={Math.min(
                        Number(raffle.maxTicketsPerWallet || 0) - getUserTicketCount(),
                        Number(raffle.maxTickets || 0) - Number(raffle.ticketsSold || 0)
                      )}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(
                        Number(raffle.maxTicketsPerWallet || 0) - getUserTicketCount(),
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
    </div>
  );
} 