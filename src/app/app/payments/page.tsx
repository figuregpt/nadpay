"use client";

import { Trophy, ArrowLeft, Link2, CreditCard, Zap, Shield, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import dynamic from "next/dynamic";

// Load Web3 component dynamically (skip SSR)
const Web3AppContent = dynamic(() => import("../Web3AppContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Link2 className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 dark:text-gray-300">Loading Payment Creator...</p>
      </div>
    </div>
  )
});

export default function PaymentsPage() {
  const { theme, setTheme } = useTheme();
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Nav */}
            <div className="flex items-center space-x-8">
              <Link href="/app" className="flex items-center space-x-3">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" />
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
                <Link href="/app" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Raffles
                </Link>
                <Link href="/app/create" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Create
                </Link>
                <Link href="/app/payments" className="text-blue-600 dark:text-blue-400 font-medium border-b-2 border-blue-600 pb-1">
                  Payments
                </Link>
                <Link href="/app/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Dashboard
                </Link>
              </nav>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {!isConnected ? (
                <ConnectKitButton.Custom>
                  {({ show }) => (
                    <button
                      onClick={show}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectKitButton.Custom>
              ) : (
                <ConnectKitButton.Custom>
                  {({ show }) => (
                    <button
                      onClick={show}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectKitButton.Custom>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center mb-6">
              <Link2 className="w-12 h-12 mr-4 text-yellow-300" />
              <h1 className="text-4xl md:text-6xl font-bold">
                <span className="text-yellow-300">NadPay</span> Links
              </h1>
            </div>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Create payment links and get paid instantly! 💰
            </p>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-bold mb-2">Instant</h3>
                <p className="text-sm opacity-80">Get paid in seconds, no delays</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-bold mb-2">Multi-Token</h3>
                <p className="text-sm opacity-80">Accept MON, USDC, WETH and more</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Globe className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-bold mb-2">Shareable</h3>
                <p className="text-sm opacity-80">Share links anywhere, anytime</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Create Form */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Create Payment Link
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Set up your payment details and start accepting payments
              </p>
            </motion.div>

            <Web3AppContent />
          </div>
        </div>
      </section>
    </div>
  );
} 