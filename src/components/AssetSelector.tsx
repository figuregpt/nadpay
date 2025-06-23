"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle, Coins, Image, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KnownToken,
  KnownNFT,
  getAllTokens,
  getAllNFTs,
  searchTokens,
  searchNFTs,
  getTokensByCategory,
  getNFTsByCategory,
  TOKEN_CATEGORIES,
  NFT_CATEGORIES
} from '../lib/knownAssets';

export interface SelectedAsset {
  type: 'token' | 'nft';
  data: KnownToken | KnownNFT;
}

interface AssetSelectorProps {
  selectedAsset: SelectedAsset | null;
  onAssetSelect: (asset: SelectedAsset | null) => void;
  assetType?: 'token' | 'nft' | 'both';
  placeholder?: string;
  disabled?: boolean;
}

export function AssetSelector({
  selectedAsset,
  onAssetSelect,
  assetType = 'both',
  placeholder = 'Select an asset...',
  disabled = false
}: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'token' | 'nft'>(assetType === 'nft' ? 'nft' : 'token');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get all assets (admin curated only)
  const allTokens = getAllTokens();
  const allNFTs = getAllNFTs();

  // Filter assets based on search and category
  const filteredTokens = searchQuery
    ? searchTokens(searchQuery)
    : selectedCategory
    ? getTokensByCategory(selectedCategory as keyof typeof TOKEN_CATEGORIES)
    : allTokens;

  const filteredNFTs = searchQuery
    ? searchNFTs(searchQuery)
    : selectedCategory
    ? getNFTsByCategory(selectedCategory as keyof typeof NFT_CATEGORIES)
    : allNFTs;

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

  const handleAssetClick = (asset: KnownToken | KnownNFT, type: 'token' | 'nft') => {
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
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-20'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center gap-3">
          {selectedAsset ? (
            <>
              {selectedAsset.type === 'token' ? (
                <Coins className="w-5 h-5 text-indigo-600" />
              ) : (
                <Image className="w-5 h-5 text-purple-600" />
              )}
              <div>
                <div className="font-medium">
                  {selectedAsset.data.name}
                  {selectedAsset.type === 'token' && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({(selectedAsset.data as KnownToken).symbol})
                    </span>
                  )}
                </div>
                {selectedAsset.data.description && (
                  <div className="text-sm text-gray-500 truncate">
                    {selectedAsset.data.description}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              {/* Tabs */}
              {assetType === 'both' && (
                <div className="flex mb-3">
                  <button
                    onClick={() => setActiveTab('token')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-l-lg border ${
                      activeTab === 'token'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <Coins className="w-4 h-4 inline mr-1" />
                    Tokens
                  </button>
                  <button
                    onClick={() => setActiveTab('nft')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-r-lg border-l-0 border ${
                      activeTab === 'nft'
                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <Image className="w-4 h-4 inline mr-1" />
                    NFTs
                  </button>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Content */}
            <div className="max-h-64 overflow-y-auto">
              {activeTab === 'token' ? (
                <div className="p-2">
                  {filteredTokens.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Coins className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No tokens found</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredTokens.map((token) => (
                        <button
                          key={token.address}
                          onClick={() => handleAssetClick(token, 'token')}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
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
                              <Coins className="w-5 h-5 text-indigo-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{token.name}</span>
                              <span className="text-sm text-gray-500">({token.symbol})</span>
                              {token.verified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            {token.description && (
                              <p className="text-sm text-gray-500 truncate">{token.description}</p>
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
                    <div className="text-center py-8 text-gray-500">
                      <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No NFT collections found</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredNFTs.map((nft) => (
                        <button
                          key={nft.address}
                          onClick={() => handleAssetClick(nft, 'nft')}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center overflow-hidden">
                            {nft.image ? (
                              <img
                                src={nft.image}
                                alt={nft.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Image className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{nft.name}</span>
                              {nft.verified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            {nft.description && (
                              <p className="text-sm text-gray-500 truncate">{nft.description}</p>
                            )}
                            {nft.floorPrice && (
                              <p className="text-sm text-gray-600">Floor: {nft.floorPrice} MON</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
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