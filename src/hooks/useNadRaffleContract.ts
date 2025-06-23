'use client';

import React from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, createPublicClient, http, decodeEventLog } from 'viem';
import { NADRAFFLE_CONTRACT, REWARD_TYPES, RAFFLE_STATUS, type Raffle } from '@/lib/raffle-contract';
import { config, publicClient } from '@/lib/wagmi';

export function useNadRaffleContract() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  // Read functions
  const { data: totalRaffles } = useReadContract({
    address: NADRAFFLE_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_CONTRACT.abi,
    functionName: 'getTotalRaffles',
  });

  const { data: platformFee } = useReadContract({
    address: NADRAFFLE_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_CONTRACT.abi,
    functionName: 'platformFeePercentage',
  });



  // Write functions
  const createRaffle = async ({
    title,
    description,
    imageHash,
    rewardType,
    rewardTokenAddress,
    rewardAmount,
    ticketPrice,
    maxTickets,
    maxTicketsPerWallet,
    expirationTime,
    autoDistributeOnSoldOut,
    creationFee = '0.001'
  }: {
    title: string;
    description: string;
    imageHash: string;
    rewardType: 'TOKEN' | 'NFT';
    rewardTokenAddress: string;
    rewardAmount: string;
    ticketPrice: string;
    maxTickets: number;
    maxTicketsPerWallet: number;
    expirationTime: number;
    autoDistributeOnSoldOut: boolean;
    creationFee?: string;
  }) => {
    try {
      // Additional validation
      if (rewardType === 'TOKEN' && !rewardTokenAddress) {
        throw new Error('Valid token address required for TOKEN reward');
      }
      if (rewardType === 'NFT' && (!rewardTokenAddress || rewardTokenAddress === '0x0000000000000000000000000000000000000000')) {
        throw new Error('Valid NFT address required for NFT reward');
      }
      if (!rewardAmount || parseFloat(rewardAmount) <= 0) {
        throw new Error('Reward amount must be greater than 0');
      }
      
      // Calculate total value needed for MON rewards
      let totalValue = parseEther(creationFee); // Base creation fee
      if (rewardType === 'TOKEN' && rewardTokenAddress === '0x0000000000000000000000000000000000000000') {
        // For native MON rewards, add reward amount to the transaction value
        totalValue = parseEther(creationFee) + parseEther(rewardAmount);
      }
      
      writeContract({
        address: NADRAFFLE_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_CONTRACT.abi,
        functionName: 'createRaffle',
        args: [
          title,
          description,
          imageHash || "",
          REWARD_TYPES[rewardType],
          rewardTokenAddress as `0x${string}`,
          parseEther(rewardAmount),
          parseEther(ticketPrice),
          BigInt(maxTickets),
          BigInt(maxTicketsPerWallet),
          BigInt(expirationTime),
          autoDistributeOnSoldOut,
        ],
        value: totalValue,
      });
    } catch (err) {
      console.error('Error creating raffle:', err);
      throw err;
    }
  };

  const purchaseTickets = async (raffleId: number, quantity: number, ticketPrice: string) => {
    try {
      const totalCost = (parseFloat(ticketPrice) * quantity).toString();
      writeContract({
        address: NADRAFFLE_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_CONTRACT.abi,
        functionName: 'purchaseTickets',
        args: [BigInt(raffleId), BigInt(quantity)],
        value: parseEther(totalCost),
      });
    } catch (err) {
      console.error('Error purchasing tickets:', err);
      throw err;
    }
  };

  const endRaffle = async (raffleId: number) => {
    try {
      console.log('endRaffle hook called with raffleId:', raffleId);
      console.log('Contract address:', NADRAFFLE_CONTRACT.address);
      console.log('writeContract function:', writeContract);
      
      writeContract({
        address: NADRAFFLE_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_CONTRACT.abi,
        functionName: 'endRaffle',
        args: [BigInt(raffleId)],
      });
      
      console.log('writeContract called successfully');
    } catch (err) {
      console.error('Error ending raffle:', err);
      throw err;
    }
  };

  const claimReward = async (raffleId: number) => {
    try {
      writeContract({
        address: NADRAFFLE_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_CONTRACT.abi,
        functionName: 'claimReward',
        args: [BigInt(raffleId)],
      });
    } catch (err) {
      console.error('Error claiming reward:', err);
      throw err;
    }
  };

  const cancelRaffle = async (raffleId: number) => {
    try {
      console.log('cancelRaffle hook called with raffleId:', raffleId);
      console.log('Contract address:', NADRAFFLE_CONTRACT.address);
      
      writeContract({
        address: NADRAFFLE_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_CONTRACT.abi,
        functionName: 'cancelRaffle',
        args: [BigInt(raffleId)],
      });
      
      console.log('cancelRaffle writeContract called successfully');
    } catch (err) {
      console.error('Error cancelling raffle:', err);
      throw err;
    }
  };

  // Utility functions
  const formatRaffleData = (raffle: any): Raffle | null => {
    if (!raffle || !raffle.id) return null;
    
    return {
      id: raffle.id,
      creator: raffle.creator,
      title: raffle.title,
      description: raffle.description,
      imageHash: raffle.imageHash,
      rewardType: raffle.rewardType,
      rewardTokenAddress: raffle.rewardTokenAddress,
      rewardAmount: raffle.rewardAmount,
      ticketPrice: raffle.ticketPrice,
      maxTickets: raffle.maxTickets,
      maxTicketsPerWallet: raffle.maxTicketsPerWallet,
      expirationTime: raffle.expirationTime,
      autoDistributeOnSoldOut: raffle.autoDistributeOnSoldOut,
      ticketsSold: raffle.ticketsSold,
      totalEarned: raffle.totalEarned,
      winner: raffle.winner,
      status: raffle.status,
      createdAt: raffle.createdAt,
      rewardClaimed: raffle.rewardClaimed,
    };
  };

  const getStatusText = (status: number): string => {
    switch (status) {
      case RAFFLE_STATUS.ACTIVE: return 'Active';
      case RAFFLE_STATUS.ENDED: return 'Ended';
      case RAFFLE_STATUS.CANCELLED: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getRewardTypeText = (rewardType: number): string => {
    switch (rewardType) {
      case REWARD_TYPES.TOKEN: return 'Token';
      case REWARD_TYPES.NFT: return 'NFT';
      default: return 'Unknown';
    }
  };

  // Get raffle ID from transaction events
  const getRaffleIdFromTransaction = async (txHash: string): Promise<number | null> => {
    try {
      const publicClient = createPublicClient({
        chain: {
          id: 10143,
          name: 'Monad Testnet',
          nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://testnet-rpc.monad.xyz'] }
          }
        },
        transport: http()
      });

      const receipt = await publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`
      });

      // Look for RaffleCreated event
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === NADRAFFLE_CONTRACT.address.toLowerCase()) {
          try {
            const decoded = decodeEventLog({
              abi: NADRAFFLE_CONTRACT.abi,
              data: log.data,
              topics: log.topics,
            });
            
            if (decoded.eventName === 'RaffleCreated') {
              return Number(decoded.args.raffleId);
            }
          } catch (decodeError) {
            console.log('Could not decode log:', decodeError);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting raffle ID from transaction:', error);
      return null;
    }
  };

  return {
    // Contract data
    totalRaffles,
    platformFee,
    contractAddress: NADRAFFLE_CONTRACT.address,
    

    
    // Write functions
    createRaffle,
    purchaseTickets,
    endRaffle,
    claimReward,
    cancelRaffle,
    
    // Transaction state
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    
    // Utility functions
    formatRaffleData,
    getStatusText,
    getRewardTypeText,
    getRaffleIdFromTransaction,
    
    // Constants
    REWARD_TYPES,
    RAFFLE_STATUS,
  };
}

// Hook to get creator's raffles
export function useCreatorRaffles(creatorAddress?: string) {
  const { data: totalRaffles } = useReadContract({
    address: NADRAFFLE_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_CONTRACT.abi,
    functionName: 'getTotalRaffles',
  });

  // First get the raffle IDs for this user
  const { data: raffleIds, isLoading: loadingIds, refetch } = useReadContract({
    address: NADRAFFLE_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_CONTRACT.abi,
    functionName: 'getUserRaffles',
    args: creatorAddress ? [creatorAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!creatorAddress,
    },
  });

  // Use React state to store all raffle data
  const [rafflesData, setRafflesData] = React.useState<any[]>([]);
  const [loadingRaffles, setLoadingRaffles] = React.useState(false);

  // Fetch all raffle data when we get the IDs
  React.useEffect(() => {
    if (!raffleIds || raffleIds.length === 0) {
      setRafflesData([]);
      return;
    }

    setLoadingRaffles(true);
    
    const fetchRaffles = async () => {
      try {
        const rafflePromises = raffleIds.map(async (id: bigint) => {
          const data = await publicClient.readContract({
            address: NADRAFFLE_CONTRACT.address as `0x${string}`,
            abi: NADRAFFLE_CONTRACT.abi,
            functionName: 'getRaffle',
            args: [id],
          });
          return data;
        });

        const results = await Promise.all(rafflePromises);
        setRafflesData(results);
      } catch (error) {
        console.error('Error fetching raffles:', error);
        setRafflesData([]);
      } finally {
        setLoadingRaffles(false);
      }
    };

    fetchRaffles();
  }, [raffleIds]);

  return {
    data: rafflesData,
    isLoading: loadingIds || loadingRaffles,
    refetch,
    totalRaffles,
    raffleIds,
  };
} 