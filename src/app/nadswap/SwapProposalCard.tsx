'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNFTMetadata } from '@/hooks/useNFTMetadata';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User,
  ArrowRight,
  Image as ImageIcon,
  Coins,
  ChevronDown,
  ChevronUp,
  Calendar,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Package,
  Hash,
  Plus,
  Zap
} from 'lucide-react';
import { SwapProposalV3 } from '@/hooks/useNadSwapV3Contract';

interface SwapProposalCardProps {
  proposal: SwapProposalV3;
  onAccept?: (proposalId: number) => void;
  onCancel?: (proposalId: number) => void;
  isAccepting?: boolean;
  isCancelling?: boolean;
  isApprovingNFT?: boolean;
  isApprovingToken?: boolean;
  currentUserAddress?: string;
}

// NFT Image Component with metadata fetching
function NFTImage({ asset }: { asset: any }) {
  const { metadata, isLoading } = useNFTMetadata(asset.contractAddress, asset.tokenId.toString());
  
  // Function to open MagicEden page
  const openMagicEden = () => {
    const magicEdenUrl = `https://magiceden.io/item-details/monad-testnet/${asset.contractAddress}/${asset.tokenId}`;
    window.open(magicEdenUrl, '_blank', 'noopener,noreferrer');
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center animate-pulse">
        <RefreshCw className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 animate-spin" />
      </div>
    );
  }
  
  if (metadata?.image) {
    return (
      <div 
        className="relative group cursor-pointer w-full h-full" 
        onClick={openMagicEden}
        title={`View ${metadata.name || `NFT #${asset.tokenId}`} on MagicEden`}
      >
        <img
          src={metadata.image}
          alt={metadata.name || `NFT #${asset.tokenId}`}
          className="w-full h-full rounded-lg object-cover shadow-sm transition-transform group-hover:scale-105"
          onError={(e) => {
            }
  
  return (
    <div 
      className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 transition-transform"
      onClick={openMagicEden}
      title={`View NFT #${asset.tokenId} on MagicEden`}
    >
      <ImageIcon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
    </div>
  );
}

export default function SwapProposalCard({
  proposal,
  onAccept,
  onCancel,
  isAccepting = false,
  isCancelling = false,
  isApprovingNFT = false,
  isApprovingToken = false,
  currentUserAddress
}: SwapProposalCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isProposer = currentUserAddress?.toLowerCase() === proposal.proposer.toLowerCase();
  const isTarget = currentUserAddress?.toLowerCase() === proposal.targetWallet.toLowerCase();
  const timeRemaining = Math.max(0, proposal.deadline * 1000 - Date.now());
  const isExpired = timeRemaining <= 0;
  
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Expired';
    
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusConfig = () => {
    if (proposal.isAccepted) return {
      color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      icon: <CheckCircle className="w-4 h-4" />,
      text: 'Completed',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
    };
    if (proposal.isExpired || isExpired) return {
      color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
      icon: <XCircle className="w-4 h-4" />,
      text: 'Expired',
      bgGradient: 'from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10'
    };
    return {
      color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      icon: <Clock className="w-4 h-4" />,
      text: 'Active',
      bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10'
    };
  };

  const statusConfig = getStatusConfig();

  const AssetCard = ({ asset, type }: { asset: any; type: 'offering' | 'requesting' }) => (
    <div className={`p-3 rounded-xl border-2 transition-all ${
      type === 'offering' 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700' 
        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700'
    }`}>
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-dark-800 shadow-sm flex items-center justify-center overflow-hidden border">
              {asset.image ? (
                <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
              ) : asset.isNFT ? (
            <ImageIcon className="w-6 h-6 text-gray-400" />
              ) : (
            <Coins className="w-6 h-6 text-gray-400" />
              )}
            </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {asset.name || asset.symbol || (asset.isNFT ? `NFT #${asset.tokenId}` : 'Unknown Token')}
          </h4>
              {!asset.isNFT && asset.amount !== '0' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {asset.amount} {asset.symbol || 'TOKEN'}
            </p>
          )}
          {asset.isNFT && asset.symbol && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
              {asset.symbol}
                </p>
              )}
          {asset.isNFT && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
              <Sparkles className="w-3 h-3 mr-1" />
              NFT
            </span>
          )}
          </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br ${statusConfig.bgGradient} rounded-2xl border-2 border-gray-200 dark:border-dark-700 overflow-hidden hover:shadow-xl transition-all duration-300 w-full`}
    >
      {/* Responsive Layout */}
      <div className="flex flex-col lg:flex-row items-stretch">
        {/* Left: Status & Info */}
        <div className="flex-shrink-0 lg:w-64 p-3 lg:p-6 lg:pr-4 flex flex-col justify-between">
          <div className="space-y-2 lg:space-y-4">
            <div className="flex items-center justify-between lg:block">
              <div className={`inline-flex items-center space-x-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full border ${statusConfig.color}`}>
                {statusConfig.icon}
                <span className="text-xs lg:text-sm font-semibold">{statusConfig.text}</span>
              </div>
              <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white lg:hidden">#{proposal.id}</p>
            </div>
            <div className="hidden lg:block">
              <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">#{proposal.id}</p>
              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{formatTimeRemaining(timeRemaining)}</span>
          </div>
        </div>
            <div className="lg:hidden flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatTimeRemaining(timeRemaining)}</span>
        </div>
      </div>

          {/* Trading Parties - More Compact on Mobile */}
          <div className="flex lg:flex-col lg:space-y-4 space-x-3 lg:space-x-0 mt-2 lg:mt-6">
            <div className="flex items-center space-x-1.5 lg:space-x-3 flex-1 lg:flex-none">
              <div className="w-5 h-5 lg:w-8 lg:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="w-2.5 h-2.5 lg:w-4 lg:h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">From</p>
                <p className="font-mono text-xs lg:text-sm font-medium truncate">
                  {proposal.proposer.slice(0, 4)}...{proposal.proposer.slice(-3)}
                </p>
            {isProposer && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                You
              </span>
            )}
          </div>
            </div>
            
            <div className="flex items-center space-x-1.5 lg:space-x-3 flex-1 lg:flex-none">
              <div className="w-5 h-5 lg:w-8 lg:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <User className="w-2.5 h-2.5 lg:w-4 lg:h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">To</p>
                <p className="font-mono text-xs lg:text-sm font-medium truncate">
                  {proposal.targetWallet.slice(0, 4)}...{proposal.targetWallet.slice(-3)}
                </p>
            {isTarget && (
                  <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full dark:bg-green-900/20 dark:text-green-400">
                You
              </span>
            )}
              </div>
          </div>
        </div>
      </div>

        {/* Right: Trading Assets - More Compact Layout */}
        <div className="flex-1 p-3 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-12 space-y-3 lg:space-y-0 h-full">
            {/* Offering Section */}
            <div className="flex-1 space-y-2 lg:space-y-6">
              <div className="flex items-center space-x-1.5 lg:space-x-3">
                <div className="w-6 h-6 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
                </div>
        <div>
                  <h3 className="font-bold text-sm lg:text-lg text-gray-900 dark:text-white">
                    {isProposer ? 'You offered' : 'Offering'}
                  </h3>
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{proposal.offeredAssets.length} item{proposal.offeredAssets.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              {/* Smaller Asset Grid for Mobile */}
              <div className="grid grid-cols-3 lg:grid-cols-3 gap-1.5 lg:gap-4">
                {Array.from({ length: showDetails ? Math.min(proposal.offeredAssets.length, 9) : 3 }).map((_, index) => {
                  const asset = proposal.offeredAssets[index];
                  if (asset && asset.isNFT) {
                    : asset.image ? (
                              <img
                                src={asset.image}
                                alt={asset.name || 'Asset'}
                                className="w-6 h-6 lg:w-12 lg:h-12 rounded-lg object-cover shadow-sm"
                                onError={(e) => {
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    e.currentTarget.style.display = 'none';
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
                                <Coins className="w-3 h-3 lg:w-6 lg:h-6 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="text-center space-y-0.5 px-0.5">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate" title={asset.name}>
                              {asset.name ? asset.name.slice(0, 8) + (asset.name.length > 8 ? '...' : '') : (asset.isNFT ? `#${asset.tokenId}` : 'Token')}
                            </p>
                            {!asset.isNFT && asset.amount && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">
                                {parseFloat(asset.amount).toFixed(1)} {asset.symbol?.slice(0, 4) || ''}
              </p>
            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <Plus className="w-4 h-4 lg:w-8 lg:h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Show more indicator - More compact */}
              {!showDetails && proposal.offeredAssets.length > 3 && (
                <div className="text-center">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                    +{proposal.offeredAssets.length - 3} more
                  </span>
                </div>
              )}
              {showDetails && proposal.offeredAssets.length > 9 && (
                <div className="text-center">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                    +{proposal.offeredAssets.length - 9} more items
                  </span>
                </div>
              )}
            </div>

            {/* VS Divider - Smaller on Mobile */}
            <div className="flex items-center justify-center lg:self-start lg:mt-12">
              <div className="w-8 h-8 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg lg:rounded-2xl flex items-center justify-center shadow-xl">
                <Zap className="w-4 h-4 lg:w-8 lg:h-8 text-white" />
          </div>
        </div>
        
            {/* Requesting Section */}
            <div className="flex-1 space-y-2 lg:space-y-6">
              <div className="flex items-center space-x-1.5 lg:space-x-3">
                <div className="w-6 h-6 lg:w-10 lg:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
                </div>
        <div>
                  <h3 className="font-bold text-sm lg:text-lg text-gray-900 dark:text-white">Requesting</h3>
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{proposal.requestedAssets.length} item{proposal.requestedAssets.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              {/* Smaller Asset Grid for Mobile */}
              <div className="grid grid-cols-3 lg:grid-cols-3 gap-1.5 lg:gap-4">
                {Array.from({ length: showDetails ? Math.min(proposal.requestedAssets.length, 9) : 3 }).map((_, index) => {
                  const asset = proposal.requestedAssets[index];
                  if (asset && asset.isNFT) {
                    : asset.image ? (
                              <img
                                src={asset.image}
                                alt={asset.name || 'Asset'}
                                className="w-6 h-6 lg:w-12 lg:h-12 rounded-lg object-cover shadow-sm"
                                onError={(e) => {
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    e.currentTarget.style.display = 'none';
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                                <Coins className="w-3 h-3 lg:w-6 lg:h-6 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="text-center space-y-0.5 px-0.5">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate" title={asset.name}>
                              {asset.name ? asset.name.slice(0, 8) + (asset.name.length > 8 ? '...' : '') : (asset.isNFT ? `#${asset.tokenId}` : 'Token')}
                            </p>
                            {!asset.isNFT && asset.amount && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">
                                {parseFloat(asset.amount).toFixed(1)} {asset.symbol?.slice(0, 4) || ''}
              </p>
            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <Plus className="w-4 h-4 lg:w-8 lg:h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Show more indicator - More compact */}
              {!showDetails && proposal.requestedAssets.length > 3 && (
                <div className="text-center">
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                    +{proposal.requestedAssets.length - 3} more
                  </span>
                </div>
              )}
              {showDetails && proposal.requestedAssets.length > 9 && (
                <div className="text-center">
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                    +{proposal.requestedAssets.length - 9} more items
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="bg-white/70 dark:bg-dark-800/70 backdrop-blur-sm border-t border-gray-200 dark:border-dark-700 p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
        <button
          onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showDetails ? 'Show Less' : 'Show More'}</span>
        </button>
        
          <div className="flex items-center space-x-2 lg:space-x-3 w-full sm:w-auto">
          {isTarget && proposal.isActive && !isExpired && (
            <button
              onClick={() => onAccept?.(proposal.id)}
                disabled={isAccepting || isApprovingNFT || isApprovingToken}
                className="flex items-center justify-center space-x-2 px-4 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg lg:rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm lg:text-base flex-1 sm:flex-none"
            >
                {isApprovingNFT || isApprovingToken ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Approving Assets...</span>
                    <span className="sm:hidden">Approving...</span>
                  </>
                ) : isAccepting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Accepting Trade...</span>
                    <span className="sm:hidden">Accepting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Accept Trade</span>
                    <span className="sm:hidden">Accept</span>
                  </>
                )}
            </button>
          )}
          
          {isProposer && proposal.isActive && !isExpired && (
            <button
              onClick={() => onCancel?.(proposal.id)}
              disabled={isCancelling}
                className="flex items-center justify-center space-x-2 px-4 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg lg:rounded-xl hover:from-red-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm lg:text-base flex-1 sm:flex-none"
            >
                {isCancelling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Cancelling...</span>
                    <span className="sm:hidden">Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Cancel Trade</span>
                    <span className="sm:hidden">Cancel</span>
                  </>
                )}
            </button>
          )}

            {isExpired && (
              <div className="flex items-center space-x-2 px-3 lg:px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg lg:rounded-xl flex-1 sm:flex-none justify-center">
                <AlertCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Expired</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <AnimatePresence>
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
            className="bg-gray-50 dark:bg-dark-900/50 border-t border-gray-200 dark:border-dark-700 p-4"
        >
            {/* Complete Asset Lists */}
            {(proposal.offeredAssets.length > 9 || proposal.requestedAssets.length > 9) && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Complete Asset Lists</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* All Offered Assets */}
                  {proposal.offeredAssets.length > 9 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2 text-blue-500" />
                        All Offered Assets ({proposal.offeredAssets.length})
                      </h5>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {proposal.offeredAssets.map((asset, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 bg-white dark:bg-dark-800 rounded-lg border">
                            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                              {asset.isNFT ? (
                                <NFTImage asset={asset} />
                              ) : asset.image ? (
                                <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                  <Coins className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {asset.name || (asset.isNFT ? `NFT #${asset.tokenId}` : 'Unknown Token')}
                              </p>
                              {!asset.isNFT && asset.amount && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {asset.amount} {asset.symbol || 'TOKEN'}
                                </p>
                              )}
                              {asset.isNFT && asset.symbol && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{asset.symbol}</p>
                              )}
                            </div>
                            {asset.isNFT && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                NFT
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
          </div>
                  )}
          
                  {/* All Requested Assets */}
                  {proposal.requestedAssets.length > 9 && (
              <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <Package className="w-4 h-4 mr-2 text-purple-500" />
                        All Requested Assets ({proposal.requestedAssets.length})
                      </h5>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {proposal.requestedAssets.map((asset, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 bg-white dark:bg-dark-800 rounded-lg border">
                            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                              {asset.isNFT ? (
                                <NFTImage asset={asset} />
                              ) : asset.image ? (
                                <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                  <Coins className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {asset.name || (asset.isNFT ? `NFT #${asset.tokenId}` : 'Unknown Token')}
                              </p>
                              {!asset.isNFT && asset.amount && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {asset.amount} {asset.symbol || 'TOKEN'}
                                </p>
                              )}
                              {asset.isNFT && asset.symbol && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{asset.symbol}</p>
                              )}
                            </div>
                            {asset.isNFT && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                NFT
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address and Time Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">Proposer Address</span>
          </div>
                <p className="font-mono text-xs bg-white dark:bg-dark-800 p-2 rounded border break-all">
                  {proposal.proposer}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">Target Address</span>
                </div>
                <p className="font-mono text-xs bg-white dark:bg-dark-800 p-2 rounded border break-all">
                  {proposal.targetWallet}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">Expires</span>
                </div>
                <p className="text-xs bg-white dark:bg-dark-800 p-2 rounded border">
                  {new Date(proposal.deadline * 1000).toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">Created</span>
                </div>
                <p className="text-xs bg-white dark:bg-dark-800 p-2 rounded border">
                  {new Date(proposal.createdAt * 1000).toLocaleString()}
                </p>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
} 