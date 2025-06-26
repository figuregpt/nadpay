"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { config } from "../lib/wagmi";
import { useState, useEffect } from "react";
import { reconnect } from "@wagmi/core";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Basit reconnect stratejisi
    const attemptReconnect = async () => {
      try {
        // Wagmi store'dan kontrol et
        const savedConnection = localStorage.getItem('nadpay-wagmi');
        if (savedConnection) {
          console.log('🔄 Provider attempting to restore connection...');
          // Sadece reconnect dene, hata olursa devam et
          await reconnect(config);
        }
      } catch (error) {
        console.log('❌ Provider reconnection failed (normal):', error);
        // Hata normal, devam et
      }
    };

    // Daha uzun bekle
    const timer = setTimeout(attemptReconnect, 200);
    
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider 
      config={config} 
      reconnectOnMount={true}
      initialState={undefined}
    >
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          options={{
            hideBalance: false,
            hideTooltips: false,
            hideQuestionMarkCTA: false,
            hideNoWalletCTA: true, // Hide "I don't have a wallet"
            hideRecentBadge: true, // Hide "Recent" badge
            walletConnectCTA: "link",
            enforceSupportedChains: false,
            embedGoogleFonts: true,
            initialChainId: 10143,
            avoidLayoutShift: true,
            bufferPolyfill: false,
          }}
          customTheme={{
            "--ck-brand-color": "#836EF9",
            "--ck-border-radius": "12px",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 