'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SwapRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /nadswap
    router.replace('/nadswap');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to NadSwap...</p>
      </div>
    </div>
  );
} 