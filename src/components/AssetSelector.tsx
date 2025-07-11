"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, CheckCircle, Coins, Image, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KnownToken,
  KnownNFT,
  searchTokens,
  searchNFTs,
  getTokensByCategory,
  getNFTsByCategory,
  getAllNFTs,
  TOKEN_CATEGORIES,
  NFT_CATEGORIES
} from '../lib/knownAssets';
import { useAssetBalances } from '../hooks/useAssetBalances';
import { useOwnedNFTsWithMetadata, NFTWithMetadata } from '../hooks/useNFTMetadata';
import { useAccount } from 'wagmi';

// Separate component for NFT list to avoid hook ordering issues
interface NFTListProps {
  filteredNFTs: any[];
  onAssetClick: (asset: KnownToken | KnownNFT | NFTWithMetadata, type: 'token' | 'nft' | 'individual_nft') => void;
  userAddress?: string;
}

function NFTList({ filteredNFTs, onAssetClick, userAddress }: NFTListProps) {
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  
  const toggleCollection = (address: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedCollections(newExpanded);
  };

  return (
    <div className="space-y-1">
      {/* NFT Collections */}
      {filteredNFTs.map((collection) => (
        <div key={collection.address}>
          {/* Collection Header */}
          <button
            onClick={() => toggleCollection(collection.address)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              {collection.image ? (
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white flex items-center justify-between">
                <span>{collection.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {collection.totalOwned} owned
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedCollections.has(collection.address) ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>
              {collection.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {collection.description}
                </p>
              )}
            </div>
          </button>

          {/* Individual NFTs */}
          {expandedCollections.has(collection.address) && (
            <div className="ml-4 mt-2 space-y-1">
              <IndividualNFTsList 
                collectionAddress={collection.address}
                userAddress={userAddress}
                onAssetClick={onAssetClick}
              />
            </div>
          )}
        </div>
      ))}

      {/* No NFTs found */}
      {filteredNFTs.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Image className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p>No NFT collections found</p>
        </div>
      )}
    </div>
  );
}

// Component to show individual NFTs within a collection
function IndividualNFTsList({ 
  collectionAddress, 
  userAddress, 
  onAssetClick 
}: {
  collectionAddress: string;
  userAddress?: string;
  onAssetClick: (asset: KnownToken | KnownNFT | NFTWithMetadata, type: 'token' | 'nft' | 'individual_nft') => void;
}) {
  const { nfts, isLoading } = useOwnedNFTsWithMetadata(collectionAddress, userAddress);

  if (isLoading) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-sm mt-1">Loading NFTs...</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No individual NFTs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {nfts.map((nft) => (
        <button
          key={`${nft.address}-${nft.tokenId}`}
          onClick={() => onAssetClick(nft, 'individual_nft')}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            {nft.metadata?.image ? (
              <img
                src={nft.metadata.image}
                alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Image className={`w-4 h-4 text-purple-600 dark:text-purple-400 ${nft.metadata?.image ? 'hidden' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {nft.metadata?.name || `NFT #${nft.tokenId}`}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Token ID: {nft.tokenId}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export interface SelectedAsset {
  type: 'token' | 'nft' | 'individual_nft';
  data: KnownToken | KnownNFT | NFTWithMetadata;
}

interface AssetSelectorProps {
  selectedAsset: SelectedAsset | null;
  onAssetSelect: (asset: SelectedAsset | null) => void;
  assetType?: 'token' | 'nft' | 'both';
  placeholder?: string;
  disabled?: boolean;
  showOnlyOwned?: boolean;
}

export function AssetSelector({
  selectedAsset,
  onAssetSelect,
  assetType = 'both',
  placeholder = 'Select an asset...',
  disabled = false,
  showOnlyOwned = true
}: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'token' | 'nft'>(assetType === 'nft' ? 'nft' : 'token');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { tokenBalances, nftBalances, isLoading } = useAssetBalances();
  const { address } = useAccount();

  // Type guards
  const isKnownToken = (data: any): data is KnownToken => {
    return data && typeof data.symbol === 'string';
  };

  const isKnownNFT = (data: any): data is KnownNFT => {
    return data && typeof data.name === 'string' && !data.tokenId;
  };

  const isNFTWithMetadata = (data: any): data is NFTWithMetadata => {
    return data && typeof data.tokenId === 'string' && data.metadata;
  };

  // Helper function to get display name
  const getDisplayName = (asset: SelectedAsset): string => {
    if (isKnownToken(asset.data)) return asset.data.name;
    if (isKnownNFT(asset.data)) return asset.data.name;
    if (isNFTWithMetadata(asset.data)) {
      return asset.data.metadata?.name || `NFT #${asset.data.tokenId}`;
    }
    return 'Unknown Asset';
  };

  // Helper function to get display description
  const getDisplayDescription = (asset: SelectedAsset): string | undefined => {
    if (isKnownToken(asset.data)) return asset.data.description;
    if (isKnownNFT(asset.data)) return asset.data.description;
    if (isNFTWithMetadata(asset.data)) {
      return `Token ID: ${asset.data.tokenId}${asset.data.metadata?.description ? ` - ${asset.data.metadata.description}` : ''}`;
    }
    return undefined;
  };

  // Filter to only owned assets if showOnlyOwned is true
  const ownedTokens = showOnlyOwned 
    ? tokenBalances.filter(token => {
        const hasBalance = token.balance !== '0' && token.formattedBalance !== '0';
        const isNotLoading = !token.isLoading;
        const isRateLimited = token.formattedBalance === 'Rate Limited';
        const isLoadingText = token.formattedBalance === 'Loading...';
        // Show important tokens (MON and CHOG) always when connected
        const isImportantToken = token.symbol === 'MON' || token.symbol === 'CHOG';
        const shouldShow = (hasBalance && isNotLoading) || 
                          (isImportantToken && address) || // Always show MON and CHOG when connected
                          (isRateLimited && isImportantToken) ||
                          (isLoadingText && isImportantToken);
        
        return shouldShow;
      })
    : tokenBalances;

  const ownedNFTs = showOnlyOwned 
    ? nftBalances.filter(nft => 
        nft.totalOwned > 0 && 
        !nft.isLoading
      )
    : nftBalances;

  // Filter assets based on search and category
  const filteredTokens = searchQuery
    ? ownedTokens.filter(token => 
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedCategory
    ? ownedTokens.filter(token => {
        const categoryTokens = getTokensByCategory(selectedCategory as keyof typeof TOKEN_CATEGORIES);
        return categoryTokens.some(catToken => catToken.symbol === token.symbol);
      })
    : ownedTokens;
  
  // Sort tokens to always show MON and CHOG first
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    if (a.symbol === 'MON') return -1;
    if (b.symbol === 'MON') return 1;
    if (a.symbol === 'CHOG') return -1;
    if (b.symbol === 'CHOG') return 1;
    return 0;
  });

  const filteredNFTs = useMemo(() => {
    if (!showOnlyOwned) {
      // Show all known NFTs when not filtering by ownership
      return searchQuery 
        ? searchNFTs(searchQuery)
        : selectedCategory 
        ? getNFTsByCategory(selectedCategory as keyof typeof NFT_CATEGORIES)
        : getAllNFTs();
    }

    // When showOnlyOwned is true, filter NFT collections by actual ownership
    const ownedCollections = nftBalances
      .filter(nft => nft.totalOwned > 0)
      .map(nft => ({
        ...nft,
        address: nft.address,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        totalOwned: nft.totalOwned
      }));

    if (!searchQuery) {
      return ownedCollections;
    }

    // Filter owned collections by search query
    return ownedCollections.filter(nft =>
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nft.description && nft.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, selectedCategory, showOnlyOwned, nftBalances]);

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAssetClick = (asset: KnownToken | KnownNFT | NFTWithMetadata, type: 'token' | 'nft' | 'individual_nft') => {
    onAssetSelect({ type, data: asset });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg text-left transition-colors ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-20 bg-white dark:bg-gray-800'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-3">
          {selectedAsset ? (
            <>
              {/* Asset Logo/Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selectedAsset.type === 'token' 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30' 
                  : 'bg-purple-100 dark:bg-purple-900/30'
              }`}>
                {selectedAsset.type === 'token' ? (
                  (selectedAsset.data as KnownToken).logo ? (
                    <img
                      src={(selectedAsset.data as KnownToken).logo}
                      alt={(selectedAsset.data as KnownToken).symbol}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null
                ) : (
                  (selectedAsset.type === 'nft' && isKnownNFT(selectedAsset.data) && selectedAsset.data.image) ? (
                    <img
                      src={selectedAsset.data.image}
                      alt={getDisplayName(selectedAsset)}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (selectedAsset.type === 'individual_nft' && isNFTWithMetadata(selectedAsset.data) && selectedAsset.data.metadata?.image) ? (
                    <img
                      src={selectedAsset.data.metadata.image}
                      alt={getDisplayName(selectedAsset)}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null
                )}
                {/* Fallback Icon */}
                {selectedAsset.type === 'token' ? (
                  <Coins className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${
                    (selectedAsset.data as KnownToken).logo ? 'hidden' : ''
                  }`} />
                ) : (
                  <Image className={`w-4 h-4 text-purple-600 dark:text-purple-400 ${
                    (selectedAsset.type === 'nft' && isKnownNFT(selectedAsset.data) && selectedAsset.data.image) || 
                    (selectedAsset.type === 'individual_nft' && isNFTWithMetadata(selectedAsset.data) && selectedAsset.data.metadata?.image) ? 'hidden' : ''
                  }`} />
                )}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">{getDisplayName(selectedAsset)}</span>
                    {selectedAsset.type === 'token' && isKnownToken(selectedAsset.data) && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                        ({selectedAsset.data.symbol})
                      </span>
                    )}
                  </div>
                {/* Show balance/description on second line */}
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {selectedAsset.type === 'token' && (() => {
                    const tokenBalance = tokenBalances.find(t => 
                      t.address.toLowerCase() === selectedAsset.data.address.toLowerCase()
                    );
                    if (tokenBalance) {
                      return `${tokenBalance.formattedBalance} ${tokenBalance.symbol} • ${getDisplayDescription(selectedAsset) || 'Token'}`;
                    }
                    return getDisplayDescription(selectedAsset);
                  })()}
                  {selectedAsset.type === 'nft' && (() => {
                    const nftBalance = nftBalances.find(n => 
                      n.address.toLowerCase() === selectedAsset.data.address.toLowerCase()
                    );
                    if (nftBalance) {
                      return `${nftBalance.totalOwned} owned • ${getDisplayDescription(selectedAsset) || 'NFT Collection'}`;
                    }
                    return getDisplayDescription(selectedAsset);
                  })()}
                  {selectedAsset.type === 'individual_nft' && getDisplayDescription(selectedAsset)}
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              {/* Tabs */}
              {assetType === 'both' && (
                <div className="flex mb-3">
                  <button
                    onClick={() => setActiveTab('token')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-l-lg border ${
                      activeTab === 'token'
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Coins className="w-4 h-4 inline mr-1" />
                    Tokens
                  </button>
                  <button
                    onClick={() => setActiveTab('nft')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-r-lg border-l-0 border ${
                      activeTab === 'nft'
                        ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Image className="w-4 h-4 inline mr-1" />
                    NFTs
                  </button>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Content */}
            <div className="max-h-64 overflow-y-auto">
              {activeTab === 'token' ? (
                <div className="p-2">
                  {sortedTokens.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Coins className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p>{showOnlyOwned ? 'No owned tokens found' : 'No tokens found'}</p>
                      {showOnlyOwned && (
                        <p className="text-sm mt-1">Connect wallet to see your tokens</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {sortedTokens.map((token) => (
                        <button
                          key={token.address}
                          onClick={() => handleAssetClick(token, 'token')}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            {token.logo ? (
                              <img
                                src={token.logo}
                                alt={token.symbol}
                                className="w-6 h-6 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Coins className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium text-gray-900 dark:text-white truncate">{token.name}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">({token.symbol})</span>
                                {token.verified && (
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex-shrink-0 ml-2">
                                {token.formattedBalance} {token.symbol}
                              </span>
                            </div>
                            {token.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{token.description}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2">
                  {filteredNFTs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Image className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p>{showOnlyOwned ? 'No owned NFT collections found' : 'No NFT collections found'}</p>
                      {showOnlyOwned && (
                        <p className="text-sm mt-1">Connect wallet to see your NFTs</p>
                      )}
                    </div>
                  ) : (
                    <NFTList
                      filteredNFTs={filteredNFTs}
                      onAssetClick={handleAssetClick}
                      userAddress={address}
                    />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 