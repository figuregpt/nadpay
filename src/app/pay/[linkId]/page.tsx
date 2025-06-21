import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { formatEther } from "viem";

// Import contract utilities
import { publicClient } from "@/lib/wagmi";
import { NADPAY_CONTRACT } from "@/lib/contract";

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
    
    // Fetch payment link data from contract
    const paymentLinkData = await publicClient.readContract({
      ...NADPAY_CONTRACT,
      functionName: 'getPaymentLink',
      args: [BigInt(internalLinkId)]
    });

    if (!paymentLinkData || !paymentLinkData.creator || paymentLinkData.creator === '0x0000000000000000000000000000000000000000') {
      return {
        title: "Payment Link Not Found - NadPay",
        description: "This payment link does not exist or has been removed.",
      };
    }

    const { title, description, coverImage, price } = paymentLinkData;
    const priceInMON = formatEther(price);
    
    const pageTitle = `${title} - ${priceInMON} MON | NadPay`;
    const pageDescription = description 
      ? `${description} | Price: ${priceInMON} MON | Pay securely on Monad blockchain`
      : `Pay ${priceInMON} MON securely on Monad blockchain`;

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