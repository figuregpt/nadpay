"use client";

import { ArrowRight, Link2, Zap, Shield, Globe, Users, CheckCircle, Sparkles, Trophy, ArrowLeftRight, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      <Navbar showTicketsButton={false} />

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

      {/* Points & Leaderboard Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-orange-900/10">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-display-lg font-inter text-gray-900 dark:text-white mb-4">
              Earn Points & Compete
            </h2>
            <p className="text-body-xl font-inter text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Connect your Twitter account and earn points for every activity. Climb the leaderboard and showcase your DeFi journey!
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
            {/* Points System */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-dark-700">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Points System</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                    <div className="flex items-center">
                      <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3" />
                      <span className="font-medium text-gray-900 dark:text-white">NadRaffle Activity</span>
                    </div>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">4pts per 0.1 MON</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                    <div className="flex items-center">
                      <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                      <span className="font-medium text-gray-900 dark:text-white">NadSwap Trade</span>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">4pts per swap</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                      <span className="font-medium text-gray-900 dark:text-white">NadPay Transaction</span>
                    </div>
                    <span className="text-green-600 dark:text-green-400 font-bold">4pts per 0.1 MON</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Twitter Connection Required</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Connect your Twitter account to start earning points</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Leaderboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-dark-700 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h3>
                </div>
                <a
                  href="/leaderboard"
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors"
                >
                  View Full →
                </a>
              </div>

              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Top Trader</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">15,420 points</p>
                  </div>
                  <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
                </div>

                <div className="flex items-center p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">DeFi Explorer</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">12,880 points</p>
                  </div>
                  <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Raffle Master</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">10,340 points</p>
                  </div>
                  <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <a
                  href="/leaderboard"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  View Full Leaderboard
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
