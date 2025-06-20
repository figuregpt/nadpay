import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { createStorage, noopStorage } from "wagmi";
import { createPublicClient } from "viem";

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

// Public client for server-side contract reads
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http("https://testnet-rpc.monad.xyz"),
});

export const config = createConfig({
  // Sadece Monad testnet - daha odaklı deneyim
  chains: [monadTestnet],
  ssr: true,
  storage: createStorage({
    storage: typeof window !== 'undefined' ? localStorage : noopStorage,
    key: 'nadpay-wagmi', // Custom key for our app
  }),
  connectors: [
    // MetaMask - en popüler
    injected({
      target: "metaMask",
    }),
    // Phantom Wallet - sadece Ethereum provider'ı
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        const phantom = (window as any).phantom?.ethereum;
        if (!phantom || !phantom.isPhantom) return undefined;
        return phantom;
      },
    }),
    // OKX Wallet - popüler exchange wallet
    injected({
      target: () => {
        if (typeof window === 'undefined') return undefined;
        const okx = (window as any).okxwallet;
        if (!okx || !okx.isOkxWallet) return undefined;
        return okx;
      },
    }),
    // HaHa Wallet - Monad ekosistemi
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