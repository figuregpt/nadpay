"use client";


import { Moon, Sun, ArrowRight, Link2, Zap, Shield, Globe, Users, CheckCircle, Sparkles, Wallet } from "lucide-react";
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
            <a
              href="/app"
              className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Launch App</span>
              <span className="sm:hidden">Launch</span>
            </a>
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
              Payment Solutions
              <br />
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                on Monad
              </span>
            </h1>
            <p className="text-body-xl font-inter text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Create payment links, subscriptions, and more on the fastest EVM-compatible blockchain. 
              Simple, secure, and lightning-fast transactions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/app"
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity text-body-lg font-inter font-semibold flex items-center justify-center"
              >
                Launch App
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              <a
                href="/docs"
                className="px-8 py-4 border border-gray-200 dark:border-dark-700 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-body-lg font-inter font-semibold flex items-center justify-center"
              >
                Documentation
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
              How it Works
            </h2>
            <p className="text-body-xl font-inter text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get started with NadPay in just 3 simple steps
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-16 lg:mb-20"
            >
              <div className="lg:w-1/2 order-1 lg:order-1">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-lg lg:text-xl font-bold text-white">1</span>
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 flex-1 hidden lg:block"></div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-4">Connect Your Wallet</h3>
                <p className="text-gray-600 dark:text-gray-300 text-base lg:text-lg leading-relaxed mb-6">
                  Simply connect your Web3 wallet to Monad Testnet. We support MetaMask, Phantom, HaHa Wallet and more.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2 bg-orange-100 dark:bg-orange-900/20 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-orange-700 dark:text-orange-300">Lightning Fast</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 dark:text-green-300">Secure</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 order-2 lg:order-2">
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-dark-700 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Connect Wallet</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">Choose your preferred wallet</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl border border-gray-200 dark:border-dark-600">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-sm"></div>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">MetaMask</span>
                        </div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl border border-gray-200 dark:border-dark-600">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full"></div>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">Phantom</span>
                        </div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl border border-gray-200 dark:border-dark-600">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-lg"></div>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">HaHa Wallet</span>
                        </div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-500">
                      <span className="inline-flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Monad Testnet Ready</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-16 lg:mb-20"
            >
              <div className="lg:w-1/2 order-1 lg:order-2">
                <div className="flex items-center mb-6 lg:flex-row-reverse">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center ml-4 lg:ml-0 lg:mr-4 shadow-lg">
                    <span className="text-lg lg:text-xl font-bold text-white">2</span>
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 flex-1 hidden lg:block"></div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-4">Create Payment Link</h3>
                <p className="text-gray-600 dark:text-gray-300 text-base lg:text-lg leading-relaxed mb-6">
                  Set your payment amount, add a description, and configure limits. Our intuitive dashboard makes it super easy.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Sparkles className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">Custom Amounts</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Shield className="w-6 h-6 text-purple-500 mb-2" />
                    <p className="text-sm text-purple-700 dark:text-purple-300">Usage Limits</p>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 order-2 lg:order-1">
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-dark-700 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                  
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Link2 className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Create Payment Link</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Configure your payment details</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Amount (MON)</label>
                      <div className="mt-1 bg-gray-50 dark:bg-dark-700 rounded-lg p-3 border border-gray-200 dark:border-dark-600">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">10.00</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Description</label>
                      <div className="mt-1 bg-gray-50 dark:bg-dark-700 rounded-lg p-3 border border-gray-200 dark:border-dark-600">
                        <span className="text-gray-700 dark:text-gray-300">Coffee payment</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Max Uses</label>
                        <div className="mt-1 bg-gray-50 dark:bg-dark-700 rounded-lg p-3 border border-gray-200 dark:border-dark-600 text-center">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">100</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Expires</label>
                        <div className="mt-1 bg-gray-50 dark:bg-dark-700 rounded-lg p-3 border border-gray-200 dark:border-dark-600 text-center">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">30 days</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-3 text-center font-medium opacity-75">
                        Generate Link
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-2">
                        Preview mode - not functional
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12"
            >
              <div className="lg:w-1/2 order-1 lg:order-1">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-lg lg:text-xl font-bold text-white">3</span>
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-orange-500 to-red-500 flex-1 hidden lg:block"></div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-4">Share & Get Paid</h3>
                <p className="text-gray-600 dark:text-gray-300 text-base lg:text-lg leading-relaxed mb-6">
                  Copy your payment link and share it anywhere - social media, email, QR codes. Get paid instantly when someone uses it.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 px-4 py-2 rounded-full border border-orange-200 dark:border-orange-800">
                    <Globe className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">Global</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-2 rounded-full border border-green-200 dark:border-green-800">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">Instant</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-2 rounded-full border border-purple-200 dark:border-purple-800">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">Secure</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 order-2 lg:order-2">
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-dark-700 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
                  
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <ArrowRight className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Share & Get Paid</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Your payment link is ready</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 block">Your Payment Link</label>
                      <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 border border-gray-200 dark:border-dark-600 relative">
                        <div className="flex items-center space-x-2">
                          <Link2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-mono break-all">
                            https://nadpay.xyz/pay/abc123...
                          </span>
                        </div>
                        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center opacity-75">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Copy Link</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center opacity-75">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">QR Code</span>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">Payment Received!</p>
                          <p className="text-xs text-green-600 dark:text-green-400">10.00 MON from 0x1234...5678</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                      Demo notification - not functional
                    </div>
                  </div>
                </div>
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
              Why Choose NadPay?
            </h2>
            <p className="text-body-xl font-inter text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built for the future of payments on Monad blockchain
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
                  <h3 className="text-2xl font-bold mb-4">Lightning Fast Payments</h3>
                  <p className="text-white/90 text-lg leading-relaxed">
                    Experience the speed of Monad - the fastest EVM blockchain with sub-second finality. 
                    No more waiting for confirmations.
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
                        Direct wallet-to-wallet payments with no intermediaries or chargebacks.
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
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Global Reach</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Accept payments from anywhere in the world, instantly and without restrictions.
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All-In-One Platform</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Payment links, subscriptions, and analytics in one powerful dashboard.
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
                  No sign-ups required. Customers pay with just one click using their preferred wallet.
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Customer Rewards</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Build loyalty with exclusive perks for repeat customers.
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
