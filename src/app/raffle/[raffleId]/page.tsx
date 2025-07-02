import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { formatEther } from "viem";
import { publicClient } from "@/lib/wagmi";
import { getKnownToken, KNOWN_NFTS } from "@/lib/knownAssets";

// Dynamically import the raffle content
const RaffleContent = dynamic(() => import('./RaffleContent'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading raffle...</p>
      </div>
    </div>
  )
});

interface PageProps {
  params: Promise<{ raffleId: string }>;
}

// V7 Contract configuration
const RAFFLE_V7_CONTRACT_ADDRESS = "0xd67e81D3f4B7a3c9E8F609F0FF5d67c96FEc36dd";
const V7_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "_raffleId", "type": "uint256"}],
    "name": "getRaffleDetails",
    "outputs": [{
      "components": [
        {"internalType": "address", "name": "creator", "type": "address"},
        {"internalType": "uint256", "name": "ticketPrice", "type": "uint256"},
        {"internalType": "address", "name": "ticketPaymentToken", "type": "address"},
        {"internalType": "uint256", "name": "maxTickets", "type": "uint256"},
        {"internalType": "uint256", "name": "soldTickets", "type": "uint256"},
        {"internalType": "uint256", "name": "startTime", "type": "uint256"},
        {"internalType": "uint256", "name": "endTime", "type": "uint256"},
        {"internalType": "uint256", "name": "rewardAmount", "type": "uint256"},
        {"internalType": "enum NadRaffleV7.RewardType", "name": "rewardType", "type": "uint8"},
        {"internalType": "address", "name": "rewardTokenAddress", "type": "address"},
        {"internalType": "uint256", "name": "rewardTokenId", "type": "uint256"},
        {"internalType": "enum NadRaffleV7.RaffleState", "name": "state", "type": "uint8"},
        {"internalType": "address", "name": "winner", "type": "address"}
      ],
      "internalType": "struct NadRaffleV7.RaffleInfo",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { raffleId } = await params;
    
    // Fetch raffle data from V7 contract
    const raffleData = await publicClient.readContract({
      address: RAFFLE_V7_CONTRACT_ADDRESS,
      abi: V7_ABI,
      functionName: 'getRaffleDetails',
      args: [BigInt(raffleId)]
    });

    if (!raffleData || !raffleData.creator || raffleData.creator === '0x0000000000000000000000000000000000000000') {
      return {
        title: "Raffle Not Found - NadPay RaffleHouse",
        description: "This raffle does not exist or has been removed.",
      };
    }

    const { ticketPrice, ticketPaymentToken, rewardType, rewardAmount, rewardTokenAddress, rewardTokenId, maxTickets, soldTickets } = raffleData;
    
    // Format ticket price
    const ticketPriceFormatted = formatEther(ticketPrice);
    const ticketTokenSymbol = ticketPaymentToken === "0x0000000000000000000000000000000000000000" ? "MON" : getKnownToken(ticketPaymentToken)?.symbol || "TOKEN";
    
    // Format reward info
    let rewardInfo = "";
    if (rewardType === 0) { // Token reward
      const rewardAmountFormatted = formatEther(rewardAmount);
      const rewardTokenSymbol = rewardTokenAddress === "0x0000000000000000000000000000000000000000" ? "MON" : getKnownToken(rewardTokenAddress)?.symbol || "TOKEN";
      rewardInfo = `Win ${rewardAmountFormatted} ${rewardTokenSymbol}`;
    } else if (rewardType === 1) { // NFT reward
      const nftCollection = KNOWN_NFTS.find(nft => nft.address.toLowerCase() === rewardTokenAddress.toLowerCase());
      const nftName = nftCollection?.name || "NFT";
      rewardInfo = `Win ${nftName} #${rewardTokenId}`;
    }
    
    const ticketsRemaining = Number(maxTickets) - Number(soldTickets);
    const pageTitle = `${rewardInfo} - Raffle #${raffleId} | NadPay RaffleHouse`;
    const pageDescription = `${rewardInfo} | Ticket Price: ${ticketPriceFormatted} ${ticketTokenSymbol} | ${ticketsRemaining} tickets remaining | Enter to win on Monad blockchain`;

    return {
      title: pageTitle,
      description: pageDescription,
      openGraph: {
        title: pageTitle,
        description: pageDescription,
        type: 'website',
        siteName: 'NadPay RaffleHouse',
      },
      twitter: {
        card: 'summary',
        title: pageTitle,
        description: pageDescription,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: "Raffle - NadPay RaffleHouse",
      description: "Win amazing prizes in blockchain raffles",
    };
  }
}

export default function RafflePage() {
  return <RaffleContent />;
} 