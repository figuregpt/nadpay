'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { NADRAFFLE_CONTRACT, REWARD_TYPES, RAFFLE_STATUS, type Raffle } from '@/lib/raffle-contract';

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
      writeContract({
        address: NADRAFFLE_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_CONTRACT.abi,
        functionName: 'createRaffle',
        args: [
          title,
          description,
          imageHash,
          REWARD_TYPES[rewardType],
          rewardTokenAddress as `0x${string}`,
          parseEther(rewardAmount),
          parseEther(ticketPrice),
          BigInt(maxTickets),
          BigInt(maxTicketsPerWallet),
          BigInt(expirationTime),
          autoDistributeOnSoldOut,
        ],
        value: parseEther(creationFee),
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
      writeContract({
        address: NADRAFFLE_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_CONTRACT.abi,
        functionName: 'endRaffle',
        args: [BigInt(raffleId)],
      });
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
      writeContract({
        address: NADRAFFLE_CONTRACT.address as `0x${string}`,
        abi: NADRAFFLE_CONTRACT.abi,
        functionName: 'cancelRaffle',
        args: [BigInt(raffleId)],
      });
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
    
    // Constants
    REWARD_TYPES,
    RAFFLE_STATUS,
  };
} 