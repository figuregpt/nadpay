"use client";

import { useState } from "react";
import { Moon, Sun, ArrowRight, Link2, Zap, Shield, Globe, Users, CheckCircle, Sparkles, Wallet, Trophy, ChevronDown, ArrowLeftRight, CreditCard } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

// Custom SVG icons for Discord and X (Twitter)
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const [isNadToolsOpen, setIsNadToolsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-dark-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">NadPay</span>
          </div>
          


          <div className="flex items-center space-x-2 sm:space-x-4">
            <a
              href="https://x.com/nadpayxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
              title="Follow us on X"
            >
              <XIcon className="w-4 h-4" />
            </a>
            <div className="relative group">
              <div className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 cursor-pointer">
                <DiscordIcon className="w-4 h-4" />
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Coming Soon
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg border border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            
            {/* RaffleHouse Link */}
            <a
              href="/rafflehouse"
              className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm sm:text-base flex items-center"
            >
              <Trophy className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">RaffleHouse</span>
              <span className="sm:hidden">Raffle</span>
            </a>
            
            {/* NadTools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNadToolsOpen(!isNadToolsOpen)}
                onBlur={() => setTimeout(() => setIsNadToolsOpen(false), 150)}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm sm:text-base flex items-center"
            >
                <span className="hidden sm:inline">NadTools</span>
                <span className="sm:hidden">Tools</span>
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isNadToolsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isNadToolsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 py-2 z-50">
                  <a
                    href="/nadswap"
                    className="flex items-start px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <ArrowLeftRight className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">NadSwap</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Trade NFTs directly with other users</p>
                    </div>
                  </a>
                  
                  <a
                    href="/nadpay"
                    className="flex items-start px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">NadPay</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Create payment links and subscriptions</p>
                    </div>
            </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-display-xl md:text-display-2xl font-inter text-gray-900 dark:text-white mb-6">
              Complete DeFi Suite
              <br />
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                on Monad
              </span>
            </h1>
            <p className="text-body-xl font-inter text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience the future of decentralized finance with our comprehensive suite of tools. 
              Trade NFTs, create payment links, run raffles, and more on the fastest EVM-compatible blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/rafflehouse"
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity text-body-lg font-inter font-semibold flex items-center justify-center"
              >
                <Trophy className="w-5 h-5 mr-2" />
                RaffleHouse
              </a>
              <a
                href="/nadswap"
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity text-body-lg font-inter font-semibold flex items-center justify-center"
              >
                <ArrowLeftRight className="w-5 h-5 mr-2" />
                NadSwap
              </a>
              <a
                href="/nadpay"
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-opacity text-body-lg font-inter font-semibold flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                NadPay
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-dark-950 dark:to-dark-900">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-display-lg font-inter text-gray-900 dark:text-white mb-4">
              Our Services
            </h2>
            <p className="text-body-xl font-inter text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover the complete suite of DeFi tools built on Monad blockchain
            </p>
          </motion.div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* RaffleHouse */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-dark-700 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">RaffleHouse</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Create and participate in NFT raffles. Fair, transparent, and automated prize distribution with instant payouts.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    NFT & Token Raffles
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Automated Finalization
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Instant Prize Distribution
                  </li>
                </ul>
                <a
                  href="/rafflehouse"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Launch RaffleHouse
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            </motion.div>

            {/* NadSwap */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-dark-700 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <ArrowLeftRight className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">NadSwap</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Trade NFTs and tokens directly with other users. Secure escrow system with automated expiration handling.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Direct P2P Trading
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Secure Escrow System
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Multi-Asset Support
                  </li>
                </ul>
                <a
                  href="/nadswap"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Launch NadSwap
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            </motion.div>

            {/* NadPay */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-dark-700 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-teal-500"></div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">NadPay</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Create payment links and manage subscriptions. Perfect for merchants, creators, and service providers.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Payment Links
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Subscription Management
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Usage Analytics
                  </li>
                </ul>
                <a
                  href="/nadpay"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Launch NadPay
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-dark-900">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-display-lg font-inter text-gray-900 dark:text-white mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-body-xl font-inter text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience the power of decentralized finance with our comprehensive suite built on Monad blockchain
            </p>
          </motion.div>

          {/* Asymmetric Grid Layout */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Large featured card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="lg:col-span-6 bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 p-8 rounded-3xl text-white relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Lightning Fast DeFi</h3>
                  <p className="text-white/90 text-lg leading-relaxed">
                    Experience the speed of Monad - the fastest EVM blockchain with sub-second finality. 
                    Trade, pay, and participate in raffles without waiting for confirmations.
                  </p>
                </div>
              </motion.div>

              {/* Right column - 2 stacked cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-200 dark:border-dark-700 group hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">100% Decentralized</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Direct peer-to-peer transactions with no intermediaries. Your assets, your control.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-200 dark:border-dark-700 group hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Global Access</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Trade, pay, and participate from anywhere in the world, instantly and without restrictions.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Bottom row - 3 cards */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="lg:col-span-4 bg-gradient-to-tr from-orange-100 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Complete DeFi Suite</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Trading, payments, and raffles all in one powerful ecosystem with unified experience.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="lg:col-span-4 bg-gradient-to-tr from-pink-100 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-pink-200 dark:border-pink-800"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Zero Friction</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  No complex sign-ups. Just connect your wallet and start using all services immediately.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                className="lg:col-span-4 bg-gradient-to-tr from-blue-100 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Community Driven</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Built by the community, for the community. Fair, transparent, and always improving.
                </p>
              </motion.div>

            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-dark-800 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">NadPay</span>
            </div>
            <div className="flex space-x-6">
              <a href="/docs" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Documentation
              </a>
              <a href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-dark-800 mt-8 pt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              © 2025 NadPay. Built with ❤️ by <a href="https://x.com/figuregpt" className="text-primary-500 hover:text-primary-600 transition-colors">Figure</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
