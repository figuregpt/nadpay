import { useState, useEffect } from 'react';
import { usePublicClient, useBlockNumber } from 'wagmi';

export function useBlockchainTime() {
  const [blockchainTime, setBlockchainTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const publicClient = usePublicClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  useEffect(() => {
    const getBlockchainTime = async () => {
      if (!publicClient) {
        setError('No public client available');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Get the latest block to get accurate blockchain time
        const block = await publicClient.getBlock({ blockTag: 'latest' });
        const blockTimestamp = Number(block.timestamp);
        
        // Log blockchain time for debugging
        console.log('🕐 Blockchain time synced:', {
          blockTime: new Date(blockTimestamp * 1000).toLocaleString(),
          localTime: new Date().toLocaleString(),
          difference: blockTimestamp - Math.floor(Date.now() / 1000)
        });
        
        setBlockchainTime(blockTimestamp);
      } catch (err) {
        console.error('❌ Error fetching blockchain time:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch blockchain time');
        // Fallback to UTC time if blockchain time fetch fails
        setBlockchainTime(Math.floor(Date.now() / 1000));
      } finally {
        setIsLoading(false);
      }
    };

    getBlockchainTime();
  }, [publicClient, blockNumber]);

  // Return current blockchain time (estimated) and utilities
  const getCurrentBlockchainTime = () => {
    if (!blockchainTime) return Math.floor(Date.now() / 1000);
    
    // Estimate current time based on last known blockchain time
    // Add estimated time passed (blocks are ~2 seconds on most chains)
    const timeSinceLastUpdate = Math.floor(Date.now() / 1000) - blockchainTime;
    return blockchainTime + timeSinceLastUpdate;
  };

  const getMinimumExpirationTime = (minutesFromNow: number = 60) => {
    const currentTime = getCurrentBlockchainTime();
    // Add the full duration requested - buffer is only for validation, not duration calculation
    return currentTime + (minutesFromNow * 60);
  };

  const formatBlockchainTimeForInput = (timestamp: number) => {
    // Convert blockchain timestamp to local datetime-local input format
    const date = new Date(timestamp * 1000);
    // Use toISOString but convert to local timezone for display
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const getMinimumDateTimeForInput = () => {
    // Get minimum time with tolerance for UI (1 hour for better UX)
    const currentTime = getCurrentBlockchainTime();
    const minimumTimestamp = currentTime + (60 * 60); // 1 hour buffer
    return formatBlockchainTimeForInput(minimumTimestamp);
  };

  const parseInputTimeToBlockchain = (datetimeLocalValue: string) => {
    // Convert datetime-local input to blockchain timestamp
    // The input is in local timezone, we need to convert to UTC timestamp
    const localDate = new Date(datetimeLocalValue);
    return Math.floor(localDate.getTime() / 1000);
  };

      return {
      blockchainTime,
      isLoading,
      error,
      getCurrentBlockchainTime,
      getMinimumExpirationTime,
      formatBlockchainTimeForInput,
      getMinimumDateTimeForInput,
      parseInputTimeToBlockchain,
      // Utility to check if a timestamp is valid (more lenient - just contract requirement)
      isValidExpirationTime: (timestamp: number) => {
        const currentTime = getCurrentBlockchainTime();
        const minimumBuffer = 60 * 60 + 5; // 1 hour 5 seconds (contract requirement + tiny safety)
        return timestamp > currentTime + minimumBuffer;
      }
    };
} 