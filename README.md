# NadPay - Decentralized Payment Links on Monad

NadPay is a fully decentralized payment link platform built for the Monad blockchain ecosystem. Create trustless payment links with smart contracts, eliminating the need for centralized databases and ensuring transparent, secure transactions.

## Features

- 🚀 **Lightning Fast**: Built on Monad's high-performance blockchain with 10,000 TPS
- 🔒 **Fully Decentralized**: Smart contract-based payment system with no database dependency
- 💎 **Trustless Transactions**: All payments processed through verified smart contracts
- 🌍 **Global Reach**: Accept payments from anywhere with near-zero gas fees
- 💰 **Low Platform Fee**: Only 1% transaction fee (configurable, max 5%)
- 🎨 **Modern UI**: Beautiful interface inspired by Monad's design language
- 🌙 **Dark/Light Mode**: Toggle between themes for optimal viewing
- 📱 **Responsive**: Works perfectly on desktop and mobile devices
- 🔗 **Multi-wallet Support**: MetaMask, Phantom, OKX, HaHa Wallet compatible

## Smart Contract Features

- **Payment Link Creation**: Create payment links with custom parameters
- **Flexible Limits**: Set total sales and per-wallet purchase limits
- **Automatic Payments**: Direct wallet-to-wallet transfers via smart contract
- **Event Logging**: All transactions recorded on-chain for transparency
- **Deactivation**: Creators can deactivate links (irreversible)
- **Platform Fee**: Configurable fee system (1% default, 5% maximum)
- **Security**: ReentrancyGuard and access control mechanisms
- **Gas Optimization**: Efficient contract design for low transaction costs

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nadpay
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file
PRIVATE_KEY=your_private_key_for_contract_deployment
MONGODB_URI=your_mongodb_uri_optional
```

4. Deploy smart contract (optional - for development):
```bash
npm run compile
npm run deploy:testnet
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Blockchain**: Solidity smart contracts on Monad
- **Web3**: Wagmi + Viem for blockchain interactions
- **Wallet**: ConnectKit for multi-wallet support
- **Styling**: Tailwind CSS with custom theme
- **UI Components**: Lucide React Icons
- **Animations**: Framer Motion
- **Theme**: next-themes for dark/light mode
- **TypeScript**: Full type safety
- **Development**: Hardhat for contract development

## Project Structure

```
nadpay/
├── contracts/
│   └── NadPay.sol        # Smart contract
├── scripts/
│   ├── deploy.js         # Deployment script
│   └── generateABI.js    # ABI generation
├── src/
│   ├── app/
│   │   ├── page.tsx      # Landing page
│   │   ├── app/
│   │   │   ├── page.tsx  # Create payment page
│   │   │   └── dashboard/# Dashboard
│   │   └── pay/[linkId]/ # Payment processing
│   ├── hooks/
│   │   ├── useNadPayContract.ts # Contract hooks
│   │   └── usePersistentWallet.ts # Wallet persistence
│   ├── lib/
│   │   ├── contract.ts   # Contract ABI & config
│   │   └── wagmi.ts      # Web3 configuration
│   └── components/       # UI components
├── hardhat.config.js     # Hardhat configuration
└── package.json          # Dependencies & scripts
```

## Development

To start developing:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## About Monad

NadPay is built for the Monad ecosystem - the fastest EVM-compatible L1 blockchain featuring:
- 10,000 TPS throughput
- 0.5s block times  
- 1s single-slot finality
- Near-zero gas fees
- Full EVM compatibility

---

Built with ❤️ for the Monad community.
