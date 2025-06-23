import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { formatEther } from "viem";

// Import contract utilities
import { publicClient } from "@/lib/wagmi";
import { NADRAFFLE_CONTRACT } from "@/lib/raffle-contract";
import { decodePredictableSecureRaffleId } from "@/lib/linkUtils";

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
      ...NADRAFFLE_CONTRACT,
      functionName: 'getRaffle',
      args: [BigInt(internalRaffleId)]
    });

    if (!raffleData || !raffleData.creator || raffleData.creator === '0x0000000000000000000000000000000000000000') {
      return {
        title: "Raffle Not Found - NadPay",
        description: "This raffle does not exist or has been removed.",
      };
    }

    const { title, description, ticketPrice, rewardAmount, rewardType } = raffleData;
    const ticketPriceInMON = formatEther(ticketPrice);
    const rewardAmountFormatted = formatEther(rewardAmount);
    const rewardTypeText = Number(rewardType) === 0 ? 'Token' : 'NFT';
    
    const pageTitle = `${title} - ${ticketPriceInMON} MON per ticket | NadPay Raffle`;
    const pageDescription = description 
      ? `${description} | Ticket Price: ${ticketPriceInMON} MON | Reward: ${rewardAmountFormatted} ${rewardTypeText === 'Token' ? 'MON' : 'NFT'} | Join the raffle on Monad blockchain`
      : `Join the raffle for ${ticketPriceInMON} MON per ticket on Monad blockchain`;

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