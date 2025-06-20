"use client";

import { useState } from "react";
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

  ChevronRight,
  ChevronDown,
  FileText,
  Settings,
  CreditCard,
  Users,
  Globe
} from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [expandedSections, setExpandedSections] = useState<string[]>(["getting-started"]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
      id: "creating-links",
      title: "Creating Payment Links",
      icon: Link2,
      subsections: [
        { id: "basic-link", title: "Basic Payment Link" },
        { id: "advanced-options", title: "Advanced Options" },
        { id: "image-upload", title: "Image Upload" }
      ]
    },
    {
      id: "smart-contracts",
      title: "Smart Contracts",
      icon: Code,
      subsections: [
        { id: "contract-overview", title: "Contract Overview" },
        { id: "functions", title: "Functions" },
        { id: "events", title: "Events" }
      ]
    },
    {
      id: "dashboard",
      title: "Dashboard",
      icon: Settings,
      subsections: [
        { id: "overview", title: "Overview" },
        { id: "analytics", title: "Analytics" },
        { id: "management", title: "Link Management" }
      ]
    },
    {
      id: "payment-process",
      title: "Payment Process",
      icon: CreditCard,
      subsections: [
        { id: "customer-flow", title: "Customer Flow" },
        { id: "transaction-flow", title: "Transaction Flow" },
        { id: "confirmations", title: "Confirmations" }
      ]
    },
    {
      id: "security",
      title: "Security",
      icon: Shield,
      subsections: [
        { id: "security-features", title: "Security Features" },
        { id: "best-practices", title: "Best Practices" },
        { id: "audit", title: "Smart Contract Audit" }
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
                Welcome to NadPay
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                The decentralized payment link platform built on Monad blockchain.
              </p>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">
                What is NadPay?
              </h3>
              <p className="text-primary-700 dark:text-primary-300">
                NadPay is a decentralized payment platform that allows you to create secure payment links 
                on the Monad blockchain. Accept payments in MON tokens with customizable limits, 
                automatic image compression, and real-time analytics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4 sm:p-6">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Lightning Fast
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Built on Monad's high-performance blockchain for instant transactions.
                </p>
              </div>
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4 sm:p-6">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Secure & Trustless
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Smart contract-based payments with no intermediaries or custody risks.
                </p>
              </div>
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Easy to Use
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Simple interface for creators and seamless experience for customers.
                </p>
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
                Understanding NadPay's smart contract architecture.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contract Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract Address</label>
                  <div className="flex items-center mt-1">
                    <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-2 rounded text-xs sm:text-sm break-all">
                      0x7d3B3A31D84Aa66CFDa807137556a0f27097770d
                    </code>
                    <button 
                      onClick={() => copyToClipboard("0x7d3B3A31D84Aa66CFDa807137556a0f27097770d")}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Network</label>
                  <p className="mt-1 text-gray-900 dark:text-white">Monad Testnet</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Compiler Version</label>
                  <p className="mt-1 text-gray-900 dark:text-white">Solidity 0.8.20</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">License</label>
                  <p className="mt-1 text-gray-900 dark:text-white">MIT</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Key Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Security</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ReentrancyGuard and Ownable patterns
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Gas Optimized</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Efficient storage and function calls
                      </p>
                    </div>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Users className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Multi-User</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Support for multiple creators
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Settings className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Configurable</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Flexible limits and pricing
                      </p>
                    </div>
                  </li>
                </ul>
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
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Book className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  NadPay Documentation
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base hidden sm:block">
                  Complete guide to using NadPay on Monad blockchain
                </p>
              </div>
            </div>
            <a
              href="/app"
              className="inline-flex items-center px-3 py-2 sm:px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to App</span>
              <span className="sm:hidden">Back</span>
            </a>
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