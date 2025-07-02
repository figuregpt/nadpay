"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, Link2, ArrowLeft, ShoppingCart, Users, Clock, Sun, Moon } from "lucide-react";
import { useAccount, useBalance, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther } from "viem";
import { ConnectKitButton } from "connectkit";
import { useTheme } from "next-themes";
import { 
  usePaymentLinkV2, 
  usePurchaseV2, 
  useUserPurchaseCountV2, 
  formatPaymentLinkV2, 
  formatPriceV2,
  PaymentLinkV2 
} from "@/hooks/useNadPayV2Contract";
import { getKnownToken } from "@/lib/knownAssets";
import { usePointsTracker } from "@/hooks/usePointsTracker";

export default function PaymentContent() {
  const params = useParams();
  const linkId = params.linkId as string;
  const { theme, setTheme } = useTheme();
  
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
      
      // Check recent internal IDs (last 10000 should be enough)
      for (let i = 0; i < 10000; i++) {
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
  
  console.log('🔍 PaymentContent Debug:', {
    linkId,
    internalLinkId,
    decodedSuccessfully: internalLinkId !== null
  });
  
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: balance, refetch: refetchBalance } = useBalance({
    address: address,
    chainId: 10143, // Monad Testnet
  });
  
  // Points tracking
  const { trackNadPayPurchase } = usePointsTracker();
  
  // Contract hooks
  const { data: contractLink, isLoading: loadingLink, error: contractError, refetch: refetchLink } = usePaymentLinkV2(internalLinkId || -1);
  const { data: userPurchaseCount, refetch: refetchUserCount } = useUserPurchaseCountV2(internalLinkId || -1, address);
  const { purchase, isPending: purchasing, isConfirming, isConfirmed, error: purchaseError, hash: purchaseHash } = usePurchaseV2();
  
  // Get token balance if payment is not native MON
  const { data: tokenBalance, refetch: refetchTokenBalance } = useBalance({
    address: address,
    token: contractLink?.paymentToken !== "0x0000000000000000000000000000000000000000" ? contractLink?.paymentToken as `0x${string}` : undefined,
    chainId: 10143,
    query: {
      enabled: !!contractLink?.paymentToken && contractLink.paymentToken !== "0x0000000000000000000000000000000000000000"
    }
  });

  console.log('📊 Contract Data:', {
    internalLinkId,
    contractLink: contractLink ? 'loaded' : 'null',
    loadingLink,
    contractError: contractError?.message || 'none'
  });
  
  const [quantity, setQuantity] = useState(1);
  const [isApproving, setIsApproving] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // ERC20 approval hooks
  const { writeContract: approveToken, data: approvalHash, isPending: isApprovalPending } = useWriteContract();
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Check current allowance
  const { data: currentAllowance } = useReadContract({
    address: contractLink?.paymentToken as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" }
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'allowance',
    args: address && contractLink?.paymentToken !== "0x0000000000000000000000000000000000000000" 
              ? [address, "0x091f3ae2E54584BE7195E2A8C5eD3976d0851905" as `0x${string}`] 
      : undefined,
    query: {
      enabled: !!address && !!contractLink?.paymentToken && contractLink.paymentToken !== "0x0000000000000000000000000000000000000000"
    }
  });

  // Convert contract data to display format
  const paymentLink = contractLink ? {
    ...formatPaymentLinkV2(contractLink),
    linkId: linkId,
    _id: linkId,
    creatorAddress: contractLink.creator,
    price: formatPriceV2(contractLink.price),
    totalEarned: formatPriceV2(contractLink.totalEarned),
    paymentTokenSymbol: contractLink.paymentToken === "0x0000000000000000000000000000000000000000" ? "MON" : getKnownToken(contractLink.paymentToken)?.symbol || "TOKEN",
    purchases: [],
    createdAt: contractLink.createdAt ? new Date(Number(contractLink.createdAt) * 1000).toISOString() : new Date().toISOString(),
  } : null;

  const loading = loadingLink;
  const error = contractError?.message || null;

  // Handle successful purchase
  useEffect(() => {
    if (isConfirmed && purchaseHash && paymentLink) {
      setPurchaseSuccess(true);
      
      // Track points for buyer
      const totalAmount = (parseFloat(paymentLink.price) * quantity).toString();
      console.log('🎯 Tracking NadPay purchase points:', {
        buyer: address,
        amount: totalAmount,
        linkId: linkId,
        txHash: purchaseHash
      });
      
      trackNadPayPurchase(purchaseHash, totalAmount, linkId).catch(error => {
        console.error('❌ Failed to track buyer points:', error);
      });
      
      // NadPay sellers don't get points (removed by user request)
      
      // Refetch data to update UI
      refetchLink();
      refetchUserCount();
      refetchBalance();
      refetchTokenBalance();
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setPurchaseSuccess(false);
      }, 5000);
    }
  }, [isConfirmed, purchaseHash, paymentLink, quantity, address, linkId, trackNadPayPurchase, refetchLink, refetchUserCount, refetchBalance, refetchTokenBalance]);

  // Handle successful approval - automatically proceed to purchase
  useEffect(() => {
    if (isApprovalConfirmed && isApproving) {
      setIsApproving(false);
      // Automatically proceed to purchase after approval
      setTimeout(() => {
        handlePurchaseAfterApproval();
      }, 1000);
    }
  }, [isApprovalConfirmed, isApproving]);

  const handleApproval = async () => {
    if (!contractLink || !address) return;

    try {
      setIsApproving(true);
      const totalPrice = parseFloat(paymentLink?.price || "0") * quantity;
      const amountToApprove = parseEther(totalPrice.toString());

      await approveToken({
        address: contractLink.paymentToken as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" }
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function"
          }
        ],
        functionName: 'approve',
        args: ["0x091f3ae2E54584BE7195E2A8C5eD3976d0851905" as `0x${string}`, amountToApprove],
      });
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Token approval failed. Please try again.');
      setIsApproving(false);
    }
  };

  const needsApproval = () => {
    if (!contractLink || !paymentLink || contractLink.paymentToken === "0x0000000000000000000000000000000000000000") {
      return false; // Native token doesn't need approval
    }
    
    if (!currentAllowance) return true;
    
    const totalPrice = parseFloat(paymentLink.price) * quantity;
    const requiredAmount = parseEther(totalPrice.toString());
    
    return BigInt(currentAllowance.toString()) < requiredAmount;
  };

  const handlePurchaseAfterApproval = async () => {
    if (!isConnected || !paymentLink || !address || !contractLink) {
      return;
    }

    if (chain?.id !== 10143) {
      return;
    }

    try {
      const totalPrice = parseFloat(paymentLink.price) * quantity;
      const isNativePayment = contractLink.paymentToken === "0x0000000000000000000000000000000000000000";
      
      // Check user's balance
      if (isNativePayment) {
        // Check MON balance
        if (balance && parseFloat(balance.formatted) < totalPrice) {
          return;
        }
      } else {
        // Check token balance
        if (tokenBalance && parseFloat(tokenBalance.formatted) < totalPrice) {
          return;
        }
      }

      await purchase(internalLinkId || 0, quantity, totalPrice.toString(), isNativePayment);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const handleSmartPurchase = async () => {
    if (!isConnected || !paymentLink || !address || !contractLink) {
      alert('Please connect your wallet');
      return;
    }

    if (chain?.id !== 10143) {
      alert('Please switch to Monad Testnet');
      return;
    }

    const totalPrice = parseFloat(paymentLink.price) * quantity;
    const isNativePayment = contractLink.paymentToken === "0x0000000000000000000000000000000000000000";
    
    // Check user's balance first
    if (isNativePayment) {
      if (balance && parseFloat(balance.formatted) < totalPrice) {
        alert('Insufficient MON balance');
        return;
      }
    } else {
      if (tokenBalance && parseFloat(tokenBalance.formatted) < totalPrice) {
        alert(`Insufficient ${paymentLink.paymentTokenSymbol} balance`);
        return;
      }
    }

    try {
      // If approval is needed, do approval first
      if (needsApproval()) {
        setIsApproving(true);
        const amountToApprove = parseEther(totalPrice.toString());

        await approveToken({
          address: contractLink.paymentToken as `0x${string}`,
          abi: [
            {
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" }
              ],
              name: "approve",
              outputs: [{ name: "", type: "bool" }],
              stateMutability: "nonpayable",
              type: "function"
            }
          ],
          functionName: 'approve',
          args: ["0x091f3ae2E54584BE7195E2A8C5eD3976d0851905" as `0x${string}`, amountToApprove],
        });
        // Purchase will happen automatically after approval in useEffect
      } else {
        // Direct purchase if no approval needed
        await purchase(internalLinkId || 0, quantity, totalPrice.toString(), isNativePayment);
      }
    } catch (error) {
      console.error('Smart purchase failed:', error);
      alert('Transaction failed. Please try again.');
      setIsApproving(false);
    }
  };

  const handlePurchase = async () => {
    if (!isConnected || !paymentLink || !address || !contractLink) {
      alert('Please connect your wallet');
      return;
    }

    if (chain?.id !== 10143) {
      alert('Please switch to Monad Testnet');
      return;
    }

    try {
      const totalPrice = parseFloat(paymentLink.price) * quantity;
      const isNativePayment = contractLink.paymentToken === "0x0000000000000000000000000000000000000000";
      
      // Check user's balance
      if (isNativePayment) {
        // Check MON balance
        if (balance && parseFloat(balance.formatted) < totalPrice) {
          alert('Insufficient MON balance');
          return;
        }
      } else {
        // Check token balance
        if (tokenBalance && parseFloat(tokenBalance.formatted) < totalPrice) {
          alert(`Insufficient ${paymentLink.paymentTokenSymbol} balance`);
          return;
        }
      }

      await purchase(internalLinkId || 0, quantity, totalPrice.toString(), isNativePayment);
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
            <a 
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">NadPay</h1>
              </div>
            </a>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-2">
                <a 
                  href="/nadswap"
                  className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  NadSwap
                </a>
                <a 
                  href="/rafflehouse"
                  className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  RaffleHouse
                </a>
              </div>
              
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="inline-flex items-center p-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <a 
                href="/nadpay"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Create Your Link</span>
                <span className="sm:hidden">Create</span>
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
            {/* Cover Image - Removed in ultra-secure contract */}
            {/* No cover image available in ultra-secure version */}

            <div className="p-8">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {paymentLink.title}
                </h1>
                {/* Description removed in ultra-secure contract */}
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Payment Link #{paymentLink.linkId}
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
                  {paymentLink.price} {paymentLink.paymentTokenSymbol}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Current: {chain?.name} • Required: Monad Testnet
                  </p>
                  <button
                    onClick={() => switchChain({ chainId: 10143 })}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold"
                  >
                    Switch to Monad Testnet
                  </button>
                </div>
              ) : !paymentLink.isActive ? (
                /* Inactive Link - Check if sold out or deactivated */
                <div className="text-center py-8">
                  {/* Check if sold out */}
                  {Number(paymentLink.totalSales) > 0 && Number(paymentLink.salesCount) >= Number(paymentLink.totalSales) ? (
                    <>
                      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingCart className="w-8 h-8 text-yellow-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Sold Out
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        All items have been sold ({paymentLink.salesCount}/{paymentLink.totalSales})
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Link2 className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Payment Link Inactive
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        This payment link has been deactivated by the creator
                      </p>
                    </>
                  )}
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
                        {(parseFloat(paymentLink.price) * quantity).toFixed(4).replace(/\.?0+$/, '')} {paymentLink.paymentTokenSymbol}
                      </span>
                    </div>
                    {/* Show relevant balance based on payment token */}
                    {contractLink?.paymentToken === "0x0000000000000000000000000000000000000000" ? (
                      // Show MON balance for native payments
                      balance && (
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Your Balance:</span>
                          <span className="text-gray-900 dark:text-white">
                            {parseFloat(balance.formatted).toFixed(4).replace(/\.?0+$/, '')} {balance.symbol}
                          </span>
                        </div>
                      )
                    ) : (
                      // Show token balance for token payments
                      tokenBalance && (
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Your Balance:</span>
                          <span className="text-gray-900 dark:text-white">
                            {parseFloat(tokenBalance.formatted).toFixed(4).replace(/\.?0+$/, '')} {tokenBalance.symbol}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  {/* Smart Purchase Button */}
                  <button
                    onClick={handleSmartPurchase}
                    disabled={!canPurchase() || purchasing || isConfirming || isApprovalPending || isApprovalConfirming || isApproving}
                    className="w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApprovalPending || isApprovalConfirming || isApproving ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Approving {paymentLink.paymentTokenSymbol}...</span>
                      </div>
                    ) : purchasing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Purchase...</span>
                      </div>
                    ) : isConfirming ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Confirming...</span>
                      </div>
                    ) : !canPurchase() ? (
                      'Cannot Purchase'
                    ) : (
                      `Purchase for ${(parseFloat(paymentLink.price) * quantity).toFixed(4).replace(/\.?0+$/, '')} ${paymentLink.paymentTokenSymbol}`
                    )}
                  </button>

                  {/* Success Message */}
                  {purchaseSuccess && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-green-700 dark:text-green-300 font-medium">
                          🎉 Payment Successful! Your purchase has been confirmed.
                        </p>
                      </div>
                    </div>
                  )}

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