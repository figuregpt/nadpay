"use client";

import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function usePersistentWallet() {
  const { address, isConnected, status } = useAccount();
  const { connect, connectors, status: connectStatus } = useConnect();
  const { disconnect } = useDisconnect();
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);

  // Save wallet state to localStorage
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem('nadpay_wallet_connected', 'true');
      localStorage.setItem('nadpay_wallet_address', address);
    }
  }, [isConnected, address]);

  // Only auto-reconnect if user was previously connected
  useEffect(() => {
    if (hasAttemptedReconnect) return;
    
    const attemptReconnect = async () => {
      const wasConnected = localStorage.getItem('nadpay_wallet_connected');
      const savedAddress = localStorage.getItem('nadpay_wallet_address');
      
      // Only try to reconnect if there was a previously connected wallet and not currently connected
      if (wasConnected === 'true' && savedAddress && !isConnected && status === 'disconnected') {
        // Add reconnection logic here if needed
      }
      
      // Always mark as attempted after checking
      setHasAttemptedReconnect(true);
    };

    // Wait briefly, then try to reconnect
    const timer = setTimeout(attemptReconnect, 500);
    
    return () => clearTimeout(timer);
  }, [connect, connectors, isConnected, hasAttemptedReconnect, status]);

  // Clear state on disconnect
  useEffect(() => {
    if (!isConnected && status === 'disconnected') {
      localStorage.removeItem('nadpay_wallet_connected');
      localStorage.removeItem('nadpay_wallet_address');
    }
  }, [isConnected, status]);

  return {
    address,
    isConnected,
    status,
    connectStatus,
    hasAttemptedReconnect,
    disconnect: () => {
      disconnect();
      localStorage.removeItem('nadpay_wallet_connected');
      localStorage.removeItem('nadpay_wallet_address');
    }
  };
} 