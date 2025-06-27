import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';

// V2 Ultra-Secure Contract address
const NADPAY_V2_CONTRACT_ADDRESS = "0xfeF2c348d0c8a14b558df27034526d87Ac1f9f25" as `0x${string}`;

// Import ultra-secure ABI
import NADPAY_V2_ULTRA_SECURE_ABI_JSON from '../../NadPayV2-UltraSecure.abi.json';

// V2 Ultra-Secure ABI
const NADPAY_V2_ABI = NADPAY_V2_ULTRA_SECURE_ABI_JSON;

// Old V2 ABI (keeping for reference)
const NADPAY_V2_ABI_OLD = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "linkId",
        "type": "uint256"
      }
    ],
    "name": "PaymentLinkDeactivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "linkId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "paymentToken",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalSales",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxPerWallet",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      }
    ],
    "name": "PaymentLinkCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newFee",
        "type": "uint256"
      }
    ],
    "name": "PlatformFeeUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "linkId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "paymentToken",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "txHash",
        "type": "bytes32"
      }
    ],
    "name": "PurchaseMade",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_FEE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "coverImage",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "paymentToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "totalSales",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxPerWallet",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      }
    ],
    "name": "createPaymentLink",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "linkId",
        "type": "uint256"
      }
    ],
    "name": "deactivatePaymentLink",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "emergencyTokenWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeRecipient",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "getCreatorLinks",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "linkId",
        "type": "uint256"
      }
    ],
    "name": "getPaymentLink",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "coverImage",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "paymentToken",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "totalSales",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxPerWallet",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "salesCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarned",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiresAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct NadPayV2.PaymentLink",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "linkId",
        "type": "uint256"
      }
    ],
    "name": "getPurchases",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "txHash",
            "type": "bytes32"
          }
        ],
        "internalType": "struct NadPayV2.Purchase[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalLinks",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "linkId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserPurchaseCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "linkPurchases",
    "outputs": [
      {
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "txHash",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "paymentLinks",
    "outputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "coverImage",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "paymentToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "totalSales",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxPerWallet",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "salesCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalEarned",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "linkId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "purchase",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newRecipient",
        "type": "address"
      }
    ],
    "name": "setFeeRecipient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newFee",
        "type": "uint256"
      }
    ],
    "name": "setPlatformFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userPurchases",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Enhanced PaymentLink interface for V2 Ultra-Secure
export interface PaymentLinkV2 {
  id: bigint;
  creator: string;
  title: string;
  // Note: description and coverImage removed in ultra-secure version
  price: bigint;
  paymentToken: string; // New field for V2
  totalSales: bigint;
  maxPerWallet: bigint;
  salesCount: bigint;
  totalEarned: bigint;
  isActive: boolean;
  createdAt: bigint;
  expiresAt: bigint;
}

export interface PurchaseV2 {
  buyer: string;
  amount: bigint;
  timestamp: bigint;
  txHash: string;
}

// Read hooks
export function usePaymentLinkV2(linkId: number) {
  return useReadContract({
    address: NADPAY_V2_CONTRACT_ADDRESS,
    abi: NADPAY_V2_ABI,
    functionName: 'getPaymentLink',
    args: [BigInt(linkId)],
    query: {
      enabled: linkId >= 0,
    }
  }) as {
    data: PaymentLinkV2 | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

export function usePaymentLinkPurchasesV2(linkId: number) {
  return useReadContract({
    address: NADPAY_V2_CONTRACT_ADDRESS,
    abi: NADPAY_V2_ABI,
    functionName: 'getPurchases',
    args: [BigInt(linkId)],
    query: {
      enabled: linkId >= 0,
    }
  });
}

export function useCreatorLinksV2(creatorAddress?: string, debug = false) {
  const publicClient = usePublicClient();
  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const refetch = async (forceRefresh = false) => {
    if ((!creatorAddress && !debug) || !publicClient) return;

    // Rate limiting: Don't refetch more than once every 3 seconds
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime) < 3000) {
      console.log('🚫 Rate limiting: Skipping refetch (too recent)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let creatorLinkIds: bigint[] = [];
      
      if (debug) {
        // Debug mode: get all links and show them
        const totalLinks = await publicClient.readContract({
          address: NADPAY_V2_CONTRACT_ADDRESS,
          abi: NADPAY_V2_ABI,
          functionName: 'getTotalLinks',
        }) as bigint;
        
        console.log('🔍 DEBUG MODE: Total Links:', totalLinks.toString());
        
        // Create array of all link IDs
        creatorLinkIds = Array.from({ length: Number(totalLinks) }, (_, i) => BigInt(i));
      } else {
        // Normal mode: get creator-specific links
        creatorLinkIds = await publicClient.readContract({
          address: NADPAY_V2_CONTRACT_ADDRESS,
          abi: NADPAY_V2_ABI,
          functionName: 'getAllCreatorLinks',
          args: [creatorAddress as `0x${string}`],
        }) as bigint[];
      }

      console.log('📋 Creator Link IDs:', creatorLinkIds.map(id => id.toString()));

      const creatorLinks: any[] = [];
      
      // Fetch each link details
      for (const linkId of creatorLinkIds) {
        try {
          const link = await publicClient.readContract({
            address: NADPAY_V2_CONTRACT_ADDRESS,
            abi: NADPAY_V2_ABI,
            functionName: 'getPaymentLink',
            args: [linkId],
          }) as any;
          
          // In debug mode, show all links; in normal mode, filter by creator
          if (debug || link.creator.toLowerCase() === creatorAddress?.toLowerCase()) {
            creatorLinks.push({
              ...link,
              linkId: Number(linkId),
            });
          }
        } catch (linkError) {
          console.error(`❌ Error fetching link ${linkId.toString()}:`, linkError);
          // Continue with next link
        }
      }

      console.log('📋 Creator Links Found:', creatorLinks);
      
      setLinks(creatorLinks);
      setLastFetchTime(now);
    } catch (err) {
      console.error('❌ Error fetching creator links:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (creatorAddress) {
      refetch();
    }
  }, [creatorAddress, publicClient]);

  return {
    data: links,
    isLoading,
    error,
    refetch,
  };
}

export function useUserPurchaseCountV2(linkId: number, userAddress?: string) {
  return useReadContract({
    address: NADPAY_V2_CONTRACT_ADDRESS,
    abi: NADPAY_V2_ABI,
    functionName: 'getUserPurchaseCount',
    args: linkId >= 0 && userAddress ? [BigInt(linkId), userAddress as `0x${string}`] : undefined,
    query: {
      enabled: linkId >= 0 && !!userAddress,
    }
  });
}

export function useTotalLinksV2() {
  return useReadContract({
    address: NADPAY_V2_CONTRACT_ADDRESS,
    abi: NADPAY_V2_ABI,
    functionName: 'getTotalLinks',
  });
}

// Write hooks
export function useCreatePaymentLinkV2() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createPaymentLink = async (params: {
    title: string;
    description: string; // Still accepted but not used in ultra-secure contract
    coverImage: string; // Still accepted but not used in ultra-secure contract
    price: string; // in token units
    paymentToken: string; // 0x0 for MON, token address for ERC20
    totalSales: number;
    maxPerWallet: number;
    expiresAt: number; // Unix timestamp, 0 means never expires
  }) => {
    const priceInWei = parseEther(params.price);
    
    return writeContract({
      address: NADPAY_V2_CONTRACT_ADDRESS,
      abi: NADPAY_V2_ABI,
      functionName: 'createPaymentLink',
      args: [
        params.title, // Only title is used in ultra-secure contract
        priceInWei, // uint256
        params.paymentToken as `0x${string}`, // address
        BigInt(params.totalSales), // uint256
        BigInt(params.maxPerWallet), // uint256
        BigInt(params.expiresAt), // uint256
      ],
    });
  };

  const getLinkIdFromTransaction = async (txHash: `0x${string}`) => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      
      // Look for PaymentLinkCreated event in logs
      const paymentLinkCreatedEvent = receipt.logs.find(log => 
        log.address.toLowerCase() === NADPAY_V2_CONTRACT_ADDRESS.toLowerCase()
      );

      if (paymentLinkCreatedEvent && paymentLinkCreatedEvent.topics && paymentLinkCreatedEvent.topics[1]) {
        // Extract link ID from event topics
        const linkId = parseInt(paymentLinkCreatedEvent.topics[1], 16);
        return linkId;
      }

      throw new Error('Payment link creation event not found');
    } catch (error) {
      console.error('Error extracting link ID from transaction:', error);
      throw error;
    }
  };

  return {
    createPaymentLink,
    getLinkIdFromTransaction,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

export function usePurchaseV2() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const purchase = async (linkId: number, amount: number, totalPrice: string, isNativePayment: boolean = true) => {
    return writeContract({
      address: NADPAY_V2_CONTRACT_ADDRESS,
      abi: NADPAY_V2_ABI,
      functionName: 'purchase',
      args: [BigInt(linkId), BigInt(amount)],
      value: isNativePayment ? parseEther(totalPrice) : BigInt(0), // Only send MON for native payments
    });
  };

  return {
    purchase,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

export function useDeactivatePaymentLinkV2() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const deactivatePaymentLink = async (linkId: number) => {
    return writeContract({
      address: NADPAY_V2_CONTRACT_ADDRESS,
      abi: NADPAY_V2_ABI,
      functionName: 'deactivatePaymentLink',
      args: [BigInt(linkId)],
    });
  };

  return {
    deactivatePaymentLink,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Helper functions
export function formatPaymentLinkV2(rawLink: unknown): PaymentLinkV2 & { linkId: number; uniqueBuyersCount?: number } {
  const link = rawLink as any;
  return {
    id: BigInt(link.id || link.linkId || 0),
    creator: link.creator,
    title: link.title,
    price: BigInt(link.price),
    paymentToken: link.paymentToken, // V2 feature
    totalSales: BigInt(link.totalSales),
    maxPerWallet: BigInt(link.maxPerWallet),
    salesCount: BigInt(link.salesCount),
    totalEarned: BigInt(link.totalEarned),
    isActive: link.isActive,
    createdAt: BigInt(link.createdAt),
    expiresAt: BigInt(link.expiresAt),
    linkId: link.linkId || Number(link.id) || 0,
    uniqueBuyersCount: link.uniqueBuyersCount,
  };
}

export function formatPurchaseV2(rawPurchase: unknown): PurchaseV2 {
  const purchase = rawPurchase as any;
  return {
    buyer: purchase.buyer,
    amount: BigInt(purchase.amount),
    timestamp: BigInt(purchase.timestamp),
    txHash: purchase.txHash,
  };
}

export function formatPriceV2(priceInWei: bigint | undefined | null): string {
  if (!priceInWei) return '0';
  return formatEther(priceInWei);
}

export function parsePriceV2(priceInToken: string): bigint {
  return parseEther(priceInToken);
} 