"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, X, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount, useSwitchChain, usePublicClient, useWalletClient } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useNadRaffleV4FastContract, NADRAFFLE_V4_FAST_CONTRACT } from "@/hooks/useNadRaffleV4FastContract";
import { createPredictableSecureRaffleId } from "@/lib/linkUtils";
import { AssetSelector, SelectedAsset } from "@/components/AssetSelector";
import { KnownToken, KnownNFT } from "@/lib/knownAssets";
import { NFTWithMetadata } from "@/hooks/useNFTMetadata";
import { useBlockchainTime } from "@/hooks/useBlockchainTime";

export default function CreateRaffleContent() {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Use blockchain time instead of local time for security
  const {
    getCurrentBlockchainTime,
    getMinimumExpirationTime,
    formatBlockchainTimeForInput,
    getMinimumDateTimeForInput,
    parseInputTimeToBlockchain,
    isValidExpirationTime,
    isLoading: isBlockchainTimeLoading
  } = useBlockchainTime();
  
  // Raffle form state
  const [raffleFormData, setRaffleFormData] = useState({
    title: '',
    description: '',
    imageHash: '',
    rewardType: 'TOKEN' as 'TOKEN' | 'NFT',
    rewardTokenAddress: '',
    rewardAmount: '',
    ticketPrice: '0.01',
    ticketPaymentToken: '', // For V2 contract multi-token support
    maxTickets: '100',
    expirationDateTime: '',
    autoDistributeOnSoldOut: true, // Always true - auto-distribute enabled by default
  });

  // Transaction state for multi-step process
  const [transactionState, setTransactionState] = useState({
    isProcessing: false,
    currentStep: '',
    steps: [] as string[]
  });

  // Selected asset state for new asset selector
  const [selectedRewardAsset, setSelectedRewardAsset] = useState<SelectedAsset | null>(null);
  const [selectedTicketPaymentAsset, setSelectedTicketPaymentAsset] = useState<SelectedAsset | null>(null);
  
  const [generatedRaffleLink, setGeneratedRaffleLink] = useState<string | null>(null);

  // Contract hooks
  const {
    createRaffle,
    getRaffleIdFromTransaction,
    isPending: isRaffleCreating,
    isConfirming: isRaffleConfirming,
    isConfirmed: isRaffleConfirmed,
    error: raffleError,
    hash: raffleHash
  } = useNadRaffleV4FastContract();

  const handleRaffleInputChange = (field: string, value: string | number | boolean) => {
    setRaffleFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Special handler for ticket price to ensure English decimal format
  const handleTicketPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Replace comma with dot for English decimal format
    value = value.replace(',', '.');
    // Ensure only valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleRaffleInputChange('ticketPrice', value);
    }
  };

  const handleSwitchToMonad = () => {
    if (switchChain) {
      switchChain({ chainId: 10143 });
    }
  };

  const handleRaffleSuccess = async () => {
    if (!raffleHash) return;
    
    try {
      console.log('🎯 Raffle transaction confirmed, extracting raffle ID...');
      const raffleId = await getRaffleIdFromTransaction(raffleHash);
      
      if (raffleId !== null) {
        console.log('🎫 Raffle ID extracted:', raffleId);
        const secureRaffleId = createPredictableSecureRaffleId(raffleId);
        const raffleUrl = `${window.location.origin}/raffle/${secureRaffleId}`;
        setGeneratedRaffleLink(raffleUrl);
        console.log('🔗 Raffle link generated:', raffleUrl);
      } else {
        console.error('❌ Failed to extract raffle ID from transaction');
        alert('Raffle created but failed to generate link. Please check the transaction.');
      }
    } catch (error) {
      console.error('❌ Error in raffle success handler:', error);
      alert('Raffle created but there was an error generating the link.');
    }
  };

  useEffect(() => {
    if (isRaffleConfirmed && raffleHash && !generatedRaffleLink) {
      handleRaffleSuccess();
    }
  }, [isRaffleConfirmed, raffleHash, generatedRaffleLink]);

  // ERC-20 Token approval helper functions
  const checkERC20Allowance = async (tokenAddress: string, owner: string, spender: string): Promise<bigint> => {
    const erc20Abi = [
      {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ];

    try {
      if (!publicClient) return BigInt(0);
      
      const result = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner, spender],
      });
      return result as bigint;
    } catch (error) {
      console.error('Error checking allowance:', error);
      return BigInt(0);
    }
  };

  const approveERC20Token = async (tokenAddress: string, spender: string, amount: bigint) => {
    const erc20Abi = [
      {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      }
    ];

    if (!publicClient || !walletClient) {
      throw new Error('Wallet client not ready');
    }

    const { request } = await publicClient.simulateContract({
      account: address as `0x${string}`,
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount]
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt;
  };

  const handleCreateRaffle = async () => {
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    if (chain?.id !== 10143) {
      alert('Please switch to Monad Testnet');
      return;
    }

    if (!selectedRewardAsset) {
      alert('Please select a reward asset');
      return;
    }

    if (!selectedTicketPaymentAsset) {
      alert('Please select a ticket payment asset');
      return;
    }

    if (!raffleFormData.title || !raffleFormData.description || !raffleFormData.rewardAmount || !raffleFormData.expirationDateTime) {
      alert('Please fill in all required fields');
      return;
    }

    if (!publicClient || !walletClient) {
      alert('Wallet client not ready. Please try again.');
      return;
    }

    // Set up transaction steps
    const steps = [];
    let needsNFTApproval = false;
    let needsRewardTokenApproval = false;

    // Check if reward token approval is needed (for ERC-20 rewards)
    if (raffleFormData.rewardType === 'TOKEN' && selectedRewardAsset) {
      const rewardTokenAddress = selectedRewardAsset.data.address;
      if (rewardTokenAddress !== '0x0000000000000000000000000000000000000000') {
        const rewardAmount = BigInt(parseFloat(raffleFormData.rewardAmount.toString()) * 1e18);
        const currentAllowance = await checkERC20Allowance(
          rewardTokenAddress,
          address as string,
          NADRAFFLE_V4_FAST_CONTRACT.address
        );
        needsRewardTokenApproval = currentAllowance < rewardAmount;
      }
    }

    // Check if NFT approval is needed
    if (raffleFormData.rewardType === 'NFT' && selectedRewardAsset) {
      const contractAddress = NADRAFFLE_V4_FAST_CONTRACT.address;
      const tokenId = BigInt(raffleFormData.rewardAmount);
      const nftAddress = selectedRewardAsset.data.address as `0x${string}`;

      try {
        // Check if the contract is approved for all NFTs (since individual approve doesn't work)
        const isApprovedForAll = await publicClient.readContract({
          address: nftAddress,
          abi: [
            {
              name: 'isApprovedForAll',
              type: 'function',
              stateMutability: 'view',
              inputs: [
                { name: 'owner', type: 'address' },
                { name: 'operator', type: 'address' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'isApprovedForAll',
          args: [address as `0x${string}`, contractAddress]
        });

        needsNFTApproval = !isApprovedForAll;
        console.log('🔍 NFT Approval Check:', { isApprovedForAll, needsNFTApproval });
      } catch (error) {
        console.error('Error checking NFT approval:', error);
        alert('Failed to check NFT approval status. Please try again.');
        return;
      }
    }

    // Build steps array
    if (needsRewardTokenApproval) {
      steps.push('Approving Reward Token');
    }
    if (needsNFTApproval) {
      steps.push('Approving NFT');
    }
    steps.push('Creating Raffle');

    // Start transaction process
    setTransactionState({
      isProcessing: true,
      currentStep: steps[0],
      steps: steps
    });

    try {
      let currentStepIndex = 0;

      // Step 1: Reward Token Approval (if needed)
      if (needsRewardTokenApproval && raffleFormData.rewardType === 'TOKEN' && selectedRewardAsset) {
        setTransactionState(prev => ({ ...prev, currentStep: 'Approving Reward Token' }));
        
        const rewardTokenAddress = selectedRewardAsset.data.address;
        const rewardAmount = BigInt(parseFloat(raffleFormData.rewardAmount.toString()) * 1e18);
        
        console.log('Approving reward token...');
        await approveERC20Token(rewardTokenAddress, NADRAFFLE_V4_FAST_CONTRACT.address, rewardAmount);
        
        // Verify approval
        const newAllowance = await checkERC20Allowance(
          rewardTokenAddress,
          address as string,
          NADRAFFLE_V4_FAST_CONTRACT.address
        );
        
        if (newAllowance < rewardAmount) {
          throw new Error('Reward token approval failed');
        }
        
        currentStepIndex++;
      }

      // Step 2: NFT Approval (if needed)
      if (needsNFTApproval && raffleFormData.rewardType === 'NFT' && selectedRewardAsset) {
        setTransactionState(prev => ({ ...prev, currentStep: 'Approving NFT' }));
        
        const contractAddress = NADRAFFLE_V4_FAST_CONTRACT.address;
        const tokenId = BigInt(raffleFormData.rewardAmount);
        const nftAddress = selectedRewardAsset.data.address as `0x${string}`;

        console.log('Sending NFT approval transaction using setApprovalForAll...');
        
        // Use setApprovalForAll instead of individual approve
        const { request } = await publicClient.simulateContract({
          account: address as `0x${string}`,
          address: nftAddress,
          abi: [
            {
              name: 'setApprovalForAll',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'operator', type: 'address' },
                { name: 'approved', type: 'bool' }
              ],
              outputs: []
            }
          ],
          functionName: 'setApprovalForAll',
          args: [contractAddress, true]
        });

        const approvalHash = await walletClient.writeContract(request);
        console.log('NFT setApprovalForAll transaction sent:', approvalHash);

        // Wait for approval to be confirmed
        const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        console.log('NFT setApprovalForAll confirmed:', approvalReceipt);

        // Verify the approval was actually set
        const isApprovedForAll = await publicClient.readContract({
          address: nftAddress,
          abi: [
            {
              name: 'isApprovedForAll',
              type: 'function',
              stateMutability: 'view',
              inputs: [
                { name: 'owner', type: 'address' },
                { name: 'operator', type: 'address' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'isApprovedForAll',
          args: [address as `0x${string}`, contractAddress]
        });

        if (!isApprovedForAll) {
          throw new Error('NFT approval failed - setApprovalForAll was not successful');
        }

        console.log('✅ NFT setApprovalForAll successful');
        currentStepIndex++;
      }

      // Final Step: Create Raffle
      setTransactionState(prev => ({ ...prev, currentStep: 'Creating Raffle' }));
      const expirationTime = parseInputTimeToBlockchain(raffleFormData.expirationDateTime);
      
      // Convert expirationTime to duration (seconds from now)
      const currentTime = Math.floor(Date.now() / 1000);
      const duration = Math.max(expirationTime - currentTime, 3600); // Minimum 1 hour
      
      console.log('🎫 Creating raffle with data:', {
        ...raffleFormData,
        expirationTime,
        duration,
        rewardTokenAddress: selectedRewardAsset.data.address,
        ticketPaymentToken: selectedTicketPaymentAsset.data.address
      });

      await createRaffle({
        title: raffleFormData.title,
        description: raffleFormData.description,
        rewardType: raffleFormData.rewardType,
        rewardTokenAddress: selectedRewardAsset.data.address,
        rewardAmount: raffleFormData.rewardAmount,
        ticketPrice: raffleFormData.ticketPrice,
        ticketPaymentToken: selectedTicketPaymentAsset.data.address,
        maxTickets: parseInt(raffleFormData.maxTickets) || 1,
        duration: duration,
        autoDistributeOnSoldOut: raffleFormData.autoDistributeOnSoldOut,
      });

      // Reset transaction state on success
      setTransactionState({
        isProcessing: false,
        currentStep: '',
        steps: []
      });
      
    } catch (error) {
      console.error('❌ Error in transaction process:', error);
      
      // Reset transaction state on error
      setTransactionState({
        isProcessing: false,
        currentStep: '',
        steps: []
      });
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Raffle duration must be at least 13 minutes')) {
        alert('⏰ Contract requires raffle duration to be at least 13 minutes from current blockchain time. Please select a later time and try again.');
      } else if (errorMessage.includes('Raffle duration must be at least 15 minutes')) {
        alert('⏰ Contract requires raffle duration to be at least 15 minutes from current blockchain time. Please select a later time and try again.');
      } else if (errorMessage.includes('approval')) {
        alert('Failed to approve NFT transfer. Please try again.');
      } else {
        alert('Failed to create raffle. Please try again.');
      }
    }
  };

  // Show success screen if raffle is created
  if (generatedRaffleLink) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
        {/* Header */}
        <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    Raffle Created!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    RaffleHouse
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Navigation Links */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link 
                    href="/"
                    className="hidden sm:block px-2 lg:px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                  >
                    Home
                  </Link>
                  <Link 
                    href="/app/dashboard"
                    className="px-2 lg:px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/nadpay"
                    className="px-2 lg:px-3 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                  >
                    NadPay
                  </Link>
                  <Link 
                    href="/nadswap"
                    className="px-2 lg:px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                  >
                    NadSwap
                  </Link>
                </div>
                
                {/* Custom Wallet Button */}
                <div className="relative">
                  <ConnectKitButton />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Raffle Created!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Share this raffle link to let people participate
              </p>
              
              <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Raffle Link:</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                  <input
                    type="text"
                    value={generatedRaffleLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(generatedRaffleLink);
                        alert('Link copied to clipboard!');
                      } catch (error) {
                        console.error('Failed to copy:', error);
                      }
                    }}
                    className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={generatedRaffleLink.replace(window.location.origin, '')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold"
                >
                  View Raffle
                </Link>
                <Link
                  href="/rafflehouse"
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors font-semibold"
                >
                  Back to RaffleHouse
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link href="/rafflehouse" className="flex items-center space-x-2">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </Link>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  Create Raffle
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  RaffleHouse
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Navigation Links */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link 
                  href="/"
                  className="hidden sm:block px-2 lg:px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                >
                  Home
                </Link>
                <Link 
                  href="/app/dashboard"
                  className="px-2 lg:px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/nadpay"
                  className="px-2 lg:px-3 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                >
                  NadPay
                </Link>
                <Link 
                  href="/nadswap"
                  className="px-2 lg:px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity text-xs sm:text-sm font-medium"
                >
                  NadSwap
                </Link>
              </div>
              
              {/* Custom Wallet Button */}
              <div className="relative">
                <ConnectKitButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Raffle Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl p-8 relative">
            {/* Close button - absolute positioned */}
            <Link
              href="/rafflehouse"
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </Link>
            
            {/* Header - now perfectly centered */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create Raffle
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Set up your raffle with NFT or token rewards
              </p>
            </div>

            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Connect your wallet to create a raffle
                </p>
                <ConnectKitButton />
              </div>
            ) : chain?.id !== 10143 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Please switch to Monad Testnet to create raffles
                </p>
                <button
                  onClick={handleSwitchToMonad}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold"
                >
                  Switch to Monad Testnet
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Raffle Title *
                  </label>
                  <input
                    type="text"
                    value={raffleFormData.title}
                    onChange={(e) => handleRaffleInputChange('title', e.target.value)}
                    placeholder="e.g., Win a Rare NFT!"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={raffleFormData.description}
                    onChange={(e) => handleRaffleInputChange('description', e.target.value)}
                    placeholder="Describe your raffle and the reward..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Reward Configuration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Reward Asset *
                  </label>
                  <AssetSelector
                    selectedAsset={selectedRewardAsset}
                    onAssetSelect={(asset) => {
                      setSelectedRewardAsset(asset);
                      if (asset) {
                        if (asset.type === 'individual_nft') {
                          const nftData = asset.data as NFTWithMetadata;
                          handleRaffleInputChange('rewardTokenAddress', nftData.address);
                          handleRaffleInputChange('rewardType', 'NFT');
                          
                          // TEMPORARY FIX: Use correct token ID for Nad Name Service NFT
                          if (nftData.address.toLowerCase() === '0x3019BF1dfB84E5b46Ca9D0eEC37dE08a59A41308'.toLowerCase()) {
                            console.log('🔧 TEMP FIX: Using correct token ID 4014411 instead of', nftData.tokenId);
                            handleRaffleInputChange('rewardAmount', '4014411');
                          } else {
                            handleRaffleInputChange('rewardAmount', nftData.tokenId);
                          }
                        } else {
                          handleRaffleInputChange('rewardTokenAddress', asset.data.address);
                          handleRaffleInputChange('rewardType', asset.type === 'token' ? 'TOKEN' : 'NFT');
                          handleRaffleInputChange('rewardAmount', '');
                        }
                      } else {
                        handleRaffleInputChange('rewardTokenAddress', '');
                        handleRaffleInputChange('rewardAmount', '');
                      }
                    }}
                    assetType="both"
                    showOnlyOwned={true}
                    placeholder="Select token or NFT to give as reward..."
                  />
                    
                  {/* Amount Input */}
                  {selectedRewardAsset && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {selectedRewardAsset.type === 'token' 
                          ? 'Amount to give as reward *' 
                          : selectedRewardAsset.type === 'individual_nft'
                          ? 'NFT Token ID (auto-filled) *'
                          : 'Token ID to give as reward *'
                        }
                      </label>
                      <input
                        type={selectedRewardAsset.type === 'token' ? 'number' : 'text'}
                        value={raffleFormData.rewardAmount}
                        onChange={(e) => handleRaffleInputChange('rewardAmount', e.target.value)}
                        placeholder={selectedRewardAsset.type === 'token' ? '100' : '1'}
                        min={selectedRewardAsset.type === 'token' ? '0' : undefined}
                        step={selectedRewardAsset.type === 'token' ? '0.001' : undefined}
                        disabled={selectedRewardAsset.type === 'individual_nft'}
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                          selectedRewardAsset.type === 'individual_nft' ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      />
                      {selectedRewardAsset.type === 'token' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Selected: {(selectedRewardAsset.data as KnownToken).symbol} - {(selectedRewardAsset.data as KnownToken).name}
                        </p>
                      )}
                      {selectedRewardAsset.type === 'nft' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Selected NFT Collection: {(selectedRewardAsset.data as KnownNFT).name}
                        </p>
                      )}
                      {selectedRewardAsset.type === 'individual_nft' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Selected NFT: {(selectedRewardAsset.data as NFTWithMetadata).metadata?.name || `NFT #${(selectedRewardAsset.data as NFTWithMetadata).tokenId}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Ticket Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ticket Payment Asset *
                    </label>
                    <AssetSelector
                      selectedAsset={selectedTicketPaymentAsset}
                      onAssetSelect={(asset) => {
                        setSelectedTicketPaymentAsset(asset);
                        // V1 contract only supports MON, so we store for future V2 compatibility
                        setRaffleFormData(prev => ({
                          ...prev,
                          ticketPaymentToken: asset?.data.address || ''
                        }));
                      }}
                      assetType="token"
                      showOnlyOwned={false}
                      placeholder="Select payment token for tickets"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ticket Price {selectedTicketPaymentAsset && selectedTicketPaymentAsset.type === 'token' && (
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          ({(selectedTicketPaymentAsset.data as any).symbol})
                        </span>
                      )} *
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={raffleFormData.ticketPrice}
                      onChange={handleTicketPriceChange}
                      placeholder="0.01"
                      min="0"
                      step="0.01"
                      lang="en"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Tickets *
                    </label>
                    <input
                      type="number"
                      value={raffleFormData.maxTickets}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          handleRaffleInputChange('maxTickets', '');
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue)) {
                            handleRaffleInputChange('maxTickets', numValue);
                          }
                        }
                      }}
                      placeholder="100"
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Expiration Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Expiration Date & Time *
                  </label>
                  
                  {/* Quick Duration Buttons */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                    {[
                      { label: '1H', minutes: 60 },
                      { label: '2H', minutes: 120 },
                      { label: '4H', minutes: 240 },
                      { label: '12H', minutes: 720 },
                      { label: '24H', minutes: 1440 }
                    ].map((duration) => (
                      <button
                        key={duration.label}
                        type="button"
                        onClick={() => {
                          // Use the requested duration directly, backend validation will handle contract requirements
                          const endTimestamp = getMinimumExpirationTime(duration.minutes);
                          const formattedTime = formatBlockchainTimeForInput(endTimestamp);
                          handleRaffleInputChange('expirationDateTime', formattedTime);
                          
                          console.log(`⏰ Set expiration to ${duration.minutes} minutes from blockchain time:`, {
                            requested: duration.minutes,
                            endTime: new Date(endTimestamp * 1000).toISOString(),
                            localDisplay: formattedTime
                          });
                        }}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          raffleFormData.expirationDateTime === formatBlockchainTimeForInput(getMinimumExpirationTime(duration.minutes))
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                        }`}
                      >
                        {duration.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Raffle duration: minimum 1 hour, maximum 24 hours
                    {!isBlockchainTimeLoading && (
                      <span className="block mt-1 text-blue-600 dark:text-blue-400">
                        🕐 Current blockchain time: {new Date(getCurrentBlockchainTime() * 1000).toLocaleString()}
                      </span>
                    )}
                    <span className="block mt-1 text-green-600 dark:text-green-400 text-xs">
                      ✅ System includes automatic buffer for blockchain sync differences
                    </span>
                  </p>
                </div>

                {/* Create Button */}
                <div className="flex space-x-4">
                  <Link
                    href="/rafflehouse"
                    className="flex-1 px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors font-semibold text-center"
                  >
                    Back to Templates
                  </Link>
                  <button
                    onClick={handleCreateRaffle}
                    disabled={isRaffleCreating || isRaffleConfirming || transactionState.isProcessing}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {transactionState.isProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{transactionState.currentStep}...</span>
                      </div>
                    ) : isRaffleCreating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : isRaffleConfirming ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Confirming...</span>
                      </div>
                    ) : (
                      'Create Raffle'
                    )}
                  </button>
                </div>
                
                {/* Transaction Progress */}
                {transactionState.isProcessing && transactionState.steps.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                          Processing Transaction {transactionState.steps.indexOf(transactionState.currentStep) + 1} of {transactionState.steps.length}
                        </p>
                        <p className="text-blue-500 dark:text-blue-300 text-xs">
                          {transactionState.currentStep}...
                        </p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-blue-100 dark:bg-blue-800 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${((transactionState.steps.indexOf(transactionState.currentStep) + 1) / transactionState.steps.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {raffleError && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      Error: {raffleError.message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 