const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  //console.log("🎨 Comprehensive NFT Check in Contracts");
  
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
  
  const minimalRaffleABI = [
    "function owner() external view returns (address)",
    "function getRaffle(uint256) view returns (tuple(address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, address ticketPaymentToken, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint8 status, uint256 expirationTime, uint256 createdAt, address winner, bool rewardClaimed))",
    "function emergencyWithdrawNFT(address nftContract, uint256 tokenId) external",
    "function adminForceEndRaffle(uint256 raffleId, string reason) external",
    "function totalRaffles() view returns (uint256)"
  ];
  
  let totalNFTsFound = 0;
  let totalStuckRewards = 0;
  let withdrawableContracts = [];
  
  for (const contractInfo of contracts) {
    //console.log(`\n🎨 Checking ${contractInfo.name}: ${contractInfo.address}`);
    
    try {
      const contract = new ethers.Contract(contractInfo.address, minimalRaffleABI, wallet);
      
      // Check if we are owner first
      let isOwner = false;
      try {
        const owner = await contract.owner();
        isOwner = owner.toLowerCase() === wallet.address.toLowerCase();
        //console.log(`👑 Contract Owner: ${owner} ${isOwner ? '✅' : '❌'}`);
      } catch (e) {
        //console.log(`⚠️  Could not check owner`);
      }
      
      // Get total raffles if possible
      let totalRaffles = 20; // default
      try {
        const total = await contract.totalRaffles();
        totalRaffles = Math.min(Number(total), 50); // Check max 50 raffles
        //console.log(`📊 Total Raffles: ${total.toString()}`);
      } catch (e) {
        //console.log(`📊 Checking first 20 raffles...`);
      }
      
      // Check for NFT rewards in raffles
      //console.log(`🔍 Scanning raffles for NFT rewards...`);
      let nftRewards = [];
      let stuckNFTRewards = [];
      let activeNFTRaffles = [];
      
      for (let raffleId = 0; raffleId < totalRaffles; raffleId++) {
        try {
          const raffle = await contract.getRaffle(raffleId);
          
          if (raffle.creator !== '0x0000000000000000000000000000000000000000') {
            // Check if this is an NFT raffle
            if (raffle.rewardType == 1) { // NFT reward
              nftRewards.push({
                raffleId: raffleId,
                title: raffle.title,
                nftContract: raffle.rewardTokenAddress,
                tokenId: raffle.rewardAmount.toString(),
                status: raffle.status,
                winner: raffle.winner,
                ticketsSold: raffle.ticketsSold,
                maxTickets: raffle.maxTickets,
                expirationTime: raffle.expirationTime
              });
              
              const now = Math.floor(Date.now() / 1000);
              const isExpired = now > Number(raffle.expirationTime);
              const isSoldOut = Number(raffle.ticketsSold) >= Number(raffle.maxTickets);
              const hasWinner = raffle.winner !== '0x0000000000000000000000000000000000000000';
              
              if (raffle.status == 0) { // Still ACTIVE
                if (isExpired || isSoldOut) {
                  // This NFT is stuck!
                  //console.log(`   🚨 STUCK NFT in Raffle #${raffleId}: "${raffle.title}"`);
                  //console.log(`     NFT: ${raffle.rewardTokenAddress} #${raffle.rewardAmount.toString()}`);
                  //console.log(`     Status: ${isExpired ? 'EXPIRED' : 'SOLD OUT'} but still ACTIVE`);
                  //console.log(`     Tickets: ${raffle.ticketsSold}/${raffle.maxTickets}`);
                  
                  stuckNFTRewards.push({
                    raffleId: raffleId,
                    title: raffle.title,
                    nftContract: raffle.rewardTokenAddress,
                    tokenId: raffle.rewardAmount.toString(),
                    reason: isExpired ? 'EXPIRED' : 'SOLD OUT'
                  });
                } else {
                  activeNFTRaffles.push(raffleId);
                }
              } else if (raffle.status == 1 && !hasWinner) {
                // Ended but no winner selected
                //console.log(`   ⚠️  NFT Raffle #${raffleId} ENDED but no winner: "${raffle.title}"`);
                stuckNFTRewards.push({
                  raffleId: raffleId,
                  title: raffle.title,
                  nftContract: raffle.rewardTokenAddress,
                  tokenId: raffle.rewardAmount.toString(),
                  reason: 'ENDED_NO_WINNER'
                });
              }
            }
          }
        } catch (e) {
          break; // No more raffles
        }
      }
      
      // Summary for this contract
      //console.log(`\n   📊 NFT SUMMARY for ${contractInfo.name}:`);
      //console.log(`     🎨 Total NFT raffles found: ${nftRewards.length}`);
      //console.log(`     🚨 Stuck NFT rewards: ${stuckNFTRewards.length}`);
      //console.log(`     ✅ Active NFT raffles: ${activeNFTRaffles.length}`);
      
      if (stuckNFTRewards.length > 0) {
        //console.log(`     🎯 Recoverable NFTs:`);
        stuckNFTRewards.forEach((nft, index) => {
          //console.log(`       ${index + 1}. Raffle #${nft.raffleId}: "${nft.title}" (${nft.reason})`);
          //console.log(`          NFT: ${nft.nftContract} #${nft.tokenId}`);
        });
        
        if (isOwner) {
          //console.log(`     ✅ You can recover these NFTs as contract owner!`);
          withdrawableContracts.push({
            ...contractInfo,
            stuckNFTRewards: stuckNFTRewards
          });
        }
      }
      
      totalNFTsFound += nftRewards.length;
      totalStuckRewards += stuckNFTRewards.length;
      
    } catch (error) {
      //console.log(`   ❌ Error checking ${contractInfo.name}:`, error.message);
    }
  }
  
  //console.log(`\n🎯 GLOBAL SUMMARY:`);
  //console.log(`🎨 Total NFT raffles found: ${totalNFTsFound}`);
  //console.log(`🚨 Total stuck NFT rewards: ${totalStuckRewards}`);
  //console.log(`🔐 Contracts with recoverable NFTs: ${withdrawableContracts.length}`);
  
  if (totalStuckRewards > 0) {
    //console.log(`\n💰 NFT RECOVERY OPTIONS:`);
    //console.log(`1. Use adminForceEndRaffle() to resolve stuck raffles`);
    //console.log(`2. Use emergencyWithdrawNFT() if available`);
    //console.log(`3. Manual intervention for complex cases`);
    
    //console.log(`\n🚀 To recover NFTs automatically, run:`);
    //console.log(`node recover-stuck-nfts.js`);
    
    withdrawableContracts.forEach((contract, index) => {
      //console.log(`\n${index + 1}. ${contract.name} (${contract.stuckNFTRewards.length} NFTs):`);
      contract.stuckNFTRewards.forEach(nft => {
        //console.log(`   - Raffle #${nft.raffleId}: ${nft.reason}`);
      });
    });
  } else {
    //console.log(`\n✨ Good news! No stuck NFT rewards found.`);
    //console.log(`All NFT raffles appear to be properly resolved.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Script failed:", error);
    process.exit(1);
  }); 