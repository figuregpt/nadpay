"use client";

import { useState, useEffect } from "react";
import { Trophy, Search, Filter, Clock, Users, Gift, Zap, Star, TrendingUp, Plus, Link2, ArrowLeft, ChevronDown, Sparkles, Target, Rocket, Minus, Crown } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useTotalRafflesV3, useRaffleV3, formatRaffleV3, useBuyTicketsV3 } from "@/hooks/useNadRaffleV3Contract";
import { formatEther, parseEther } from "viem";
import { getKnownToken } from "@/lib/knownAssets";
import { useNFTMetadata } from "@/hooks/useNFTMetadata";
import { createPredictableSecureRaffleId } from "@/lib/linkUtils";

interface RaffleCardProps {
  raffle: any;
  raffleId: number;
  onRefresh?: () => void;
}

function RaffleCard({ raffle, raffleId, onRefresh }: RaffleCardProps) {
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const { isConnected, address } = useAccount();
  
  const { buyTickets, isBuyLoading, isBuyConfirming, isBuyConfirmed } = useBuyTicketsV3();
  
  const { metadata: nftMetadata } = useNFTMetadata(
    raffle.rewardType === 1 ? raffle.rewardTokenAddress : '',
    raffle.rewardType === 1 ? raffle.rewardAmount.toString() : ''
  );

  // Auto refresh after successful purchase
  useEffect(() => {
    if (isBuyConfirmed && onRefresh) {
      setTimeout(() => {
        onRefresh();
      }, 2000); // Wait 2 seconds for blockchain to update
    }
  }, [isBuyConfirmed, onRefresh]);

  const getTimeRemaining = () => {
    if (!raffle || Number(raffle.expirationTime || 0) === 0) return null;
    
    const now = Date.now();
    const expiration = Number(raffle.expirationTime) * 1000;
    const remaining = expiration - now;
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getPaymentTokenSymbol = () => {
    if (raffle.ticketPaymentToken === '0x0000000000000000000000000000000000000000') {
      return 'MON';
    }
    const knownToken = getKnownToken(raffle.ticketPaymentToken);
    return knownToken?.symbol || 'TOKEN';
  };

  const getRewardDisplay = () => {
    if (raffle.rewardType === 1) {
      return {
        name: nftMetadata?.name || `NFT #${raffle.rewardAmount.toString()}`,
        type: 'NFT',
        image: nftMetadata?.image
      };
    } else {
      const tokenInfo = raffle.rewardTokenAddress === '0x0000000000000000000000000000000000000000' 
        ? { symbol: 'MON', logo: '/monad-logo.svg' }
        : getKnownToken(raffle.rewardTokenAddress);
      
      return {
        name: `${formatEther(raffle.rewardAmount)} ${tokenInfo?.symbol || 'TOKEN'}`,
        type: 'Token',
        image: tokenInfo?.logo || null
      };
    }
  };

  const timeRemaining = getTimeRemaining();
  const isEnding = timeRemaining && timeRemaining !== 'Ended' && !timeRemaining.includes('d');
  const reward = getRewardDisplay();
  const ticketPrice = formatEther(raffle.ticketPrice);
  const ticketsSold = Number(raffle.ticketsSold);
  const maxTickets = Number(raffle.maxTickets);
  const progress = maxTickets > 0 ? (ticketsSold / maxTickets) * 100 : 0;
  const maxTicketsPerWallet = Number(raffle.maxTicketsPerWallet);
  const totalCost = (parseFloat(ticketPrice) * ticketQuantity).toFixed(4);
  
  // Check if raffle is sold out or ended
  const isSoldOut = ticketsSold >= maxTickets;
  const isExpired = timeRemaining === 'Ended';
  const isEnded = isSoldOut || isExpired;
  const winner = raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000' ? raffle.winner : null;

  const handleBuyTickets = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (isEnded) {
      alert("This raffle has ended");
      return;
    }

    if (ticketQuantity <= 0) {
      alert("Please select at least 1 ticket");
      return;
    }

    if (ticketQuantity > maxTicketsPerWallet) {
      alert(`Maximum ${maxTicketsPerWallet} tickets per wallet`);
      return;
    }

    if (ticketQuantity > (maxTickets - ticketsSold)) {
      alert(`Only ${maxTickets - ticketsSold} tickets remaining`);
      return;
    }

    try {
      const totalPrice = parseEther((parseFloat(ticketPrice) * ticketQuantity).toString());
      await buyTickets({
        raffleId: raffleId,
        ticketCount: ticketQuantity,
        paymentTokenAddress: raffle.ticketPaymentToken,
        totalPrice: totalPrice
      });
      
      // Reset quantity after successful purchase
      setTicketQuantity(1);
    } catch (error) {
      console.error('Error buying tickets:', error);
    }
  };

  const getRaffleStatus = () => {
    if (isEnded) {
      return { text: 'Ended', color: 'bg-red-500/90', border: 'border-red-400' };
    }
    if (isSoldOut) {
      return { text: 'Sold Out', color: 'bg-yellow-500/90', border: 'border-yellow-400' };
    }
    if (isEnding) {
      return { text: 'Ending Soon', color: 'bg-orange-500/90', border: 'border-orange-400' };
    }
    return { text: 'Active', color: 'bg-green-500/90', border: 'border-green-400' };
  };

  const status = getRaffleStatus();

  return (
    <div
      className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Reward Image/Preview - Square aspect ratio */}
      <div className="relative aspect-square bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
        {reward.image ? (
          reward.type === 'NFT' ? (
            <img
              src={reward.image}
              alt={reward.name}
              className="w-full h-full object-cover"
            />
          ) : (
            // Token logo with hover effect
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <img
                  src={reward.image}
                  alt={reward.name}
                  className={`w-16 h-16 object-contain transition-transform duration-300 ${isHovered ? 'scale-125' : ''}`}
                />
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gift className="w-16 h-16 text-white opacity-80" />
          </div>
        )}
        
        {/* Hover Overlay for View Raffle */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Link href={`/raffle/${createPredictableSecureRaffleId(raffleId)}`}>
              <button className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors">
                View Raffle
              </button>
            </Link>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 backdrop-blur-sm text-white text-xs font-medium rounded-full border ${status.color} ${status.border}`}>
            {status.text}
          </span>
        </div>

        {/* Prize Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-yellow-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-yellow-400">
            {reward.type === 'NFT' ? 'NFT Prize' : 'Token Prize'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
          {raffle.title}
        </h3>

        {/* Reward */}
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {reward.name}
          </span>
        </div>

        {/* Winner Display for Ended Raffles */}
        {isEnded && winner && (
          <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Crown className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Winner:</div>
              <div className="text-xs text-blue-800 dark:text-blue-300 font-mono">
                {winner.slice(0, 6)}...{winner.slice(-4)}
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">Price</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {ticketPrice} {getPaymentTokenSymbol()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">Tickets</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {ticketsSold}/{maxTickets}
            </div>
          </div>
      <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">Time</div>
            <div className={`font-medium ${isEnding ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
              {timeRemaining || 'No limit'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isSoldOut ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Ticket Quantity Selector */}
        {!isEnded && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tickets</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  disabled={ticketQuantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">{ticketQuantity}</span>
                <button
                  onClick={() => setTicketQuantity(Math.min(maxTicketsPerWallet, Math.min(maxTickets - ticketsSold, ticketQuantity + 1)))}
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  disabled={ticketQuantity >= maxTicketsPerWallet || ticketQuantity >= (maxTickets - ticketsSold)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Total: {totalCost} {getPaymentTokenSymbol()}
            </div>
          </div>
        )}

        {/* Buy Button */}
        <button 
          onClick={handleBuyTickets}
          disabled={!isConnected || isEnded || isBuyLoading || isBuyConfirming}
          className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isConnected ? 'Connect Wallet' : 
           isEnded ? (winner ? 'Raffle Complete' : 'Raffle Ended') :
           isSoldOut ? 'Sold Out' :
           isBuyLoading ? 'Confirming...' :
           isBuyConfirming ? 'Processing...' :
           `Buy ${ticketQuantity} Ticket${ticketQuantity > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

export default function RaffleHousePage() {
  const { isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'ending' | 'newest' | 'popular' | 'prize'>('ending');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ending' | 'ended'>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get total raffles and load them
  const { data: totalRaffles } = useTotalRafflesV3();
  const [raffles, setRaffles] = useState<any[]>([]);
  const [raffleData, setRaffleData] = useState<{[key: number]: any}>({});
  const [isLoading, setIsLoading] = useState(true);

  // Force refresh function
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Load all raffles with their data
  useEffect(() => {
    if (!totalRaffles || Number(totalRaffles) === 0) {
      setIsLoading(false);
      return;
    }

    const loadRaffles = async () => {
      setIsLoading(true);
      const rafflePromises = [];
      
      for (let i = 1; i <= Number(totalRaffles); i++) {
        rafflePromises.push({ id: i });
      }
      
      setRaffles(rafflePromises);
      setIsLoading(false);
    };

    loadRaffles();
  }, [totalRaffles, refreshTrigger]);

  // Store raffle data as it loads
  const updateRaffleData = (raffleId: number, data: any) => {
    setRaffleData(prev => ({
      ...prev,
      [raffleId]: data
    }));
  };

  // Filter and sort raffles based on their data
  const filteredAndSortedRaffles = raffles.filter(raffleItem => {
    const data = raffleData[raffleItem.id];
    if (!data) return true; // Show loading raffles
    
    const raffle = formatRaffleV3(data);
    const ticketsSold = Number(raffle.ticketsSold);
    const maxTickets = Number(raffle.maxTickets);
    const isSoldOut = ticketsSold >= maxTickets;
    const now = Date.now();
    const expiration = Number(raffle.expirationTime) * 1000;
    const isExpired = expiration > 0 && now > expiration;
    const isEnded = isSoldOut || isExpired;
    const isEnding = !isEnded && expiration > 0 && (expiration - now) < 24 * 60 * 60 * 1000; // Less than 24 hours

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (!raffle.title.toLowerCase().includes(searchLower) && 
          !raffle.description.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Status filter
    switch (filterStatus) {
      case 'active':
        return !isEnded && !isEnding;
      case 'ending':
        return isEnding;
      case 'ended':
        return isEnded;
      default:
        return true;
    }
  }).sort((a, b) => {
    const dataA = raffleData[a.id];
    const dataB = raffleData[b.id];
    
    if (!dataA || !dataB) return 0;
    
    const raffleA = formatRaffleV3(dataA);
    const raffleB = formatRaffleV3(dataB);

    switch (sortBy) {
      case 'ending':
        // Sort by expiration time (soonest first)
        const timeA = Number(raffleA.expirationTime);
        const timeB = Number(raffleB.expirationTime);
        if (timeA === 0) return 1; // No expiration goes to end
        if (timeB === 0) return -1;
        return timeA - timeB;
      
      case 'newest':
        // Sort by creation time (newest first)
        return Number(raffleB.createdAt) - Number(raffleA.createdAt);
      
      case 'popular':
        // Sort by tickets sold (most popular first)
        return Number(raffleB.ticketsSold) - Number(raffleA.ticketsSold);
      
      case 'prize':
        // Sort by reward amount (highest first)
        return Number(raffleB.rewardAmount) - Number(raffleA.rewardAmount);
      
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-dark-950 dark:via-purple-950/20 dark:to-pink-950/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-dark-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Nav */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">RaffleHouse</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">powered by NadPay</p>
                </div>
              </Link>
              
              {/* Nav Links */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/app" className="text-purple-600 dark:text-purple-400 font-medium border-b-2 border-purple-600 pb-1">
                  Raffles
                </Link>
                <Link href="/app/create" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Create
                </Link>
                <Link href="/app/payments" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Payments
                </Link>
                <Link href="/app/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Dashboard
            </Link>
              </nav>
          </div>
          
            {/* Actions */}
          <div className="flex items-center space-x-4">
              <Link href="/app/create">
                <button className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium shadow-lg">
                  <Plus className="w-4 h-4" />
                  <span>New Raffle</span>
                </button>
              </Link>
              
              {!isConnected ? (
                <ConnectKitButton.Custom>
                  {({ show }) => (
            <button
                      onClick={show}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg"
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectKitButton.Custom>
              ) : (
                <ConnectKitButton />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Animated Background */}
      <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-pink-400/30 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '3s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-purple-300/25 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Moving Gradient Waves */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent skew-y-12 animate-pulse" style={{ animation: 'wave 8s ease-in-out infinite' }}></div>
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-pink-300/15 to-transparent -skew-y-12 animate-pulse" style={{ animation: 'wave 6s ease-in-out infinite reverse' }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-y-6 animate-pulse" style={{ animation: 'wave 10s ease-in-out infinite' }}></div>
          </div>
          
          {/* Enhanced Sparkle Effects */}
          <div className="absolute top-1/3 left-1/5 w-3 h-3 bg-cyan-300 rounded-full animate-ping shadow-lg shadow-cyan-300/50"></div>
          <div className="absolute top-2/3 right-1/5 w-2 h-2 bg-pink-300 rounded-full animate-ping shadow-lg shadow-pink-300/50" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/3 left-2/3 w-2.5 h-2.5 bg-white rounded-full animate-ping shadow-lg shadow-white/50" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/4 right-1/2 w-1.5 h-1.5 bg-purple-300 rounded-full animate-ping shadow-lg shadow-purple-300/50" style={{ animationDelay: '3s' }}></div>
          
          {/* Radial Glow Behind Title */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-cyan-400/20 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div>
            {/* Neon Animated RaffleHouse Title */}
            <h1 className="text-6xl md:text-8xl font-bold mb-6 relative">
              <span 
                className="bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent animate-pulse font-black neon-text"
                style={{
                  textShadow: '0 0 30px rgba(0, 255, 255, 1), 0 0 60px rgba(168, 85, 247, 1), 0 0 90px rgba(255, 20, 147, 0.8)',
                  filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.9)) drop-shadow(0 0 40px rgba(168, 85, 247, 0.8))',
                  WebkitTextStroke: '2px rgba(255, 255, 255, 0.3)'
                }}
              >
                RaffleHouse
              </span>
              
              {/* Enhanced Neon Glow Effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent opacity-70 blur-sm animate-pulse font-black"
                style={{
                  WebkitTextStroke: '2px rgba(255, 255, 255, 0.3)'
                }}
              >
                RaffleHouse
              </div>
              
              {/* Extra Glow Layer */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent opacity-40 blur-lg animate-pulse font-black"
              >
                RaffleHouse
              </div>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              Discover amazing raffles, win incredible prizes
            </p>
          </div>
        </div>

        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes wave {
            0%, 100% { transform: translateX(-100%) skewY(12deg); }
            50% { transform: translateX(100%) skewY(12deg); }
          }
          
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 1s ease-out forwards;
            opacity: 0;
          }
          
          .bg-gradient-radial {
            background: radial-gradient(circle, var(--tw-gradient-stops));
          }
          
          @keyframes neon-pulse {
            0%, 100% {
              text-shadow: 
                0 0 30px rgba(0, 255, 255, 1),
                0 0 60px rgba(168, 85, 247, 1),
                0 0 90px rgba(255, 20, 147, 0.8),
                0 0 120px rgba(0, 255, 255, 0.5);
            }
            50% {
              text-shadow: 
                0 0 40px rgba(0, 255, 255, 1),
                0 0 80px rgba(168, 85, 247, 1),
                0 0 120px rgba(255, 20, 147, 1),
                0 0 160px rgba(0, 255, 255, 0.8);
            }
          }
          
          .neon-text {
            animation: neon-pulse 2s ease-in-out infinite alternate;
          }
        `}</style>
      </section>

      {/* Filters & Search */}
      <section className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-dark-700/50 py-6" id="raffles">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search raffles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-dark-700/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none px-4 py-3 pr-8 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-dark-700/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer"
                >
                  <option value="ending">Ending Soon</option>
                  <option value="newest">Newest</option>
                  <option value="popular">Popular</option>
                  <option value="prize">Highest Prize</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="appearance-none px-4 py-3 pr-8 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-dark-700/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer"
                >
                  <option value="all">All Raffles</option>
                  <option value="active">Active</option>
                  <option value="ending">Ending Soon</option>
                  <option value="ended">Ended</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={handleRefresh}
                className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                title="Refresh"
              >
                ↻
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Raffles Grid */}
      <section className="py-12 relative">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-dark-700/50 overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 animate-pulse" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                      <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                      <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : raffles.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No raffles found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Be the first to create an amazing raffle!</p>
              <Link href="/app/create">
                <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-lg">
                  Create First Raffle
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedRaffles.map((raffleItem) => (
                <RaffleCardComponent 
                  key={raffleItem.id} 
                  raffleId={raffleItem.id} 
                  onDataLoad={(data) => updateRaffleData(raffleItem.id, data)}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
      </div>
      </section>
    </div>
  );
}

// Component to load individual raffle data
function RaffleCardComponent({ raffleId, onDataLoad, onRefresh }: { raffleId: number, onDataLoad: (data: any) => void, onRefresh: () => void }) {
  const { data: raffleData, isLoading } = useRaffleV3(raffleId);
  
  useEffect(() => {
    if (raffleData && onDataLoad) {
      onDataLoad(raffleData);
    }
  }, [raffleData, onDataLoad]);
  
  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-dark-700/50 overflow-hidden">
        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!raffleData) return null;

  const raffle = formatRaffleV3(raffleData);
  return <RaffleCard raffle={raffle} raffleId={raffleId} onRefresh={onRefresh} />;
} 