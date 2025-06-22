import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { createStorage, noopStorage } from "wagmi";
import { createPublicClient } from "viem";

// Monad testnet configuration (EVM-compatible) - Updated parameters
export const monadTestnet = {
  id: 10143, // Correct Chain ID (According to official Monad docs)
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

// Public client for server-side contract reads
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http("https://testnet-rpc.monad.xyz"),
});

export const config = createConfig({
  // Only Monad testnet - more focused experience
  chains: [monadTestnet],
  ssr: true,
  storage: createStorage({
    storage: typeof window !== 'undefined' ? localStorage : noopStorage,
    key: 'nadpay-wagmi', // Custom key for our app
  }),
  connectors: [
    // MetaMask - most popular
    injected({
      target: "metaMask",
    }),
    // Phantom Wallet - Ethereum provider only
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        const phantom = (window as any).phantom?.ethereum;
        if (!phantom || !phantom.isPhantom) return undefined;
        return phantom;
      },
    }),
    // OKX Wallet - popular exchange wallet
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        const okx = (window as any).okxwallet;
        if (!okx || !okx.isOkxWallet) return undefined;
        return okx;
      },
    }),
    // HaHa Wallet - Monad ecosystem
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        const haha = (window as any).haha;
        if (!haha || !haha.isHahaWallet) return undefined;
        return haha;
      },
    }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
}); 