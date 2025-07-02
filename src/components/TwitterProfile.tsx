"use client";

import { useTwitterProfile } from '@/hooks/useTwitterProfile';
import { ExternalLink, RefreshCw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface TwitterProfileProps {
  showFullProfile?: boolean;
  className?: string;
  showStats?: boolean;
  userPoints?: any;
  userRank?: number | null;
  loadingStats?: boolean;
  onRefreshStats?: () => Promise<void>;
  formatStatsPoints?: (points: number) => string;
}

export default function TwitterProfile({ 
  showFullProfile = true, 
  className = "", 
  showStats = false,
  userPoints,
  userRank,
  loadingStats = false,
  onRefreshStats,
  formatStatsPoints
}: TwitterProfileProps) {
  const { profile, isLoading, error, connectTwitter, disconnectTwitter } = useTwitterProfile();

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        {showFullProfile && (
          <div>
            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
            <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        )}
      </div>
    );
  }

  if (!profile) {
    if (!showFullProfile) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 ${className}`}
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connect Your X Account
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Verify your identity and show your profile in raffles
            </p>
            <button
              onClick={connectTwitter}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Connect X Account
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}
      </motion.div>
    );
  }

  // Compact profile view for creator display
  if (!showFullProfile) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <img
          src={profile.twitterAvatarUrl || '/placeholder-avatar.png'}
          alt={profile.twitterName}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {profile.twitterName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            @{profile.twitterHandle}
          </p>
        </div>
      </div>
    );
  }

  // Full profile view for dashboard
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 ${className}`}
    >
      {/* Profile Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <img
            src={profile.twitterAvatarUrl || '/placeholder-avatar.png'}
            alt={profile.twitterName}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {profile.twitterName}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              @{profile.twitterHandle}
            </p>
            <a
              href={`https://x.com/${profile.twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 text-sm inline-flex items-center mt-1"
            >
              View on X
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
        <button
          onClick={disconnectTwitter}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>

      {/* Stats Section */}
      {showStats && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Your Leaderboard Stats</h4>
            {onRefreshStats && (
              <button
                onClick={onRefreshStats}
                disabled={loadingStats}
                className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors disabled:opacity-50"
                title="Refresh stats"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loadingStats ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {loadingStats ? (
            <div className="grid md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl p-4 animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : userPoints && formatStatsPoints ? (
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{formatStatsPoints(userPoints.totalPoints)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Points</div>
                {userRank && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Rank #{userRank}</div>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatStatsPoints(userPoints.pointsBreakdown.nadswap)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">NadSwap Points</div>
                <div className="text-xs text-green-600 dark:text-green-400">4pts per swap</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatStatsPoints(userPoints.pointsBreakdown.nadpay)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">NadPay Points</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">4pts per 0.1 MON</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatStatsPoints(userPoints.pointsBreakdown.nadraffle)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">NadRaffle Points</div>
                <div className="text-xs text-purple-600 dark:text-purple-400">4pts per 0.1 MON</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start Earning Points</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Use NadPay, NadSwap, and NadRaffle to earn points!</p>
              <div className="flex justify-center space-x-2">
                <a href="/leaderboard" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                  View Leaderboard →
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
} 
 