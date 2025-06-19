"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, Link2, ArrowLeft, ShoppingCart, Users, Clock } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { usePaymentLink, usePurchase, useUserPurchaseCount, formatPaymentLink, formatPrice } from "@/hooks/useNadPayContract";

export default function PaymentContent() {
  const params = useParams();
  const linkId = params.linkId as string;
  
  // Decode secure link ID to get internal ID
  const decodeSecureLinkId = (secureId: string): number | null => {
    // If it's already a number, return it (backward compatibility)
    if (/^\d+$/.test(secureId)) {
      return parseInt(secureId);
    }
    
    // If it's seed_hash format, we need to brute force check
    const parts = secureId.split('_');
    if (parts.length === 2) {
      const seed = parseInt(parts[0]);
      const targetHash = parts[1];
      
      // Check recent internal IDs (last 1000 should be enough)
      for (let i = 0; i < 1000; i++) {
        const combined = `${i}_${seed}_nadpay`;
        let hash = 0;
        for (let j = 0; j < combined.length; j++) {
          const char = combined.charCodeAt(j);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        const generatedHash = Math.abs(hash).toString(16).slice(0, 8);
        if (generatedHash === targetHash) {
          return i;
        }
      }
    }
    
    return null;
  };
  
  const internalLinkId = decodeSecureLinkId(linkId);
  
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({
    address: address,
    chainId: 10143, // Monad Testnet
  });
  
  // Contract hooks
  const { data: contractLink, isLoading: loadingLink, error: contractError } = usePaymentLink(internalLinkId || -1);
  const { data: userPurchaseCount } = useUserPurchaseCount(internalLinkId || -1, address);
  const { purchase, isPending: purchasing, isConfirming, isConfirmed, error: purchaseError } = usePurchase();
  
  const [quantity, setQuantity] = useState(1);

  // Convert contract data to display format
  const paymentLink = contractLink ? {
    ...formatPaymentLink(contractLink),
    linkId: linkId,
    _id: linkId,
    creatorAddress: contractLink.creator,
    price: formatPrice(contractLink.price),
    totalEarned: formatPrice(contractLink.totalEarned),
    purchases: [],
    createdAt: contractLink.createdAt ? new Date(Number(contractLink.createdAt) * 1000).toISOString() : new Date().toISOString(),
  } : null;

  const loading = loadingLink;
  const error = contractError?.message || null;

  // Handle successful purchase
  useEffect(() => {
    if (isConfirmed) {
      alert('Purchase successful!');
    }
  }, [isConfirmed]);

  const handlePurchase = async () => {
    if (!isConnected || !paymentLink || !address) {
      alert('Please connect your wallet');
      return;
    }

    if (chain?.id !== 10143) {
      alert('Please switch to Monad Testnet');
      return;
    }

    try {
      const totalPrice = parseFloat(paymentLink.price) * quantity;
      
      // Check user's balance
      if (balance && parseFloat(balance.formatted) < totalPrice) {
        alert('Insufficient balance');
        return;
      }

      await purchase(internalLinkId || 0, quantity, totalPrice.toString());
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const getUserPurchaseCount = () => {
    return Number(userPurchaseCount || 0);
  };

  const canPurchase = () => {
    if (!paymentLink || !isConnected) return false;
    
    // Check if link is active
    if (!paymentLink.isActive) return false;
    
    // Check total sales limit
    if (Number(paymentLink.totalSales) > 0 && Number(paymentLink.salesCount) >= Number(paymentLink.totalSales)) {
      return false;
    }
    
    // Check wallet limit
    if (Number(paymentLink.maxPerWallet) > 0) {
      const userCount = getUserPurchaseCount();
      return userCount + quantity <= Number(paymentLink.maxPerWallet);
    }
    
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading payment link...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentLink || internalLinkId === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Link Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'This payment link does not exist or has been deactivated.'}
          </p>
          <a 
            href="/app"
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* NadPay Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">NadPay</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="/docs"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
              >
                Docs
              </a>
              <a 
                href="/app"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
              >
                Create Your Link
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden"
          >
            {/* Cover Image */}
            {paymentLink.coverImage && (
              <div className="aspect-video w-full bg-gray-100 dark:bg-dark-700">
                <img
                  src={paymentLink.coverImage}
                  alt={paymentLink.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {paymentLink.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {paymentLink.description}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <ShoppingCart className="w-5 h-5 text-primary-500 mr-1" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sold</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {Number(paymentLink.totalSales) > 0 
                      ? `${paymentLink.salesCount}/${paymentLink.totalSales}`
                      : paymentLink.salesCount
                    }
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-purple-500 mr-1" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Buyers</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    0
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-green-500 mr-1" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {new Date(paymentLink.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price per item</p>
                <p className="text-3xl font-bold text-primary-500">
                  {paymentLink.price} MON
                </p>
              </div>

              {!isConnected ? (
                /* Connect Wallet */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Connect to Monad Testnet to make a purchase
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
              ) : chain?.id !== 10143 ? (
                /* Wrong Network */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Wrong Network
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Please switch to Monad Testnet to continue
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Current: {chain?.name} • Required: Monad Testnet
                  </p>
                </div>
              ) : !paymentLink.isActive ? (
                /* Inactive Link */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Link2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Payment Link Inactive
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    This payment link has been deactivated by the creator
                  </p>
                </div>
              ) : (
                /* Purchase Form */
                <div>
                  {/* Quantity Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Limits Info */}
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {Number(paymentLink.maxPerWallet) > 0 && (
                        <p>
                                                       You can purchase max {Number(paymentLink.maxPerWallet) - getUserPurchaseCount()} more items
                           (You&apos;ve purchased {getUserPurchaseCount()}/{paymentLink.maxPerWallet})
                        </p>
                      )}
                      {Number(paymentLink.totalSales) > 0 && (
                        <p>
                          {Number(paymentLink.totalSales) - Number(paymentLink.salesCount)} items remaining
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">Total Price:</span>
                      <span className="text-2xl font-bold text-primary-500">
                        {(parseFloat(paymentLink.price) * quantity).toFixed(4)} MON
                      </span>
                    </div>
                    {balance && (
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Your Balance:</span>
                        <span className="text-gray-900 dark:text-white">
                          {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={handlePurchase}
                    disabled={!canPurchase() || purchasing || isConfirming}
                    className="w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {purchasing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : isConfirming ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Confirming...</span>
                      </div>
                    ) : !canPurchase() ? (
                      'Cannot Purchase'
                    ) : (
                      `Purchase for ${(parseFloat(paymentLink.price) * quantity).toFixed(4)} MON`
                    )}
                  </button>

                  {purchaseError && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-600 dark:text-red-400 text-sm">
                        Error: {purchaseError.message}
                      </p>
                    </div>
                  )}
                </div>
              )}

                            {/* Back to Home */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
                <a
                  href="/app"
                  className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Home
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 