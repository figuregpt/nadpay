"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  Star,
  Twitter,
  ArrowRight,
  Info,
  Coins,
  Activity,
  Target,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { useTwitterProfile } from "@/hooks/useTwitterProfile";
import Navbar from "@/components/Navbar";

interface LeaderboardUser {
  _id: string;
  walletAddress: string;
  twitterHandle?: string;
  totalPoints: number;
  pointsBreakdown: {
    nadswap: number;
    nadpay: number;
    nadraffle: number;
  };
  rank: number;
  createdAt: string;
}

interface UserPoints {
  walletAddress: string;
  totalPoints: number;
  pointsBreakdown: {
    nadswap: number;
    nadpay: number;
    nadraffle: number;
  };
  transactions: any[];
}

export default function LeaderboardPage() {
  const { address, isConnected } = useAccount();
  const { profile, isLoading: twitterLoading } = useTwitterProfile();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 20;
  const isTwitterConnected = !!profile?.twitterHandle;

  useEffect(() => {
    fetchLeaderboard();
  }, [address, profile]); // Re-fetch when address or profile changes

  useEffect(() => {
    if (address) {
      fetchUserPoints();
    }
  }, [address]);

  // Auto-refresh leaderboard every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard();
      if (address) {
        fetchUserPoints();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [address]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      
      console.log('🎯 Leaderboard Frontend - Response:', {
        status: response.status,
        data: data,
        hasLeaderboard: !!data.leaderboard,
        leaderboardLength: data.leaderboard?.length
      });
      
      if (data.leaderboard) {
        // Add rank to each user
        const rankedData = data.leaderboard.map((user: any, index: number) => ({
          ...user,
          rank: index + 1
        }));
        
        console.log('📊 Leaderboard Frontend - Setting data:', {
          count: rankedData.length,
          firstUser: rankedData[0]
        });
        
        setLeaderboard(rankedData);
      } else {
        console.log('⚠️ Leaderboard Frontend - No leaderboard data');
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/points/${address}`);
      const data = await response.json();
      setUserPoints(data);
      
      // Find user's rank in leaderboard
      const userInLeaderboard = leaderboard.find(
        user => user.walletAddress.toLowerCase() === address.toLowerCase()
      );
      setUserRank(userInLeaderboard?.rank || null);
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setCurrentPage(1); // Reset to first page
    await Promise.all([
      fetchLeaderboard(),
      address ? fetchUserPoints() : Promise.resolve()
    ]);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-sm font-bold text-yellow-600">1.</span>;
    if (rank === 2) return <span className="text-sm font-bold text-gray-500">2.</span>;
    if (rank === 3) return <span className="text-sm font-bold text-amber-600">3.</span>;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPoints = (points: number) => {
    return points.toFixed(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(leaderboard.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  
  // Use connected wallet address
  const simulatedAddress = address;
  
  // Get current page users
  const currentPageUsers = leaderboard.slice(startIndex, endIndex);
  
  // Find connected user in current page
  const connectedUserInCurrentPage = simulatedAddress ? currentPageUsers.find(
    user => user.walletAddress.toLowerCase() === simulatedAddress.toLowerCase()
  ) : null;
  
  // Get connected user from full leaderboard
  const connectedUserFromFull = simulatedAddress ? leaderboard.find(
    user => user.walletAddress.toLowerCase() === simulatedAddress.toLowerCase()
  ) : null;
  

  
  // Final users to display (connected user at top + current page users)
  const usersToDisplay = [];
  
  // Always show connected user at top if exists (even if they're in current page)
  if (connectedUserFromFull) {
    usersToDisplay.push(connectedUserFromFull);
  }
  
  // Add current page users (ALWAYS excluding connected user to avoid duplication)
  const filteredCurrentPageUsers = simulatedAddress 
    ? currentPageUsers.filter(user => user.walletAddress.toLowerCase() !== simulatedAddress.toLowerCase())
    : currentPageUsers;
    
  usersToDisplay.push(...filteredCurrentPageUsers);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Navbar showTicketsButton={false} />

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
                Welcome to <span className="bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">Leaderboard</span>
              </h1>
              <p className="text-body-xl font-inter text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Earn points by using NadPay, NadSwap, and NadRaffle. Points are saved to your wallet address, but you need to connect Twitter to earn them!
              </p>
              
              <div className="flex justify-center">
                {!isConnected ? (
                  <div className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-body-lg font-inter font-semibold flex items-center justify-center">
                    <Users className="w-5 h-5 mr-2" />
                    Connect Wallet in Navbar
                  </div>
                ) : !isTwitterConnected ? (
                  <Link
                    href="/dashboard"
                    className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:opacity-90 transition-opacity text-body-lg font-inter font-semibold flex items-center justify-center"
                  >
                    <Twitter className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Link>
                ) : (
                  <div className="flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl">
                    <Twitter className="w-5 h-5 mr-2" />
                    <span className="text-body-lg font-inter font-semibold">
                      Connected as @{profile?.twitterHandle}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Point System Rules */}
        <section className="py-12">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 mb-8"
            >
              <div className="flex items-center mb-4">
                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How to Earn Points</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                {/* NadSwap */}
                <div className="bg-white dark:bg-dark-800 rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-lg hover:border-green-200 dark:hover:border-green-700 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="flex items-center">
                      <Activity className="w-4 md:w-5 h-4 md:h-5 text-green-600 dark:text-green-400 mr-2" />
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">NadSwap</h3>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">4pts</div>
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                      <strong>Per swap:</strong> Each user gets 4pts
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                      <strong>Requires:</strong> Twitter connected
                    </div>
                  </div>
                </div>

                {/* NadPay */}
                <div className="bg-white dark:bg-dark-800 rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="flex items-center">
                      <Coins className="w-4 md:w-5 h-4 md:h-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">NadPay</h3>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">4pts</div>
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                      <strong>Buyer/Creator:</strong> 4pts per 0.1 MON
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                      <strong>Example:</strong> 0.01 MON = 0.4pts
                    </div>
                  </div>
                </div>

                {/* NadRaffle */}
                <div className="bg-white dark:bg-dark-800 rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="flex items-center">
                      <Target className="w-4 md:w-5 h-4 md:h-5 text-purple-600 dark:text-purple-400 mr-2" />
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">NadRaffle</h3>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">4+pts</div>
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                      <strong>Creator:</strong> 4pts + ticket sales
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                      <strong>Buyer:</strong> 4pts per 0.1 MON ticket
                    </div>
                  </div>
                </div>
              </div>

              {!isTwitterConnected && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center">
                    <Twitter className="w-4 h-4 mr-2" />
                    <strong>Important:</strong> You must connect your Twitter account in Dashboard to start earning points!
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* User Stats */}
        {isConnected && (
          <section className="py-6">
            <div className="container mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 mb-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Stats</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={refreshData}
                      className="bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center transition-colors"
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    {!isTwitterConnected && (
                      <Link
                        href="/dashboard"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors"
                      >
                        Connect Twitter <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    )}
                  </div>
                </div>

                {userPoints ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    <div className="bg-white dark:bg-dark-800 border border-yellow-200 dark:border-yellow-700 rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm col-span-2 md:col-span-1">
                      <div className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{formatPoints(userPoints.totalPoints)}</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Total Points</div>
                      {userRank && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">Rank #{userRank}</div>
                      )}
                    </div>
                    
                    <div className="bg-white dark:bg-dark-800 border border-green-200 dark:border-green-700 rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm">
                      <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{formatPoints(userPoints.pointsBreakdown.nadswap)}</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">NadSwap</div>
                    </div>
                    
                    <div className="bg-white dark:bg-dark-800 border border-blue-200 dark:border-blue-700 rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm">
                      <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{formatPoints(userPoints.pointsBreakdown.nadpay)}</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">NadPay</div>
                    </div>
                    
                    <div className="bg-white dark:bg-dark-800 border border-purple-200 dark:border-purple-700 rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm">
                      <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">{formatPoints(userPoints.pointsBreakdown.nadraffle)}</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">NadRaffle</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-300">Start using our platform to earn points!</p>
                  </div>
                )}
              </motion.div>
            </div>
          </section>
        )}

        {/* Getting Started CTA */}
        {!isConnected && (
          <section className="py-6">
            <div className="container mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-dark-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-dark-700 mb-8 text-center"
              >
                <Users className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Use the "Connect Wallet" button in the navbar above to see your points and rank on the leaderboard!</p>
              </motion.div>
            </div>
          </section>
        )}
        
        {/* Twitter Connection CTA */}
        {isConnected && !isTwitterConnected && (
          <section className="py-6">
            <div className="container mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-dark-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-dark-700 mb-8 text-center"
              >
                <Twitter className="w-16 h-16 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect Twitter to Start Earning</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your wallet is connected! Now go to Dashboard and connect your Twitter account to start earning points from your transactions.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold"
                >
                  <Twitter className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Link>
              </motion.div>
            </div>
          </section>
        )}

        {/* Leaderboard Table */}
        <section className="py-6">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2" />
                    Top Users
                  </h2>
                  <button
                    onClick={refreshData}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                    title="Refresh leaderboard"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

                            {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Loading leaderboard...</p>
                </div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="md:hidden">
                      {usersToDisplay.map((user, index) => {
                        const isConnectedUser = simulatedAddress && user.walletAddress.toLowerCase() === simulatedAddress.toLowerCase();
                        const isConnectedUserAtTop = isConnectedUser && connectedUserFromFull && index === 0;
                        
                        return (
                          <motion.div
                            key={user._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-3 border-b border-gray-200 dark:border-dark-700 ${
                              isConnectedUser
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getRankIcon(user.rank)}
                                {user.twitterHandle ? (
                                  <a 
                                    href={`https://twitter.com/${user.twitterHandle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                                  >
                                    @{user.twitterHandle}
                                  </a>
                                ) : (
                                  <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">{formatAddress(user.walletAddress)}</span>
                                )}
                                {isConnectedUserAtTop && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-lg font-bold text-gray-900 dark:text-white">{formatPoints(user.totalPoints)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <span className="text-green-600 dark:text-green-400 font-medium">{formatPoints(user.pointsBreakdown.nadswap)}</span>
                                <div className="text-gray-500 dark:text-gray-400">Swap</div>
                              </div>
                              <div className="text-center">
                                <span className="text-blue-600 dark:text-blue-400 font-medium">{formatPoints(user.pointsBreakdown.nadpay)}</span>
                                <div className="text-gray-500 dark:text-gray-400">Pay</div>
                              </div>
                              <div className="text-center">
                                <span className="text-purple-600 dark:text-purple-400 font-medium">{formatPoints(user.pointsBreakdown.nadraffle)}</span>
                                <div className="text-gray-500 dark:text-gray-400">Raffle</div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-dark-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Rank</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">User</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Total Points</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">NadSwap</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">NadPay</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300">NadRaffle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                      {usersToDisplay.map((user, index) => {
                        const isConnectedUser = simulatedAddress && user.walletAddress.toLowerCase() === simulatedAddress.toLowerCase();
                        const isConnectedUserAtTop = isConnectedUser && connectedUserFromFull && index === 0;
                        
                        return (
                          <motion.tr
                            key={user._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors ${
                              isConnectedUser
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                                : ''
                            } ${
                              isConnectedUserAtTop
                                ? 'border-b-2 border-b-blue-300 dark:border-b-blue-600'
                                : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {getRankIcon(user.rank)}
                                {isConnectedUserAtTop && (
                                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {user.twitterHandle ? (
                                  <a 
                                    href={`https://twitter.com/${user.twitterHandle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  >
                                    @{user.twitterHandle}
                                  </a>
                                ) : (
                                  <span className="text-gray-600 dark:text-gray-300 font-mono">{formatAddress(user.walletAddress)}</span>
                                )}
                                {isConnectedUserAtTop && (
                                  <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatPoints(user.totalPoints)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-green-600 dark:text-green-400 font-medium">{formatPoints(user.pointsBreakdown.nadswap)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">{formatPoints(user.pointsBreakdown.nadpay)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-purple-600 dark:text-purple-400 font-medium">{formatPoints(user.pointsBreakdown.nadraffle)}</span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              )}

              {/* Pagination */}
              {!loading && leaderboard.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Showing {startIndex + 1}-{Math.min(endIndex, leaderboard.length)} of {leaderboard.length} users
                      {connectedUserFromFull && !connectedUserInCurrentPage && (
                        <span className="text-blue-600 dark:text-blue-400"> (+Your rank)</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 7) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 4) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            pageNumber = totalPages - 6 + i;
                          } else {
                            pageNumber = currentPage - 3 + i;
                          }
                          
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => goToPage(pageNumber)}
                              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                currentPage === pageNumber
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {leaderboard.length === 0 && !loading && (
                <div className="p-8 text-center">
                  <Star className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">No users on the leaderboard yet. Be the first!</p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid md:grid-cols-3 gap-4"
        >
          <Link
            href="/nadswap"
            className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-lg hover:border-green-200 dark:hover:border-green-700 transition-all duration-200 text-center group"
          >
            <Activity className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Start Swapping</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Use NadSwap to earn points</p>
          </Link>

          <Link
            href="/app/create"
            className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 text-center group"
          >
            <Coins className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Create Payment</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Use NadPay to earn points</p>
          </Link>

          <Link
            href="/rafflehouse/create"
            className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-200 text-center group"
          >
            <Target className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Create Raffle</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Use NadRaffle to earn points</p>
          </Link>
        </motion.div>
      </div>
    </div>
  );
} 