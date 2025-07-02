import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { NADPAY_CONTRACT, type PaymentLink, type Purchase } from '@/lib/contract';
import { usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';

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

// Hook to get creator payment links with real contract data
export function useCreatorPaymentLinks(creatorAddress?: string) {
  const { data: linkIds, isLoading: loadingIds, error: errorIds, refetch: refetchIds } = useCreatorLinks(creatorAddress);
  const publicClient = usePublicClient();
  
  const [paymentLinksData, setPaymentLinksData] = useState<any[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [errorLinks, setErrorLinks] = useState<any>(null);

  useEffect(() => {
    if (!linkIds || linkIds.length === 0 || !publicClient) {
      setPaymentLinksData([]);
      return;
    }

    const fetchAllLinks = async () => {
      setIsLoadingLinks(true);
      setErrorLinks(null);
      
      try {
        const promises = (linkIds as bigint[]).map(async (linkId) => {
          try {
            // Get payment link details
            const linkResult = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'getPaymentLink',
              args: [linkId]
            });
            
                         // Get purchases for this link to calculate unique buyers
             let uniqueBuyersCount = 0;
             try {
               const purchasesResult = await publicClient.readContract({
                 address: CONTRACT_ADDRESS,
                 abi: CONTRACT_ABI,
                 functionName: 'getPurchases',
                 args: [linkId]
               });
               
               // Calculate unique buyers from purchases
               if (purchasesResult && Array.isArray(purchasesResult)) {
                 const uniqueBuyers = new Set();
                 purchasesResult.forEach((purchase: any) => {
                   if (purchase?.buyer) {
                     uniqueBuyers.add(purchase.buyer);
                   }
                 });
                 uniqueBuyersCount = uniqueBuyers.size;
               }
             } catch (purchaseError) {
               console.error(`Error fetching purchases for link ${linkId}:`, purchaseError);
               // If we can't get purchases, keep uniqueBuyersCount as 0
             }
            
            return {
              ...linkResult,
              linkId: Number(linkId),
              uniqueBuyersCount
            };
          } catch (error) {
            console.error(`Error fetching link ${linkId}:`, error);
            return null;
          }
        });

        const results = await Promise.all(promises);
        const validResults = results.filter(result => result !== null);
        setPaymentLinksData(validResults);
      } catch (error) {
        console.error('Error fetching payment links:', error);
        setErrorLinks(error);
        setPaymentLinksData([]);
      } finally {
        setIsLoadingLinks(false);
      }
    };

    fetchAllLinks();
  }, [linkIds, publicClient]);

  return {
    data: paymentLinksData,
    isLoading: loadingIds || isLoadingLinks,
    error: errorIds || errorLinks,
    refetch: () => {
      refetchIds();
    }
  };
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
  const publicClient = usePublicClient();
  
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
    expiresAt: number; // Unix timestamp, 0 means never expires
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
        BigInt(params.expiresAt),
      ],
    });
  };

  // Function to get link ID from transaction receipt
  const getLinkIdFromTransaction = async (txHash: `0x${string}`) => {
    if (!publicClient) return null;
    
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      
      // PaymentLinkCreated event signature: PaymentLinkCreated(uint256 indexed linkId, address indexed creator, string title, uint256 price, uint256 totalSales, uint256 maxPerWallet)
      const eventSignature = '0x8f4e3b2e1f3c9d0a8b7e6f5c4d3a2b1e0f9c8d7a6b5e4f3c2d1a0b9e8f7c6d5a4b3e2f1c0d9a8b7e6f5c4d3a2b1';
      
      // Find PaymentLinkCreated event
      const linkCreatedEvent = receipt.logs.find(log => {
        // For now, let's use a simpler approach - find the log with linkId as first topic
        return log.topics.length >= 2 && log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase();
      });
      
      if (linkCreatedEvent && linkCreatedEvent.topics[1]) {
        // Link ID is the first indexed parameter (topics[1])
        const linkId = parseInt(linkCreatedEvent.topics[1], 16);
        return linkId;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting link ID from transaction:', error);
      return null;
    }
  };

  return {
    createPaymentLink,
    getLinkIdFromTransaction,
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
export function formatPaymentLink(rawLink: unknown): PaymentLink & { linkId: number; uniqueBuyersCount?: number } {
  const link = rawLink as PaymentLink & { uniqueBuyersCount?: number };
  
  // Handle potential undefined/null values
  return {
    linkId: 0, // Will be set by caller
    creator: link?.creator || '',
    title: link?.title || '',
    description: link?.description || '',
    coverImage: link?.coverImage || '',
    price: link?.price || BigInt(0),
    totalSales: link?.totalSales || BigInt(0),
    maxPerWallet: link?.maxPerWallet || BigInt(0),
    salesCount: link?.salesCount || BigInt(0),
    totalEarned: link?.totalEarned || BigInt(0),
    isActive: link?.isActive || false,
    createdAt: link?.createdAt || BigInt(0),

    uniqueBuyersCount: link?.uniqueBuyersCount || 0, // Preserve uniqueBuyersCount
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
export function formatPrice(priceInWei: bigint | undefined | null): string {
  if (!priceInWei) return '0';
  return formatEther(priceInWei);
}

// Helper to parse price from MON to wei
export function parsePrice(priceInMON: string): bigint {
  return parseEther(priceInMON);
} 