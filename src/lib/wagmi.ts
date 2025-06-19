import { http, createConfig } from "wagmi";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { createStorage, noopStorage } from "wagmi";

// TypeScript declarations for wallet providers
declare global {
  interface Window {
    okxwallet?: any;
    haha?: any;
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

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id";

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
    // Injected wallets için - Phantom, MetaMask, OKX Wallet, HaHa Wallet destekli
    injected({
      target: "metaMask",
    }),
    injected({
      target: "phantom", 
    }),
    injected({
      target: () => ({
        id: "okxWallet",
        name: "OKX Wallet",
        provider: typeof window !== "undefined" ? window.okxwallet : undefined,
      }),
    }),
    injected({
      target: () => ({
        id: "hahaWallet",
        name: "HaHa Wallet", 
        provider: typeof window !== "undefined" ? window.haha : undefined,
      }),
    }),
    // Generic injected connector for other wallets
    injected(),
    // WalletConnect geçici olarak devre dışı - connection hatası veriyor
    // walletConnect({
    //   projectId,
    //   metadata: {
    //     name: "NadPay",
    //     description: "Payment links on Monad",
    //     url: "https://nadpay.com",
    //     icons: ["https://nadpay.com/icon.png"],
    //   },
    //   showQrModal: true,
    // }),
    // Coinbase Wallet da geçici devre dışı
    // coinbaseWallet({
    //   appName: "NadPay",
    //   appLogoUrl: "https://nadpay.com/icon.png",
    // }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
}); 