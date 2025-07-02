# NadRaffle V7 - Multi-Token Payment System

## Deployment Summary

### Contract Details
- **Contract Name**: NadRaffleV7
- **Contract Address**: `0xBd32ce277D91b6beD459454C7964528f54A54f75`
- **Network**: Monad Testnet
- **Deployed**: January 2025

### New Features in V7

#### 1. Multi-Token Ticket Payments ✨
- **Any ERC20 Token Accepted**: Users can now buy raffle tickets with any ERC20 token (USDC, CHOG, etc.)
- **Native MON Support**: Still supports native MON tokens for payments
- **Flexible Configuration**: Each raffle creator can choose their preferred payment token

#### 2. Enhanced Smart Contract
- **New Field**: Added `ticketPaymentToken` to RaffleInfo struct
- **Updated Functions**: `createRaffle` now accepts payment token parameter
- **Automatic Token Routing**: Contract handles both native and ERC20 payments seamlessly

#### 3. All V6 Security Features Preserved
- ✅ 2-Phase Security (sold out → winner selection)
- ✅ Automatic reward distribution
- ✅ Pending rewards for failed transfers
- ✅ Rate limiting
- ✅ Emergency functions
- ✅ Pausable contract

### UI/UX Updates

#### Create Raffle Page (V7)
- Added AssetSelector for ticket payment token selection
- Dynamic ticket price label shows selected token symbol
- Clear indication of V7 features with green badge
- Validation ensures payment token is selected

#### V7 Launch Page
- Dedicated landing page at `/rafflehouse/v7-launch`
- Feature highlights and how-it-works section
- Clear call-to-action for V7 raffle creation

#### RaffleHouse Main Page
- Added V7 announcement banner
- Dual create buttons (V7 and V6)
- Smooth transition for existing users

### Technical Implementation

#### Contract Structure
```solidity
struct RaffleInfo {
    address creator;
    uint256 ticketPrice;
    address ticketPaymentToken;    // NEW: Payment token address (0x0 for native)
    uint256 maxTickets;
    // ... other fields
}

function createRaffle(
    uint256 ticketPrice,
    address ticketPaymentToken,    // NEW: Payment token parameter
    uint256 maxTickets,
    uint256 duration,
    RewardType rewardType,
    address rewardTokenAddress,
    uint256 rewardTokenId
) external payable
```

#### Payment Handling
- Native MON: Direct ETH transfer
- ERC20 Tokens: Uses SafeERC20 for secure transfers
- Automatic fee distribution to platform and creator

### Migration Path
- V6 contracts remain active and unchanged
- Users can choose between V6 (MON only) and V7 (multi-token)
- No breaking changes to existing raffles
- Smooth upgrade path for creators

### Future Enhancements
- Add support for stablecoins in known assets
- Implement token whitelist for vetted tokens
- Add liquidity pool integration for automatic swaps
- Enhanced analytics for multi-token raffles

### Security Considerations
- All V6 security features maintained
- SafeERC20 used for token transfers
- Proper allowance checking
- Reentrancy protection
- Rate limiting on all functions

### Deployment Files
- Contract: `contracts/NadRaffleV7.sol`
- ABI: `NadRaffleV7.abi.json`
- Hook: `src/hooks/useNadRaffleV7Contract.ts`
- Deployment Info: `raffle-v7-deployment-monadTestnet-1751443673271.json` 