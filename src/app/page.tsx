"use client";


import { Moon, Sun, ArrowRight, Link2 } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-dark-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">NadPay</span>
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
            <a
              href="/app"
              className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Launch App
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
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-display-lg font-inter text-gray-900 dark:text-white mb-4">
              How it Works
            </h2>
            <p className="text-body-xl font-inter text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Create and share payment links in just a few simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-heading-xl font-inter text-gray-900 dark:text-white mb-4">Connect Wallet</h3>
              <p className="text-body-md font-inter text-gray-600 dark:text-gray-300">
                Connect your wallet to Monad Testnet and start creating payment links instantly.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-heading-xl font-inter text-gray-900 dark:text-white mb-4">Create Link</h3>
              <p className="text-body-md font-inter text-gray-600 dark:text-gray-300">
                Fill in your payment details, set limits, and generate your unique payment link.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-heading-xl font-inter text-gray-900 dark:text-white mb-4">Share & Earn</h3>
              <p className="text-body-md font-inter text-gray-600 dark:text-gray-300">
                Share your link anywhere and start receiving payments directly to your wallet.
              </p>
            </motion.div>
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
              © 2024 NadPay. Built for the Monad ecosystem.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
