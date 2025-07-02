import { Metadata } from "next";
import DashboardContent from "./DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard | NadPay",
  description: "Manage your payment links, raffles, and view your activity on NadPay",
};

export default function DashboardPage() {
  return <DashboardContent />;
} 