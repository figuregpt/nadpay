import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther, decodeEventLog } from 'viem';
import { usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';

// V4 WORKING contract address - fully functional with admin controls
const RAFFLE_V4_FAST_CONTRACT_ADDRESS = "0xa874905B117242eC6c966E35B18985e9242Bb633" as `0x${string}`; // WORKING Contract

// Import the V4 Working ABI
import WorkingABI from './working-abi.json';

// Export the contract configuration
export const NADRAFFLE_V4_FAST_CONTRACT = {
  address: RAFFLE_V4_FAST_CONTRACT_ADDRESS,
  abi: WorkingABI,
} as const;

export function useNadRaffleV4FastContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createRaffle = async (params: {
    title: string;
    description: string;
    rewardType: 'TOKEN' | 'NFT';
    rewardTokenAddress: string;
    rewardAmount: string;
    ticketPaymentToken: string;
    ticketPrice: string;
    maxTickets: number;
    duration: number; // in seconds
    autoDistributeOnSoldOut: boolean;
  }) => {
    const ticketPriceInWei = parseEther(params.ticketPrice);
    const rewardTypeEnum = params.rewardType === 'TOKEN' ? 0 : 1;
    
    // Convert reward amount based on type
    let rewardAmountBigInt: bigint;
    if (params.rewardType === 'TOKEN') {
      rewardAmountBigInt = parseEther(params.rewardAmount);
    } else {
      rewardAmountBigInt = BigInt(params.rewardAmount);
    }

    // Handle ticket payment token address (empty string means native MON)
    const ticketPaymentTokenAddress = params.ticketPaymentToken || '0x0000000000000000000000000000000000000000';
    
    // Calculate msg.value based on reward type and token address
    let msgValue = BigInt(0);
    
    if (params.rewardType === 'TOKEN' && params.rewardTokenAddress === '0x0000000000000000000000000000000000000000') {
      // Native MON reward - add reward amount to msg.value
      msgValue = rewardAmountBigInt;
    } else if (params.rewardType === 'NFT') {
      // NFT rewards don't need msg.value (contract rejects it)
      msgValue = BigInt(0);
    }
    
    // Ultra-Secure contract createRaffle parameters:
    // (title, description, rewardType, rewardTokenAddress, rewardAmount, ticketPrice, ticketPaymentToken, maxTickets, duration, autoDistributeOnSoldOut)
    return writeContract({
      address: RAFFLE_V4_FAST_CONTRACT_ADDRESS,
      abi: WorkingABI,
      functionName: 'createRaffle',
      args: [
        params.title,
        params.description,
        rewardTypeEnum,
        params.rewardTokenAddress as `0x${string}`,
        rewardAmountBigInt,
        ticketPriceInWei,
        ticketPaymentTokenAddress as `0x${string}`,
        BigInt(params.maxTickets),
        BigInt(params.duration),
        params.autoDistributeOnSoldOut,
      ],
      value: msgValue,
    });
  };

  const getRaffleIdFromTransaction = async (txHash: `0x${string}`) => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      
      if (log.address.toLowerCase() === RAFFLE_V4_FAST_CONTRACT_ADDRESS.toLowerCase()) {
          if (log.topics && log.topics.length > 1) {
            try {
              const raffleIdHex = log.topics[1];
              if (!raffleIdHex) {
                throw new Error('RaffleId topic is undefined');
              }
              const raffleId = parseInt(raffleIdHex, 16);
              {
              } catch (error) {
      console.error('Error extracting raffle ID from transaction:', error);
      throw error;
    }
  };

  return {
    createRaffle,
    getRaffleIdFromTransaction,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Read hooks for dashboard
export function useTotalRafflesV3() {
  return useReadContract({
    address: RAFFLE_V4_FAST_CONTRACT_ADDRESS,
    abi: WorkingABI,
    functionName: 'getTotalRaffles',
  });
}

export function useRaffleV3(raffleId: number) {
  return useReadContract({
    address: RAFFLE_V4_FAST_CONTRACT_ADDRESS,
    abi: WorkingABI,
    functionName: 'getRaffle',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId >= 0,
      refetchInterval: 5000, // Auto refetch every 5 seconds
    },
  });
}

export function useCreatorRafflesV3(creatorAddress?: string) {
  const [raffles, setRaffles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const publicClient = usePublicClient();
  
  const refetch = async () => {
    if (!creatorAddress || !publicClient) return;
    
    setLoading(true);
    try {
      // Get total raffles to know how many to check
      const totalRaffles = await publicClient.readContract({
        address: RAFFLE_V4_FAST_CONTRACT_ADDRESS,
        abi: WorkingABI,
        functionName: 'getTotalRaffles',
      }) as bigint;

      const creatorRaffles: any[] = [];
      
      // Check each raffle to see if creator matches
      for (let i = 0; i < Number(totalRaffles); i++) {
        try {
          const raffle = await publicClient.readContract({
            address: RAFFLE_V4_FAST_CONTRACT_ADDRESS,
            abi: WorkingABI,
            functionName: 'getRaffle',
            args: [BigInt(i)],
          });
          
          // Format the raffle data
          const formattedRaffle = formatRaffleV3(raffle);
          
          // Check if this raffle belongs to the creator
          if (formattedRaffle.creator.toLowerCase() === creatorAddress.toLowerCase()) {
            creatorRaffles.push({
              ...formattedRaffle,
              id: i.toString(), // Add string ID for compatibility
              internalId: i, // Keep numeric ID for contract calls
            });
          }
        } catch (error) {
          console.error(`Error fetching raffle ${i}:`, error);
          // Continue with next raffle
        }
      }
      
      setRaffles(creatorRaffles);
    } catch (error) {
      console.error('Error fetching creator raffles:', error);
      setRaffles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [creatorAddress, publicClient]);

  return {
    data: raffles,
    isLoading: loading,
    refetch,
  };
}

// V4 Fast contract raffle struct:
// {id, creator, title, description, rewardType, rewardTokenAddress, rewardAmount, ticketPrice, ticketPaymentToken, maxTickets, ticketsSold, totalEarned, expirationTime, autoDistributeOnSoldOut, winner, status, rewardClaimed, createdAt}
export interface RaffleV3 {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  rewardType: number;
  rewardTokenAddress: string;
  rewardAmount: bigint;
  ticketPrice: bigint;
  ticketPaymentToken: string;
  maxTickets: bigint;
  ticketsSold: bigint;
  totalEarned: bigint;
  expirationTime: bigint;
  autoDistributeOnSoldOut: boolean;
  winner: string;
  status: number;
  rewardClaimed: boolean;
  createdAt: bigint;
}

export function formatRaffleV3(rawRaffle: unknown): RaffleV3 {
  ) {
    dataArray = rawRaffle;
  } else if (rawRaffle && typeof rawRaffle === 'object') {
    // If it's an object, try to extract values
    const obj = rawRaffle as any;
    // Try to convert object to array based on V4 Fast struct properties
    dataArray = [
      obj.id || obj[0] || BigInt(0),
      obj.creator || obj[1] || '0x0000000000000000000000000000000000000000',
      obj.title || obj[2] || '',
      obj.description || obj[3] || '',
      obj.rewardType !== undefined ? obj.rewardType : (obj[4] !== undefined ? obj[4] : 0),
      obj.rewardTokenAddress || obj[5] || '0x0000000000000000000000000000000000000000',
      obj.rewardAmount || obj[6] || BigInt(0),
      obj.ticketPrice || obj[7] || BigInt(0),
      obj.ticketPaymentToken || obj[8] || '0x0000000000000000000000000000000000000000',
      obj.maxTickets || obj[9] || BigInt(0),
      obj.ticketsSold || obj[10] || BigInt(0),
      obj.totalEarned || obj[11] || BigInt(0),
      obj.expirationTime || obj[12] || BigInt(0),
      obj.autoDistributeOnSoldOut !== undefined ? obj.autoDistributeOnSoldOut : (obj[13] !== undefined ? obj[13] : false),
      obj.winner || obj[14] || '0x0000000000000000000000000000000000000000',
      obj.status !== undefined ? obj.status : (obj[15] !== undefined ? obj[15] : 0),
      obj.rewardClaimed !== undefined ? obj.rewardClaimed : (obj[16] !== undefined ? obj[16] : false),
      obj.createdAt || obj[17] || BigInt(0),
    ];
  } else {
    console.error('🔥 formatRaffleV3 - Unexpected data type:', rawRaffle);
    throw new Error(`Invalid raffle data structure - got ${typeof rawRaffle}: ${JSON.stringify(rawRaffle)}`);
  }
  
  if (dataArray.length < 18) {
    console.error('🔥 formatRaffleV3 - Array too short:', dataArray.length, 'expected 18');
    console.error('🔥 formatRaffleV3 - Data:', dataArray);
    throw new Error(`Invalid raffle data structure - array length ${dataArray.length}, expected 18`);
  }

  return result;
}

export function formatPriceV3Raffle(priceInWei: bigint | undefined | null): string {
  if (!priceInWei) return '0';
  return formatEther(priceInWei);
} 