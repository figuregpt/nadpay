"use client";

import { useTwitterProfile } from '@/hooks/useTwitterProfile';
import { CheckCircle, X, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface TwitterProfileProps {
  showFullProfile?: boolean;
  className?: string;
}

export default function TwitterProfile({ showFullProfile = true, className = "" }: TwitterProfileProps) {
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
        <div className="relative">
          <img
            src={profile.twitterAvatarUrl || '/placeholder-avatar.png'}
            alt={profile.twitterName}
            className="w-8 h-8 rounded-full object-cover"
          />
          {/* Always show verified badge if Twitter profile exists */}
          <CheckCircle className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500 bg-white rounded-full" />
        </div>
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
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={profile.twitterAvatarUrl || '/placeholder-avatar.png'}
              alt={profile.twitterName}
              className="w-16 h-16 rounded-full object-cover"
            />
            {/* Always show verified badge if Twitter profile exists */}
            <CheckCircle className="absolute -bottom-1 -right-1 w-6 h-6 text-blue-500 bg-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {profile.twitterName}
              </h3>
              {/* Always show verified badge if Twitter profile exists */}
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                Verified
              </span>
            </div>
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
          className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          title="Disconnect X account"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
} 
 