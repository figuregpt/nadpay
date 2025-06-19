import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { NADPAY_CONTRACT, type PaymentLink, type Purchase } from '@/lib/contract';

// Contract address - will be updated after deployment
const CONTRACT_ADDRESS = NADPAY_CONTRACT.address as `0x${string}`;
const CONTRACT_ABI = NADPAY_CONTRACT.abi;

// Read hooks
export function usePaymentLink(linkId: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPaymentLink',
    args: [BigInt(linkId)],
    query: {
      enabled: linkId >= 0,
    }
  });
}

export function usePaymentLinkPurchases(linkId: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPurchases',
    args: [BigInt(linkId)],
    query: {
      enabled: linkId >= 0,
    }
  });
}

export function useCreatorLinks(creatorAddress?: string) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCreatorLinks',
    args: creatorAddress ? [creatorAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!creatorAddress,
    }
  });
}

export function useUserPurchaseCount(linkId: number, userAddress?: string) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserPurchaseCount',
    args: linkId >= 0 && userAddress ? [BigInt(linkId), userAddress as `0x${string}`] : undefined,
    query: {
      enabled: linkId >= 0 && !!userAddress,
    }
  });
}

export function useTotalLinks() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTotalLinks',
  });
}

// Write hooks
export function useCreatePaymentLink() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createPaymentLink = async (params: {
    title: string;
    description: string;
    coverImage: string;
    price: string; // in MON
    totalSales: number;
    maxPerWallet: number;
  }) => {
    const priceInWei = parseEther(params.price);
    
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createPaymentLink',
      args: [
        params.title,
        params.description,
        params.coverImage,
        priceInWei,
        BigInt(params.totalSales),
        BigInt(params.maxPerWallet),
      ],
    });
  };

  return {
    createPaymentLink,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function usePurchase() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const purchase = async (linkId: number, amount: number, totalPrice: string) => {
    const priceInWei = parseEther(totalPrice);
    
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'purchase',
      args: [BigInt(linkId), BigInt(amount)],
      value: priceInWei,
    });
  };

  return {
    purchase,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useDeactivatePaymentLink() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const deactivatePaymentLink = async (linkId: number) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'deactivatePaymentLink',
      args: [BigInt(linkId)],
    });
  };

  return {
    deactivatePaymentLink,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Utility functions
export function formatPaymentLink(rawLink: unknown): PaymentLink & { linkId: number } {
  const link = rawLink as PaymentLink;
  return {
    linkId: 0, // Will be set by caller
    creator: link.creator,
    title: link.title,
    description: link.description,
    coverImage: link.coverImage,
    price: link.price,
    totalSales: link.totalSales,
    maxPerWallet: link.maxPerWallet,
    salesCount: link.salesCount,
    totalEarned: link.totalEarned,
    isActive: link.isActive,
    createdAt: link.createdAt,
  };
}

export function formatPurchase(rawPurchase: unknown): Purchase {
  const purchase = rawPurchase as Purchase;
  return {
    buyer: purchase.buyer,
    amount: purchase.amount,
    timestamp: purchase.timestamp,
    txHash: purchase.txHash,
  };
}

// Helper to convert price from wei to MON
export function formatPrice(priceInWei: bigint): string {
  return formatEther(priceInWei);
}

// Helper to parse price from MON to wei
export function parsePrice(priceInMON: string): bigint {
  return parseEther(priceInMON);
} 