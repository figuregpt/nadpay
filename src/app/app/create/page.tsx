"use client";

import { useState } from "react";
import { Trophy, ArrowLeft, Calendar, Users, Gift, DollarSign, Clock, Sparkles } from "lucide-react";
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
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 dark:text-gray-300">Loading Raffle Creator...</p>
      </div>
    </div>
  )
});

export default function CreateRafflePage() {
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
                <Link href="/app/create" className="text-purple-600 dark:text-purple-400 font-medium border-b-2 border-purple-600 pb-1">
                  Create
                </Link>
                <Link href="/app/payments" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
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
                <ConnectKitButton />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 mr-3" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Create Epic <span className="text-yellow-300">Raffle</span>
              </h1>
              <Sparkles className="w-8 h-8 ml-3" />
            </div>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Launch your own raffle and engage your community! 🎲
            </p>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Gift className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-bold mb-2">Any Prize</h3>
                <p className="text-sm opacity-80">Tokens, NFTs, or anything valuable</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Users className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-bold mb-2">Community</h3>
                <p className="text-sm opacity-80">Engage and grow your audience</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-bold mb-2">Monetize</h3>
                <p className="text-sm opacity-80">Set ticket prices and earn</p>
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
                Configure Your Raffle
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Fill in the details and launch your raffle to the world
              </p>
            </motion.div>

            <Web3AppContent />
          </div>
        </div>
      </section>
    </div>
  );
} 