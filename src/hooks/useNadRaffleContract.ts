import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { usePublicClient } from 'wagmi';

// For now, using a placeholder contract address - should be updated with actual deployed address
const RAFFLE_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

// Minimal ABI for raffle creation - should be expanded with actual contract ABI
const RAFFLE_ABI = [
  {
    "inputs": [
      { "name": "title", "type": "string" },
      { "name": "description", "type": "string" },
      { "name": "imageHash", "type": "string" },
      { "name": "rewardType", "type": "uint8" },
      { "name": "rewardTokenAddress", "type": "address" },
      { "name": "rewardAmount", "type": "uint256" },
      { "name": "ticketPrice", "type": "uint256" },
      { "name": "maxTickets", "type": "uint256" },
      { "name": "maxTicketsPerWallet", "type": "uint256" },
      { "name": "expirationTime", "type": "uint256" },
      { "name": "autoDistributeOnSoldOut", "type": "bool" }
    ],
    "name": "createRaffle",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

export function useNadRaffleContract() {
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
    
    return writeContract({
      address: RAFFLE_CONTRACT_ADDRESS,
      abi: RAFFLE_ABI,
      functionName: 'createRaffle',
      args: [
        params.title,
        params.description,
        params.imageHash,
        rewardTypeEnum,
        params.rewardTokenAddress as `0x${string}`,
        rewardAmountBigInt,
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
        log.address.toLowerCase() === RAFFLE_CONTRACT_ADDRESS.toLowerCase()
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