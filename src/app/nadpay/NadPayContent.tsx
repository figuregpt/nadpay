"use client";

import { Moon, Sun, Link2, ArrowLeft, Trophy, CreditCard, ArrowLeftRight, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Web3AppContent from "../app/Web3AppContent";

export default function NadPayContent() {
  const { isConnected, address } = useAccount();

  // Set document title
  useEffect(() => {
    document.title = 'NadPay - Payment Solutions on Monad';
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
        <Navbar 
          brand={{
            name: "NadPay",
            href: "/nadpay",
            logo: <CreditCard className="w-5 h-5 text-white" />
          }}
          ticketsLabel="My Payments"
          ticketsHref="/dashboard"
        />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Navbar 
        brand={{
          name: "NadPay",
          href: "/nadpay",
          logo: <CreditCard className="w-5 h-5 text-white" />
        }}
        ticketsLabel="My Payments"
        ticketsHref="/dashboard"
      />

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