const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  //console.log("💰 Checking Platform Fees Across All Contracts");
  
  // Use Monad testnet directly
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  
  // Use private key from nadpay/.env
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in nadpay/.env");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  //console.log("👤 Using wallet:", wallet.address);
  //console.log("🌐 Network: Monad Testnet");
  
  // All known contracts
  const contracts = [
    { name: "V4 WORKING", address: "0xa874905B117242eC6c966E35B18985e9242Bb633" },
    { name: "Ultra-Secure", address: "0x755c6402938a039828fe3b6c7C54A07Ea7115C42" },
    { name: "V4 Fast OLD", address: "0xb7a8e84F06124D2E444605137E781cDd7ac480fa" },
    { name: "V4 Fast FIXED", address: "0x225f2C16360e18BcAa36Fc3d0d3197e6756117d6" }
  ];
  
  const minimalABI = [
    "function owner() external view returns (address)",
    "function withdrawPlatformFees() external",
    "function platformFeePercentage() external view returns (uint256)",
    "function getRaffle(uint256) view returns (tuple(address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, address ticketPaymentToken, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint8 status, uint256 expirationTime, uint256 createdAt, address winner, bool rewardClaimed))"
  ];
  
  let totalFeesAvailable = ethers.parseEther("0");
  let withdrawableContracts = [];
  
  for (const contractInfo of contracts) {
    //console.log(`\n🔍 Checking ${contractInfo.name}: ${contractInfo.address}`);
    
    try {
      const contract = new ethers.Contract(contractInfo.address, minimalABI, wallet);
      
      // Check contract balance
      const balance = await provider.getBalance(contractInfo.address);
      //console.log(`💰 Contract MON Balance: ${ethers.formatEther(balance)} MON`);
      
      if (balance > ethers.parseEther("0.001")) {
        //console.log(`   💸 Potential fees to withdraw: ${ethers.formatEther(balance)} MON`);
        totalFeesAvailable = totalFeesAvailable + balance;
        
        // Check if we are the owner
        try {
          const owner = await contract.owner();
          //console.log(`   👑 Contract Owner: ${owner}`);
          
          if (owner.toLowerCase() === wallet.address.toLowerCase()) {
            //console.log(`   ✅ You are the owner! Can withdraw fees.`);
            withdrawableContracts.push({
              ...contractInfo,
              balance: balance,
              contract: contract
            });
          } else {
            //console.log(`   ❌ You are NOT the owner. Cannot withdraw.`);
          }
        } catch (e) {
          //console.log(`   ⚠️  Could not check owner (might be different ABI)`);
        }
        
        // Check platform fee percentage
        try {
          const feePercentage = await contract.platformFeePercentage();
          //console.log(`   📊 Platform Fee: ${feePercentage}%`);
        } catch (e) {
          //console.log(`   📊 Platform Fee: Unknown`);
        }
        
        // Try to estimate stuck rewards vs platform fees
        let estimatedRewards = ethers.parseEther("0");
        let completedRaffleRevenue = ethers.parseEther("0");
        
        // Check some raffles to estimate
        for (let i = 0; i < 10; i++) {
          try {
            const raffle = await contract.getRaffle(i);
            if (raffle.creator !== '0x0000000000000000000000000000000000000000') {
              
              if (raffle.status == 1 || raffle.winner !== '0x0000000000000000000000000000000000000000') {
                // Completed raffle - count revenue for platform fees
                const revenue = BigInt(raffle.ticketPrice) * BigInt(raffle.ticketsSold);
                completedRaffleRevenue = completedRaffleRevenue + revenue;
              } else if (raffle.status == 0) {
                // Active raffle with stuck rewards
                if (raffle.rewardType == 0) { // Token reward
                  estimatedRewards = estimatedRewards + BigInt(raffle.rewardAmount);
                }
              }
            }
          } catch (e) {
            break; // No more raffles
          }
        }
        
        const estimatedPlatformFees = completedRaffleRevenue * BigInt(5) / BigInt(100); // Assume 5% fee
        
        //console.log(`   💎 Estimated stuck rewards: ${ethers.formatEther(estimatedRewards)} MON`);
        //console.log(`   💰 Estimated platform fees: ${ethers.formatEther(estimatedPlatformFees)} MON`);
        //console.log(`   📊 Total revenue processed: ${ethers.formatEther(completedRaffleRevenue)} MON`);
      } else {
        //console.log(`   📭 No significant balance`);
      }
      
    } catch (error) {
      //console.log(`   ❌ Error checking ${contractInfo.name}:`, error.message);
    }
  }
  
  //console.log(`\n📊 SUMMARY:`);
  //console.log(`💰 Total fees potentially available: ${ethers.formatEther(totalFeesAvailable)} MON`);
  //console.log(`🔐 Withdrawable contracts: ${withdrawableContracts.length}`);
  
  // Check our current balance
  const ourBalance = await provider.getBalance(wallet.address);
  //console.log(`💳 Your current balance: ${ethers.formatEther(ourBalance)} MON`);
  
  if (withdrawableContracts.length > 0) {
    //console.log(`\n💸 WITHDRAWAL OPTIONS:`);
    withdrawableContracts.forEach((contractInfo, index) => {
      //console.log(`${index + 1}. ${contractInfo.name}: ${ethers.formatEther(contractInfo.balance)} MON`);
    });
    
    //console.log(`\n🎯 To withdraw from a specific contract, run:`);
    //console.log(`node withdraw-specific-fees.js <contract_index>`);
  } else {
    //console.log(`\n❌ No contracts where you can withdraw fees`);
    //console.log(`💡 You might need:`);
    //console.log(`   1. Owner access to contracts`);
    //console.log(`   2. Different wallet with owner privileges`);
    //console.log(`   3. Emergency withdrawal functions`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Script failed:", error);
    process.exit(1);
  }); 