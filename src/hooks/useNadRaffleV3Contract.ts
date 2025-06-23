import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';

// V3 contract address
const RAFFLE_V3_CONTRACT_ADDRESS = "0x3F0F22132a0A3864B5CD0F79D211Bf28511A76f0" as `0x${string}`;

// Complete V3 ABI from deployment file
const RAFFLE_V3_ABI = [
  {"type":"constructor","stateMutability":"undefined","payable":false,"inputs":[]},
  {"type":"error","name":"OwnableInvalidOwner","inputs":[{"type":"address","name":"owner"}]},
  {"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"type":"address","name":"account"}]},
  {"type":"error","name":"ReentrancyGuardReentrantCall","inputs":[]},
  {"type":"event","anonymous":false,"name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","indexed":true},{"type":"address","name":"newOwner","indexed":true}]},
  {"type":"event","anonymous":false,"name":"PlatformFeeUpdated","inputs":[{"type":"uint256","name":"newFee","indexed":false}]},
  {"type":"event","anonymous":false,"name":"RaffleCancelled","inputs":[{"type":"uint256","name":"raffleId","indexed":true},{"type":"address","name":"creator","indexed":true}]},
  {"type":"event","anonymous":false,"name":"RaffleCreated","inputs":[{"type":"uint256","name":"raffleId","indexed":true},{"type":"address","name":"creator","indexed":true},{"type":"string","name":"title","indexed":false},{"type":"uint8","name":"rewardType","indexed":false},{"type":"address","name":"rewardTokenAddress","indexed":false},{"type":"uint256","name":"rewardAmount","indexed":false},{"type":"address","name":"ticketPaymentToken","indexed":false},{"type":"uint256","name":"ticketPrice","indexed":false},{"type":"uint256","name":"maxTickets","indexed":false},{"type":"uint256","name":"expirationTime","indexed":false}]},
  {"type":"event","anonymous":false,"name":"RaffleEnded","inputs":[{"type":"uint256","name":"raffleId","indexed":true},{"type":"address","name":"winner","indexed":true},{"type":"uint256","name":"winningTicket","indexed":false},{"type":"bytes32","name":"randomHash","indexed":false}]},
  {"type":"event","anonymous":false,"name":"RewardClaimed","inputs":[{"type":"uint256","name":"raffleId","indexed":true},{"type":"address","name":"winner","indexed":true},{"type":"uint8","name":"rewardType","indexed":false},{"type":"uint256","name":"amount","indexed":false}]},
  {"type":"event","anonymous":false,"name":"TicketPurchased","inputs":[{"type":"uint256","name":"raffleId","indexed":true},{"type":"address","name":"buyer","indexed":true},{"type":"uint256","name":"ticketNumber","indexed":false},{"type":"address","name":"paymentToken","indexed":false},{"type":"uint256","name":"amount","indexed":false},{"type":"bytes32","name":"randomSeed","indexed":false}]},
  {"type":"function","name":"MAX_FEE","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},
  {"type":"function","name":"cancelRaffle","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"raffleId"}],"outputs":[]},
  {"type":"function","name":"claimReward","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"raffleId"}],"outputs":[]},
  {"type":"function","name":"createRaffle","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"string","name":"title"},{"type":"string","name":"description"},{"type":"string","name":"imageHash"},{"type":"uint8","name":"rewardType"},{"type":"address","name":"rewardTokenAddress"},{"type":"uint256","name":"rewardAmount"},{"type":"address","name":"ticketPaymentToken"},{"type":"uint256","name":"ticketPrice"},{"type":"uint256","name":"maxTickets"},{"type":"uint256","name":"maxTicketsPerWallet"},{"type":"uint256","name":"expirationTime"},{"type":"bool","name":"autoDistributeOnSoldOut"}],"outputs":[{"type":"uint256","name":""}]},
  {"type":"function","name":"endRaffle","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"raffleId"}],"outputs":[]},
  {"type":"function","name":"forceEndExpiredRaffle","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"raffleId"}],"outputs":[]},
  {"type":"function","name":"getRaffle","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"raffleId"}],"outputs":[{"type":"tuple","name":"","components":[{"type":"uint256","name":"id"},{"type":"address","name":"creator"},{"type":"string","name":"title"},{"type":"string","name":"description"},{"type":"string","name":"imageHash"},{"type":"uint8","name":"rewardType"},{"type":"address","name":"rewardTokenAddress"},{"type":"uint256","name":"rewardAmount"},{"type":"address","name":"ticketPaymentToken"},{"type":"uint256","name":"ticketPrice"},{"type":"uint256","name":"maxTickets"},{"type":"uint256","name":"maxTicketsPerWallet"},{"type":"uint256","name":"expirationTime"},{"type":"bool","name":"autoDistributeOnSoldOut"},{"type":"uint256","name":"ticketsSold"},{"type":"uint256","name":"totalEarned"},{"type":"address","name":"winner"},{"type":"uint8","name":"status"},{"type":"uint256","name":"createdAt"},{"type":"bool","name":"rewardClaimed"}]}]},
  {"type":"function","name":"getRaffleTickets","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"raffleId"}],"outputs":[{"type":"tuple[]","name":"","components":[{"type":"uint256","name":"raffleId"},{"type":"address","name":"buyer"},{"type":"uint256","name":"ticketNumber"},{"type":"uint256","name":"purchaseTime"},{"type":"bytes32","name":"randomSeed"}]}]},
  {"type":"function","name":"getTotalRaffles","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},
  {"type":"function","name":"getUserRaffles","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"user"}],"outputs":[{"type":"uint256[]","name":""}]},
  {"type":"function","name":"getUserTickets","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"raffleId"},{"type":"address","name":"user"}],"outputs":[{"type":"uint256","name":""}]},
  {"type":"function","name":"isRaffleExpired","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"raffleId"}],"outputs":[{"type":"bool","name":""}]},
  {"type":"function","name":"owner","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"address","name":""}]},
  {"type":"function","name":"platformFeePercentage","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256","name":""}]},
  {"type":"function","name":"purchaseTickets","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"uint256","name":"raffleId"},{"type":"uint256","name":"quantity"}],"outputs":[]},
  {"type":"function","name":"raffleTickets","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":""},{"type":"uint256","name":""}],"outputs":[{"type":"uint256","name":"raffleId"},{"type":"address","name":"buyer"},{"type":"uint256","name":"ticketNumber"},{"type":"uint256","name":"purchaseTime"},{"type":"bytes32","name":"randomSeed"}]},
  {"type":"function","name":"raffles","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":""}],"outputs":[{"type":"uint256","name":"id"},{"type":"address","name":"creator"},{"type":"string","name":"title"},{"type":"string","name":"description"},{"type":"string","name":"imageHash"},{"type":"uint8","name":"rewardType"},{"type":"address","name":"rewardTokenAddress"},{"type":"uint256","name":"rewardAmount"},{"type":"address","name":"ticketPaymentToken"},{"type":"uint256","name":"ticketPrice"},{"type":"uint256","name":"maxTickets"},{"type":"uint256","name":"maxTicketsPerWallet"},{"type":"uint256","name":"expirationTime"},{"type":"bool","name":"autoDistributeOnSoldOut"},{"type":"uint256","name":"ticketsSold"},{"type":"uint256","name":"totalEarned"},{"type":"address","name":"winner"},{"type":"uint8","name":"status"},{"type":"uint256","name":"createdAt"},{"type":"bool","name":"rewardClaimed"}]},
  {"type":"function","name":"renounceOwnership","constant":false,"payable":false,"inputs":[],"outputs":[]},
  {"type":"function","name":"setPlatformFee","constant":false,"payable":false,"inputs":[{"type":"uint256","name":"newFeePercentage"}],"outputs":[]},
  {"type":"function","name":"ticketsPurchasedByWallet","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":""},{"type":"address","name":""}],"outputs":[{"type":"uint256","name":""}]},
  {"type":"function","name":"transferOwnership","constant":false,"payable":false,"inputs":[{"type":"address","name":"newOwner"}],"outputs":[]},
  {"type":"function","name":"userRaffles","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":""},{"type":"uint256","name":""}],"outputs":[{"type":"uint256","name":""}]},
  {"type":"function","name":"withdrawERC20PlatformFees","constant":false,"payable":false,"inputs":[{"type":"address","name":"token"}],"outputs":[]},
  {"type":"function","name":"withdrawPlatformFees","constant":false,"payable":false,"inputs":[],"outputs":[]}
] as const;

// Export the contract configuration
export const NADRAFFLE_V3_CONTRACT = {
  address: RAFFLE_V3_CONTRACT_ADDRESS,
  abi: RAFFLE_V3_ABI,
} as const;

export function useNadRaffleV3Contract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createRaffle = async (params: {
    title: string;
    description: string;
    imageHash: string;
    rewardType: 'TOKEN' | 'NFT';
    rewardTokenAddress: string;
    rewardAmount: string;
    ticketPaymentToken: string;
    ticketPrice: string;
    maxTickets: number;
    maxTicketsPerWallet: number;
    expirationTime: number;
    autoDistributeOnSoldOut: boolean;
  }) => {
    const ticketPriceInWei = parseEther(params.ticketPrice);
    const rewardTypeEnum = params.rewardType === 'TOKEN' ? 0 : 1;
    
    // Convert reward amount based on type
    let rewardAmountBigInt: bigint;
    if (params.rewardType === 'TOKEN') {
      // For tokens, parse as ether (18 decimals) - might need adjustment based on token decimals
      rewardAmountBigInt = parseEther(params.rewardAmount);
    } else {
      // For NFTs, use token ID as is
      rewardAmountBigInt = BigInt(params.rewardAmount);
    }

    // Handle ticket payment token address (empty string means native MON)
    const ticketPaymentTokenAddress = params.ticketPaymentToken || '0x0000000000000000000000000000000000000000';
    
    // Calculate msg.value based on reward type and token address
    let msgValue = parseEther("0.001"); // Base creation fee
    
    if (params.rewardType === 'TOKEN' && params.rewardTokenAddress === '0x0000000000000000000000000000000000000000') {
      // Native MON reward - add reward amount to msg.value
      msgValue = msgValue + rewardAmountBigInt;
    }
    
    console.log('useNadRaffleV3Contract: createRaffle called with:', {
      ...params,
      ticketPriceInWei: ticketPriceInWei.toString(),
      rewardTypeEnum,
      rewardAmountBigInt: rewardAmountBigInt.toString(),
      ticketPaymentTokenAddress,
      msgValue: msgValue.toString(),
      contractAddress: RAFFLE_V3_CONTRACT_ADDRESS
    });
    
    return writeContract({
      address: RAFFLE_V3_CONTRACT_ADDRESS,
      abi: RAFFLE_V3_ABI,
      functionName: 'createRaffle',
      args: [
        params.title,
        params.description,
        params.imageHash,
        rewardTypeEnum,
        params.rewardTokenAddress as `0x${string}`,
        rewardAmountBigInt,
        ticketPaymentTokenAddress as `0x${string}`,
        ticketPriceInWei,
        BigInt(params.maxTickets),
        BigInt(params.maxTicketsPerWallet),
        BigInt(params.expirationTime),
        params.autoDistributeOnSoldOut,
      ],
      value: msgValue, // Dynamic value based on reward type
    });
  };

  const getRaffleIdFromTransaction = async (txHash: `0x${string}`) => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      
      // Look for RaffleCreated event in logs
      const raffleCreatedEvent = receipt.logs.find(log => 
        log.address.toLowerCase() === RAFFLE_V3_CONTRACT_ADDRESS.toLowerCase()
      );

      if (raffleCreatedEvent && raffleCreatedEvent.topics && raffleCreatedEvent.topics[1]) {
        // Extract raffle ID from event topics
        const raffleId = parseInt(raffleCreatedEvent.topics[1], 16);
        return raffleId;
      }

      throw new Error('Raffle creation event not found');
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
    address: RAFFLE_V3_CONTRACT_ADDRESS,
    abi: RAFFLE_V3_ABI,
    functionName: 'getTotalRaffles',
  });
}

export function useRaffleV3(raffleId: number) {
  return useReadContract({
    address: RAFFLE_V3_CONTRACT_ADDRESS,
    abi: RAFFLE_V3_ABI,
    functionName: 'getRaffle',
    args: raffleId >= 0 ? [BigInt(raffleId)] : undefined,
    query: {
      enabled: raffleId >= 0,
    }
  });
}

export function useCreatorRafflesV3(creatorAddress?: string) {
  const publicClient = usePublicClient();
  const [raffles, setRaffles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    if (!creatorAddress || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      // First get raffle IDs
      const raffleIds = await publicClient.readContract({
        address: RAFFLE_V3_CONTRACT_ADDRESS,
        abi: RAFFLE_V3_ABI,
        functionName: 'getUserRaffles',
        args: [creatorAddress as `0x${string}`],
      }) as bigint[];

      console.log('🎫 Creator Raffle IDs (V3):', raffleIds.map(id => id.toString()));

      // Then get each raffle's details
      const rafflePromises = raffleIds.map(async (raffleId) => {
        const raffle = await publicClient.readContract({
          address: RAFFLE_V3_CONTRACT_ADDRESS,
          abi: RAFFLE_V3_ABI,
          functionName: 'getRaffle',
          args: [raffleId],
        });
        return formatRaffleV3(raffle);
      });

      const raffleDetails = await Promise.all(rafflePromises);
      setRaffles(raffleDetails);
      console.log('🎫 Formatted Creator Raffles (V3):', raffleDetails);

    } catch (err) {
      console.error('Error fetching creator raffles V3:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [creatorAddress]);

  return { raffles, isLoading, error, refetch };
}

export interface RaffleV3 {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  imageHash: string;
  rewardType: number;
  rewardTokenAddress: string;
  rewardAmount: bigint;
  ticketPaymentToken: string;
  ticketPrice: bigint;
  maxTickets: bigint;
  maxTicketsPerWallet: bigint;
  expirationTime: bigint;
  autoDistributeOnSoldOut: boolean;
  ticketsSold: bigint;
  totalEarned: bigint;
  winner: string;
  status: number;
  createdAt: bigint;
  rewardClaimed: boolean;
}

export function formatRaffleV3(rawRaffle: unknown): RaffleV3 {
  const raffle = rawRaffle as any;
  return {
    id: raffle.id || raffle[0] || BigInt(0),
    creator: raffle.creator || raffle[1] || '0x0000000000000000000000000000000000000000',
    title: raffle.title || raffle[2] || '',
    description: raffle.description || raffle[3] || '',
    imageHash: raffle.imageHash || raffle[4] || '',
    rewardType: raffle.rewardType !== undefined ? raffle.rewardType : (raffle[5] !== undefined ? raffle[5] : 0),
    rewardTokenAddress: raffle.rewardTokenAddress || raffle[6] || '0x0000000000000000000000000000000000000000',
    rewardAmount: raffle.rewardAmount || raffle[7] || BigInt(0),
    ticketPaymentToken: raffle.ticketPaymentToken || raffle[8] || '0x0000000000000000000000000000000000000000',
    ticketPrice: raffle.ticketPrice || raffle[9] || BigInt(0),
    maxTickets: raffle.maxTickets || raffle[10] || BigInt(0),
    maxTicketsPerWallet: raffle.maxTicketsPerWallet || raffle[11] || BigInt(0),
    expirationTime: raffle.expirationTime || raffle[12] || BigInt(0),
    autoDistributeOnSoldOut: raffle.autoDistributeOnSoldOut !== undefined ? raffle.autoDistributeOnSoldOut : (raffle[13] !== undefined ? raffle[13] : false),
    ticketsSold: raffle.ticketsSold || raffle[14] || BigInt(0),
    totalEarned: raffle.totalEarned || raffle[15] || BigInt(0),
    winner: raffle.winner || raffle[16] || '0x0000000000000000000000000000000000000000',
    status: raffle.status !== undefined ? raffle.status : (raffle[17] !== undefined ? raffle[17] : 0),
    createdAt: raffle.createdAt || raffle[18] || BigInt(0),
    rewardClaimed: raffle.rewardClaimed !== undefined ? raffle.rewardClaimed : (raffle[19] !== undefined ? raffle[19] : false),
  };
}

export function formatPriceV3Raffle(priceInWei: bigint | undefined | null): string {
  if (!priceInWei) return '0';
  return formatEther(priceInWei);
} 