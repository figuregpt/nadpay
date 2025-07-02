import { Metadata } from "next";
import LeaderboardContent from "./LeaderboardContent";

export const metadata: Metadata = {
  title: "Leaderboard - Top Users | NadPay",
  description: "See the top users earning points on NadPay ecosystem. Compete for rewards by using NadSwap, NadPay, and RaffleHouse",
};

export default function LeaderboardPage() {
  return <LeaderboardContent />;
} 