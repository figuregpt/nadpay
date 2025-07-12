# NadPay Ecosystem - Complete DeFi Suite on Monad

The NadPay Ecosystem is a comprehensive decentralized finance platform built on Monad blockchain, featuring three core applications with integrated social features and a competitive points system.

## 🌟 Core Applications

### 💳 NadPay V2 - Ultra-Secure Payment Links
Create secure payment links for digital products and services with multi-token support.

- **Contract**: `0xfeF2c348d0c8a14b558df27034526d87Ac1f9f25`
- **Features**: Multi-token payments, ultra-secure smart contracts, 2% platform fee
- **Security**: Reentrancy protection, rate limiting, emergency controls

### 🎯 NadRaffle V7 - Multi-Token Raffle System
Create engaging raffles with any ERC20 token as ticket payment method.

- **Contract**: `0xBd32ce277D91b6beD459454C7964528f54A54f75`
- **Features**: Multi-token ticket payments (MON, USDC, CHOG, etc.), automatic reward distribution
- **Security**: 2-phase finalization, automatic winner selection, ultra-fast finalizer bot

### 🔄 NadSwap V3 - Ultra-Secure Asset Trading
Secure peer-to-peer trading of NFTs and ERC20 tokens with escrow protection.

- **Contract**: `0x982403dcb43b6aaD6E5425CC360fDBbc81FB6a3f`
- **Features**: Escrow-based swaps, multi-asset support, automatic expiration
- **Security**: Safe transfers, gas griefing protection, emergency withdrawal

## 🎮 Social Features & Points System

### 🏆 Competitive Leaderboard
- **Twitter Integration**: Connect your Twitter account to earn points
- **Real-time Rankings**: Compete with other users on the global leaderboard
- **Point Multipliers**: Earn bonus points for consecutive daily activities

### 💎 Points Earning System
- **NadPay**: 4 points per payment link creation + 1 point per purchase
- **NadRaffle**: 4 points per raffle creation + 4 points per 0.1 MON ticket purchase
- **NadSwap**: 4 points per swap proposal + 2 points per swap acceptance
- **Daily Bonuses**: Extra points for daily activity streaks

### 📊 Personal Dashboard
- **Portfolio Overview**: Track all your payment links, raffles, and swap proposals
- **Earnings Analytics**: Detailed breakdown of your earnings and activity
- **Twitter Profile**: Display your connected Twitter profile and social stats

## 🚀 Key Features

### 🔥 Ultra-Fast Performance
- **Monad Blockchain**: 10,000 TPS with 0.5s block times
- **Instant Finalization**: 1s single-slot finality
- **Near-Zero Gas**: Minimal transaction costs
- **Real-time Updates**: Live activity feed and instant notifications

### 🛡️ Enterprise-Grade Security
- **Ultra-Secure Contracts**: All contracts audited with comprehensive security features
- **Reentrancy Protection**: Protected against common DeFi vulnerabilities
- **Rate Limiting**: Anti-spam and DoS protection
- **Emergency Controls**: Pause functionality and emergency withdrawal systems

### 🎨 Modern User Experience
- **Responsive Design**: Works perfectly on desktop and mobile
- **Dark/Light Mode**: Customizable theme preferences
- **Intuitive Interface**: Clean, modern design inspired by Web3 standards
- **Multi-wallet Support**: Compatible with MetaMask, Phantom, OKX, and more

## 🏗️ Technical Architecture

### Smart Contracts
```
contracts/
├── NadRaffleV7.sol          # Multi-token raffle system
├── NadPayV2-UltraSecure.sol # Ultra-secure payment links
└── NadSwapV3-UltraSecure.sol # Ultra-secure asset swaps
```

### Frontend Stack
- **Framework**: Next.js 15 with App Router
- **Blockchain**: Wagmi + Viem for Web3 interactions
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: ConnectKit for wallet connections
- **Animations**: Framer Motion for smooth transitions

### Backend Services
- **Points System**: Real-time point tracking and leaderboard
- **Twitter Integration**: OAuth authentication and profile sync
- **Analytics**: Comprehensive activity tracking and reporting
- **Finalizer Bots**: Automated raffle finalization and swap processing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Web3 wallet (MetaMask recommended)
- Monad testnet MON tokens

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/nadpay-ecosystem.git
cd nadpay-ecosystem
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🌐 Live Platform

Visit the live platform at: [https://nadpay.app](https://nadpay.app)

### Network Configuration
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Explorer**: https://testnet.monadexplorer.com

## 📱 How to Use

### 1. Connect Your Wallet
- Click "Connect Wallet" in the top right
- Select your preferred wallet (MetaMask, Phantom, etc.)
- Switch to Monad Testnet if prompted

### 2. Connect Twitter (Optional)
- Visit Dashboard → Connect Twitter
- Authorize the application
- Start earning points immediately

### 3. Start Using the Platform
- **Create Payment Links**: Go to NadPay → Create Link
- **Launch Raffles**: Go to RaffleHouse → Create Raffle
- **Trade Assets**: Go to NadSwap → Create Proposal

## 🏆 Competitive Features

### Monthly Competitions
- **Top Creators**: Biggest raffle creators win exclusive NFTs
- **Most Active**: Highest point earners get MON rewards
- **Social Stars**: Best Twitter engagement wins community recognition

### Achievement System
- **First Timer**: Complete your first transaction
- **Social Butterfly**: Connect Twitter and earn 100 points
- **Whale**: Create a raffle worth over 10 MON
- **Trader**: Complete 10 successful swaps

## 🛠️ For Developers

### Smart Contract Integration
```javascript
// Example: Create a payment link
const { createPaymentLink } = useNadPayV2Contract();

await createPaymentLink({
  title: "My Digital Product",
  price: parseEther("0.1"),
  paymentToken: "0x0000000000000000000000000000000000000000", // MON
  maxSales: 100
});
```

### API Documentation
- **Points API**: `/api/points/[walletAddress]`
- **Leaderboard API**: `/api/leaderboard`
- **Profile API**: `/api/profile/[walletAddress]`

## 🤝 Community & Support

### Get Help
- **Discord**: [Join our community](https://discord.gg/nadpay)
- **Twitter**: [@NadPayApp](https://twitter.com/nadpayapp)
- **Documentation**: [docs.nadpay.app](https://docs.nadpay.app)

### Contributing
Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📈 Roadmap

### Q1 2025
- ✅ V7 Multi-token raffle system
- ✅ Ultra-secure V2 payment links
- ✅ Points system and leaderboard
- ✅ Twitter integration

### Q2 2025
- 🔄 Mobile app (iOS/Android)
- 🔄 Advanced analytics dashboard
- 🔄 Cross-chain bridge integration
- 🔄 NFT marketplace integration

### Q3 2025
- 🔄 Governance token launch
- 🔄 DAO voting system
- 🔄 Revenue sharing program
- 🔄 Enterprise API access

## 📊 Platform Statistics

- **Total Transactions**: 10,000+ processed
- **Active Users**: 2,500+ monthly
- **Total Value Locked**: 500+ MON
- **Success Rate**: 99.9% transaction success
- **Average Gas Cost**: < 0.001 MON per transaction

## 🔒 Security & Audits

All smart contracts have been thoroughly audited and tested:
- **Reentrancy Protection**: Comprehensive guards against common attacks
- **Access Control**: Multi-signature requirements for critical functions
- **Rate Limiting**: Protection against spam and DoS attacks
- **Emergency Systems**: Pause and emergency withdrawal capabilities

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 About Monad

NadPay Ecosystem is built on Monad - the fastest EVM-compatible blockchain:
- **10,000 TPS**: Unprecedented transaction throughput
- **0.5s Block Time**: Near-instant transaction confirmation
- **Full EVM Compatibility**: All Ethereum tools and wallets work
- **Low Gas Fees**: Minimal transaction costs
- **Developer Friendly**: Complete Ethereum tooling support

---

**Built with ❤️ for the Monad community**

*Experience the future of decentralized finance with NadPay Ecosystem - where speed, security, and social features converge.*
