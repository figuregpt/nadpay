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
    
    console.log('V7 createRaffle called with:', {
      ticketPrice,
      ticketPaymentToken,
      maxTickets,
      duration,
      rewardType,
      rewardTokenAddress,
      rewardTokenId,
      creationFee,
      ticketPriceInWei: ticketPriceInWei.toString(),
      rewardTokenIdBigInt: rewardTokenIdBigInt.toString(),
      msgValue: msgValue.toString(),
    });
    
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
      
      console.log('🔍 V7 Transaction receipt logs:', receipt.logs.length);
      console.log('🔍 V7 Contract address:', RAFFLE_V7_CONTRACT_ADDRESS);
      
      // Find the RaffleCreated event log
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`🔍 Log ${i}:`, {
          address: log.address,
          topics: log.topics?.length || 0,
        });
        
        if (log.address.toLowerCase() === RAFFLE_V7_CONTRACT_ADDRESS.toLowerCase()) {
          console.log('✅ Found log from V7 contract');
          
          // Try manual topic parsing - RaffleCreated has raffleId as first indexed parameter (topics[1])
          if (log.topics && log.topics.length > 1) {
            try {
              const raffleIdHex = log.topics[1];
              if (!raffleIdHex) {
                throw new Error('RaffleId topic is undefined');
              }
              const raffleId = parseInt(raffleIdHex, 16);
              console.log('✅ Extracted V7 raffle ID from topics:', raffleId);
              
              // Verify this looks reasonable (should be a small number)
              if (raffleId >= 0 && raffleId < 1000000) {
                // Track points here immediately when ID is extracted
                console.log('🎯 TRACKING POINTS IN HOOK:', { txHash, raffleId });
                
                // Direct API call to track points - no component dependency
                try {
                  // First check if user has Twitter connected
                  const userAddress = txHash; // We'll extract from transaction
                  
                  // Get the transaction to extract the sender address
                  const transaction = await publicClient.getTransaction({ hash: txHash });
                  const creatorAddress = transaction.from;
                  console.log('🔍 Creator address from transaction:', creatorAddress);
                  
                  // Check Twitter connection
                  const profileResponse = await fetch(`/api/profile/${creatorAddress}`);
                  const profileData = await profileResponse.json();
                  
                  if (profileData.profile?.twitter) {
                    console.log('✅ Twitter verified, tracking points...');
                    
                    // Call points API directly
                    const pointsResponse = await fetch('/api/points/add', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        walletAddress: creatorAddress,
                        type: 'nadraffle_create',
                        amount: '0',
                        txHash: txHash,
                        twitterHandle: profileData.profile.twitter.username,
                        metadata: { raffleId: raffleId.toString() }
                      }),
                    });
                    
                    const pointsResult = await pointsResponse.json();
                    console.log('🎉 POINTS API RESULT:', pointsResult);
                  } else {
                    console.log('❌ No Twitter connection found for creator');
                  }
                } catch (pointsError) {
                  console.error('❌ Points tracking failed in hook:', pointsError);
                }
                
                return raffleId;
              }
            } catch (topicError) {
              console.log('❌ Failed to parse from topics:', topicError);
            }
          }
        }
      }

      throw new Error('V7 Raffle creation event not found');
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
  console.log('🔍 formatRaffleV7 received rawRaffle:', rawRaffle);
  console.log('🔍 rawRaffle type:', typeof rawRaffle);
  console.log('🔍 rawRaffle isArray:', Array.isArray(rawRaffle));
  
  // V7 contract returns a struct (object), not an array
  if (!rawRaffle || typeof rawRaffle !== 'object') {
    console.error('❌ Invalid V7 raffle data: not an object:', rawRaffle);
    throw new Error('Invalid V7 raffle data structure');
  }

  const raffle = rawRaffle as any;
  
  // Log the object properties to understand the structure
  console.log('🔍 raffle properties:', Object.keys(raffle));
  console.log('🔍 raffle values:', {
    creator: raffle.creator,
    ticketPrice: raffle.ticketPrice?.toString(),
    ticketPaymentToken: raffle.ticketPaymentToken,
    maxTickets: raffle.maxTickets?.toString(),
    soldTickets: raffle.soldTickets?.toString(),
    startTime: raffle.startTime?.toString(),
    endTime: raffle.endTime?.toString(),
    rewardAmount: raffle.rewardAmount?.toString(),
    rewardType: raffle.rewardType,
    rewardTokenAddress: raffle.rewardTokenAddress,
    rewardTokenId: raffle.rewardTokenId?.toString(),
    state: raffle.state,
    winner: raffle.winner
  });

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
      console.log('❌ useCreatorRafflesV7: Missing requirements:', { 
        creatorAddress: !!creatorAddress, 
        publicClient: !!publicClient, 
        totalRaffles: totalRaffles?.toString() 
      });
      return;
    }

    console.log('🎯 useCreatorRafflesV7: Starting fetch for creator:', creatorAddress);
    console.log('🎫 Total Raffles:', totalRaffles.toString());

    setIsLoading(true);
    setError(null);
    
    try {
      const raffleCount = Number(totalRaffles);
      const creatorRaffles: RaffleInfoV7[] = [];

      // Check each raffle to see if it was created by this user (V7 uses 0-based indexing)
      for (let i = 0; i < raffleCount; i++) {
        try {
          console.log(`🔍 Checking raffle ${i}...`);
          
          const raffleData = await publicClient.readContract({
            address: RAFFLE_V7_CONTRACT_ADDRESS,
            abi: V7ABI,
            functionName: 'getRaffleDetails',
            args: [BigInt(i)],
          }) as any;

          console.log(`  Raffle ${i} creator:`, raffleData.creator, 'vs', creatorAddress);

          // Check if this raffle was created by the target creator
          if (raffleData.creator?.toLowerCase() === creatorAddress.toLowerCase()) {
            console.log(`✅ Found raffle ${i} created by user`);
            
            const formattedRaffle = formatRaffleV7(raffleData);
            // Add the raffle ID to the data
            const raffleWithId = {
              ...formattedRaffle,
              raffleId: i, // Add raffle ID for reference
            };
            
            console.log(`➕ Adding raffle ${i} to creator raffles:`, raffleWithId);
            creatorRaffles.push(raffleWithId as RaffleInfoV7);
          }
        } catch (error) {
          console.error(`❌ Error fetching raffle ${i}:`, error);
        }
      }

      console.log('📊 Final creator raffles:', creatorRaffles);
      setRaffles(creatorRaffles);
      
    } catch (error) {
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