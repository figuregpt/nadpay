const { ethers } = require('hardhat');

async function main() {
  console.log("🔍 Checking Raffle Rewards Status...");
  
  // Contract addresses to check (use the ones from finalizer logs)
  const contracts = [
    { name: "V4 WORKING", address: "0xa874905B117242eC6c966E35B18985e9242Bb633" }
  ];
  
  try {
    const [signer] = await ethers.getSigners();
    console.log("👤 Using wallet:", signer.address);
    console.log("🌐 Network:", await ethers.provider.getNetwork());
    
    for (const contractInfo of contracts) {
      console.log(`\n🔍 Checking ${contractInfo.name}: ${contractInfo.address}`);
      
      try {
        // For simplicity, let's use a minimal ABI that should work
        const minimalABI = [
          "function getRaffle(uint256) view returns (tuple(address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, address ticketPaymentToken, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint8 status, uint256 expirationTime, uint256 createdAt, address winner, bool rewardClaimed))",
          "function totalRaffles() view returns (uint256)",
          "function randomnessCommits(uint256) view returns (tuple(bytes32 commitment, uint256 revealDeadline, bool revealed))"
        ];
        
        const contract = new ethers.Contract(contractInfo.address, minimalABI, signer);
        
        // Check contract balance
        const balance = await ethers.provider.getBalance(contractInfo.address);
        console.log(`💰 Contract MON Balance: ${ethers.formatEther(balance)} MON`);
        
        // Try to get total raffles first
        let totalRaffles = 10; // default
        try {
          const total = await contract.totalRaffles();
          totalRaffles = Number(total);
          console.log(`📊 Total Raffles Created: ${totalRaffles}`);
        } catch (e) {
          console.log("⚠️  Could not get total raffles, checking 0-10");
        }
        
        // Check specific raffles
        let foundRaffles = 0;
        for (let raffleId = 0; raffleId <= Math.min(totalRaffles, 20); raffleId++) {
          try {
            const raffle = await contract.getRaffle(raffleId);
            
            // Check if this is a real raffle (has a creator)
            if (raffle.creator && raffle.creator !== '0x0000000000000000000000000000000000000000') {
              foundRaffles++;
              console.log(`\n📋 Raffle #${raffleId}: "${raffle.title}"`);
              console.log(`   Creator: ${raffle.creator}`);
              console.log(`   Status: ${raffle.status} (0=ACTIVE, 1=ENDED, 2=CANCELLED)`);
              console.log(`   Tickets: ${raffle.ticketsSold}/${raffle.maxTickets}`);
              console.log(`   Winner: ${raffle.winner}`);
              console.log(`   Reward Type: ${raffle.rewardType} (0=TOKEN, 1=NFT)`);
              
              if (raffle.rewardType == 0) {
                // Token reward
                console.log(`   Reward Amount: ${ethers.formatEther(raffle.rewardAmount)} ${raffle.rewardTokenAddress === '0x0000000000000000000000000000000000000000' ? 'MON' : 'TOKEN'}`);
              } else {
                // NFT reward
                console.log(`   Reward NFT: Token ID ${raffle.rewardAmount.toString()}`);
                console.log(`   NFT Contract: ${raffle.rewardTokenAddress}`);
              }
              
              console.log(`   Reward Claimed: ${raffle.rewardClaimed}`);
              console.log(`   Expiration: ${new Date(Number(raffle.expirationTime) * 1000).toLocaleString()}`);
              
              // Check for problems
              const now = Math.floor(Date.now() / 1000);
              const isExpired = now > Number(raffle.expirationTime);
              const isSoldOut = Number(raffle.ticketsSold) >= Number(raffle.maxTickets);
              
              if (raffle.status == 0 && isSoldOut) {
                console.log(`   🚨 SOLD OUT but still ACTIVE - rewards stuck!`);
              }
              
              if (raffle.status == 0 && isExpired) {
                console.log(`   ⏰ EXPIRED but still ACTIVE - rewards stuck!`);
              }
              
              if (raffle.winner !== '0x0000000000000000000000000000000000000000' && !raffle.rewardClaimed) {
                console.log(`   🎉 Winner selected but reward NOT claimed yet`);
              }
              
              if (raffle.winner !== '0x0000000000000000000000000000000000000000' && raffle.rewardClaimed) {
                console.log(`   ✅ Winner selected and reward CLAIMED`);
              }
              
              // Check randomness commitment status
              try {
                const commitment = await contract.randomnessCommits(raffleId);
                if (commitment.commitment !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                  console.log(`   🎲 Randomness committed, reveal deadline: ${new Date(Number(commitment.revealDeadline) * 1000).toLocaleString()}`);
                  console.log(`   🔓 Revealed: ${commitment.revealed}`);
                  
                  if (now > Number(commitment.revealDeadline) && !commitment.revealed && raffle.status == 0) {
                    console.log(`   ⚡ READY for emergency winner selection!`);
                  }
                }
              } catch (e) {
                // No commitment or function doesn't exist
              }
            }
          } catch (raffleError) {
            // This raffle ID doesn't exist, continue checking
            if (raffleError.message.includes("invalid raffle")) {
              continue;
            }
          }
        }
        
        console.log(`\n📈 Found ${foundRaffles} raffles in ${contractInfo.name}`);
        
      } catch (contractError) {
        console.log(`❌ Error checking ${contractInfo.name}:`, contractError.message);
      }
    }
    
    console.log("\n🎯 SUMMARY:");
    console.log("- Look for 🚨 SOLD OUT but still ACTIVE");
    console.log("- Look for ⏰ EXPIRED but still ACTIVE"); 
    console.log("- Look for ⚡ READY for emergency winner selection");
    console.log("- Look for 🎉 Winner selected but reward NOT claimed");
    
  } catch (error) {
    console.error("❌ Script failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 