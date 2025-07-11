"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, Trophy, ArrowLeft, Gift, Users, RefreshCw, Twitter, Search } from "lucide-react";
import { useAccount, useBalance, useSwitchChain, usePublicClient, useWalletClient } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { config } from "@/lib/wagmi";

import { useRaffleV7, NADRAFFLE_V7_CONTRACT, formatRaffleV7 } from "@/hooks/useNadRaffleV7Contract";
import { decodePredictableSecureRaffleId, createPredictableSecureRaffleId } from "@/lib/linkUtils";
import { formatEther, parseEther } from "viem";
import { getKnownToken, getKnownNFT, isKnownToken, isKnownNFT } from "@/lib/knownAssets";
import { useNFTMetadata } from "@/hooks/useNFTMetadata";
import { useUserRaffles } from "@/hooks/useUserRaffles";
import { usePointsTracker, useTwitterConnected } from "@/hooks/usePointsTracker";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RaffleContent() {
  console.log('🚀 RaffleContent component started!');
  
  const params = useParams();
  const secureRaffleId = params.raffleId as string;
  const router = useRouter();
  
  console.log('📝 Received raffleId from params:', secureRaffleId);
  
  // Smart raffle ID decoding - handle both numeric and secure hex IDs
  const getRaffleId = () => {
    // First check if it's a simple numeric string (like "0", "1", "2")
    const numericId = parseInt(secureRaffleId);
    if (!isNaN(numericId) && numericId.toString() === secureRaffleId) {
      console.log('🔢 Using direct numeric ID:', numericId);
      return numericId;
    }
    
    // If not numeric, try to decode as secure hex ID
    const decodedId = decodePredictableSecureRaffleId(secureRaffleId);
    if (decodedId !== null) {
      console.log('🔐 Decoded secure ID:', decodedId);
      return decodedId;
    }
    
    // If both fail, default to 0
    console.log('❌ Failed to parse raffle ID, defaulting to 0');
    return 0;
  };
  
  const raffleId = getRaffleId();
  
  console.log('🎫 RaffleContent Debug:', {
    secureRaffleId,
    raffleId,
    debugMessage: `Successfully resolved to raffle ID: ${raffleId}`
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
  
  // Points tracking - no longer needs enabled parameter
  const { hasTwitter, twitterHandle } = useTwitterConnected();
  const { trackNadRaffleTicketPurchase, trackNadRaffleTicketSale } = usePointsTracker();
  
  // Use V6 hook for raffle data with refetch capability
  const { data: raffleData, isLoading: loadingRaffle, error: raffleError, refetch: refetchRaffleData } = useRaffleV7(raffleId);
  
  // Purchase tickets functionality using writeContract
  const { writeContractAsync } = useWriteContract();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [transactionStep, setTransactionStep] = useState<'idle' | 'approving' | 'purchasing'>('idle');


  
  const [quantity, setQuantity] = useState(1);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [participants, setParticipants] = useState<Array<{address: string, tickets: number, twitterHandle?: string, twitterName?: string}>>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantsFetched, setParticipantsFetched] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const participantsPerPage = 20;
  
  // Winner Twitter data
  const [winnerTwitter, setWinnerTwitter] = useState<{
    handle?: string;
    name?: string;
    avatar?: string;
  } | null>(null);
  const [loadingWinnerTwitter, setLoadingWinnerTwitter] = useState(false);
  
  // Track processed hashes to prevent duplicate notifications
  const processedPurchases = useRef<Set<string>>(new Set());
  
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
  
  // Convert contract data to display format
  const raffle = raffleData ? formatRaffleV7(raffleData) : null;



  // Fetch participants from blockchain using contract mapping
  const fetchParticipants = useCallback(async () => {
    if (!publicClient || raffleId === null) {
      console.log('❌ Cannot fetch participants - missing requirements:', { publicClient: !!publicClient, raffleId });
      return;
    }
    
    // Rate limiting: don't fetch more than once every 10 seconds
    const now = Date.now();
    if (now - lastFetchTime < 10000 && participantsFetched) {
      console.log('⏰ Skipping fetch - too soon since last fetch');
      return;
    }
    
    setLoadingParticipants(true);
    try {
      console.log('🔍 Fetching participants for raffle:', raffleId);
      console.log('📍 Contract address:', NADRAFFLE_V7_CONTRACT.address);
      
      // Use the contract's getRaffleParticipants function
      console.log('🔍 Getting participants for raffle:', raffleId);
      
      const participantAddresses = await publicClient.readContract({
        address: NADRAFFLE_V7_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_V7_CONTRACT.abi,
        functionName: 'getRaffleParticipants',
        args: [BigInt(raffleId)]
      }) as string[];
      
      console.log('📊 Found', participantAddresses.length, 'participants for raffle', raffleId);
      
      // Get ticket counts for each participant
      const participantList: Array<{address: string, tickets: number, twitterHandle?: string, twitterName?: string}> = [];
      
      for (const address of participantAddresses) {
        // Get ticket count from the contract
        const ticketCount = await publicClient.readContract({
          address: NADRAFFLE_V7_CONTRACT.address as `0x${string}`,
          abi: NADRAFFLE_V7_CONTRACT.abi,
          functionName: 'ticketCounts',
          args: [BigInt(raffleId), address as `0x${string}`]
        }) as bigint;
        
        const tickets = Number(ticketCount);
        console.log(`📝 ${address} has ${tickets} tickets`);
        
        const participant = {
          address: address.toLowerCase(),
          tickets
        };
        
        // Fetch Twitter info for this participant
        try {
          console.log('🐦 Fetching Twitter info for:', address);
          const twitterResponse = await fetch(`/api/profile/${address}`);
          const twitterData = await twitterResponse.json();
          
          if (twitterResponse.ok && twitterData.profile?.twitter) {
            participantList.push({
              ...participant,
              twitterHandle: twitterData.profile.twitter.username,
              twitterName: twitterData.profile.twitter.name
            });
            console.log('✅ Twitter info found:', {
              handle: twitterData.profile.twitter.username,
              name: twitterData.profile.twitter.name
            });
          } else {
            participantList.push(participant);
            console.log('❌ No Twitter info found for participant');
          }
        } catch (twitterError) {
          console.error('❌ Error fetching Twitter info:', twitterError);
          participantList.push(participant);
        }
      }
      
      console.log('🎯 Final participant list:', participantList);
      
      // If no participants found through events but tickets are sold, there might be an issue
      if (participantList.length === 0 && raffle && Number(raffle.soldTickets) > 0) {
        console.warn('⚠️ No participants found through events but tickets are sold!');
        console.log('🔍 Debug info:', {
          raffleId,
          soldTickets: raffle.soldTickets,
          contractAddress: NADRAFFLE_V7_CONTRACT.address
        });
      }

      setParticipants(participantList);
      setParticipantsFetched(true);
      setLastFetchTime(now);
      
    } catch (error) {
      console.error('❌ Error fetching participants:', error);
      setParticipantsFetched(true);
    } finally {
      setLoadingParticipants(false);
    }
  }, [publicClient, raffleId, lastFetchTime, participantsFetched, raffle]);

  // Manual refresh function for participants
  const refreshParticipants = useCallback(() => {
    setParticipantsFetched(false);
    setLastFetchTime(0);
    fetchParticipants();
  }, [fetchParticipants]);

  // Filter and sort participants based on search query and ticket count
  const filteredParticipants = participants
    .filter(participant => {
      const query = searchQuery.toLowerCase();
      return (
        participant.address.toLowerCase().includes(query) ||
        (participant.twitterHandle && participant.twitterHandle.toLowerCase().includes(query)) ||
        (participant.twitterName && participant.twitterName.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => b.tickets - a.tickets); // Sort by ticket count: highest to lowest

  // Pagination logic
  const totalPages = Math.ceil(filteredParticipants.length / participantsPerPage);
  const startIndex = (currentPage - 1) * participantsPerPage;
  const endIndex = startIndex + participantsPerPage;
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Find current user's ticket count
  const userTickets = participants.find(p => 
    address && p.address.toLowerCase() === address.toLowerCase()
  )?.tickets || 0;

  // Auto-refresh participants when raffle soldTickets changes
  const [previousSoldTickets, setPreviousSoldTickets] = useState<number>(0);
  
  useEffect(() => {
    if (raffle) {
      const currentSoldTickets = Number(raffle.soldTickets);
      if (currentSoldTickets !== previousSoldTickets) {
        console.log('🎫 Ticket sales changed from', previousSoldTickets, 'to', currentSoldTickets);
        if (previousSoldTickets > 0) { // Only refresh if this isn't the initial load
          console.log('🔄 Auto-refreshing participants due to ticket sale...');
          refreshParticipants();
        }
        setPreviousSoldTickets(currentSoldTickets);
      }
    }
  }, [raffle?.soldTickets, previousSoldTickets, refreshParticipants]);

  // Periodic auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Periodic refresh of participants...');
      refreshParticipants();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refreshParticipants]);

  // Fetch winner Twitter data when winner is available
  useEffect(() => {
    const fetchWinnerTwitter = async () => {
      if (!raffle?.winner || raffle.winner === '0x0000000000000000000000000000000000000000') {
        setWinnerTwitter(null);
        return;
      }

      setLoadingWinnerTwitter(true);
      try {
        console.log('🐦 Fetching Twitter info for winner:', raffle.winner);
        const twitterResponse = await fetch(`/api/profile/${raffle.winner}`);
        const twitterData = await twitterResponse.json();
        
        if (twitterResponse.ok && twitterData.profile?.twitter) {
          setWinnerTwitter({
            handle: twitterData.profile.twitter.username,
            name: twitterData.profile.twitter.name,
            avatar: twitterData.profile.twitter.profile_image_url
          });
          console.log('✅ Winner Twitter info found:', {
            handle: twitterData.profile.twitter.username,
            name: twitterData.profile.twitter.name
          });
        } else {
          setWinnerTwitter(null);
          console.log('❌ No Twitter info found for winner');
        }
      } catch (error) {
        console.error('❌ Error fetching winner Twitter info:', error);
        setWinnerTwitter(null);
      } finally {
        setLoadingWinnerTwitter(false);
      }
    };

    fetchWinnerTwitter();
  }, [raffle?.winner]);
  
  // Debug raffle data
  if (raffle) {
    console.log('🔍 Raw raffle data from contract:', raffleData);
    console.log('🎯 Formatted raffle data:', raffle);
  }

  // Fetch NFT metadata if reward is actually an NFT (check against known assets)
  const shouldFetchNFT = raffle && (() => {
    if (raffle.rewardTokenAddress && raffle.rewardTokenAddress !== '0x0000000000000000000000000000000000000000') {
      const knownToken = getKnownToken(raffle.rewardTokenAddress);
      const knownNFT = getKnownNFT(raffle.rewardTokenAddress);
      
      // Only fetch NFT metadata if it's a known NFT or if it's unknown but marked as NFT type
      return knownNFT || (!knownToken && raffle.rewardType === 2);
    }
    return false;
  })();
  
  const { metadata: nftMetadata, isLoading: nftLoading } = useNFTMetadata(
    shouldFetchNFT ? raffle.rewardTokenAddress : '',
    shouldFetchNFT ? raffle.rewardTokenId?.toString() : ''
  );

  const loading = loadingRaffle;

  // Fetch participants when raffle data loads
  useEffect(() => {
    if (raffle && publicClient && !participantsFetched) {
      fetchParticipants();
    }
  }, [raffle, publicClient, participantsFetched, fetchParticipants]);

  // This effect is no longer needed as purchase confirmation is handled in handlePurchaseTickets



  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);



  const handlePurchaseTickets = async () => {
    console.log('🎫 Purchase button clicked');
    
    if (!isConnected || !raffle || !address) {
      console.log('❌ Cannot purchase - missing requirements:', { isConnected, raffle: !!raffle, address });
      showNotification('error', 'Please connect your wallet');
      return;
    }

    if (chain?.id !== 10143) {
      console.log('❌ Wrong chain:', chain?.id);
      showNotification('error', 'Please switch to Monad Testnet');
      return;
    }

    console.log('🔍 Raffle payment token:', raffle.ticketPaymentToken);

    setIsPurchasing(true);
    setTransactionStep('idle');

    try {
      const ticketPriceInEther = formatEther(raffle.ticketPrice);
      const totalPrice = parseFloat(ticketPriceInEther) * quantity;
      
      console.log('💰 Purchase details:', {
        ticketPrice: ticketPriceInEther,
        quantity,
        totalPrice,
        paymentToken: raffle.ticketPaymentToken
      });
      
      // Check user's balance only for MON payments
      if (!raffle.ticketPaymentToken || raffle.ticketPaymentToken === '0x0000000000000000000000000000000000000000') {
      if (balance && parseFloat(balance.formatted) < totalPrice) {
        showNotification('error', 'Insufficient MON balance');
          setIsPurchasing(false);
        return;
      }
      }

      // V7 purchase tickets - handle payment token
      if (!raffle.ticketPaymentToken || raffle.ticketPaymentToken === '0x0000000000000000000000000000000000000000') {
        // Native MON payment
        console.log('💸 Purchasing with native MON');
        setTransactionStep('purchasing');
        
        const hash = await writeContractAsync({
          address: NADRAFFLE_V7_CONTRACT.address as `0x${string}`,
          abi: NADRAFFLE_V7_CONTRACT.abi,
        functionName: 'purchaseTickets',
        args: [BigInt(raffleId), BigInt(quantity)],
        value: parseEther(totalPrice.toString()),
      });
        
        console.log('⏳ Waiting for transaction confirmation...');
        await waitForTransactionReceipt(config, {
          hash,
        });
        
        showNotification('success', 'Tickets purchased successfully!');
        refetchRaffleData();
        refreshParticipants();
        
        // Track points
        const metadata = {
          raffleId: raffleId.toString(),
          creatorAddress: raffle.creator,
        };
        
        trackNadRaffleTicketPurchase(hash, totalPrice.toString(), raffleId.toString(), metadata)
          .then((result) => {
            console.log('🎉 Points awarded for ticket purchase! Creator points awarded automatically.', result);
          })
          .catch(error => {
            console.error('❌ Error tracking ticket purchase points:', error);
          });
          
      } else {
        // ERC20 token payment - need to handle approval first
        console.log('💸 Purchasing with ERC20 token:', raffle.ticketPaymentToken);
        
        // Check token balance first
        const tokenBalance = await publicClient?.readContract({
          address: raffle.ticketPaymentToken as `0x${string}`,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            },
          ],
          functionName: 'balanceOf',
          args: [address],
        });
        
        const totalCostWei = raffle.ticketPrice * BigInt(quantity);
        
        if (!tokenBalance || tokenBalance < totalCostWei) {
          const knownToken = getKnownToken(raffle.ticketPaymentToken);
          showNotification('error', `Insufficient ${knownToken?.symbol || 'token'} balance`);
          setIsPurchasing(false);
          return;
        }
        
        // Check current allowance
        const allowance = await publicClient?.readContract({
          address: raffle.ticketPaymentToken as `0x${string}`,
          abi: [
            {
              name: 'allowance',
              type: 'function',
              stateMutability: 'view',
              inputs: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
              ],
              outputs: [{ name: '', type: 'uint256' }],
            },
          ],
          functionName: 'allowance',
          args: [address, NADRAFFLE_V7_CONTRACT.address as `0x${string}`],
        });
        
        console.log('💰 Token payment details:', {
          tokenBalance: tokenBalance?.toString(),
          totalCostWei: totalCostWei.toString(),
          currentAllowance: allowance?.toString(),
        });
        
        // Approve if needed
        if (!allowance || allowance < totalCostWei) {
          console.log('🔓 Approving token spend...');
          setTransactionStep('approving');
          showNotification('info', 'Approving token spend...');
          
          const approvalHash = await writeContractAsync({
            address: raffle.ticketPaymentToken as `0x${string}`,
            abi: [
              {
                name: 'approve',
                type: 'function',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'spender', type: 'address' },
                  { name: 'amount', type: 'uint256' },
                ],
                outputs: [{ name: '', type: 'bool' }],
              },
            ],
            functionName: 'approve',
            args: [NADRAFFLE_V7_CONTRACT.address as `0x${string}`, totalCostWei],
          });
          
          console.log('⏳ Waiting for approval confirmation...');
          await waitForTransactionReceipt(config, {
            hash: approvalHash,
          });
          
          showNotification('success', 'Approval complete! Now purchasing tickets...');
        }
        
        // Now purchase tickets
        setTransactionStep('purchasing');
        const purchaseHash = await writeContractAsync({
          address: NADRAFFLE_V7_CONTRACT.address as `0x${string}`,
          abi: NADRAFFLE_V7_CONTRACT.abi,
          functionName: 'purchaseTickets',
          args: [BigInt(raffleId), BigInt(quantity)],
        });
        
        console.log('⏳ Waiting for purchase confirmation...');
        await waitForTransactionReceipt(config, {
          hash: purchaseHash,
        });
        
        showNotification('success', 'Tickets purchased successfully!');
        refetchRaffleData();
        refreshParticipants();
        
        // Track points
        const ticketPriceInEther = formatEther(raffle.ticketPrice);
        const totalAmount = (parseFloat(ticketPriceInEther) * quantity).toString();
        const metadata = {
          raffleId: raffleId.toString(),
          creatorAddress: raffle.creator,
        };
        
        trackNadRaffleTicketPurchase(purchaseHash, totalAmount, raffleId.toString(), metadata)
          .then((result) => {
            console.log('🎉 Points awarded for ticket purchase! Creator points awarded automatically.', result);
          })
          .catch(error => {
            console.error('❌ Error tracking ticket purchase points:', error);
          });
      }
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification('error', `Purchase failed: ${errorMessage}`);
    } finally {
      setIsPurchasing(false);
      setTransactionStep('idle');
    }
  };

  const canPurchase = () => {
    if (!raffle || !isConnected) return false;
    
    // Check if raffle is active (V6 uses state 0 for ACTIVE)
    if (raffle.state !== 0) return false;
    
    // Check if expired
    if (currentTime > Number(raffle.endTime) * 1000) return false;
    
    // Check if sold out
    if (Number(raffle.soldTickets) >= Number(raffle.maxTickets)) return false;
    
    return true;
  };

  const getRaffleStatus = () => {
    if (!raffle) return 'Loading...';
    
    const now = currentTime;
    const isExpired = now > Number(raffle.endTime) * 1000;
    const isSoldOut = Number(raffle.soldTickets) >= Number(raffle.maxTickets);
    const hasWinner = raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000';

    if (hasWinner) return 'Winner Selected';
    if (isSoldOut && !isExpired) return 'Sold Out - Awaiting Winner';
    if (isExpired && Number(raffle.soldTickets) > 0) return 'Selecting Winner';
    if (isExpired && Number(raffle.soldTickets) === 0) return 'Expired';
    return 'Active';
  };

  const getTimeRemaining = () => {
    if (!raffle) return 'N/A';
    
    const timeLeft = (Number(raffle.endTime) * 1000) - currentTime;
    if (timeLeft <= 0) return 'Ended';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getRewardDisplay = () => {
    if (!raffle) return 'N/A';
    
    // Check if reward has a token address (non-native token)
    if (raffle.rewardTokenAddress && raffle.rewardTokenAddress !== '0x0000000000000000000000000000000000000000') {
      const knownToken = getKnownToken(raffle.rewardTokenAddress);
      const knownNFT = getKnownNFT(raffle.rewardTokenAddress);
      
      if (knownToken) {
        // It's a known ERC-20 token - use rewardTokenId for amount, not rewardAmount
        return `${formatEther(raffle.rewardTokenId)} ${knownToken.symbol}`;
      } else if (knownNFT) {
        // It's a known NFT collection
        return nftMetadata?.name || `${knownNFT.name} #${raffle.rewardTokenId?.toString() || '0'}`;
      } else if (raffle.rewardType === 2) {
        // Unknown NFT - fallback to generic NFT display
      return nftMetadata?.name || `NFT #${raffle.rewardTokenId?.toString() || '0'}`;
      } else {
        // Unknown token - use rewardTokenId for amount
        return `${formatEther(raffle.rewardTokenId)} Token`;
      }
    } else {
      // Native MON token - use rewardAmount
      return `${formatEther(raffle.rewardAmount)} MON`;
    }
  };

  const isWinner = () => {
    return raffle?.winner?.toLowerCase() === address?.toLowerCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading raffle...</p>
        </div>
      </div>
    );
  }

  if (raffleError || !raffle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Raffle Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">This raffle doesn't exist or has been removed.</p>
          <Link href="/rafflehouse" className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Back to Raffles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <Navbar
        brand={{
          name: "Back to RaffleHouse",
          href: "/rafflehouse",
          logo: <ArrowLeft className="w-5 h-5 text-white" />
        }}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Raffle Details */}
          <div className="space-y-6">
            {/* Reward Display */}
            <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto mb-4 rounded-xl overflow-hidden">
                  {(() => {
                    // Check if reward has a token address (non-native token)
                    if (raffle.rewardTokenAddress && raffle.rewardTokenAddress !== '0x0000000000000000000000000000000000000000') {
                      const knownToken = getKnownToken(raffle.rewardTokenAddress);
                      const knownNFT = getKnownNFT(raffle.rewardTokenAddress);
                      
                      if (knownToken) {
                        return (
                          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                            <Wallet className="w-16 h-16 text-white" />
                          </div>
                        );
                      } else if (knownNFT || raffle.rewardType === 2) {
                        // Show NFT image if available, otherwise fallback to icon
                        if (nftMetadata?.image) {
                          return (
                            <img 
                              src={nftMetadata.image} 
                              alt={nftMetadata.name || 'NFT Reward'} 
                              className="w-full h-full object-cover"
                            />
                          );
                        } else if (knownNFT?.image) {
                          return (
                            <img 
                              src={knownNFT.image} 
                              alt={knownNFT.name || 'NFT Reward'} 
                              className="w-full h-full object-cover"
                            />
                          );
                        } else if (!nftLoading) {
                          return (
                            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <Gift className="w-16 h-16 text-white" />
                            </div>
                          );
                        } else {
                          return (
                            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                          );
                        }
                      } else {
                        return (
                          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                            <Wallet className="w-16 h-16 text-white" />
                          </div>
                        );
                      }
                    } else {
                      return (
                        <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <Wallet className="w-16 h-16 text-white" />
                        </div>
                      );
                    }
                  })()}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {getRewardDisplay()}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {(() => {
                    // Check if reward has a token address (non-native token)
                    if (raffle.rewardTokenAddress && raffle.rewardTokenAddress !== '0x0000000000000000000000000000000000000000') {
                      const knownToken = getKnownToken(raffle.rewardTokenAddress);
                      const knownNFT = getKnownNFT(raffle.rewardTokenAddress);
                      
                      if (knownToken) {
                        return 'Token Reward';
                      } else if (knownNFT || raffle.rewardType === 2) {
                        return 'NFT Reward';
                      } else {
                        return 'Token Reward';
                      }
                    } else {
                      return 'Token Reward';
                    }
                  })()}
                </p>
              </div>

              {/* Status */}
              <div className="text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  getRaffleStatus() === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  getRaffleStatus() === 'Winner Selected' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {getRaffleStatus()}
                </div>
              </div>
            </div>

            {/* Raffle Info */}
            <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Raffle Details</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Price</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatEther(raffle.ticketPrice)} {(() => {
                      if (!raffle.ticketPaymentToken || raffle.ticketPaymentToken === '0x0000000000000000000000000000000000000000') {
                        return 'MON';
                      } else {
                        const knownToken = getKnownToken(raffle.ticketPaymentToken);
                        return knownToken ? knownToken.symbol : 'TOKEN';
                      }
                    })()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tickets Sold</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {raffle.soldTickets} / {raffle.maxTickets}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Time Remaining</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getTimeRemaining()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Creator</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {raffle.creator.slice(0, 6)}...{raffle.creator.slice(-4)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <span>Progress</span>
                  <span>{Math.round((Number(raffle.soldTickets) / Number(raffle.maxTickets)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((Number(raffle.soldTickets) / Number(raffle.maxTickets)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>


          </div>

          {/* Right Column - Purchase, Your Tickets & Participants */}
          <div className="space-y-6">
            {/* Purchase Section */}
            {canPurchase() && (
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Purchase Tickets</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={Number(raffle.maxTickets) - Number(raffle.soldTickets)}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300">Total Cost:</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(parseFloat(formatEther(raffle.ticketPrice)) * quantity).toFixed(4)} {(() => {
                        if (!raffle.ticketPaymentToken || raffle.ticketPaymentToken === '0x0000000000000000000000000000000000000000') {
                          return 'MON';
                        } else {
                          const knownToken = getKnownToken(raffle.ticketPaymentToken);
                          return knownToken ? knownToken.symbol : 'TOKEN';
                        }
                      })()}
                    </span>
                  </div>

                  <button
                    onClick={handlePurchaseTickets}
                    disabled={isPurchasing || !isConnected}
                    className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                  >
                    {isPurchasing ? (
                      transactionStep === 'approving' ? 'Approving...' : 
                      transactionStep === 'purchasing' ? 'Purchasing...' : 
                      'Processing...'
                    ) : 'Purchase Tickets'}
                  </button>
                </div>
              </div>
            )}

            {/* User Tickets Card - Only show if user is connected and has tickets */}
            {address && userTickets > 0 && (
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100">Your Tickets</h3>
                      <p className="text-sm text-primary-700 dark:text-primary-300">
                        You own {userTickets} ticket{userTickets > 1 ? 's' : ''} in this raffle
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">
                      {userTickets}
                    </p>
                    <p className="text-sm text-primary-700 dark:text-primary-300">
                      {raffle && participants.length > 0 ? 
                        ((userTickets / participants.reduce((sum, p) => sum + p.tickets, 0)) * 100).toFixed(1) 
                        : '0.0'}% chance
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Participants ({filteredParticipants.length})
                </h2>
                <div className="flex items-center space-x-2">
                <button
                    onClick={refreshParticipants}
                    disabled={loadingParticipants}
                    className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh participants"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingParticipants ? 'animate-spin' : ''}`} />
                </button>
                  {loadingParticipants && (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Updating...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by address or Twitter handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Participants Count Info */}
              {searchQuery && (
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredParticipants.length} of {participants.length} participants
              </div>
            )}
              
              {currentParticipants.length > 0 ? (
                <>
                  <div className="space-y-3 mb-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {currentParticipants.map((participant, index) => {
                      const globalIndex = startIndex + index;
                      return (
                        <div 
                          key={participant.address}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              #{globalIndex + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                              </p>
                              <div className="flex items-center space-x-2">
                                {participant.address.toLowerCase() === address?.toLowerCase() && (
                                  <p className="text-xs text-primary-600 dark:text-primary-400">You</p>
                                )}
                                {participant.twitterHandle && (
                                  <a
                                    href={`https://twitter.com/${participant.twitterHandle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 hover:underline transition-all duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Twitter className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                    <p className="text-xs text-blue-500 dark:text-blue-400">
                                      @{participant.twitterHandle}
                                    </p>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {participant.tickets} ticket{participant.tickets > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {raffle && raffle.soldTickets > 0 ? ((participant.tickets / participants.reduce((sum, p) => sum + p.tickets, 0)) * 100).toFixed(1) : '0.0'}% chance
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredParticipants.length)} of {filteredParticipants.length}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-dark-500"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-dark-500"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {loadingParticipants ? 'Loading participants...' : 
                     searchQuery ? 'No participants found matching your search' : 'No participants yet'}
                  </p>
                </div>
              )}
            </div>

            {/* Claim Section */}


            {/* Winner Display */}
            {raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' && (
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🏆 Winner</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Congratulations to:</p>
                
                <div className="flex items-center space-x-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  {/* Winner Avatar */}
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    {winnerTwitter?.avatar ? (
                      <img 
                        src={winnerTwitter.avatar} 
                        alt={winnerTwitter.name || 'Winner'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    {/* Wallet Address */}
                    <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      {raffle.winner.slice(0, 6)}...{raffle.winner.slice(-4)}
                    </p>
                    
                    {/* Twitter Info */}
                    {loadingWinnerTwitter ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">Loading Twitter...</span>
                      </div>
                    ) : winnerTwitter?.handle ? (
                      <a
                        href={`https://twitter.com/${winnerTwitter.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 hover:underline transition-all duration-200"
                      >
                        <Twitter className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          @{winnerTwitter.handle}
                        </span>
                        {winnerTwitter.name && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({winnerTwitter.name})
                          </span>
                        )}
                      </a>
                    ) : (
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        No Twitter connected
                      </p>
                    )}
                    
                    {/* Winner indicators */}
                    <div className="flex items-center space-x-2 mt-2">
                      {isWinner() && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          🎉 That's you!
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        🏆 Raffle Winner
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 