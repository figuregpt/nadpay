import { Metadata } from "next";
import NadPayContent from "./NadPayContent";

export const metadata: Metadata = {
  title: "NadPay - Payment Solutions | NadPay",
  description: "Create secure payment links, manage subscriptions, and accept crypto payments on Monad blockchain",
};

export default function NadPayPage() {
  return <NadPayContent />;
} 