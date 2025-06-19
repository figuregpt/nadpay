"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Link2, 
  ArrowLeft, 
  ShoppingCart, 
  Users, 
  Copy,
  ExternalLink,
  DollarSign,
  XCircle
} from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";

interface PaymentLinkData {
  _id: string;
  linkId: string;
  creatorAddress: string;
  title: string;
  description: string;
  coverImage: string;
  price: string;
  totalSales: number;
  maxPerWallet: number;
  salesCount: number;
  totalEarned: string;
  isActive: boolean;
  purchases: Array<{
    buyerAddress: string;
    amount: number;
    txHash: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export default function DashboardContent() {
  const { address, isConnected } = useAccount();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPaymentLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payment-links?creator=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentLinks(data.paymentLinks);
      } else {
        console.error(data.error || 'Failed to fetch payment links');
      }
    } catch {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchPaymentLinks();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const copyLink = (linkId: string) => {
    const fullLink = `${window.location.origin}/pay/${linkId}`;
    navigator.clipboard.writeText(fullLink);
    alert('Payment link copied to clipboard!');
  };

  const deactivateLink = async (linkId: string) => {
    if (!address) return;
    
    const confirmed = confirm('Are you sure you want to deactivate this payment link? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/payment-links/${linkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: false,
          creatorAddress: address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Payment link deactivated successfully');
        fetchPaymentLinks(); // Refresh the list
      } else {
        alert(data.error || 'Failed to deactivate payment link');
      }
    } catch (error) {
      console.error('Error deactivating payment link:', error);
      alert('Failed to deactivate payment link');
    }
  };

  const getTotalStats = () => {
    const totalEarned = paymentLinks.reduce((sum, link) => sum + parseFloat(link.totalEarned), 0);
    const totalSales = paymentLinks.reduce((sum, link) => sum + link.salesCount, 0);
    const totalBuyers = new Set(
      paymentLinks.flatMap(link => link.purchases.map(p => p.buyerAddress))
    ).size;

    return { totalEarned, totalSales, totalBuyers };
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your wallet to view your payment links and earnings dashboard.
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
          <div className="mt-6">
            <a 
              href="/app"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your payment links and track earnings
              </p>
            </div>
            <a
              href="/app"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-dark-700"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalEarned.toFixed(4)} MON
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-dark-700"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalSales}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-dark-700"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Buyers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalBuyers}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-dark-700"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <Link2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Links</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {paymentLinks.filter(link => link.isActive).length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Payment Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700"
        >
          <div className="p-6 border-b border-gray-200 dark:border-dark-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Payment Links
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and track all your payment links
            </p>
          </div>

          {paymentLinks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No payment links yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first payment link to start earning on Monad
              </p>
              <a
                href="/app"
                className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Create Payment Link
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paymentLinks.map((link, index) => (
                <motion.div
                  key={link._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {link.title}
                        </h3>
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                          link.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {link.description}
                      </p>
                      
                      {/* Stats Row */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {link.price} MON
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Sold</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {link.totalSales > 0 ? `${link.salesCount}/${link.totalSales}` : link.salesCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Buyers</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Set(link.purchases.map(p => p.buyerAddress)).size}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Earned</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {parseFloat(link.totalEarned).toFixed(4)} MON
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(link.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Recent Purchases */}
                      {link.purchases.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Recent Buyers
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {link.purchases.slice(-3).map((purchase, idx) => (
                              <div 
                                key={idx}
                                className="text-xs bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded"
                              >
                                {purchase.buyerAddress.slice(0, 6)}...{purchase.buyerAddress.slice(-4)} 
                                ({purchase.amount} items)
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ml-6 flex flex-col space-y-2">
                      <button
                        onClick={() => copyLink(link.linkId)}
                        className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </button>
                      <a
                        href={`/pay/${link.linkId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 text-sm bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </a>
                      {link.isActive && (
                        <button
                          onClick={() => deactivateLink(link.linkId)}
                          className="inline-flex items-center px-3 py-2 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 