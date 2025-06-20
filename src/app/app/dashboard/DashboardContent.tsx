"use client";

import { useEffect, useState } from "react";
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
  XCircle,
  Search,
  Download
} from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useCreatorPaymentLinks, useDeactivatePaymentLink, formatPaymentLink, formatPrice } from "@/hooks/useNadPayContract";

interface PaymentLinkData {
  linkId: string;
  _id: string;
  creator: string;
  title: string;
  description: string;
  coverImage: string;
  price: string;
  totalSales: bigint;
  maxPerWallet: bigint;
  salesCount: bigint;
  totalEarned: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: bigint;
  creatorAddress: string;
  purchases: unknown[];
  uniqueBuyersCount?: number;
}

export default function DashboardContent() {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create secure link ID using internal ID + creator address as seed
  const createSecureLinkId = (internalId: number, creatorAddress: string): string => {
    // Use creator address as seed to ensure consistency
    const addressSeed = parseInt(creatorAddress.slice(-8), 16); // Last 8 chars of address as number
    const combined = `${internalId}_${addressSeed}_nadpay`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${addressSeed}_${Math.abs(hash).toString(16).slice(0, 8)}`;
  };
  
  // Contract hooks
  const { data: creatorLinksData, isLoading: loadingLinks, refetch } = useCreatorPaymentLinks(address);
  const { 
    deactivatePaymentLink, 
    isConfirmed: deactivationConfirmed 
  } = useDeactivatePaymentLink();

    // Convert contract data to display format and sort by newest first
  const paymentLinks: PaymentLinkData[] = creatorLinksData ? creatorLinksData
    .map((link: unknown) => {
      try {
        const formatted = formatPaymentLink(link);
        console.log('Raw link data:', link);
        console.log('Formatted link data:', formatted);
        console.log('uniqueBuyersCount from link:', (link as { uniqueBuyersCount?: number }).uniqueBuyersCount);
        
        return {
          ...formatted,
          linkId: (link as { linkId: { toString(): string } }).linkId.toString(), // Use actual linkId from contract
          _id: (link as { linkId: { toString(): string } }).linkId.toString(),
          creatorAddress: formatted.creator,
          price: formatPrice(formatted.price),
          totalEarned: formatPrice(formatted.totalEarned),
          uniqueBuyersCount: (link as { uniqueBuyersCount?: number }).uniqueBuyersCount || 0, // Add this explicitly
          purchases: [], // Will be fetched separately if needed
          createdAt: formatted.createdAt ? new Date(Number(formatted.createdAt) * 1000).toISOString() : new Date().toISOString(),
          expiresAt: formatted.expiresAt || BigInt(0),
        };
    } catch (error) {
      console.error('Error formatting payment link:', error, link);
      // Return a default object to prevent crashes
      return {
        linkId: '0',
        _id: '0',
        creator: '',
        title: 'Error Loading Link',
        description: 'This link could not be loaded',
        coverImage: '',
        price: '0',
        totalSales: BigInt(0),
        maxPerWallet: BigInt(0),
        salesCount: BigInt(0),
        totalEarned: '0',
        isActive: false,
        createdAt: new Date().toISOString(),
        expiresAt: BigInt(0),
        creatorAddress: '',
        purchases: [],
      };
    }
  })
    .sort((a: PaymentLinkData, b: PaymentLinkData) => {
      // Sort by linkId descending (newest first)
      return parseInt(b.linkId) - parseInt(a.linkId);
    }) : [];

  // Refetch when deactivation is confirmed
  useEffect(() => {
    if (deactivationConfirmed) {
      refetch();
    }
  }, [deactivationConfirmed, refetch]);

  const copyLink = (linkId: string) => {
    if (!address) return;
    const secureId = createSecureLinkId(parseInt(linkId), address);
    const fullLink = `${window.location.origin}/pay/${secureId}`;
    navigator.clipboard.writeText(fullLink);
    alert('Payment link copied to clipboard!');
  };

  const isExpired = (link: PaymentLinkData) => {
    if (!link.expiresAt || Number(link.expiresAt) === 0) return false;
    return Date.now() > Number(link.expiresAt) * 1000;
  };

  const getLinkStatus = (link: PaymentLinkData) => {
    if (!link.isActive) return 'Inactive';
    if (isExpired(link)) return 'Expired';
    return 'Active';
  };

  const deactivateLink = async (linkId: string) => {
    if (!address) return;
    
    const confirmed = confirm('Are you sure you want to deactivate this payment link? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deactivatePaymentLink(parseInt(linkId));
    } catch (error) {
      console.error('Error deactivating payment link:', error);
      alert('Failed to deactivate payment link');
    }
  };

  const exportToCSV = () => {
    if (filteredPaymentLinks.length === 0) {
      alert('No payment links to export');
      return;
    }

    // CSV headers
    const headers = ['Address', 'Amount', 'Price', 'Title', 'Description', 'Status', 'Created', 'Expires', 'Sales', 'Buyers', 'Earned'];
    
    // CSV data
    const csvData = filteredPaymentLinks.map((link: PaymentLinkData) => [
      link.creatorAddress || address || '',
      `${link.salesCount}/${link.totalSales > 0 ? link.totalSales : '∞'}`,
      `${link.price} MON`,
      `"${link.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${link.description.replace(/"/g, '""')}"`, // Escape quotes
      getLinkStatus(link),
      new Date(link.createdAt).toLocaleDateString(),
      link.expiresAt && Number(link.expiresAt) > 0
        ? new Date(Number(link.expiresAt) * 1000).toLocaleString()
        : 'Never',
      link.salesCount.toString(),
      (link.uniqueBuyersCount || 0).toString(),
      `${parseFloat(link.totalEarned).toFixed(4)} MON`
    ]);

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nadpay-payment-links-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSingleLinkToCSV = (link: PaymentLinkData) => {
    // CSV headers
    const headers = ['Address', 'Amount', 'Price', 'Title', 'Description', 'Status', 'Created', 'Expires', 'Sales', 'Buyers', 'Earned'];
    
    // Single link data
    const csvData = [
      link.creatorAddress || address || '',
      `${link.salesCount}/${link.totalSales > 0 ? link.totalSales : '∞'}`,
      `${link.price} MON`,
      `"${link.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${link.description.replace(/"/g, '""')}"`, // Escape quotes
      getLinkStatus(link),
      new Date(link.createdAt).toLocaleDateString(),
      link.expiresAt && Number(link.expiresAt) > 0
        ? new Date(Number(link.expiresAt) * 1000).toLocaleString()
        : 'Never',
      link.salesCount.toString(),
      (link.uniqueBuyersCount || 0).toString(),
      `${parseFloat(link.totalEarned).toFixed(4)} MON`
    ];

    // Combine headers and data
    const csvContent = [headers, csvData]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const linkElement = document.createElement('a');
    const url = URL.createObjectURL(blob);
    linkElement.setAttribute('href', url);
    
    // Use link title for filename (sanitized)
    const sanitizedTitle = link.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    linkElement.setAttribute('download', `nadpay-${sanitizedTitle}-${link.linkId}.csv`);
    linkElement.style.visibility = 'hidden';
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  // Filter payment links based on search query
  const filteredPaymentLinks = paymentLinks.filter((link: PaymentLinkData) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      link.title.toLowerCase().includes(query) ||
      link.description.toLowerCase().includes(query) ||
      link.linkId.toString().includes(query) ||
      link.price.toString().includes(query)
    );
  });

  const getTotalStats = () => {
    const totalEarned = paymentLinks.reduce((sum: number, link: PaymentLinkData) => {
      const earned = typeof link.totalEarned === 'string' ? parseFloat(link.totalEarned) : 0;
      return sum + (isNaN(earned) ? 0 : earned);
    }, 0);
    const totalSales = paymentLinks.reduce((sum: number, link: PaymentLinkData) => {
      const sales = typeof link.salesCount === 'bigint' ? Number(link.salesCount) : 
                   typeof link.salesCount === 'number' ? link.salesCount : 0;
      return sum + sales;
    }, 0);
    const totalBuyers = paymentLinks.reduce((sum: number, link: PaymentLinkData) => {
      return sum + (link.uniqueBuyersCount || 0);
    }, 0);

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

  if (loadingLinks) {
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
      {/* NadPay Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Link2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  NadPay Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your payment links and track earnings on Monad
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="/app"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
              >
                Create New Link
              </a>
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
                  {paymentLinks.filter((link: PaymentLinkData) => getLinkStatus(link) === 'Active').length}
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Payment Links
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage and track all your payment links
                </p>
              </div>
              {paymentLinks.length > 0 && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={exportToCSV}
                    className="inline-flex items-center px-3 py-2 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export CSV
                  </button>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search links..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
            {searchQuery && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Found {filteredPaymentLinks.length} of {paymentLinks.length} links
              </div>
            )}
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
          ) : filteredPaymentLinks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No links found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                No payment links match your search &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPaymentLinks.map((link: PaymentLinkData, index: number) => (
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
                          getLinkStatus(link) === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : getLinkStatus(link) === 'Expired'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {getLinkStatus(link)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {link.description}
                      </p>
                      
                      {/* Stats Row */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
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
                            {link.uniqueBuyersCount || 0}
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
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Expires</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {link.expiresAt && Number(link.expiresAt) > 0
                              ? new Date(Number(link.expiresAt) * 1000).toLocaleString()
                              : 'Never'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => copyLink(link.linkId)}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </button>
                        <a
                          href={`/pay/${createSecureLinkId(parseInt(link.linkId), address || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </a>
                        <button
                          onClick={() => exportSingleLinkToCSV(link)}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </button>
                        {getLinkStatus(link) === 'Active' && (
                          <button
                            onClick={() => deactivateLink(link.linkId)}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Deactivate
                          </button>
                        )}
                      </div>
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