import { Metadata } from "next";
import RaffleHouseContent from "./RaffleHouseContent";

export const metadata: Metadata = {
  title: "RaffleHouse - Win NFTs & Crypto | NadPay",
  description: "Discover and participate in exciting raffles to win NFTs, tokens, and exclusive rewards on Monad",
};

export default function RaffleHousePage() {
  return <RaffleHouseContent />;
} 