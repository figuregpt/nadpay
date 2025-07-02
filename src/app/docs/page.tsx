"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { 
  Link2, 
  ArrowLeft, 
  Book, 
  Code, 
  Wallet, 
  Shield, 
  Zap,
  Copy,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  FileText,
  Settings,
  CreditCard,
  Users,
  Globe,
  Trophy,
  ArrowLeftRight,
  Sparkles,
  Twitter,
  Star,
  Award,
  Target,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Home,
  BarChart3
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [expandedSections, setExpandedSections] = useState<string[]>(["getting-started", "points-system"]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Book,
      subsections: [
        { id: "introduction", title: "Introduction" },
        { id: "quick-start", title: "Quick Start" },
        { id: "wallet-setup", title: "Wallet Setup" }
      ]
    },
    {
      id: "points-system",
      title: "Points & Leaderboard",
      icon: Trophy,
      subsections: [
        { id: "points-overview", title: "Points System Overview" },
        { id: "earning-points", title: "How to Earn Points" },
        { id: "twitter-integration", title: "Twitter Integration" },
        { id: "leaderboard", title: "Leaderboard" },
        { id: "dashboard", title: "Dashboard" }
      ]
    },
    {
      id: "nadpay",
      title: "NadPay - Payment Links",
      icon: CreditCard,
      subsections: [
        { id: "nadpay-overview", title: "Overview" },
        { id: "creating-links", title: "Creating Payment Links" },
        { id: "payment-process", title: "Payment Process" },
        { id: "nadpay-features", title: "Advanced Features" }
      ]
    },
    {
      id: "rafflehouse",
      title: "RaffleHouse - V6 Raffles",
      icon: Globe,
      subsections: [
        { id: "raffle-overview", title: "Overview" },
        { id: "creating-raffles", title: "Creating Raffles" },
        { id: "v6-features", title: "V6 Features" },
        { id: "raffle-participation", title: "Participating in Raffles" }
      ]
    },
    {
      id: "nadswap",
      title: "NadSwap - V3 Trading",
      icon: ArrowLeftRight,
      subsections: [
        { id: "swap-overview", title: "Overview" },
        { id: "creating-swaps", title: "Creating Swap Proposals" },
        { id: "swap-process", title: "Swap Process" },
        { id: "v3-features", title: "V3 Features" }
      ]
    },
    {
      id: "smart-contracts",
      title: "Smart Contracts",
      icon: Code,
      subsections: [
        { id: "contract-overview", title: "Contract Overview" },
        { id: "contract-addresses", title: "Contract Addresses" },
        { id: "security-features", title: "Security Features" }
      ]
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "introduction":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to NadPay Ecosystem
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                The complete DeFi suite on Monad blockchain with integrated points system and social features.
              </p>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">
                What is NadPay Ecosystem?
              </h3>
              <p className="text-primary-700 dark:text-primary-300">
                NadPay is a comprehensive DeFi platform featuring NadPay for payment links, RaffleHouse V6 for ultra-fast raffles, 
                and NadSwap V3 for secure asset trading. Connect your Twitter account to earn points for every activity and 
                compete on the leaderboard. All built with ultra-secure smart contracts on Monad blockchain.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <CreditCard className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  NadPay V2
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create secure payment links with multi-token support. Earn 4 points per 0.1 MON in transactions.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Multi-token payments (MON, USDC, USDT)</li>
                  <li>• Real-time analytics dashboard</li>
                  <li>• Image compression & IPFS storage</li>
                  <li>• Purchase history tracking</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <Trophy className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  RaffleHouse V6
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Ultra-secure raffle system with instant finalization. Earn 4 points per 0.1 MON in raffle activity.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• 2-phase finalization system</li>
                  <li>• Token & NFT rewards</li>
                  <li>• Ultra-fast finalizer bot</li>
                  <li>• Emergency winner selection</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <ArrowLeftRight className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  NadSwap V3
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Decentralized asset trading with enhanced security. Earn 4 points per swap transaction.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Escrow-based trading</li>
                  <li>• Multi-asset support (MON, ERC20, NFTs)</li>
                  <li>• 1-hour auto-expiration</li>
                  <li>• Emergency withdrawal system</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <Twitter className="w-6 h-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  Twitter Integration Required
                </h3>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                To earn points and participate in the leaderboard, you must connect your Twitter account. 
                This ensures fair competition and prevents multiple wallet connections.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">4pts</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">per 0.1 MON</div>
                  <div className="text-xs text-yellow-500">NadPay & RaffleHouse</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">4pts</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">per swap</div>
                  <div className="text-xs text-yellow-500">NadSwap trading</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">∞</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">activities</div>
                  <div className="text-xs text-yellow-500">No daily limits</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <Zap className="w-6 h-6 text-yellow-600 mb-2" />
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Lightning Fast</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Optimized for Monad's sub-second finality</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <Shield className="w-6 h-6 text-green-600 mb-2" />
                <h4 className="font-semibold text-green-800 dark:text-green-200">Ultra-Secure</h4>
                <p className="text-sm text-green-700 dark:text-green-300">All contracts audited with reentrancy protection</p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <Users className="w-6 h-6 text-blue-600 mb-2" />
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">Social DeFi</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">Points, leaderboards, and Twitter integration</p>
              </div>
            </div>
          </div>
        );

      case "points-overview":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Points System Overview
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Earn points for every activity and compete on the leaderboard. Twitter connection required.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Trophy className="w-8 h-8 text-yellow-600 mr-4" />
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  How Points Work
                </h3>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                The points system rewards active users across all NadPay services. Connect your Twitter account 
                to start earning points and climbing the leaderboard. Points are awarded automatically for verified transactions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">NadRaffle</h3>
                    <p className="text-purple-600 dark:text-purple-400 font-semibold">4pts per 0.1 MON</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Earn points for creating raffles, buying tickets, and selling raffle tickets.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                  <li>• Creating raffles: Points based on ticket sales</li>
                  <li>• Buying tickets: 4pts per 0.1 MON spent</li>
                  <li>• No limits on earning potential</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <ArrowLeftRight className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">NadSwap</h3>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">4pts per swap</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Earn points for every completed swap transaction, regardless of asset value.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                  <li>• Fixed 4 points per successful swap</li>
                  <li>• Points awarded to both parties</li>
                  <li>• Includes all asset types (MON, ERC20, NFTs)</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">NadPay</h3>
                    <p className="text-green-600 dark:text-green-400 font-semibold">4pts per 0.1 MON</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Earn points for both creating payment links and making purchases.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                  <li>• Buyers: 4pts per 0.1 MON spent</li>
                  <li>• Sellers: Points from customer purchases</li>
                  <li>• Multi-token support included</li>
                </ul>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Twitter className="w-8 h-8 text-red-600 mr-4" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Twitter Connection Required
                </h3>
              </div>
              <p className="text-red-700 dark:text-red-300 mb-4">
                <strong>Important:</strong> You must connect your Twitter account to earn points. Users without 
                Twitter connections receive 0 points for all activities. This ensures fair competition and prevents gaming.
              </p>
              <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  <strong>Security Note:</strong> Each Twitter account can only be connected to one wallet address. 
                  If you try to connect an already-used Twitter account, the connection will fail.
                </p>
              </div>
            </div>
          </div>
        );

      case "earning-points":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                How to Earn Points
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Step-by-step guide to start earning points across all NadPay services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Step 1: Connect Twitter
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Go to Dashboard</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Visit <a href="/dashboard" className="text-blue-500 hover:text-blue-600">/dashboard</a> or click the profile button in the navbar
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Click "Connect Twitter"</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Authorize the application to link your Twitter account
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Start Earning</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Your points will be tracked automatically for all future activities
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Step 2: Start Activities
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">NadRaffle Activities</h4>
                    <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                      <li>• Create raffles (earn from ticket sales)</li>
                      <li>• Buy raffle tickets (4pts per 0.1 MON)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">NadSwap Activities</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Create swap proposals (4pts when accepted)</li>
                      <li>• Accept swap proposals (4pts per swap)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">NadPay Activities</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• Create payment links (earn from sales)</li>
                      <li>• Make purchases (4pts per 0.1 MON)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "twitter-integration":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Twitter Integration
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Connect your Twitter account to unlock points and leaderboard features.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Twitter className="w-8 h-8 text-blue-600 mr-4" />
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  Why Twitter Integration?
                </h3>
              </div>
              <p className="text-blue-700 dark:text-blue-300">
                Twitter integration ensures fair competition by preventing users from connecting multiple wallets 
                to farm points. It also adds a social element to the platform and enables future social features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Security Features
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">One-to-One Mapping</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Each Twitter account can only be connected to one wallet
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Connection Verification</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Backend validates Twitter connection before awarding points
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Duplicate Prevention</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        System prevents connecting already-used Twitter accounts
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Connection Process
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Visit Dashboard</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Go to /dashboard</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Click Connect Twitter</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Authorize application</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Start Earning Points</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Points tracked automatically</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "leaderboard":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Leaderboard
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Compete with other users and track your ranking across all activities.
              </p>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Award className="w-8 h-8 text-yellow-600 mr-4" />
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  How Rankings Work
                </h3>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300">
                The leaderboard ranks users by total points earned across all NadPay services. 
                Rankings are updated in real-time as users earn points from verified transactions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Leaderboard Features
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Real-time Rankings</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        See your rank update instantly as you earn points
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Users className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Twitter Profiles</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        View Twitter profiles and usernames of top users
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <TrendingUp className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Activity Breakdown</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        See points earned from different services
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Visit Leaderboard
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Check your current ranking and see how you compare to other users.
                </p>
                <a
                  href="/leaderboard"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  View Leaderboard
                  <ChevronRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          </div>
        );

      case "dashboard":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Dashboard
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Your personal hub for managing Twitter integration, viewing stats, and tracking activities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Twitter Profile Management
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Twitter className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Connect Twitter</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Link your Twitter account to start earning points
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Users className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Profile Display</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        View your Twitter profile picture and username
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Disconnect Option</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Disconnect your Twitter account if needed
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Points & Statistics
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <BarChart3 className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Total Points</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        See your overall points and current rank
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Target className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Service Breakdown</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Points from NadRaffle, NadSwap, and NadPay
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <TrendingUp className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Live Updates</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Stats refresh automatically with new activities
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Activity Tracking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200">My Tickets</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    View all your raffle tickets and winnings
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-800 dark:text-green-200">My Payments</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Track your payment link purchases and history
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <ArrowLeftRight className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">My Swaps</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    View your swap proposals and completed trades
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-medium text-lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Dashboard
                <ChevronRight className="w-5 h-5 ml-2" />
              </a>
            </div>
          </div>
        );

      case "nadpay-overview":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                NadPay - Payment Links
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Create secure payment links for digital products and services with multi-token support.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                💳 NadPay V2 Ultra-Secure
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                The latest version of NadPay features ultra-secure smart contracts with multi-token support, 
                advanced analytics, and comprehensive security features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ✨ Key Features
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Multi-Token Support</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Accept payments in MON, USDC, USDT, and more</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Image Compression</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Automatic image optimization and IPFS storage</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Analytics Dashboard</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Real-time sales tracking and insights</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Customizable Limits</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Set sales limits and per-wallet restrictions</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🔒 Security Features
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Ultra-Secure Contracts</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Reentrancy protection and comprehensive security</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Emergency Controls</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Pause functionality for critical situations</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Access Control</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Role-based permissions and ownership management</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Rate Limiting</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Built-in protection against RPC overload</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Contract Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract Address</label>
                  <div className="flex items-center mt-1">
                    <code className="flex-1 bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded text-sm break-all">
                      0xfeF2c348d0c8a14b558df27034526d87Ac1f9f25
                    </code>
                    <button 
                      onClick={() => copyToClipboard("0xfeF2c348d0c8a14b558df27034526d87Ac1f9f25")}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                  <p className="mt-1 text-gray-900 dark:text-white">V2 Ultra-Secure</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "raffle-overview":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                RaffleHouse - V4 Fast Raffles
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Ultra-fast raffle system with 2-minute reveal windows optimized for Monad blockchain.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
                ⚡ V4 Fast Technology
              </h3>
              <p className="text-purple-700 dark:text-purple-300">
                Revolutionary raffle system with 2-minute reveal windows, ultra-secure randomness, and emergency 
                winner selection. Optimized for Monad's 0.5-second block time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🚀 V4 Fast Features
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">2-Minute Reveal Window</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Ultra-fast winner selection vs 1-hour in other versions</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Ultra-Secure Randomness</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Commit-reveal scheme with emergency fallback</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Token & NFT Rewards</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Support for both ERC20 tokens and ERC721 NFTs</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Real-Time Countdown</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Live countdown timers for reveal windows</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🎯 Raffle Types
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Token Raffles</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Win MON, USDC, USDT, or any ERC20 token</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">NFT Raffles</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Win unique NFTs and digital collectibles</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Time-Limited</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Set expiration times for automatic ending</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Sold-Out Auto-End</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Automatic winner selection when all tickets sold</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Contract Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract Address</label>
                  <div className="flex items-center mt-1">
                    <code className="flex-1 bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded text-sm break-all">
                      0xa874905B117242eC6c966E35B18985e9242Bb633
                    </code>
                    <button 
                      onClick={() => copyToClipboard("0xa874905B117242eC6c966E35B18985e9242Bb633")}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                  <p className="mt-1 text-gray-900 dark:text-white">V4 Fast</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "swap-overview":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                NadSwap - Decentralized Trading
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Secure peer-to-peer asset trading with escrow protection and zero counterparty risk.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                🔒 Escrow-Based Security
              </h3>
              <p className="text-green-700 dark:text-green-300">
                NadSwap V3 uses smart contract escrow to eliminate counterparty risk. Assets are locked 
                in the contract until both parties fulfill their obligations or the swap is cancelled.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🔄 Swap Features
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Token-to-Token</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Swap any ERC20 tokens (MON, USDC, USDT, etc.)</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">NFT-to-Token</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Trade NFTs for tokens or vice versa</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">NFT-to-NFT</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Direct NFT-to-NFT trading</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Proposal System</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Create proposals and wait for acceptance</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🛡️ Security Features
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Escrow Protection</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Assets locked until swap completion</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Cancellation Rights</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Either party can cancel before acceptance</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">No Counterparty Risk</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Smart contract handles all asset transfers</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Emergency Pause</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Contract can be paused in emergencies</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Contract Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract Address</label>
                  <div className="flex items-center mt-1">
                    <code className="flex-1 bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded text-sm break-all">
                      0x982403dcb43b6aaD6E5425CC360fDBbc81FB6a3f
                    </code>
                    <button 
                      onClick={() => copyToClipboard("0x982403dcb43b6aaD6E5425CC360fDBbc81FB6a3f")}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                  <p className="mt-1 text-gray-900 dark:text-white">V3</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "quick-start":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Quick Start Guide
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Get started with NadPay in just a few minutes.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Connect Your Wallet
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connect a compatible wallet (MetaMask, Phantom, OKX, or HaHa Wallet) to Monad Testnet.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Monad Testnet Details:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Chain ID: 10143</li>
                    <li>• RPC URL: https://testnet-rpc.monad.xyz</li>
                    <li>• Explorer: https://testnet.monadexplorer.com</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Create a Payment Link
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Fill out the payment link form with your product details.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• <strong>Title:</strong> Name of your product/service</li>
                  <li>• <strong>Description:</strong> Brief description</li>
                  <li>• <strong>Cover Image:</strong> Optional product image (auto-compressed)</li>
                  <li>• <strong>Price:</strong> Price in MON tokens</li>
                  <li>• <strong>Limits:</strong> Optional sales and wallet limits</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Share Your Link
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Copy your secure payment link and share it with customers.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Example: <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                      https://nadpay.app/pay/12345_a7b3c9d2
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "wallet-setup":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Wallet Setup
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Configure your wallet for Monad Testnet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Supported Wallets
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">MetaMask</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Phantom Wallet</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">OKX Wallet</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">HaHa Wallet</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Network Configuration
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Network Name</label>
                    <div className="flex items-center mt-1">
                      <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm">
                        Monad Testnet
                      </code>
                      <button 
                        onClick={() => copyToClipboard("Monad Testnet")}
                        className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Chain ID</label>
                    <div className="flex items-center mt-1">
                      <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm">
                        10143
                      </code>
                      <button 
                        onClick={() => copyToClipboard("10143")}
                        className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">RPC URL</label>
                    <div className="flex items-center mt-1">
                      <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm">
                        https://testnet-rpc.monad.xyz
                      </code>
                      <button 
                        onClick={() => copyToClipboard("https://testnet-rpc.monad.xyz")}
                        className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "basic-link":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Creating Basic Payment Links
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Learn how to create your first payment link.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Required Fields
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                Only three fields are required to create a payment link: Title, Description, and Price.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Step-by-Step Process
                </h3>
                <ol className="space-y-4">
                  <li className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Enter Title</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Choose a clear, descriptive title for your product or service.
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      2
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Add Description</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Provide details about what the customer is purchasing.
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      3
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Set Price</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Enter the price in MON tokens (supports decimals).
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      4
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Create Link</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Click "Create Payment Link" and confirm the blockchain transaction.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Example Basic Link
                </h3>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                      <p className="text-gray-900 dark:text-white">Digital Art Collection</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                      <p className="text-gray-900 dark:text-white">0.5 MON</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                      <p className="text-gray-900 dark:text-white">
                        Exclusive digital art piece from the "Monad Dreams" collection. 
                        High-resolution file delivered instantly after purchase.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "contract-overview":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Smart Contract Overview
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Understanding the NadPay Ecosystem's ultra-secure smart contract architecture.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🛡️ Ultra-Secure Architecture
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                All contracts in the NadPay ecosystem use Ultra-Secure versions with comprehensive security features, 
                reentrancy protection, emergency controls, and rate limiting capabilities.
              </p>
            </div>

            {/* NadPay V2 Contract */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                NadPay V2 Ultra-Secure Contract
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract Address</label>
                  <div className="flex items-center mt-1">
                    <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-2 rounded text-xs sm:text-sm break-all">
                      0xfeF2c348d0c8a14b558df27034526d87Ac1f9f25
                    </code>
                    <button 
                      onClick={() => copyToClipboard("0xfeF2c348d0c8a14b558df27034526d87Ac1f9f25")}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                  <p className="mt-1 text-gray-900 dark:text-white">V2 Ultra-Secure</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</label>
                  <p className="mt-1 text-gray-900 dark:text-white">Payment Links & Multi-Token Support</p>
                </div>
              </div>
            </div>

            {/* NadRaffle V4 Fast Contract */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-500" />
                NadRaffle V4 Fast Contract
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract Address</label>
                  <div className="flex items-center mt-1">
                    <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-2 rounded text-xs sm:text-sm break-all">
                      0xa874905B117242eC6c966E35B18985e9242Bb633
                    </code>
                    <button 
                      onClick={() => copyToClipboard("0xa874905B117242eC6c966E35B18985e9242Bb633")}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                  <p className="mt-1 text-gray-900 dark:text-white">V4 Fast</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</label>
                  <p className="mt-1 text-gray-900 dark:text-white">Ultra-Fast Raffles with 2-min Reveals</p>
                </div>
              </div>
            </div>

            {/* NadSwap V3 Contract */}
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ArrowLeft className="w-5 h-5 mr-2 text-green-500" />
                NadSwap V3 Contract
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract Address</label>
                  <div className="flex items-center mt-1">
                    <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-2 rounded text-xs sm:text-sm break-all">
                      0x982403dcb43b6aaD6E5425CC360fDBbc81FB6a3f
                    </code>
                    <button 
                      onClick={() => copyToClipboard("0x982403dcb43b6aaD6E5425CC360fDBbc81FB6a3f")}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                  <p className="mt-1 text-gray-900 dark:text-white">V3</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</label>
                  <p className="mt-1 text-gray-900 dark:text-white">Escrow-Based Asset Trading</p>
                </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Network</h4>
                <p className="text-gray-600 dark:text-gray-400">Monad Testnet</p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Compiler</h4>
                <p className="text-gray-600 dark:text-gray-400">Solidity 0.8.20+</p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">License</h4>
                <p className="text-gray-600 dark:text-gray-400">MIT</p>
              </div>
            </div>
          </div>
        );

      case "contract-addresses":
        return (
          <div className="space-y-8">
                <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Contract Addresses
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                All deployed contract addresses on Monad Testnet.
              </p>
                </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
                <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                    💳 NadPay V2 Ultra-Secure
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <code className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm break-all">
                      0x091f3ae2E54584BE7195E2A8C5eD3976d0851905
                    </code>
                    <button 
                      onClick={() => copyToClipboard("0x091f3ae2E54584BE7195E2A8C5eD3976d0851905")}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                    Multi-token payments (MON + ERC20), SafeERC20 integration, Emergency token withdrawal
                  </p>
              </div>
            </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
                <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                    🎯 NadRaffle V6 Ultra-Secure
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <code className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm break-all">
                      0x51bA8C7AFA1bf51cCba0Abf0Da56f4e5c07D351A
                    </code>
                    <button 
                      onClick={() => copyToClipboard("0x51bA8C7AFA1bf51cCba0Abf0Da56f4e5c07D351A")}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                    2-phase finalization system, Ultra-fast finalizer bot, Reentrancy protection, Safe transfers
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden">
                <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    🔄 NadSwap V3 Ultra-Secure
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <code className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm break-all">
                      0x0ebDFAFbef16A22eA8ffaba4DdA051AC4df8f979
                    </code>
                    <button 
                      onClick={() => copyToClipboard("0x0ebDFAFbef16A22eA8ffaba4DdA051AC4df8f979")}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                    Escrow-based swaps, Native MON + ERC20/NFT support, 1-hour auto-expiration, Emergency withdrawal
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                📝 Important Notes
              </h3>
              <ul className="text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• All contracts are deployed on Monad Testnet (Chain ID: 10143)</li>
                <li>• These are Ultra-Secure versions with comprehensive security features</li>
                <li>• Always verify contract addresses before interacting</li>
                <li>• Use the copy button to avoid typos when copying addresses</li>
              </ul>
            </div>
          </div>
        );

      case "security-features":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Security Features
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Comprehensive security measures across all NadPay ecosystem contracts.
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                🛡️ Ultra-Secure Architecture
              </h3>
              <p className="text-red-700 dark:text-red-300">
                All contracts in the NadPay ecosystem implement Ultra-Secure versions with multiple layers 
                of protection against common attack vectors and edge cases.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🔒 Core Security Features
              </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900 dark:text-white">Reentrancy Guards</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Protection against reentrancy attacks</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900 dark:text-white">Access Control</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Role-based permissions and ownership</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900 dark:text-white">Emergency Pause</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Circuit breaker for critical situations</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900 dark:text-white">Input Validation</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Comprehensive parameter checking</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ⚡ Advanced Protection
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900 dark:text-white">Rate Limiting</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Protection against RPC overload</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900 dark:text-white">Overflow Protection</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">SafeMath and bounds checking</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900 dark:text-white">Front-running Protection</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Commit-reveal schemes where applicable</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900 dark:text-white">Gas Optimization</strong>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Efficient code to prevent DoS attacks</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "creating-links":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Creating Payment Links
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Step-by-step guide to creating secure payment links with NadPay.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                💡 Getting Started
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                Creating a payment link is simple and only requires three essential fields: title, description, and price. 
                Advanced options like limits and custom images are optional.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📝 Required Fields
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Title</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Clear, descriptive name for your product or service
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Description</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Detailed explanation of what customers are purchasing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Price & Token</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Set price and choose payment token (MON, USDC, USDT, etc.)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ⚙️ Optional Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Sales Limits</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Set maximum total sales and per-wallet purchase limits
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Cover Image</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Upload product image with automatic compression
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "security-features":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Security Features
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                NadPay's comprehensive security measures.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <Shield className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Smart Contract Security
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• ReentrancyGuard protection</li>
                  <li>• Input validation on all functions</li>
                  <li>• Overflow protection with Solidity 0.8+</li>
                  <li>• Access control with Ownable pattern</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <Link2 className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Secure Link IDs
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Hash-based secure link generation</li>
                  <li>• Non-sequential ID system</li>
                  <li>• Transaction hash seeding</li>
                  <li>• Collision-resistant algorithms</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <Wallet className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Wallet Security
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• No private key storage</li>
                  <li>• Client-side transaction signing</li>
                  <li>• Secure wallet connection protocols</li>
                  <li>• Network verification checks</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <Globe className="w-8 h-8 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Frontend Security
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Image compression to prevent large uploads</li>
                  <li>• Input sanitization and validation</li>
                  <li>• CSP headers and security policies</li>
                  <li>• HTTPS enforcement</li>
                </ul>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Important Security Notes
              </h3>
              <ul className="text-red-700 dark:text-red-300 space-y-1">
                <li>• Always verify you're on the correct network (Monad Testnet)</li>
                <li>• Double-check transaction details before confirming</li>
                <li>• Keep your wallet software updated</li>
                <li>• Never share your private keys or seed phrases</li>
              </ul>
            </div>
          </div>
        );

      case "advanced-options":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Advanced Payment Link Options
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Customize your payment links with advanced features.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sales Limits
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Set maximum number of purchases for your payment link.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Sales Limit</label>
                      <p className="text-gray-900 dark:text-white">Maximum number of total purchases allowed</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Example</label>
                      <p className="text-gray-900 dark:text-white">Set to 100 for limited edition items</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Per-Wallet Limits
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Limit how many times each wallet can purchase.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Purchase Limit</label>
                      <p className="text-gray-900 dark:text-white">Maximum purchases per wallet address</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Use Case</label>
                      <p className="text-gray-900 dark:text-white">Prevent bulk purchasing by single users</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Link Deactivation
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You can deactivate payment links at any time.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    <strong>Warning:</strong> Deactivation is irreversible. Once deactivated, a payment link cannot be reactivated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "image-upload":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Image Upload & Compression
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Add attractive cover images to your payment links.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Automatic Image Compression
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  NadPay automatically compresses uploaded images to optimize performance and reduce storage costs.
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• <strong>Max file size:</strong> 5MB before compression</li>
                  <li>• <strong>Supported formats:</strong> JPEG, PNG, WebP</li>
                  <li>• <strong>Output quality:</strong> 80% (optimal balance)</li>
                  <li>• <strong>Max dimensions:</strong> 1200x800 pixels</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Best Practices
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommended</h4>
                    <ul className="space-y-1 text-green-600 dark:text-green-400">
                      <li>• Use high-quality images (1200x800px)</li>
                      <li>• Choose relevant product photos</li>
                      <li>• Ensure good lighting and clarity</li>
                      <li>• Use standard image formats</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Avoid</h4>
                    <ul className="space-y-1 text-red-600 dark:text-red-400">
                      <li>• Low-resolution images</li>
                      <li>• Copyrighted content</li>
                      <li>• Images with text overlay</li>
                      <li>• Inappropriate content</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "functions":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Smart Contract Functions
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Detailed overview of NadPay and NadRaffle contract functions.
              </p>
            </div>

            {/* NadPay Functions */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Link2 className="w-5 h-5 mr-2 text-primary-500" />
                NadPay Contract Functions
              </h2>
              
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  createPaymentLink()
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Creates a new payment link with specified parameters.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    function createPaymentLink(<br/>
                    &nbsp;&nbsp;string memory title,<br/>
                    &nbsp;&nbsp;string memory description,<br/>
                    &nbsp;&nbsp;string memory imageHash,<br/>
                    &nbsp;&nbsp;uint256 price,<br/>
                    &nbsp;&nbsp;uint256 totalSalesLimit,<br/>
                    &nbsp;&nbsp;uint256 walletPurchaseLimit<br/>
                    ) external payable
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  purchaseFromLink()
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Processes a purchase from a payment link.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    function purchaseFromLink(uint256 linkId, uint256 quantity) external payable
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  deactivateLink()
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Deactivates a payment link (only by creator).
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    function deactivateLink(uint256 linkId) external
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  NadPay View Functions
                </h3>
                <div className="space-y-3">
                  <div>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">getPaymentLink(uint256 linkId)</code>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Returns payment link details</p>
                  </div>
                  <div>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">getUserLinks(address user)</code>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Returns all links created by a user</p>
                  </div>
                  <div>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">getPlatformFee()</code>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Returns current platform fee percentage</p>
                  </div>
                  <div>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">getUserPurchaseCount(uint256 linkId, address user)</code>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Returns user's purchase count for a specific link</p>
                  </div>
                </div>
              </div>
            </div>

            {/* NadRaffle Functions */}
            <div className="space-y-6 mt-12">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-500" />
                NadRaffle Contract Functions
              </h2>
              
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  createRaffle()
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Creates a new raffle with specified parameters and reward.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    function createRaffle(<br/>
                    &nbsp;&nbsp;string memory title,<br/>
                    &nbsp;&nbsp;string memory description,<br/>
                    &nbsp;&nbsp;string memory imageHash,<br/>
                    &nbsp;&nbsp;uint256 rewardAmount,<br/>
                    &nbsp;&nbsp;uint256 ticketPrice,<br/>
                    &nbsp;&nbsp;uint256 maxTickets,<br/>
                    &nbsp;&nbsp;uint256 maxTicketsPerWallet,<br/>
                    &nbsp;&nbsp;uint256 expirationTime<br/>
                    ) external payable
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  purchaseTickets()
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Purchase tickets for a specific raffle.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    function purchaseTickets(uint256 raffleId, uint256 quantity) external payable
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  endRaffle()
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Ends a raffle and selects a winner (only by creator or after expiration).
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    function endRaffle(uint256 raffleId) external
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  cancelRaffle()
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Cancels a raffle and refunds participants (only by creator before any tickets sold).
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    function cancelRaffle(uint256 raffleId) external
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  NadRaffle View Functions
                </h3>
                <div className="space-y-3">
                  <div>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">getRaffle(uint256 raffleId)</code>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Returns raffle details and current status</p>
                  </div>
                  <div>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">getUserTickets(uint256 raffleId, address user)</code>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Returns number of tickets owned by user for a raffle</p>
                  </div>
                  <div>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">getRaffleTickets(uint256 raffleId)</code>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Returns all tickets for a specific raffle</p>
                  </div>
                  <div>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">getUserRaffles(address user)</code>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Returns all raffles created by a user</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "events":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Smart Contract Events
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Events emitted by NadPay and NadRaffle smart contracts.
              </p>
            </div>

            {/* NadPay Events */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Link2 className="w-5 h-5 mr-2 text-primary-500" />
                NadPay Contract Events
              </h2>
              
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  PaymentLinkCreated
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Emitted when a new payment link is created.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    event PaymentLinkCreated(<br />
                    &nbsp;&nbsp;uint256 indexed linkId,<br />
                    &nbsp;&nbsp;address indexed creator,<br />
                    &nbsp;&nbsp;uint256 price,<br />
                    &nbsp;&nbsp;uint256 totalSalesLimit,<br />
                    &nbsp;&nbsp;uint256 walletPurchaseLimit,<br />
                    &nbsp;&nbsp;uint256 timestamp<br />
                    );
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  PurchaseMade
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Emitted when a purchase is made through a payment link.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    event PurchaseMade(<br />
                    &nbsp;&nbsp;uint256 indexed linkId,<br />
                    &nbsp;&nbsp;address indexed buyer,<br />
                    &nbsp;&nbsp;address indexed creator,<br />
                    &nbsp;&nbsp;uint256 quantity,<br />
                    &nbsp;&nbsp;uint256 amount,<br />
                    &nbsp;&nbsp;uint256 platformFee,<br />
                    &nbsp;&nbsp;uint256 timestamp<br />
                    );
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  PaymentLinkDeactivated
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Emitted when a payment link is deactivated.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    event PaymentLinkDeactivated(<br />
                    &nbsp;&nbsp;uint256 indexed linkId,<br />
                    &nbsp;&nbsp;address indexed creator,<br />
                    &nbsp;&nbsp;uint256 timestamp<br />
                    );
                  </code>
                </div>
              </div>
            </div>

            {/* NadRaffle Events */}
            <div className="space-y-6 mt-12">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-500" />
                NadRaffle Contract Events
              </h2>
              
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  RaffleCreated
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Emitted when a new raffle is created.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    event RaffleCreated(<br />
                    &nbsp;&nbsp;uint256 indexed raffleId,<br />
                    &nbsp;&nbsp;address indexed creator,<br />
                    &nbsp;&nbsp;string title,<br />
                    &nbsp;&nbsp;uint8 rewardType,<br />
                    &nbsp;&nbsp;address rewardTokenAddress,<br />
                    &nbsp;&nbsp;uint256 rewardAmount,<br />
                    &nbsp;&nbsp;uint256 ticketPrice,<br />
                    &nbsp;&nbsp;uint256 maxTickets,<br />
                    &nbsp;&nbsp;uint256 expirationTime<br />
                    );
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  TicketsPurchased
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Emitted when tickets are purchased for a raffle.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    event TicketsPurchased(<br />
                    &nbsp;&nbsp;uint256 indexed raffleId,<br />
                    &nbsp;&nbsp;address indexed buyer,<br />
                    &nbsp;&nbsp;uint256 quantity,<br />
                    &nbsp;&nbsp;uint256 totalCost,<br />
                    &nbsp;&nbsp;uint256 startTicketNumber,<br />
                    &nbsp;&nbsp;uint256 endTicketNumber<br />
                    );
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  RaffleEnded
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Emitted when a raffle ends and a winner is selected.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    event RaffleEnded(<br />
                    &nbsp;&nbsp;uint256 indexed raffleId,<br />
                    &nbsp;&nbsp;address indexed winner,<br />
                    &nbsp;&nbsp;uint256 winningTicket,<br />
                    &nbsp;&nbsp;bytes32 randomHash<br />
                    );
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  RaffleCancelled
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Emitted when a raffle is cancelled by the creator.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    event RaffleCancelled(<br />
                    &nbsp;&nbsp;uint256 indexed raffleId,<br />
                    &nbsp;&nbsp;address indexed creator<br />
                    );
                  </code>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  RewardClaimed
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Emitted when a raffle winner claims their reward.
                </p>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                  <code className="text-sm">
                    event RewardClaimed(<br />
                    &nbsp;&nbsp;uint256 indexed raffleId,<br />
                    &nbsp;&nbsp;address indexed winner,<br />
                    &nbsp;&nbsp;uint8 rewardType,<br />
                    &nbsp;&nbsp;uint256 amount<br />
                    );
                  </code>
                </div>
              </div>
            </div>
          </div>
        );

      case "overview":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Dashboard Overview
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Manage your payment links and track performance.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300">Total Links</h4>
                    <p className="text-blue-600 dark:text-blue-400">Number of payment links created</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-300">Total Sales</h4>
                    <p className="text-green-600 dark:text-green-400">Total MON earned from all links</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 dark:text-purple-300">Active Links</h4>
                    <p className="text-purple-600 dark:text-purple-400">Currently active payment links</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Activity
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  View your most recent transactions and link activities in real-time.
                </p>
              </div>
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Analytics & Insights
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Track performance and understand your sales data.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sales Analytics
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• <strong>Revenue Tracking:</strong> Monitor total earnings per link</li>
                  <li>• <strong>Purchase Patterns:</strong> Analyze buying behavior over time</li>
                  <li>• <strong>Performance Metrics:</strong> Compare link performance</li>
                  <li>• <strong>Geographic Data:</strong> See where your customers are from</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Real-time Updates
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All analytics are updated in real-time as transactions occur on the blockchain. 
                  No delays or manual updates needed.
                </p>
              </div>
            </div>
          </div>
        );

      case "management":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Link Management
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Organize and manage your payment links effectively.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Link Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Available Actions</h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• View link details and stats</li>
                      <li>• Copy payment link URL</li>
                      <li>• Generate QR code</li>
                      <li>• Deactivate link (irreversible)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Link Status</h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• <span className="text-green-500">Active:</span> Accepting payments</li>
                      <li>• <span className="text-red-500">Deactivated:</span> No longer accepting payments</li>
                      <li>• <span className="text-yellow-500">Limit Reached:</span> Sales limit met</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Bulk Operations
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select multiple links to perform batch operations like bulk deactivation or 
                  exporting analytics data.
                </p>
              </div>
            </div>
          </div>
        );

      case "customer-flow":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Customer Payment Flow
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Understanding the customer experience when making payments.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Step-by-Step Process
                </h3>
                <ol className="space-y-4">
                  <li className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Visit Payment Link</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Customer clicks on your shared payment link
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      2
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">View Product Details</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        See title, description, price, and cover image
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      3
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Connect Wallet</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Connect compatible wallet to Monad Testnet
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      4
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Confirm Purchase</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Review details and confirm blockchain transaction
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      5
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Payment Complete</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Receive confirmation and transaction hash
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        );

      case "transaction-flow":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Transaction Flow
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                How transactions are processed on the blockchain.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Payment Processing
                </h3>
                <ol className="space-y-3">
                  <li><strong>1. Transaction Initiation:</strong> Customer confirms payment in wallet</li>
                  <li><strong>2. Smart Contract Validation:</strong> Contract verifies link status and limits</li>
                  <li><strong>3. Fee Calculation:</strong> Platform fee (1%) is calculated automatically</li>
                  <li><strong>4. Payment Distribution:</strong> Funds sent to creator, fee to platform</li>
                  <li><strong>5. Event Emission:</strong> PurchaseMade event logged on blockchain</li>
                  <li><strong>6. UI Update:</strong> Frontend updates with new transaction data</li>
                </ol>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Gas Fees
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Monad's high-performance blockchain ensures minimal gas fees:
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• <strong>Payment Transaction:</strong> ~0.0001 MON</li>
                  <li>• <strong>Link Creation:</strong> ~0.0002 MON</li>
                  <li>• <strong>Link Deactivation:</strong> ~0.0001 MON</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "confirmations":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Transaction Confirmations
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Understanding blockchain confirmations and finality.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Monad Network Speed
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-300">Block Time</h4>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">0.5s</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300">Finality</h4>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">1s</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 dark:text-purple-300">TPS</h4>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">10,000</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Confirmation States
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <div>
                      <strong>Pending:</strong> Transaction submitted to mempool
                    </div>
                  </li>
                  <li className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <strong>1 Confirmation:</strong> Included in latest block
                    </div>
                  </li>
                  <li className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <strong>Finalized:</strong> Transaction cannot be reversed
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "best-practices":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Security Best Practices
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Follow these guidelines to ensure secure usage of NadPay.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Wallet Security
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Never share your private keys or seed phrases</li>
                  <li>• Use hardware wallets for large amounts</li>
                  <li>• Keep wallet software updated</li>
                  <li>• Enable wallet lock/password protection</li>
                  <li>• Verify URLs before connecting wallet</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Transaction Safety
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Always verify you're on Monad Testnet (Chain ID: 10143)</li>
                  <li>• Double-check transaction details before confirming</li>
                  <li>• Start with small test transactions</li>
                  <li>• Wait for confirmations before considering payment final</li>
                  <li>• Keep transaction receipts and hashes</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Link Creation Best Practices
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Use clear, descriptive titles and descriptions</li>
                  <li>• Set appropriate limits to prevent abuse</li>
                  <li>• Test links before sharing with customers</li>
                  <li>• Monitor link activity regularly</li>
                  <li>• Deactivate unused or compromised links</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "audit":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Smart Contract Audit
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Security audit information for NadPay smart contract.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Audit Status
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300">
                  This is a testnet deployment for demonstration purposes. 
                  A full security audit will be conducted before mainnet deployment.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Security Measures Implemented
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• <strong>ReentrancyGuard:</strong> Prevents reentrancy attacks</li>
                  <li>• <strong>Ownable:</strong> Secure ownership management</li>
                  <li>• <strong>Input Validation:</strong> All inputs are validated</li>
                  <li>• <strong>SafeMath:</strong> Built-in overflow protection (Solidity 0.8+)</li>
                  <li>• <strong>Event Logging:</strong> All actions are logged for transparency</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Planned Audit Process
                </h3>
                <ol className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>1. <strong>Automated Testing:</strong> Comprehensive test suite coverage</li>
                  <li>2. <strong>Static Analysis:</strong> Code analysis tools (Slither, MythX)</li>
                  <li>3. <strong>Manual Review:</strong> Expert security researcher review</li>
                  <li>4. <strong>Formal Verification:</strong> Mathematical proof of correctness</li>
                  <li>5. <strong>Public Report:</strong> Transparent audit results publication</li>
                </ol>
              </div>
            </div>
          </div>
        );

      case "raffle-management":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Raffle Management
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                Manage your active raffles, monitor performance, and handle winner selection.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Dashboard Overview
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your dashboard provides a comprehensive view of all your raffles with real-time statistics.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 dark:text-purple-300">Active Raffles</h4>
                    <p className="text-purple-600 dark:text-purple-400 text-sm">Currently running raffles accepting tickets</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300">Total Revenue</h4>
                    <p className="text-blue-600 dark:text-blue-400 text-sm">MON earned from ticket sales across all raffles</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-300">Participants</h4>
                    <p className="text-green-600 dark:text-green-400 text-sm">Total unique participants across all raffles</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-800 dark:text-orange-300">Completed</h4>
                    <p className="text-orange-600 dark:text-orange-400 text-sm">Raffles that have ended with winners selected</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Raffle Actions
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">During Active Phase</h4>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• <strong>Monitor Sales:</strong> Track ticket sales in real-time</li>
                      <li>• <strong>View Participants:</strong> See who has purchased tickets and their chances</li>
                      <li>• <strong>Share Links:</strong> Promote your raffle across social channels</li>
                      <li>• <strong>Export Data:</strong> Download participant lists for marketing</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Ending Raffles</h4>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• <strong>Manual End:</strong> End raffle early if desired</li>
                      <li>• <strong>Automatic End:</strong> Raffles end automatically at expiration</li>
                      <li>• <strong>Winner Selection:</strong> Smart contract randomly selects winner</li>
                      <li>• <strong>Reward Distribution:</strong> Winners can claim rewards immediately</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Mobile Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  All raffle management features are fully optimized for mobile devices with responsive design.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mobile Features</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Touch-optimized controls</li>
                      <li>• Responsive participant tables</li>
                      <li>• Mobile-friendly action buttons</li>
                      <li>• Swipe navigation for large lists</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Actions</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• One-tap raffle ending</li>
                      <li>• Instant participant viewing</li>
                      <li>• Quick share functionality</li>
                      <li>• Fast CSV exports</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Best Practices
                </h3>
                <ul className="text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Monitor raffle performance regularly to optimize future campaigns</li>
                  <li>• Engage with participants through social media during active phase</li>
                  <li>• End raffles promptly when goals are met to maintain trust</li>
                  <li>• Keep detailed records of participants for future marketing</li>
                  <li>• Announce winners publicly to build credibility</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Content Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This section is being developed. Check back soon!
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Navbar showTicketsButton={false} />
      
      {/* Documentation Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Book className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              NadPay Documentation
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Complete guide to the NadPay ecosystem on Monad blockchain
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="w-full flex items-center justify-between p-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg"
          >
            <span className="font-medium text-gray-900 dark:text-white">Navigation</span>
            {mobileSidebarOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar */}
          <div className={`w-full lg:w-80 flex-shrink-0 ${mobileSidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4 lg:sticky lg:top-8">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <section.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                        <span className="font-medium text-sm sm:text-base">{section.title}</span>
                      </div>
                      {expandedSections.includes(section.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    {expandedSections.includes(section.id) && section.subsections && (
                      <div className="ml-6 sm:ml-8 mt-2 space-y-1">
                        {section.subsections.map((subsection) => (
                          <button
                            key={subsection.id}
                            onClick={() => {
                              setActiveSection(subsection.id);
                              setMobileSidebarOpen(false); // Close mobile sidebar on selection
                            }}
                            className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                              activeSection === subsection.id
                                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                            }`}
                          >
                            {subsection.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4 sm:p-6 lg:p-8"
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 