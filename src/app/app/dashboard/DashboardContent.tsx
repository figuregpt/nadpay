"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
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
  Sun,
  Moon
} from "lucide-react";
import { useAccount, usePublicClient } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useCreatorPaymentLinks, useDeactivatePaymentLink, formatPaymentLink, formatPrice } from "@/hooks/useNadPayContract";
import { useCreatorRaffles, useNadRaffleContract } from "@/hooks/useNadRaffleContract";
import { NADPAY_CONTRACT } from "@/lib/contract";

interface PaymentLinkData {
  linkId: string;
  _id: string;
  creator: string;
  title: string;
  description: string;
  coverImage: string;
  price: string;
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
  ticketPrice: string;
  maxTickets: bigint;
  ticketsSold: bigint;
  totalEarned: string;
  status: number; // 0 = ACTIVE, 1 = ENDED, 2 = CANCELLED
  createdAt: string;
  expirationTime: bigint;
  winner?: string;
}

export default function DashboardContent() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { theme, setTheme } = useTheme();
  
  // Contract constants
  const CONTRACT_ADDRESS = NADPAY_CONTRACT.address as `0x${string}`;
  const CONTRACT_ABI = NADPAY_CONTRACT.abi;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'payment-links' | 'raffles'>('payment-links');
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState<PaymentLinkData | null>(null);
  const [participantsSearchQuery, setParticipantsSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [participantsPerPage] = useState(20);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  
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
  
  // Contract hooks
  const { data: creatorLinksData, isLoading: loadingLinks, refetch } = useCreatorPaymentLinks(address);
  const { data: creatorRafflesData, isLoading: loadingRaffles, refetch: refetchRaffles, raffleIds } = useCreatorRaffles(address);
  const { 
    deactivatePaymentLink, 
    isConfirmed: deactivationConfirmed 
  } = useDeactivatePaymentLink();
  
  // Raffle contract hook
  const { 
    endRaffle, 
    cancelRaffle,
    isPending: isEndingRaffle, 
    isConfirmed: isRaffleEnded 
  } = useNadRaffleContract();

    // Convert contract data to display format and sort by newest first
  const paymentLinks: PaymentLinkData[] = creatorLinksData ? creatorLinksData
    .map((link: unknown) => {
      try {
        const formatted = formatPaymentLink(link);
        console.log('Raw link data:', link);
        console.log('Formatted link data:', formatted);
        console.log('uniqueBuyersCount from link:', (link as { uniqueBuyersCount?: number }).uniqueBuyersCount);
        
        return {
          ...formatted,
          linkId: (link as { linkId: { toString(): string } }).linkId.toString(), // Use actual linkId from contract
          _id: (link as { linkId: { toString(): string } }).linkId.toString(),
          creatorAddress: formatted.creator,
          price: formatPrice(formatted.price),
          totalEarned: formatPrice(formatted.totalEarned),
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

  // Convert raffle contract data to display format
  console.log('creatorRafflesData:', creatorRafflesData);
  console.log('loadingRaffles:', loadingRaffles);
  console.log('address:', address);
  console.log('raffleIds from hook:', raffleIds);
  
  const raffles: RaffleData[] = creatorRafflesData ? creatorRafflesData
    .map((raffle: any, index: number) => {
      try {
        console.log('Processing raffle:', raffle);
        return {
          id: raffle.id?.toString() || index.toString(),
          creator: raffle.creator || '',
          title: raffle.title || 'Untitled Raffle',
          description: raffle.description || '',
          rewardType: Number(raffle.rewardType) || 0,
          rewardAmount: raffle.rewardAmount ? (Number(raffle.rewardAmount) / 1e18).toFixed(4) : '0',
          ticketPrice: raffle.ticketPrice ? (Number(raffle.ticketPrice) / 1e18).toFixed(4) : '0',
          maxTickets: raffle.maxTickets || BigInt(0),
          ticketsSold: raffle.ticketsSold || BigInt(0),
          totalEarned: raffle.totalEarned ? (Number(raffle.totalEarned) / 1e18).toFixed(4) : '0',
          status: Number(raffle.status) || 0,
          createdAt: raffle.createdAt ? new Date(Number(raffle.createdAt) * 1000).toISOString() : new Date().toISOString(),
          expirationTime: raffle.expirationTime || BigInt(0),
          winner: raffle.winner || undefined,
        };
      } catch (error) {
        console.error('Error formatting raffle data:', error, raffle);
        return {
          id: index.toString(),
          creator: '',
          title: 'Error Loading Raffle',
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

  // Refetch when deactivation is confirmed
  useEffect(() => {
    if (deactivationConfirmed) {
      refetch();
    }
  }, [deactivationConfirmed, refetch]);
  
  // Refetch when raffle is ended
  useEffect(() => {
    if (isRaffleEnded) {
      refetchRaffles();
    }
  }, [isRaffleEnded, refetchRaffles]);

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
    if (!link.isActive) return 'Inactive';
    if (isExpired(link)) return 'Expired';
    return 'Active';
  };

  const getRaffleStatus = (raffle: RaffleData) => {
    switch (raffle.status) {
      case 0: return 'Active';
      case 1: return 'Ended';
      case 2: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getRewardTypeText = (rewardType: number) => {
    switch (rewardType) {
      case 0: return 'Token';
      case 1: return 'NFT';
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
    const csvData = filteredPaymentLinks.map((link: PaymentLinkData) => [
      link.creatorAddress || address || '',
      `${link.salesCount}/${link.totalSales > 0 ? link.totalSales : '∞'}`,
      `${link.price} MON`,
      `"${link.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${link.description.replace(/"/g, '""')}"`, // Escape quotes
      getLinkStatus(link),
      new Date(link.createdAt).toLocaleDateString(),
      link.expiresAt && Number(link.expiresAt) > 0
        ? new Date(Number(link.expiresAt) * 1000).toLocaleString()
        : 'Never',
      link.salesCount.toString(),
      (link.uniqueBuyersCount || 0).toString(),
      `${parseFloat(link.totalEarned).toFixed(4)} MON`
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
        abi: CONTRACT_ABI,
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
      ['Rank', 'Wallet Address', 'Purchase Count', 'Total Spent (MON)', 'Total Spent (USD)', 'Transaction ID'].join(','),
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



  // Filter payment links based on search query
  const filteredPaymentLinks = paymentLinks.filter((link: PaymentLinkData) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      link.title.toLowerCase().includes(query) ||
      link.description.toLowerCase().includes(query) ||
      link.linkId.toString().includes(query) ||
      link.price.toString().includes(query)
    );
  });

  // Filter raffles based on search query
  const filteredRaffles = raffles.filter((raffle: RaffleData) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      raffle.title.toLowerCase().includes(query) ||
      raffle.description.toLowerCase().includes(query) ||
      raffle.id.toString().includes(query) ||
      raffle.ticketPrice.toString().includes(query)
    );
  });

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
              href="/app"
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

  if (loadingLinks || loadingRaffles) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* NadPay Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Link2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  NadPay Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Manage your payment links and track earnings on Monad
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <a
                href="/app"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:opacity-90 transition-opacity font-semibold text-sm"
              >
                <span className="hidden sm:inline">Create New Link</span>
                <span className="sm:hidden">New Link</span>
              </a>
              <a
                href="/app"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-semibold text-sm"
              >
                <span className="hidden sm:inline">Create Raffle</span>
                <span className="sm:hidden">New Raffle</span>
              </a>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
                <span className="hidden lg:inline ml-2">
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </span>
              </button>
              <a
                href="/app"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* NadPay Stats Overview */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">NadPay Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white dark:bg-dark-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-dark-700"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Earned</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {stats.totalEarned.toFixed(4)} MON
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-dark-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-dark-700"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {stats.totalSales}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-dark-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-dark-700"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Buyers</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {stats.totalBuyers}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white dark:bg-dark-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-dark-700"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <Link2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Links</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {paymentLinks.filter((link: PaymentLinkData) => getLinkStatus(link) === 'Active').length}
                </p>
              </div>
            </div>
          </motion.div>
          </div>
        </div>

        {/* NadRaffle Stats Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">NadRaffle Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white dark:bg-dark-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-dark-700"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Raffle Earned</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {stats.raffleEarned.toFixed(4)} MON
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white dark:bg-dark-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-dark-700"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg sm:text-xl">🎫</span>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tickets Sold</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {stats.totalTicketsSold}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="bg-white dark:bg-dark-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-dark-700"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Participants</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {stats.totalParticipants}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-white dark:bg-dark-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-dark-700"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg sm:text-xl">🏆</span>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Raffles</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {stats.activeRaffles}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-dark-700 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('payment-links')}
            className={`flex-1 px-6 py-3 text-sm font-medium rounded-md transition-colors ${
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
            onClick={() => setActiveTab('raffles')}
            className={`flex-1 px-6 py-3 text-sm font-medium rounded-md transition-colors ${
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

          {paymentLinks.length === 0 ? (
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
                href="/app"
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
              {filteredPaymentLinks.map((link: PaymentLinkData, index: number) => (
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
                            {link.price} MON
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
                            {parseFloat(link.totalEarned).toFixed(4)} MON
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

            {raffles.length === 0 ? (
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
                  href="/app"
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
                {filteredRaffles.map((raffle: RaffleData, index: number) => (
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
                              : getRaffleStatus(raffle) === 'Ended'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
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
                              {raffle.rewardAmount} {raffle.rewardType === 0 ? 'MON' : 'NFT'}
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
                            href={`/raffle/${raffle.id}`}
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
                                    {participant.totalSpent} MON
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
                  <span>Revenue: <strong className="text-green-600 dark:text-green-400">{selectedLink.totalEarned} MON</strong></span>
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