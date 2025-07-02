import { Metadata } from "next";
import NadSwapContent from "./NadSwapContent";

export const metadata: Metadata = {
  title: "NadSwap - Trade NFTs & Tokens | NadPay",
  description: "Swap NFTs and tokens securely with other users. Create custom trade proposals on Monad blockchain",
};

export default function NadSwapPage() {
  return <NadSwapContent />;
}