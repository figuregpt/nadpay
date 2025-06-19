"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, Link2, ArrowLeft, ShoppingCart, Users, Clock } from "lucide-react";
import { useAccount, useSendTransaction, useBalance } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { parseEther } from "viem";

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

export default function PaymentContent() {
  const params = useParams();
  const linkId = params.linkId as string;
  
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({
    address: address,
    chainId: 10143, // Monad Testnet
  });
  const { sendTransaction } = useSendTransaction();
  
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchPaymentLink();
  }, [linkId]);

  const fetchPaymentLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pay/${linkId}`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentLink(data.paymentLink);
      } else {
        setError(data.error || 'Payment link not found');
      }
    } catch (err) {
      setError('Failed to load payment link');
    } finally {
      setLoading(false);
    }
  };

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
      setPurchasing(true);
      
      const totalPrice = parseFloat(paymentLink.price) * quantity;
      const priceInWei = parseEther(totalPrice.toString());

      // Check user's balance
      if (balance && parseFloat(balance.formatted) < totalPrice) {
        alert('Insufficient balance');
        return;
      }

      // Send transaction
      sendTransaction({
        to: paymentLink.creatorAddress as `0x${string}`,
        value: priceInWei,
      }, {
        onSuccess: async (txHash) => {
          // Record purchase in database
          await fetch(`/api/pay/${linkId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              buyerAddress: address,
              amount: quantity,
              txHash,
            }),
          });
          
          alert('Purchase successful!');
          fetchPaymentLink(); // Refresh data
        },
        onError: (error) => {
          console.error('Transaction failed:', error);
          alert('Transaction failed. Please try again.');
        },
      });

    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const getUserPurchaseCount = () => {
    if (!paymentLink || !address) return 0;
    return paymentLink.purchases
      .filter(p => p.buyerAddress.toLowerCase() === address.toLowerCase())
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const canPurchase = () => {
    if (!paymentLink || !isConnected) return false;
    
    // Check total sales limit
    if (paymentLink.totalSales > 0 && paymentLink.salesCount >= paymentLink.totalSales) {
      return false;
    }
    
    // Check wallet limit
    if (paymentLink.maxPerWallet > 0) {
      const userCount = getUserPurchaseCount();
      return userCount + quantity <= paymentLink.maxPerWallet;
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

  if (error || !paymentLink) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden"
        >
          {/* Cover Image */}
          {paymentLink.coverImage && (
            <div className="w-full h-64 bg-gray-100 dark:bg-dark-700">
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
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {paymentLink.description}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <ShoppingCart className="w-4 h-4 text-gray-500 mr-1" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sold</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {paymentLink.totalSales > 0 ? `${paymentLink.salesCount}/${paymentLink.totalSales}` : paymentLink.salesCount}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 text-gray-500 mr-1" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Buyers</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Set(paymentLink.purchases.map(p => p.buyerAddress)).size}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="w-4 h-4 text-gray-500 mr-1" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Earned</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {parseFloat(paymentLink.totalEarned).toFixed(4)} MON
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {paymentLink.price} MON
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  per item
                </span>
              </div>
            </div>

            {!isConnected ? (
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <button
                    onClick={show}
                    className="w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg flex items-center justify-center"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet to Purchase
                  </button>
                )}
              </ConnectKitButton.Custom>
            ) : chain?.id !== 10143 ? (
              <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                <p className="text-primary-800 dark:text-primary-200 font-medium">
                  Please switch to Monad Testnet to make a purchase
                </p>
              </div>
            ) : !canPurchase() ? (
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">
                  {paymentLink.totalSales > 0 && paymentLink.salesCount >= paymentLink.totalSales
                    ? "Sales limit reached"
                    : "Purchase limit reached for your wallet"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[2ch] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        const maxAllowed = paymentLink.maxPerWallet > 0 
                          ? Math.min(paymentLink.maxPerWallet - getUserPurchaseCount(), 10)
                          : 10;
                        setQuantity(Math.min(maxAllowed, quantity + 1));
                      }}
                      className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total Price */}
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">
                    {(parseFloat(paymentLink.price) * quantity).toFixed(4)} MON
                  </span>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {purchasing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    `Purchase ${quantity} item${quantity > 1 ? 's' : ''}`
                  )}
                </button>

                {/* Wallet Limits Info */}
                {paymentLink.maxPerWallet > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    You have purchased {getUserPurchaseCount()}/{paymentLink.maxPerWallet} items with this wallet
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <a 
            href="/app"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Create your own payment link
          </a>
        </div>
      </div>
    </div>
  );
} 