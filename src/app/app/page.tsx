"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, ArrowLeftRight, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AppRedirectPage() {
  const router = useRouter();

  // Auto redirect to nadpay after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/nadpay');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We've separated our services. Please choose where you'd like to go:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.a
              href="/nadpay"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl hover:border-primary-500 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                NadPay
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Create payment links and subscriptions
              </p>
            </motion.a>

            <motion.a
              href="/nadswap"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl hover:border-blue-500 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                NadSwap
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Trade NFTs directly with other users
              </p>
            </motion.a>

            <motion.a
              href="/rafflehouse"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl hover:border-purple-500 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                RaffleHouse
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Join exciting raffles and win rewards
              </p>
            </motion.a>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Redirecting to NadPay in 3 seconds...</p>
            <p className="mt-2">
              <a href="/" className="text-primary-500 hover:text-primary-600 transition-colors">
                ← Back to Home
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 