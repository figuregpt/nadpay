'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useTheme } from "next-themes";
import { 
  ArrowLeftRight, 
  Wallet, 
  Search, 
  Plus, 
  X,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Moon,
  Sun
} from 'lucide-react';
import { useNadSwapV3Contract } from '@/hooks/useNadSwapV3Contract';
import SwapProposalForm from './SwapProposalForm';
import SwapProposalCard from './SwapProposalCard';
import Navbar from '@/components/Navbar';

export default function NadSwapContent() {
  const { isConnected, address } = useAccount();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'create' | 'sent' | 'received'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [sentProposals, setSentProposals] = useState<any[]>([]);
  const [receivedProposals, setReceivedProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingProposal, setAcceptingProposal] = useState<number | null>(null);
  const [cancellingProposal, setCancellingProposal] = useState<number | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const {
    proposalFee,
    totalProposals,
    userProposalIds,
    userReceivedProposalIds,
    getMultipleProposals,
    acceptSwapProposal,
    cancelSwapProposal,
    isApprovingNFT,
    isApprovingToken
  } = useNadSwapV3Contract();

  // Set document title
  useEffect(() => {
    document.title = 'NadSwap - Trade NFTs on Monad';
  }, []);

  // Auto-refresh proposals every 30 seconds
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing proposals...');
      setRefreshTrigger(prev => prev + 1);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [isConnected]);

  // Refresh when totalProposals changes (someone created a new proposal)
  useEffect(() => {
    if (totalProposals > 0) {
      console.log('📊 Total proposals changed:', totalProposals);
      setRefreshTrigger(prev => prev + 1);
    }
  }, [totalProposals]);

  // Manual refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch proposals when tab changes or proposal IDs change
  useEffect(() => {
    const fetchProposals = async () => {
      if (!isConnected) {
        setSentProposals([]);
        setReceivedProposals([]);
        return;
      }
      
      console.log('📊 Proposal IDs:', {
        activeTab,
        userProposalIds: userProposalIds.length,
        userReceivedProposalIds: userReceivedProposalIds.length,
        sentIds: userProposalIds,
        receivedIds: userReceivedProposalIds
      });
      
      // Prevent unnecessary fetches
      if (activeTab === 'sent' && userProposalIds.length === 0) {
        setSentProposals([]);
        return;
      }
      if (activeTab === 'received' && userReceivedProposalIds.length === 0) {
        setReceivedProposals([]);
        return;
      }
      
      setLoading(true);
      try {
        if (activeTab === 'sent' && userProposalIds.length > 0) {
          const proposals = await getMultipleProposals(userProposalIds);
          setSentProposals(proposals);
        } else if (activeTab === 'received' && userReceivedProposalIds.length > 0) {
          const proposals = await getMultipleProposals(userReceivedProposalIds);
          setReceivedProposals(proposals);
        }
      } catch (error) {
        console.error('Error fetching proposals:', error);
        // If it's a rate limit error, don't retry immediately
        if (error instanceof Error && error.message.includes('429')) {
          console.warn('Rate limited, will retry later');
        }
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(fetchProposals, 200);
    return () => clearTimeout(timeoutId);
  }, [activeTab, userProposalIds.length, userReceivedProposalIds.length, isConnected, refreshTrigger]);

  const handleAcceptProposal = useCallback(async (proposalId: number) => {
    try {
      setAcceptingProposal(proposalId);
      console.log('🔄 Attempting to accept proposal:', proposalId);
      await acceptSwapProposal(proposalId);
      console.log('✅ Successfully accepted proposal and confirmed on blockchain:', proposalId);
      
      // Now refresh proposals since transaction is confirmed
      console.log('🔄 Refreshing proposals after accept...');
      if (activeTab === 'received' && userReceivedProposalIds.length > 0) {
        const proposals = await getMultipleProposals(userReceivedProposalIds);
        setReceivedProposals(proposals);
        console.log('✅ Proposals refreshed successfully');
      }
      
    } catch (error) {
      console.error('❌ Error accepting proposal:', error);
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to accept proposal: ${error.message}`);
      } else {
        alert('Failed to accept proposal. Please try again.');
      }
    } finally {
      setAcceptingProposal(null);
    }
  }, [acceptSwapProposal, activeTab, userReceivedProposalIds, getMultipleProposals]);

  const handleCancelProposal = useCallback(async (proposalId: number) => {
    try {
      setCancellingProposal(proposalId);
      await cancelSwapProposal(proposalId);
      // Refresh proposals after successful cancel
      if (activeTab === 'sent' && userProposalIds.length > 0) {
        const proposals = await getMultipleProposals(userProposalIds);
        setSentProposals(proposals);
      }
    } catch (error) {
      console.error('Error cancelling proposal:', error);
    } finally {
      setCancellingProposal(null);
    }
  }, [cancelSwapProposal, activeTab, userProposalIds, getMultipleProposals]);

  // Handler for when a new proposal is created
  const handleProposalCreated = useCallback(() => {
    console.log('🔄 New proposal created, switching to sent tab and refreshing...');
    // Switch to sent tab to show the new proposal
    setActiveTab('sent');
    // Trigger a refresh
    setRefreshTrigger(prev => prev + 1);
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
        <Navbar 
          showTicketsButton={false}
        />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect your wallet to start trading NFTs with other users.
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Navbar 
        showTicketsButton={false}
      />

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'create', label: 'Create Proposal', icon: Plus },
              { id: 'sent', label: `Sent (${userProposalIds.length})`, icon: ArrowLeftRight },
              { id: 'received', label: `Received (${userReceivedProposalIds.length})`, icon: Wallet },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'create' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SwapProposalForm onProposalCreated={handleProposalCreated} />
          </motion.div>
        )}

        {(activeTab === 'sent' || activeTab === 'received') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Search Bar and Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-700 rounded-xl bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowOnlyActive(!showOnlyActive)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    showOnlyActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                      : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
                >
                  <svg 
                    className={`w-4 h-4 transition-colors ${showOnlyActive ? 'text-primary-500' : 'text-gray-400'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {showOnlyActive ? 'Active Only' : 'Show All'}
                  </span>
                </button>
              </div>
            </div>

            {/* Proposals List */}
            <div className="space-y-6">
              {loading ? (
                // Loading state
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 animate-pulse min-h-[400px]">
                    <div className="flex items-stretch h-full">
                      <div className="w-64 pr-4">
                        <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded mb-4"></div>
                        <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-2/3"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded mb-4"></div>
                        <div className="grid grid-cols-6 gap-4">
                          {[...Array(6)].map((_, j) => (
                            <div key={j} className="aspect-square bg-gray-200 dark:bg-dark-700 rounded-xl"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* Sent Proposals */}
                  {activeTab === 'sent' && (
                    <>
                      {sentProposals.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ArrowLeftRight className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No proposals sent yet
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Create your first swap proposal to get started.
                          </p>
                          <button
                            onClick={() => setActiveTab('create')}
                            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Proposal
                          </button>
                        </div>
                      ) : (
                        sentProposals
                          .filter(proposal => {
                            // Apply search filter
                            const matchesSearch = !searchQuery || 
                              proposal.id.toString().includes(searchQuery.toLowerCase()) ||
                              proposal.proposer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              proposal.target.toLowerCase().includes(searchQuery.toLowerCase());
                            
                            // Apply active filter
                            const matchesActiveFilter = !showOnlyActive || proposal.isActive;
                            
                            return matchesSearch && matchesActiveFilter;
                          })
                          .sort((a, b) => b.id - a.id) // Sort by ID descending (newest first)
                          .map((proposal) => (
                            <SwapProposalCard 
                              key={proposal.id} 
                              proposal={proposal}
                              currentUserAddress={address}
                              onCancel={handleCancelProposal}
                              isCancelling={cancellingProposal === proposal.id}
                            />
                          ))
                      )}
                    </>
                  )}

                  {/* Received Proposals */}
                  {activeTab === 'received' && (
                    <>
                      {receivedProposals.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No proposals received yet
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            When someone sends you a swap proposal, it will appear here.
                          </p>
                        </div>
                      ) : (
                        receivedProposals
                          .filter(proposal => {
                            // Apply search filter
                            const matchesSearch = !searchQuery || 
                              proposal.id.toString().includes(searchQuery.toLowerCase()) ||
                              proposal.proposer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              proposal.target.toLowerCase().includes(searchQuery.toLowerCase());
                            
                            // Apply active filter
                            const matchesActiveFilter = !showOnlyActive || proposal.isActive;
                            
                            return matchesSearch && matchesActiveFilter;
                          })
                          .sort((a, b) => b.id - a.id) // Sort by ID descending (newest first)
                          .map((proposal) => (
                            <SwapProposalCard 
                              key={proposal.id} 
                              proposal={proposal}
                              currentUserAddress={address}
                              onAccept={handleAcceptProposal}
                              isAccepting={acceptingProposal === proposal.id}
                              isApprovingNFT={isApprovingNFT}
                              isApprovingToken={isApprovingToken}
                            />
                          ))
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}