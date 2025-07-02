"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, X, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount, useSwitchChain, usePublicClient, useWalletClient } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useNadRaffleV7Contract, NADRAFFLE_V7_CONTRACT, useCreationFeeV7 } from "@/hooks/useNadRaffleV7Contract";
import { createPredictableSecureRaffleId } from "@/lib/linkUtils";
import { AssetSelector, SelectedAsset } from "@/components/AssetSelector";
import { KnownToken, KnownNFT } from "@/lib/knownAssets";
import { NFTWithMetadata } from "@/hooks/useNFTMetadata";
import { useBlockchainTime } from "@/hooks/useBlockchainTime";
import { formatEther } from "viem";
import Navbar from "@/components/Navbar";
import { useAssetBalances } from "@/hooks/useAssetBalances";

export default function CreateRaffleContent() {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Preload asset balances as soon as component mounts
  useAssetBalances();
  
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
  
  // Raffle form state - V7 has NO title/description but supports multi-token payments
  const [raffleFormData, setRaffleFormData] = useState({
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
  } = useNadRaffleV7Contract();

  // Get V7 creation fee from contract
  const { data: creationFeeData } = useCreationFeeV7();

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

    if (!selectedTicketPaymentAsset || !selectedTicketPaymentAsset.data.address) {
      alert('Please select a ticket payment asset');
      return;
    }

    if (!raffleFormData.rewardAmount || !raffleFormData.expirationDateTime) {
      alert('Please fill in all required fields');
      return;
    }

    if (!publicClient || !walletClient) {
      alert('Wallet client not ready. Please try again.');
      return;
    }
    
    if (isBlockchainTimeLoading) {
      alert('Please wait a moment while we sync with the blockchain...');
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
          NADRAFFLE_V7_CONTRACT.address
        );
        needsRewardTokenApproval = currentAllowance < rewardAmount;
      }
    }

    // Check if NFT approval is needed
    if (raffleFormData.rewardType === 'NFT' && selectedRewardAsset) {
      const contractAddress = NADRAFFLE_V7_CONTRACT.address;
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
        
        if (needsNFTApproval && raffleFormData.rewardType === 'NFT' && selectedRewardAsset) {
        setTransactionState(prev => ({ ...prev, currentStep: 'Approving NFT' }));
        
        const contractAddress = NADRAFFLE_V7_CONTRACT.address;
        const tokenId = BigInt(raffleFormData.rewardAmount);
        const nftAddress = selectedRewardAsset.data.address as `0x${string}`;

        const approvalHash = await walletClient.writeContract(request);
        if (!isApprovedForAll) {
          throw new Error('NFT approval failed - setApprovalForAll was not successful');
        }

        );
      const expirationTime = parseInputTimeToBlockchain(raffleFormData.expirationDateTime);
      
      // Convert expirationTime to duration (seconds from now)
      const currentTime = Math.floor(Date.now() / 1000);
      let duration = expirationTime - currentTime;
      
      // Ensure minimum duration is met (V7 contract requires 3600 seconds minimum)
      const MIN_DURATION = 3600; // 1 hour in seconds
      if (duration < MIN_DURATION) {
        duration = MIN_DURATION;
      }
      
      // Map V4 rewardType to V7 rewardType
      let v7RewardType: number;
      if (raffleFormData.rewardType === 'NFT') {
        v7RewardType = 2; // V7 NFT_TOKEN
      } else {
        // Check if it's MON or ERC20
        if (selectedRewardAsset.data.address === '0x0000000000000000000000000000000000000000') {
          v7RewardType = 0; // V7 MON_TOKEN
        } else {
          v7RewardType = 1; // V7 ERC20_TOKEN
        }
      }

      // V7 contract requires creation fee - get from contract
      const creationFee = creationFeeData ? formatEther(creationFeeData as bigint) : '0.001';

      // V7 createRaffle(ticketPrice, ticketPaymentToken, maxTickets, duration, rewardType, rewardTokenAddress, rewardTokenId, creationFee)
      await createRaffle(
        raffleFormData.ticketPrice,
        selectedTicketPaymentAsset.data.address, // New parameter for V7
        parseInt(raffleFormData.maxTickets) || 1,
        duration,
        v7RewardType,
        selectedRewardAsset.data.address,
        raffleFormData.rewardAmount,
        creationFee
      );

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
      if (errorMessage.includes('Invalid duration')) {
        alert('⏰ The raffle duration must be at least 1 hour. Please use the quick duration buttons or wait a moment before trying again.');
      } else if (errorMessage.includes('Raffle duration must be at least')) {
        alert('⏰ The selected duration is too short. Please select a longer duration and try again.');
      } else if (errorMessage.includes('approval')) {
        alert('Failed to approve NFT transfer. Please try again.');
      } else {
        alert(`Failed to create raffle: ${errorMessage}. Please try again.`);
      }
    }
  };

  // Show success screen if raffle is created
  if (generatedRaffleLink) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
        <Navbar
          brand={{
            name: "Back to RaffleHouse",
            href: "/rafflehouse",
            logo: <ArrowLeft className="w-5 h-5 text-white" />
          }}
        />

        <div className="container mx-auto px-4 py-8">
          {/* Success Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Raffle Created!</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your raffle has been successfully created and is ready to share
            </p>
          </div>

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
              <Navbar
          brand={{
            name: "Back to RaffleHouse",
            href: "/rafflehouse",
            logo: <ArrowLeft className="w-5 h-5 text-white" />
          }}
        />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Link href="/rafflehouse" className="mr-4 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Raffle</h1>
          </div>
        </div>

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

            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Connect your wallet to create a raffle
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
                          
                          // REAL FIX: Always validate ownership of the token ID before using it
                          const validateAndUseTokenId = async (contractAddr: string, userAddr: string, reportedTokenId: string) => {
                            try {
                              const provider = new (await import('ethers')).JsonRpcProvider("https://testnet-rpc.monad.xyz");
                              const contract = new (await import('ethers')).Contract(contractAddr, [
                                "function ownerOf(uint256 tokenId) view returns (address)"
                              ], provider);
                              
                              // Check if user actually owns the reported token ID
                              try {
                                const owner = await contract.ownerOf(reportedTokenId);
                                if (owner.toLowerCase() === userAddr.toLowerCase()) {
                                  throw new Error(`Token ID ${reportedTokenId} is not owned by user`);
                                }
                              } catch (e) {
                                console.error('❌ Token ID validation failed:', reportedTokenId, e);
                                throw new Error(`Invalid token ID: ${reportedTokenId}`);
                              }
                            } catch (error) {
                              console.error('❌ Token validation error:', error);
                              throw error;
                            }
                          };
                          
                          // Validate ownership before setting token ID
                          validateAndUseTokenId(nftData.address, address || '', nftData.tokenId)
                            .then(validTokenId => {
                              .catch(error => {
                              console.error('🚨 NFT validation failed, cannot use this NFT for raffle:', error);
                              alert(`Cannot use this NFT: ${error.message}\n\nThe NFT selector may be showing incorrect token IDs. Please try refreshing the page.`);
                            });
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ticket Payment Asset
                    </label>
                    <AssetSelector
                      selectedAsset={selectedTicketPaymentAsset}
                      onAssetSelect={(asset) => {
                        setSelectedTicketPaymentAsset(asset);
                        // Store for V7 contract
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
                      { label: '1H', minutes: 61 }, // Minimum duration, with 1 minute buffer
                      { label: '2H', minutes: 121 }, // Add 1 minute buffer
                      { label: '4H', minutes: 241 }, // Add 1 minute buffer
                      { label: '12H', minutes: 721 }, // Add 1 minute buffer
                      { label: '24H', minutes: 1441 } // Add 1 minute buffer
                    ].map((duration) => (
                      <button
                        key={duration.label}
                        type="button"
                        onClick={() => {
                          // Use the requested duration directly, backend validation will handle contract requirements
                          const endTimestamp = getMinimumExpirationTime(duration.minutes);
                          const formattedTime = formatBlockchainTimeForInput(endTimestamp);
                          handleRaffleInputChange('expirationDateTime', formattedTime);
                          
                          .toISOString(),
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
                    <span className="block mt-1 text-yellow-600 dark:text-yellow-400 text-xs">
                      ⚠️ Quick buttons include a small buffer to ensure minimum duration is met
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
                    disabled={isRaffleCreating || isRaffleConfirming || transactionState.isProcessing || (isRaffleConfirmed && !generatedRaffleLink)}
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
                    ) : (isRaffleConfirmed && !generatedRaffleLink) ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating Link...</span>
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

        {/* Terms & Conditions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto mt-6"
        >
          <div className="bg-gray-50 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Terms & Conditions</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• If your raffle sells zero tickets, the rewards are returned to you.</li>
              <li>• Creating a raffle incurs a 0.1 MON fee, paid at the time of creation.</li>
              <li>• You choose the raffle duration when setting it up; the minimum is 1 hour.</li>
              <li>• NadPay takes a 2.5% commission from ticket sales.</li>
              <li>• Once the raffle is created, it can't be edited, cancelled, or ended early — it will run until the scheduled end time.</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">Program ID:</span> {NADRAFFLE_V7_CONTRACT.address}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 