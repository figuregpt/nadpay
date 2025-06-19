"use client";

import { Moon, Sun, Link2, ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";

// Web3 bileşenini dinamik olarak yükle (SSR'yi atla)
const Web3AppContent = dynamic(() => import("./Web3AppContent"), {
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

export default function AppPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-dark-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">NadPay</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Create payment</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Choose how you want to get paid on Monad
            </p>
          </motion.div>

          <Web3AppContent />
        </div>
      </div>
    </div>
  );
} 