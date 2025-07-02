import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther, decodeEventLog } from 'viem';
import { usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';

// V7 Multi-Token Payment contract address
const RAFFLE_V7_CONTRACT_ADDRESS = "0xBd32ce277D91b6beD459454C7964528f54A54f75" as `0x${string}`;

// Import the V7 ABI
import V7ABI from '../../NadRaffleV7.abi.json';

// Export the contract configuration
export const NADRAFFLE_V7_CONTRACT = {
  address: RAFFLE_V7_CONTRACT_ADDRESS,
  abi: V7ABI,
} as const;

export function useNadRaffleV7Contract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createRaffle = async (
    ticketPrice: string,
    ticketPaymentToken: string, // New parameter for V7
    maxTickets: number,
    duration: number, // in seconds
    rewardType: number, // 0 = MON_TOKEN, 1 = ERC20_TOKEN, 2 = NFT_TOKEN
    rewardTokenAddress: string,
    rewardTokenId: string, // For NFT this is tokenId, for tokens this is amount
    creationFee: string
  ) => {
    const ticketPriceInWei = parseEther(ticketPrice);
    
    // Convert reward amount/tokenId based on type
    let rewardTokenIdBigInt: bigint;
    if (rewardType === 2) { // NFT
      rewardTokenIdBigInt = BigInt(rewardTokenId); // Token ID
    } else {
      rewardTokenIdBigInt = parseEther(rewardTokenId); // Token amount
    }

    // Creation fee in wei
    const creationFeeInWei = parseEther(creationFee);
    
    // Calculate msg.value (creation fee + reward if MON)
    let msgValue = creationFeeInWei;
    
    if (rewardType === 0) { // MON_TOKEN reward
      msgValue = creationFeeInWei + rewardTokenIdBigInt;
    }
    
    // V7 contract createRaffle parameters:
    // (ticketPrice, ticketPaymentToken, maxTickets, duration, rewardType, rewardTokenAddress, rewardTokenId)
    return writeContract({
      address: RAFFLE_V7_CONTRACT_ADDRESS,
      abi: V7ABI,
      functionName: 'createRaffle',
      args: [
        ticketPriceInWei,
        ticketPaymentToken as `0x${string}`,
        BigInt(maxTickets),
        BigInt(duration),
        rewardType,
        rewardTokenAddress as `0x${string}`,
        rewardTokenIdBigInt,
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
      
      if (log.address.toLowerCase() === RAFFLE_V7_CONTRACT_ADDRESS.toLowerCase()) {
          if (log.topics && log.topics.length > 1) {
            try {
              const raffleIdHex = log.topics[1];
              if (!raffleIdHex) {
                throw new Error('RaffleId topic is undefined');
              }
              const raffleId = parseInt(raffleIdHex, 16);
              // Direct API call to track points - no component dependency
                try {
                  // First check if user has Twitter connected
                  const userAddress = txHash; // We'll extract from transaction
                  
                  // Get the transaction to extract the sender address
                  const transaction = await publicClient.getTransaction({ hash: txHash });
                  const creatorAddress = transaction.from;
                  const profileData = await profileResponse.json();
                  
                  if (profileData.profile?.twitter) {
                    }
                      }),
                    });
                    
                    const pointsResult = await pointsResponse.json();
                    }
                } catch (pointsError) {
                  console.error('❌ Points tracking failed in hook:', pointsError);
                }
                
                return raffleId;
              }
            } catch (topicError) {
              } catch (error) {
      console.error('Error extracting V7 raffle ID from transaction:', error);
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

// V7 Read hooks
export function useCreationFeeV7() {
  return useReadContract({
    address: RAFFLE_V7_CONTRACT_ADDRESS,
    abi: V7ABI,
    functionName: 'creationFee',
  });
}

export function usePlatformFeePercentageV7() {
  return useReadContract({
    address: RAFFLE_V7_CONTRACT_ADDRESS,
    abi: V7ABI,
    functionName: 'platformFeePercentage',  
  });
}

export function useMinRaffleDurationV7() {
  return useReadContract({
    address: RAFFLE_V7_CONTRACT_ADDRESS,
    abi: V7ABI,
    functionName: 'minRaffleDuration',
  });
}

export function useMaxRaffleDurationV7() {
  return useReadContract({
    address: RAFFLE_V7_CONTRACT_ADDRESS,
    abi: V7ABI,
    functionName: 'maxRaffleDuration',
  });
}

export function useRaffleDetailsV7(raffleId: number) {
  return useReadContract({
    address: RAFFLE_V7_CONTRACT_ADDRESS,
    abi: V7ABI,
    functionName: 'getRaffleDetails',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId >= 0,
      refetchInterval: 5000, // Auto refetch every 5 seconds
    },
  });
}

// V7 interface based on contract struct
export interface RaffleInfoV7 {
  creator: string;
  ticketPrice: bigint;
  ticketPaymentToken: string; // New field in V7
  maxTickets: bigint;
  soldTickets: bigint;
  startTime: bigint;
  endTime: bigint;
  rewardAmount: bigint;
  rewardType: number; // 0 = MON_TOKEN, 1 = ERC20_TOKEN, 2 = NFT_TOKEN
  rewardTokenAddress: string;
  rewardTokenId: bigint;
  state: number; // 0 = ACTIVE, 1 = COMPLETED, 2 = CANCELLED, 3 = EMERGENCY
  winner: string;
  raffleId?: number; // Optional raffleId for creator hooks
}

export function formatRaffleV7(rawRaffle: unknown): RaffleInfoV7 {
  );
  // Check if required properties exist
  if (!raffle.creator || !raffle.ticketPrice || !raffle.maxTickets) {
    console.error('❌ Missing required raffle properties:', raffle);
    throw new Error('Invalid V7 raffle data structure - missing properties');
  }

  return {
    creator: raffle.creator as string,
    ticketPrice: BigInt(raffle.ticketPrice.toString()),
    ticketPaymentToken: raffle.ticketPaymentToken as string || '0x0000000000000000000000000000000000000000',
    maxTickets: BigInt(raffle.maxTickets.toString()),
    soldTickets: BigInt(raffle.soldTickets?.toString() || '0'),
    startTime: BigInt(raffle.startTime?.toString() || '0'),
    endTime: BigInt(raffle.endTime?.toString() || '0'),
    rewardAmount: BigInt(raffle.rewardAmount?.toString() || '0'),
    rewardType: Number(raffle.rewardType || 0),
    rewardTokenAddress: raffle.rewardTokenAddress as string || '0x0000000000000000000000000000000000000000',
    rewardTokenId: BigInt(raffle.rewardTokenId?.toString() || '0'),
    state: Number(raffle.state || 0),
    winner: raffle.winner as string || '0x0000000000000000000000000000000000000000',
  };
}

export function formatPriceV7(wei: bigint): string {
  return formatEther(wei);
}

export function parsePriceV7(priceInToken: string): bigint {
  return parseEther(priceInToken);
}

// Read-only hooks
export function useRaffleV7(raffleId: number) {
  return useReadContract({
    address: RAFFLE_V7_CONTRACT_ADDRESS,
    abi: V7ABI,
    functionName: 'getRaffleDetails',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId >= 0,
    }
  });
}

export function useTotalRafflesV7() {
  return useReadContract({
    address: RAFFLE_V7_CONTRACT_ADDRESS,
    abi: V7ABI,
    functionName: 'totalRaffles',
  });
}

export function useActiveRaffleIdsV7() {
  return useReadContract({
    address: RAFFLE_V7_CONTRACT_ADDRESS,
    abi: V7ABI,
    functionName: 'getActiveRaffleIds',
  });
}

// RewardType enum
export const REWARD_TYPES_V7 = {
  MON_TOKEN: 0,
  ERC20_TOKEN: 1,
  NFT_TOKEN: 2
} as const;

// RaffleState enum  
export const RAFFLE_STATES_V7 = {
  ACTIVE: 0,
  SOLD_OUT: 1,
  COMPLETED: 2,
  CANCELLED: 3,
  EMERGENCY: 4
} as const;

// Creator raffles hook for V7
export function useCreatorRafflesV7(creatorAddress?: string) {
  const [raffles, setRaffles] = useState<RaffleInfoV7[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  // Get total raffles to iterate through
  const { data: totalRaffles } = useReadContract({
    address: RAFFLE_V7_CONTRACT_ADDRESS,
    abi: V7ABI,
    functionName: 'totalRaffles',
  });

  const fetchCreatorRaffles = async () => {
    if (!creatorAddress || !publicClient || !totalRaffles) {
      return;
    }

    const raffleData = await publicClient.readContract({
            address: RAFFLE_V7_CONTRACT_ADDRESS,
            abi: V7ABI,
            functionName: 'getRaffleDetails',
            args: [BigInt(i)],
          }) as any;

          // Check if this raffle was created by the target creator
          if (raffleData.creator?.toLowerCase() === creatorAddress.toLowerCase()) {
            const formattedRaffle = formatRaffleV7(raffleData);
            // Add the raffle ID to the data
            const raffleWithId = {
              ...formattedRaffle,
              raffleId: i, // Add raffle ID for reference
            };
            
            creatorRaffles.push(raffleWithId as RaffleInfoV7);
          }
        } catch (error) {
          console.error(`❌ Error fetching raffle ${i}:`, error);
        }
      }

      {
      console.error('❌ Error fetching creator raffles:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatorRaffles();
  }, [creatorAddress, totalRaffles, publicClient]);

  return {
    data: raffles,
    isLoading,
    error,
    refetch: fetchCreatorRaffles,
  };
} 