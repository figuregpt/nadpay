"use client";

import { Moon, Sun, Link2, ArrowLeft, Trophy, CreditCard, ArrowLeftRight, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useEffect } from "react";

// Load Web3 component dynamically (skip SSR)
const Web3AppContent = dynamic(() => import("../app/Web3AppContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Link2 className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 dark:text-gray-300">Loading Web3...</p>
      </div>
    </div>
  )
});

export default function NadPayPage() {
  const { theme, setTheme } = useTheme();
  const { isConnected, address } = useAccount();

  // Set document title
  useEffect(() => {
    document.title = 'NadPay - Payment Solutions on Monad';
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your wallet to start creating payment links and managing subscriptions.
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
          <div className="mt-6 flex flex-col items-center space-y-4">
            <a 
              href="/"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </a>
            
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  NadPay
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Create payment links and subscriptions
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Navigation Links */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <a 
                  href="/" 
                  className="hidden sm:block px-2 lg:px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                >
                  Home
                </a>
                <a 
                  href="/app/dashboard" 
                  className="px-2 lg:px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                >
                  Dashboard
                </a>
                <a 
                  href="/nadswap" 
                  className="px-2 lg:px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                >
                  NadSwap
                </a>
                <a 
                  href="/rafflehouse" 
                  className="px-2 lg:px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                >
                  RaffleHouse
                </a>
              </div>
              
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
              
              {/* Custom Wallet Button with Dropdown */}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Web3AppContent />
        </motion.div>
      </div>
    </div>
  );
} 