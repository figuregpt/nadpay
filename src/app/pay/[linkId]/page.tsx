import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { formatEther } from "viem";

// Import contract utilities
import { publicClient } from "@/lib/wagmi";
import { getKnownToken } from "@/lib/knownAssets";

// Dynamically import the entire payment component
const PaymentContent = dynamic(() => import("./PaymentContent"), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading payment link...</p>
      </div>
    </div>
  )
});

interface PageProps {
  params: Promise<{ linkId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { linkId } = await params;
    
    // Decode secure link ID to get internal ID
    const decodeSecureLinkId = (secureId: string): number | null => {
      // If it's already a number, return it (backward compatibility)
      if (/^\d+$/.test(secureId)) {
        return parseInt(secureId);
      }
      
      // If it's seed_hash format, we need to brute force check
      const parts = secureId.split('_');
      if (parts.length === 2) {
        const seed = parseInt(parts[0]);
        const targetHash = parts[1];
        
        // Check recent internal IDs (last 1000 should be enough)
        // This uses the same algorithm as createSecureLinkId in Web3AppContent
        for (let i = 0; i < 1000; i++) {
          const combined = `${i}_${seed}_nadpay`;
          let hash = 0;
          for (let j = 0; j < combined.length; j++) {
            const char = combined.charCodeAt(j);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          const generatedHash = Math.abs(hash).toString(16).slice(0, 8);
          if (generatedHash === targetHash) {
            return i;
          }
        }
      }
      
      return null;
    };
    
    const internalLinkId = decodeSecureLinkId(linkId);
    
    if (internalLinkId === null) {
      return {
        title: "Payment Link Not Found - NadPay",
        description: "This payment link does not exist or has been removed.",
      };
    }
    
    // V2 Contract configuration
    const NADPAY_V2_CONTRACT = {
      address: "0x091f3ae2E54584BE7195E2A8C5eD3976d0851905" as `0x${string}`,
      abi: [
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
        }
      ] as const
    };

    // Fetch payment link data from V2 contract
    const paymentLinkData = await publicClient.readContract({
      ...NADPAY_V2_CONTRACT,
      functionName: 'getPaymentLink',
      args: [BigInt(internalLinkId)]
    });

    if (!paymentLinkData || !paymentLinkData.creator || paymentLinkData.creator === '0x0000000000000000000000000000000000000000') {
      return {
        title: "Payment Link Not Found - NadPay",
        description: "This payment link does not exist or has been removed.",
      };
    }

    const { title, description, coverImage, price, paymentToken } = paymentLinkData;
    const priceInToken = formatEther(price);
    const tokenSymbol = paymentToken === "0x0000000000000000000000000000000000000000" ? "MON" : getKnownToken(paymentToken)?.symbol || "TOKEN";
    
    const pageTitle = `${title} - ${priceInToken} ${tokenSymbol} | NadPay`;
    const pageDescription = description 
      ? `${description} | Price: ${priceInToken} ${tokenSymbol} | Pay securely on Monad blockchain`
      : `Pay ${priceInToken} ${tokenSymbol} securely on Monad blockchain`;

    return {
      title: pageTitle,
      description: pageDescription,
      openGraph: {
        title: pageTitle,
        description: pageDescription,
        images: coverImage ? [{ url: coverImage, width: 1200, height: 630 }] : [],
        type: 'website',
        siteName: 'NadPay',
      },
      twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: pageDescription,
        images: coverImage ? [coverImage] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: "Payment Link - NadPay",
      description: "Secure payments on Monad blockchain",
    };
  }
}

export default function PaymentPage() {
  return <PaymentContent />;
} 