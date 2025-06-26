import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { formatEther } from "viem";

// Import contract utilities
import { publicClient } from "@/lib/wagmi";
import { decodePredictableSecureRaffleId } from "@/lib/linkUtils";
import { getKnownToken } from "@/lib/knownAssets";

// V4 Contract configuration for metadata
const NADRAFFLE_V4_FAST_CONTRACT = {
      address: "0xb7a8e84F06124D2E444605137E781cDd7ac480fa" as `0x${string}`,
  abi: [
    {
      "inputs": [{ "name": "raffleId", "type": "uint256" }],
      "name": "getRaffle",
      "outputs": [{
        "type": "tuple",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "creator", "type": "address" },
          { "name": "title", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "rewardType", "type": "uint8" },
          { "name": "rewardTokenAddress", "type": "address" },
          { "name": "rewardAmount", "type": "uint256" },
          { "name": "ticketPrice", "type": "uint256" },
          { "name": "ticketPaymentToken", "type": "address" },
          { "name": "maxTickets", "type": "uint256" },
          { "name": "ticketsSold", "type": "uint256" },
          { "name": "totalEarned", "type": "uint256" },
          { "name": "expirationTime", "type": "uint256" },
          { "name": "autoDistributeOnSoldOut", "type": "bool" },
          { "name": "winner", "type": "address" },
          { "name": "status", "type": "uint8" },
          { "name": "rewardClaimed", "type": "bool" },
          { "name": "createdAt", "type": "uint256" }
        ]
      }],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;

// Dynamically import the entire raffle component
const RaffleContent = dynamic(() => import("./RaffleContent"), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading raffle...</p>
      </div>
    </div>
  )
});

interface PageProps {
  params: Promise<{ raffleId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { raffleId: secureRaffleId } = await params;
    
    // Decode secure raffle ID to get internal ID
    const internalRaffleId = decodePredictableSecureRaffleId(secureRaffleId);
    
    if (internalRaffleId === null) {
      return {
        title: "Raffle Not Found - NadPay",
        description: "This raffle does not exist or has been removed.",
      };
    }
    
    // Fetch raffle data from contract using internal ID
    const raffleData = await publicClient.readContract({
      address: NADRAFFLE_V4_FAST_CONTRACT.address,
      abi: NADRAFFLE_V4_FAST_CONTRACT.abi,
      functionName: 'getRaffle',
      args: [BigInt(internalRaffleId)]
    }) as any;

    if (!raffleData || !raffleData.creator || raffleData.creator === '0x0000000000000000000000000000000000000000') {
      return {
        title: "Raffle Not Found - NadPay",
        description: "This raffle does not exist or has been removed.",
      };
    }

    const { title, description, ticketPrice, rewardAmount, rewardType, ticketPaymentToken, rewardTokenAddress } = raffleData;
    
    // Get payment token symbol
    const paymentTokenSymbol = ticketPaymentToken === '0x0000000000000000000000000000000000000000' 
      ? 'MON' 
      : getKnownToken(ticketPaymentToken)?.symbol || 'TOKEN';
    
    // Get reward token symbol
    const rewardTokenSymbol = rewardTokenAddress === '0x0000000000000000000000000000000000000000'
      ? 'MON'
      : getKnownToken(rewardTokenAddress)?.symbol || 'TOKEN';
    
    const ticketPriceFormatted = formatEther(ticketPrice);
    const rewardAmountFormatted = formatEther(rewardAmount);
    const rewardTypeText = Number(rewardType) === 0 ? 'Token' : 'NFT';
    
    const pageTitle = `${title} - ${ticketPriceFormatted} ${paymentTokenSymbol} per ticket | NadPay Raffle`;
    const pageDescription = description 
      ? `${description} | Ticket Price: ${ticketPriceFormatted} ${paymentTokenSymbol} | Reward: ${rewardAmountFormatted} ${rewardTypeText === 'Token' ? rewardTokenSymbol : 'NFT'} | Join the raffle on Monad blockchain`
      : `Join the raffle for ${ticketPriceFormatted} ${paymentTokenSymbol} per ticket on Monad blockchain`;

    return {
      title: pageTitle,
      description: pageDescription,
      openGraph: {
        title: pageTitle,
        description: pageDescription,
        type: 'website',
        siteName: 'NadPay',
      },
      twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: pageDescription,
      },
    };
  } catch (error) {
    console.error('Error generating raffle metadata:', error);
    return {
      title: "Raffle - NadPay",
      description: "Join exciting raffles on Monad blockchain",
    };
  }
}

export default function RafflePage() {
  return <RaffleContent />;
} 