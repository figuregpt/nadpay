import { useEffect, useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';

interface PointsTrackerOptions {
  enabled?: boolean;
  twitterHandle?: string;
}

export function usePointsTracker(options: PointsTrackerOptions = {}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isTracking, setIsTracking] = useState(false);
  const { enabled = true, twitterHandle } = options;

  // Award points for a transaction
  const awardPoints = useCallback(async (
    type: 'nadswap' | 'nadpay_buy' | 'nadpay_sell' | 'nadraffle_create' | 'nadraffle_buy' | 'nadraffle_sell',
    amount: string,
    txHash: string,
    metadata?: any
  ) => {
    if (!address) {
      return;
    }

    // Check Twitter connection at the time of the transaction
    let actualTwitterHandle: string;
    try {
      const response = await fetch(`/api/profile/${address}`);
      const data = await response.json();
      
      if (!data.profile?.twitter) {
        return;
      }
      
      actualTwitterHandle = data.profile.twitter.username;
      } catch (error) {
      console.error('❌ Error verifying Twitter connection for points:', error);
      return;
    }

    const payload = {
      walletAddress: address,
      type,
      amount,
      txHash,
      twitterHandle: actualTwitterHandle,
      metadata
    };

    const response = await fetch('/api/points/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to add points');
    }

    const result = await response.json();
    
    if (result.success) {
      return result.points;
    } else {
      console.warn('Failed to award points:', result.error);
      return result;
    }
  }, [address]);

  // Track NadSwap transaction
  const trackNadSwapTransaction = useCallback(async (txHash: string, counterparty?: string) => {
    return awardPoints('nadswap', '0', txHash, { counterparty });
  }, [awardPoints]);

  // Track NadPay purchase
  const trackNadPayPurchase = useCallback(async (txHash: string, amount: string, linkId: string) => {
    return awardPoints('nadpay_buy', amount, txHash, { linkId });
  }, [awardPoints]);

  // Track NadPay sale (for creators)
  const trackNadPaySale = useCallback(async (txHash: string, amount: string, linkId: string) => {
    return awardPoints('nadpay_sell', amount, txHash, { linkId });
  }, [awardPoints]);

  // Track NadRaffle creation
  const trackNadRaffleCreation = useCallback(async (txHash: string, raffleId: string) => {
    return awardPoints('nadraffle_create', '0', txHash, { raffleId });
  }, [awardPoints]);

  // Track NadRaffle ticket purchase
  const trackNadRaffleTicketPurchase = useCallback(async (txHash: string, amount: string, raffleId: string, additionalMetadata?: any) => {
    const metadata = { raffleId, ...additionalMetadata };
    return awardPoints('nadraffle_buy', amount, txHash, metadata);
  }, [awardPoints]);

  // Track NadRaffle ticket sale (for creators)
  const trackNadRaffleTicketSale = useCallback(async (txHash: string, amount: string, raffleId: string) => {
    return awardPoints('nadraffle_sell', amount, txHash, { raffleId });
  }, [awardPoints]);

  // Get user's current points
  const getUserPoints = useCallback(async () => {
    if (!address) return null;

    try {
      const response = await fetch(`/api/points/${address}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching user points:', error);
      return null;
    }
  }, [address]);

  return {
    isTracking,
    trackNadSwapTransaction,
    trackNadPayPurchase,
    trackNadPaySale,
    trackNadRaffleCreation,
    trackNadRaffleTicketPurchase,
    trackNadRaffleTicketSale,
    getUserPoints,
    awardPoints
  };
}

// Helper function to format MON amount from wei
export function formatMonAmount(amountInWei: bigint): string {
  return formatEther(amountInWei);
}

// Helper function to check if user has Twitter connected
export function useTwitterConnected() {
  const { address } = useAccount();
  const [hasTwitter, setHasTwitter] = useState(false);
  const [twitterHandle, setTwitterHandle] = useState<string | undefined>();

  useEffect(() => {
    if (!address) return;

    const checkTwitterConnection = async () => {
      try {
        const response = await fetch(`/api/profile/${address}`);
        const data = await response.json();
        
        if (data.twitter) {
          setHasTwitter(true);
          setTwitterHandle(data.twitter.username);
        } else {
          setHasTwitter(false);
          setTwitterHandle(undefined);
        }
      } catch (error) {
        console.error('Error checking Twitter connection:', error);
        setHasTwitter(false);
        setTwitterHandle(undefined);
      }
    };

    checkTwitterConnection();
  }, [address]);

  return { hasTwitter, twitterHandle };
} 