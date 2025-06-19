import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { createStorage, noopStorage } from "wagmi";

// TypeScript declarations for wallet providers
declare global {
  interface Window {
    okxwallet?: {
      isOkxWallet?: boolean;
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
    haha?: {
      isHahaWallet?: boolean;
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

// Monad testnet konfigürasyonu (EVM-compatible) - Güncellenmiş parametreler
export const monadTestnet = {
  id: 10143, // Doğru Chain ID (Resmi Monad Docs'a göre)
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    public: { http: ["https://testnet-rpc.monad.xyz"] },
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
} as const;

export const config = createConfig({
  // Sadece Monad testnet - daha odaklı deneyim
  chains: [monadTestnet],
  ssr: true,
  multiInjectedProviderDiscovery: false,
  storage: createStorage({
    storage: typeof window !== 'undefined' ? localStorage : noopStorage,
    key: 'nadpay-wagmi', // Custom key for our app
  }),
  connectors: [
    // Injected wallets için - Phantom, MetaMask destekli
    injected({
      target: "metaMask",
    }),
    injected({
      target: "phantom", 
    }),
    // Generic injected connector for other wallets (OKX, HaHa, etc.)
    injected(),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
}); 