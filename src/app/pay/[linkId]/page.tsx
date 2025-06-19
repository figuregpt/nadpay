"use client";

import dynamic from "next/dynamic";

// Dynamically import the entire payment component to avoid SSR issues
const PaymentContent = dynamic(() => import("./PaymentContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading payment link...</p>
      </div>
    </div>
  )
});

export default function PaymentPage() {
  return <PaymentContent />;
} 