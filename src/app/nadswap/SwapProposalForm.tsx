'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  X, 
  Wallet,
  ArrowRight,
  Image as ImageIcon,
  Coins,
  Image
} from 'lucide-react';
import { useAccount, usePublicClient, useWaitForTransactionReceipt } from 'wagmi';
import { useAssetBalances } from '@/hooks/useAssetBalances';
import { useNadSwapV3Contract, SwapAssetV3 } from '@/hooks/useNadSwapV3Contract';
import { useNFTMetadata } from '@/hooks/useNFTMetadata';
import { KNOWN_TOKENS, KNOWN_NFTS, NATIVE_MON } from '@/lib/knownAssets';

// Separate component to prevent re-renders and focus loss
const SelectedAssetCard = React.memo(({ 
  asset, 
  index, 
  onRemove, 
  onAmountChange, 
  isOffered 
}: { 
  asset: SwapAssetV3; 
  index: number; 
  onRemove: (index: number) => void;
  onAmountChange: (index: number, amount: string, isOffered: boolean) => void;
  isOffered: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Initialize input value when component mounts
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== (asset.amount || '')) {
      inputRef.current.value = asset.amount || '';
    }
  }, []);

  const handleInputChange = useCallback(() => {
    if (inputRef.current) {
      const rawValue = inputRef.current.value;
      const normalizedValue = rawValue.replace(',', '.');
      
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Only allow valid decimal format
      if (/^[0-9]*\.?[0-9]*$/.test(normalizedValue) || normalizedValue === '') {
        // Debounce the update to prevent excessive re-renders
        timeoutRef.current = setTimeout(() => {
          onAmountChange(index, normalizedValue, isOffered);
        }, 100);
      } else {
        // Reset to previous valid value if invalid
        inputRef.current.value = asset.amount || '';
      }
    }
  }, [index, isOffered, onAmountChange, asset.amount]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-3">
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center overflow-hidden">
          {asset.image ? (
            <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
          ) : asset.isNFT ? (
            <ImageIcon className="w-6 h-6 text-gray-400" />
          ) : (
            <Coins className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {asset.isNFT ? (
                `${asset.name} #${asset.tokenId || 'Unknown'}`
              ) : (
                asset.name || asset.symbol || 'Unknown Token'
              )}
            </p>
            <button
              onClick={() => onRemove(index)}
              className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {!asset.isNFT && (
            <div className="mt-2">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                placeholder="Amount (e.g., 0.1 or 0,1)"
                onInput={handleInputChange}
                className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-dark-600 rounded bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Add display name for better debugging
SelectedAssetCard.displayName = 'SelectedAssetCard';

// NFT Asset Card with metadata fetching
const NFTAssetCard = React.memo(({ 
  contractAddress, 
  tokenId, 
  collectionName, 
  collectionImage, 
  onAdd 
}: { 
  contractAddress: string; 
  tokenId: string; 
  collectionName: string; 
  collectionImage?: string; 
  onAdd: (asset: any) => void; 
}) => {
  const { metadata, isLoading } = useNFTMetadata(contractAddress, tokenId);
  
  const handleAdd = () => {
    onAdd({
      contractAddress,
      tokenId,
      name: metadata?.name || `${collectionName} #${tokenId}`,
      image: metadata?.image || collectionImage,
      isNFT: true,
      collectionName
    });
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-3 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          ) : metadata?.image ? (
            <img src={metadata.image} alt={metadata.name || `NFT #${tokenId}`} className="w-full h-full object-cover" />
          ) : collectionImage ? (
            <img src={collectionImage} alt={collectionName} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {isLoading ? 'Loading...' : metadata?.name || `${collectionName} #${tokenId}`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {collectionName}
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

NFTAssetCard.displayName = 'NFTAssetCard';

export default function SwapProposalForm({ onProposalCreated }: { onProposalCreated?: () => void }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { tokenBalances, nftBalances, isLoading } = useAssetBalances();
  const { 
    createSwapProposal, 
    isCreatingProposal, 
    proposalFee,
    createProposalError,
    createProposalHash,
    approveNFT,
    approveERC20,
    isApprovingNFT,
    isApprovingToken
  } = useNadSwapV3Contract();

  // Transaction hash state for confirmation
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  
  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  // Form state
  const [targetWallet, setTargetWallet] = useState('');
  const [targetNFTs, setTargetNFTs] = useState<any[]>([]);
  const [isLoadingTargetNFTs, setIsLoadingTargetNFTs] = useState(false);
  
  // Selected assets
  const [selectedOfferedAssets, setSelectedOfferedAssets] = useState<SwapAssetV3[]>([]);
  const [selectedRequestedAssets, setSelectedRequestedAssets] = useState<SwapAssetV3[]>([]);
  
  // UI state
  const [showMyAssets, setShowMyAssets] = useState(false);
  const [showTargetAssets, setShowTargetAssets] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [targetAssetSearchQuery, setTargetAssetSearchQuery] = useState('');
  const [activeMyAssetsTab, setActiveMyAssetsTab] = useState<'token' | 'nft'>('token');
  const [activeTargetAssetsTab, setActiveTargetAssetsTab] = useState<'token' | 'nft'>('nft');
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load target wallet NFTs
  const loadTargetWalletNFTs = async (walletAddress: string) => {
    if (!walletAddress || walletAddress.length !== 42) {
      setTargetNFTs([]);
      return;
    }

    setIsLoadingTargetNFTs(true);
    try {
      if (publicClient) {
        const targetNFTData: any[] = [];
        
        // Check each known NFT collection for the target wallet
        for (const nftCollection of KNOWN_NFTS) {
          try {
            const balance = await publicClient.readContract({
              address: nftCollection.address as `0x${string}`,
              abi: [
                {
                  inputs: [{ name: 'owner', type: 'address' }],
                  name: 'balanceOf',
                  outputs: [{ name: '', type: 'uint256' }],
                  stateMutability: 'view',
                  type: 'function',
                },
                {
                  inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }],
                  name: 'tokenOfOwnerByIndex',
                  outputs: [{ name: '', type: 'uint256' }],
                  stateMutability: 'view',
                  type: 'function',
                },
              ],
              functionName: 'balanceOf',
              args: [walletAddress as `0x${string}`]
            });
            
            const totalOwned = Number(balance);
            
            // If user owns NFTs, get token IDs
            if (totalOwned > 0) {
              try {
                for (let i = 0; i < Math.min(totalOwned, 20); i++) { // Limit to 20 for performance
                  const tokenId = await publicClient.readContract({
                    address: nftCollection.address as `0x${string}`,
                    abi: [
                      {
                        inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }],
                        name: 'tokenOfOwnerByIndex',
                        outputs: [{ name: '', type: 'uint256' }],
                        stateMutability: 'view',
                        type: 'function',
                      },
                    ],
                    functionName: 'tokenOfOwnerByIndex',
                    args: [walletAddress as `0x${string}`, BigInt(i)]
                  });
                  
                  // Try to get token URI for specific image and name
                  let specificImage = nftCollection.image;
                  let specificName = `${nftCollection.name} #${tokenId}`;
                  
                  try {
                    const tokenURI = await publicClient.readContract({
                      address: nftCollection.address as `0x${string}`,
                      abi: [
                        {
                          inputs: [{ name: 'tokenId', type: 'uint256' }],
                          name: 'tokenURI',
                          outputs: [{ name: '', type: 'string' }],
                          stateMutability: 'view',
                          type: 'function',
                        },
                      ],
                      functionName: 'tokenURI',
                      args: [tokenId]
                    });
                    
                    // If tokenURI is available, try to fetch metadata
                    if (tokenURI && typeof tokenURI === 'string') {
                      try {
                        // Handle IPFS URLs
                        let metadataUrl = tokenURI;
                        if (tokenURI.startsWith('ipfs://')) {
                          metadataUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                        }
                        
                        const response = await fetch(metadataUrl);
                        if (response.ok) {
                          const metadata = await response.json();
                          
                          // Update specific name if available
                          if (metadata.name) {
                            specificName = metadata.name;
                          }
                          
                          // Update specific image if available
                          if (metadata.image) {
                            let imageUrl = metadata.image;
                            if (imageUrl.startsWith('ipfs://')) {
                              imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                            }
                            specificImage = imageUrl;
                          }
                        }
                      } catch (metadataError) {
                        console.warn(`Could not fetch metadata for ${nftCollection.name} #${tokenId}:`, metadataError);
                      }
                    }
                  } catch (tokenURIError) {
                    console.warn(`Could not get tokenURI for ${nftCollection.name} #${tokenId}:`, tokenURIError);
                  }
                  
                  targetNFTData.push({
                    contractAddress: nftCollection.address,
                    tokenId: tokenId.toString(),
                    name: specificName,
                    collectionName: nftCollection.name,
                    image: specificImage,
                    isNFT: true
                  });
                }
              } catch (error) {
                console.warn(`Could not fetch token IDs for ${nftCollection.name}:`, error);
                // When we can't fetch individual NFTs, don't create placeholders
                // This prevents showing incorrect NFT names
              }
            }
          } catch (error) {
            console.warn(`Failed to check ${nftCollection.name} for target wallet:`, error);
          }
        }
        
        setTargetNFTs(targetNFTData);
      } else {
        setTargetNFTs([]);
      }
    } catch (error) {
      console.error('Error loading target wallet NFTs:', error);
      setTargetNFTs([]);
    } finally {
      setIsLoadingTargetNFTs(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTargetWalletNFTs(targetWallet);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [targetWallet]);

  // Monitor transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      // Transaction confirmed on blockchain
      setIsTransactionPending(false);
      setTargetWallet('');
      setSelectedOfferedAssets([]);
      setSelectedRequestedAssets([]);
      setSuccessMessage('Proposal created successfully!');
      setTransactionHash(undefined);
      
      // Call the callback to refresh proposals in parent
      if (onProposalCreated) {
        onProposalCreated();
      }
    }
  }, [isConfirmed, onProposalCreated]);

  // Monitor transaction hash
  useEffect(() => {
    if (createProposalHash) {
      setTransactionHash(createProposalHash);
    }
  }, [createProposalHash]);

  // Monitor transaction errors
  useEffect(() => {
    if (createProposalError && isTransactionPending) {
      console.error('Transaction error:', createProposalError);
      setIsTransactionPending(false);
      setErrorMessage('Transaction failed: ' + createProposalError.message);
      setTransactionHash(undefined);
    }
  }, [createProposalError, isTransactionPending]);

  const handleAddOfferedAsset = (asset: any) => {
    const swapAsset: SwapAssetV3 = {
      contractAddress: asset.contractAddress,
      tokenId: asset.tokenId || 0,
      amount: asset.isNFT ? '0' : '0',
      isNFT: asset.isNFT,
      name: asset.name,
      symbol: asset.symbol,
      image: asset.image
    };

    if (!selectedOfferedAssets.some(a => 
      a.contractAddress === swapAsset.contractAddress && 
      a.tokenId === swapAsset.tokenId && 
      a.isNFT === swapAsset.isNFT
    )) {
      setSelectedOfferedAssets([...selectedOfferedAssets, swapAsset]);
    }
  };

  const handleAddRequestedAsset = (asset: any) => {
    const swapAsset: SwapAssetV3 = {
      contractAddress: asset.contractAddress,
      tokenId: asset.tokenId || 0,
      amount: asset.isNFT ? '0' : '0',
      isNFT: asset.isNFT,
      name: asset.name,
      symbol: asset.symbol,
      image: asset.image
    };

    if (!selectedRequestedAssets.some(a => 
      a.contractAddress === swapAsset.contractAddress && 
      a.tokenId === swapAsset.tokenId && 
      a.isNFT === swapAsset.isNFT
    )) {
      setSelectedRequestedAssets([...selectedRequestedAssets, swapAsset]);
    }
  };

  const handleRemoveOfferedAsset = (index: number) => {
    setSelectedOfferedAssets(selectedOfferedAssets.filter((_, i) => i !== index));
  };

  const handleRemoveRequestedAsset = (index: number) => {
    setSelectedRequestedAssets(selectedRequestedAssets.filter((_, i) => i !== index));
  };

  const handleTokenAmountChange = useCallback((index: number, amount: string, isOffered: boolean) => {
    // Convert comma to dot for global decimal format
    const normalizedAmount = amount.replace(',', '.');
    
    if (isOffered) {
      setSelectedOfferedAssets(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], amount: normalizedAmount };
        return updated;
      });
    } else {
      setSelectedRequestedAssets(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], amount: normalizedAmount };
        return updated;
      });
    }
  }, []);

  const handleSubmit = async () => {
    if (!targetWallet || selectedOfferedAssets.length === 0 || selectedRequestedAssets.length === 0) {
      setErrorMessage('Please fill all required fields');
      return;
    }

    // Validate token amounts
    for (const asset of [...selectedOfferedAssets, ...selectedRequestedAssets]) {
      if (!asset.isNFT && (!asset.amount || parseFloat(asset.amount) <= 0)) {
        setErrorMessage('Please enter valid token amounts');
        return;
      }
    }

    // Clear previous messages
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setSelectedRequestedAssets([]);
      setSuccessMessage('Swap proposal created successfully!');
    } catch (error: any) {
      setIsTransactionPending(false);
      console.error('Error creating proposal:', error);
      
      // More detailed error messages
      let errorMsg = 'Failed to create proposal';
      if (error?.message) {
        if (error.message.includes('insufficient funds')) {
          errorMsg = 'Insufficient funds for proposal fee (0.1 MON required)';
        } else if (error.message.includes('rejected')) {
          errorMsg = 'Transaction was rejected by user';
        } else if (error.message.includes('network')) {
          errorMsg = 'Network error - please try again';
        } else if (error.message.includes('reverted')) {
          errorMsg = 'Contract execution failed. This might be due to insufficient balance, missing approvals, or invalid assets.';
        } else if (error.message.includes('Failed to approve')) {
          errorMsg = error.message;
        } else {
          errorMsg = `Error: ${error.message}`;
        }
      }
      
      setErrorMessage(errorMsg);
    }
  };

  const AssetCard = ({ asset, onAdd, showAddButton = true }: { 
    asset: any; 
    onAdd: (asset: any) => void;
    showAddButton?: boolean;
  }) => (
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-3 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center overflow-hidden">
          {asset.image ? (
            <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
          ) : asset.isNFT ? (
            <ImageIcon className="w-6 h-6 text-gray-400" />
          ) : (
            <Coins className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {asset.isNFT ? (
              asset.name // Show specific NFT name (like "Nad Name Service #4872645")
            ) : (
              asset.name || asset.symbol || 'Unknown Token'
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {asset.isNFT ? (
              asset.collectionName || asset.name // Show collection name as subtitle
            ) : asset.balance && asset.balance !== '' ? (
              `${asset.balance} ${asset.symbol}`
            ) : (
              asset.symbol
            )}
          </p>
        </div>
        {showAddButton && (
          <button
            onClick={() => onAdd(asset)}
            className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Create Swap Proposal
        </h2>

        {/* Target Wallet */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Wallet Address
          </label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="0x..."
              value={targetWallet}
              onChange={(e) => setTargetWallet(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* What You Want (from target wallet) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              What You Want
            </h3>
            
            {/* Selected Requested Assets */}
            <div className="space-y-3 mb-4">
              {selectedRequestedAssets.map((asset, index) => (
                <SelectedAssetCard
                  key={`requested-${index}`}
                  asset={asset}
                  index={index}
                  onRemove={handleRemoveRequestedAsset}
                  onAmountChange={handleTokenAmountChange}
                  isOffered={false}
                />
              ))}
            </div>

            <button
              onClick={() => setShowTargetAssets(!showTargetAssets)}
              className="w-full py-2 px-4 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
              {showTargetAssets ? 'Hide Target Assets' : 'Select Target Assets'}
            </button>

            {showTargetAssets && (
              <div className="mt-4 space-y-3">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-dark-700 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTargetAssetsTab('token')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      activeTargetAssetsTab === 'token'
                        ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    <span>Tokens</span>
                  </button>
                  <button
                    onClick={() => setActiveTargetAssetsTab('nft')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      activeTargetAssetsTab === 'nft'
                        ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    <span>NFTs</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search target assets..."
                    value={targetAssetSearchQuery}
                    onChange={(e) => setTargetAssetSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                {/* Assets List */}
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {isLoadingTargetNFTs ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                    </div>
                  ) : !targetWallet ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Enter a wallet address to see their assets
                    </div>
                  ) : targetNFTs.length === 0 ? (
                    <div className="space-y-2">
                      <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm">
                        No NFTs found for this wallet. NadSwap currently supports NFTs and ERC20 tokens only.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Target wallet NFTs */}
                      {activeTargetAssetsTab === 'nft' && targetNFTs
                        .filter(nft => !targetAssetSearchQuery || 
                          (nft.name && nft.name.toLowerCase().includes(targetAssetSearchQuery.toLowerCase())) ||
                          (nft.tokenId && nft.tokenId.toString().includes(targetAssetSearchQuery))
                        )
                        .map((nft, index) => (
                          <AssetCard
                            key={`target-nft-${index}`}
                            asset={{ ...nft, isNFT: true }}
                            onAdd={handleAddRequestedAsset}
                          />
                        ))}
                      
                      {/* Target wallet tokens - use known tokens list */}
                      {activeTargetAssetsTab === 'token' && (
                        <div className="space-y-2">
                          {/* Known tokens list */}
                          {KNOWN_TOKENS
                            .filter(token => !targetAssetSearchQuery || 
                              token.name.toLowerCase().includes(targetAssetSearchQuery.toLowerCase()) ||
                              token.symbol.toLowerCase().includes(targetAssetSearchQuery.toLowerCase())
                            )
                            .map((token, index) => (
                              <AssetCard
                                key={`target-token-${index}`}
                                asset={{
                                  contractAddress: token.address,
                                  name: token.name,
                                  symbol: token.symbol,
                                  image: token.logo,
                                  balance: "", // Don't show balance for target tokens
                                  isNFT: false
                                }}
                                onAdd={handleAddRequestedAsset}
                              />
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* What You Offer (from your wallet) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              What You Offer
            </h3>
            
            {/* Selected Offered Assets */}
            <div className="space-y-3 mb-4">
              {selectedOfferedAssets.map((asset, index) => (
                <SelectedAssetCard
                  key={`offered-${index}`}
                  asset={asset}
                  index={index}
                  onRemove={handleRemoveOfferedAsset}
                  onAmountChange={handleTokenAmountChange}
                  isOffered={true}
                />
              ))}
            </div>

            <button
              onClick={() => setShowMyAssets(!showMyAssets)}
              className="w-full py-2 px-4 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
              {showMyAssets ? 'Hide My Assets' : 'Select My Assets'}
            </button>

            {showMyAssets && (
              <div className="mt-4 space-y-3">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-dark-700 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveMyAssetsTab('token')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      activeMyAssetsTab === 'token'
                        ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    <span>Tokens</span>
                  </button>
                  <button
                    onClick={() => setActiveMyAssetsTab('nft')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      activeMyAssetsTab === 'nft'
                        ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    <span>NFTs</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search your assets..."
                    value={assetSearchQuery}
                    onChange={(e) => setAssetSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                {/* Assets List */}
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      {/* NFT Collections */}
                      {activeMyAssetsTab === 'nft' && nftBalances
                        .filter(nft => nft.totalOwned > 0)
                        .filter(nft => !assetSearchQuery || nft.name.toLowerCase().includes(assetSearchQuery.toLowerCase()))
                        .map((nftCollection, collectionIndex) => {
                          const filteredTokens = nftCollection.ownedTokens.filter(tokenId => 
                            !assetSearchQuery || 
                            nftCollection.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                            tokenId.includes(assetSearchQuery)
                          );
                          
                          return (
                            <div key={`nft-collection-${collectionIndex}`} className="space-y-2">
                              {/* Collection Header */}
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">
                                {nftCollection.name} ({filteredTokens.length} of {nftCollection.totalOwned} NFTs)
                              </div>
                              {/* Individual NFTs */}
                              {filteredTokens.slice(0, 50).map((tokenId, tokenIndex) => (
                                <NFTAssetCard
                                  key={`nft-${collectionIndex}-${tokenIndex}`}
                                  contractAddress={nftCollection.address}
                                  tokenId={tokenId}
                                  collectionName={nftCollection.name}
                                  collectionImage={nftCollection.image}
                                  onAdd={handleAddOfferedAsset}
                                />
                              ))}
                              {filteredTokens.length > 50 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                                  ... and {filteredTokens.length - 50} more NFTs (use search to find specific ones)
                                </div>
                              )}
                            </div>
                          );
                        })}
                      
                      {/* Token Balances - now including native MON from knownAssets */}
                      {activeMyAssetsTab === 'token' && tokenBalances
                        .filter(token => parseFloat(token.balance) > 0)
                        .filter(token => !assetSearchQuery || 
                          token.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                          token.symbol.toLowerCase().includes(assetSearchQuery.toLowerCase())
                        )
                        .map((token, index) => (
                          <AssetCard
                            key={`token-${index}`}
                            asset={{
                              contractAddress: token.address,
                              name: token.name,
                              symbol: token.symbol,
                              image: token.logo,
                              balance: token.formattedBalance,
                              isNFT: false
                            }}
                            onAdd={handleAddOfferedAsset}
                          />
                        ))}
                      
                      {/* If MON is not in tokenBalances but available in knownAssets, show it */}
                      {activeMyAssetsTab === 'token' && !tokenBalances.find(token => token.symbol === 'MON') && (
                        <AssetCard
                          key="native-mon"
                          asset={{
                            contractAddress: NATIVE_MON.address,
                            name: NATIVE_MON.name,
                            symbol: NATIVE_MON.symbol,
                            image: NATIVE_MON.logo,
                            balance: "Available",
                            isNFT: false
                          }}
                          onAdd={handleAddOfferedAsset}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Proposal Fee: <span className="font-semibold">{proposalFee} MON</span></p>
              <p>Duration: <span className="font-semibold">1 hour</span></p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isCreatingProposal || isConfirming || isApprovingNFT || isApprovingToken || !targetWallet || selectedOfferedAssets.length === 0 || selectedRequestedAssets.length === 0}
            className="w-full py-3 px-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApprovingNFT || isApprovingToken ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Approving Assets...</span>
              </div>
            ) : isCreatingProposal ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Proposal...</span>
              </div>
            ) : isConfirming ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Confirming on Blockchain...</span>
              </div>
            ) : (
              'Create Proposal'
            )}
          </button>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Transaction Failed
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {errorMessage}
                  </p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 text-green-500 flex items-center justify-center">
                    ✓
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Success
                  </h3>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    {successMessage}
                  </p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 