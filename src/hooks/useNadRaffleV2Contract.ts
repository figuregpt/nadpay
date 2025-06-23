import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';

// V2 contract address
const RAFFLE_V2_CONTRACT_ADDRESS = "0x136bC59567f12a49F8485f3E76CbAd13f3bB56cF" as `0x${string}`;

// Complete V2 ABI from deployment file
const RAFFLE_V2_ABI = [
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

export function useNadRaffleV2Contract() {
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
    
    console.log('useNadRaffleV2Contract: createRaffle called with:', {
      ...params,
      ticketPriceInWei: ticketPriceInWei.toString(),
      rewardTypeEnum,
      rewardAmountBigInt: rewardAmountBigInt.toString(),
      ticketPaymentTokenAddress,
      contractAddress: RAFFLE_V2_CONTRACT_ADDRESS
    });
    
    return writeContract({
      address: RAFFLE_V2_CONTRACT_ADDRESS,
      abi: RAFFLE_V2_ABI,
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
      value: parseEther("0.001"), // Creation fee
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
        log.address.toLowerCase() === RAFFLE_V2_CONTRACT_ADDRESS.toLowerCase()
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
export function useTotalRafflesV2() {
  return useReadContract({
    address: RAFFLE_V2_CONTRACT_ADDRESS,
    abi: RAFFLE_V2_ABI,
    functionName: 'getTotalRaffles',
  });
}

export function useRaffleV2(raffleId: number) {
  return useReadContract({
    address: RAFFLE_V2_CONTRACT_ADDRESS,
    abi: RAFFLE_V2_ABI,
    functionName: 'getRaffle',
    args: raffleId >= 0 ? [BigInt(raffleId)] : undefined,
    query: {
      enabled: raffleId >= 0,
    }
  });
}

export function useCreatorRafflesV2(creatorAddress?: string) {
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
        address: RAFFLE_V2_CONTRACT_ADDRESS,
        abi: RAFFLE_V2_ABI,
        functionName: 'getUserRaffles',
        args: [creatorAddress as `0x${string}`],
      }) as bigint[];

      console.log('🎫 Creator Raffle IDs:', raffleIds.map(id => id.toString()));

      // Then get each raffle's details
      const rafflePromises = raffleIds.map(async (raffleId) => {
        const raffle = await publicClient.readContract({
          address: RAFFLE_V2_CONTRACT_ADDRESS,
          abi: RAFFLE_V2_ABI,
          functionName: 'getRaffle',
          args: [raffleId],
        });
        return Object.assign(raffle as any, { id: Number(raffleId) });
      });

      const raffleDetails = await Promise.all(rafflePromises);
      console.log('🎫 Creator Raffle Details:', raffleDetails);
      
      setRaffles(raffleDetails);
    } catch (err) {
      console.error('❌ Error fetching creator raffles:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (creatorAddress) {
      refetch();
    }
  }, [creatorAddress]);

  return {
    data: raffles,
    isLoading,
    error,
    refetch,
  };
}

// Interface for V2 raffle data
export interface RaffleV2 {
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

// Helper functions
export function formatRaffleV2(rawRaffle: unknown): RaffleV2 {
  const raffle = rawRaffle as any;
  return {
    id: BigInt(raffle.id || 0),
    creator: raffle.creator,
    title: raffle.title,
    description: raffle.description,
    imageHash: raffle.imageHash,
    rewardType: Number(raffle.rewardType),
    rewardTokenAddress: raffle.rewardTokenAddress,
    rewardAmount: BigInt(raffle.rewardAmount),
    ticketPaymentToken: raffle.ticketPaymentToken,
    ticketPrice: BigInt(raffle.ticketPrice),
    maxTickets: BigInt(raffle.maxTickets),
    maxTicketsPerWallet: BigInt(raffle.maxTicketsPerWallet),
    expirationTime: BigInt(raffle.expirationTime),
    autoDistributeOnSoldOut: raffle.autoDistributeOnSoldOut,
    ticketsSold: BigInt(raffle.ticketsSold),
    totalEarned: BigInt(raffle.totalEarned),
    winner: raffle.winner,
    status: Number(raffle.status),
    createdAt: BigInt(raffle.createdAt),
    rewardClaimed: raffle.rewardClaimed,
  };
}

export function formatPriceV2Raffle(priceInWei: bigint | undefined | null): string {
  if (!priceInWei) return '0';
  return formatEther(priceInWei);
} 