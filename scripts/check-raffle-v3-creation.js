const { ethers } = require('hardhat');

async function main() {
  const contractAddress = "0x3F0F22132a0A3864B5CD0F79D211Bf28511A76f0";
  
  // Connect to the contract
  const RaffleV3 = await ethers.getContractAt("NadRaffleV3", contractAddress);
  
  try {
    // Get total raffles
    const totalRaffles = await RaffleV3.getTotalRaffles();
    console.log('Total Raffles:', totalRaffles.toString());
    
    if (totalRaffles > 0) {
      // Get the latest raffle (ID = totalRaffles)
      const latestRaffleId = totalRaffles;
      console.log('\n=== Latest Raffle (ID:', latestRaffleId.toString(), ') ===');
      
      const raffle = await RaffleV3.getRaffle(latestRaffleId);
      
      console.log('Creator:', raffle.creator);
      console.log('Title:', raffle.title);
      console.log('Description:', raffle.description);
      console.log('Reward Type:', raffle.rewardType === 0 ? 'TOKEN' : 'NFT');
      console.log('Reward Token Address:', raffle.rewardTokenAddress);
      console.log('Reward Amount/Token ID:', raffle.rewardAmount.toString());
      console.log('Ticket Payment Token:', raffle.ticketPaymentToken);
      console.log('Ticket Price:', ethers.formatEther(raffle.ticketPrice), 'tokens');
      console.log('Max Tickets:', raffle.maxTickets.toString());
      console.log('Tickets Sold:', raffle.ticketsSold.toString());
      console.log('Status:', raffle.status === 0 ? 'ACTIVE' : raffle.status === 1 ? 'ENDED' : 'CANCELLED');
      console.log('Expiration Time:', new Date(raffle.expirationTime * 1000).toISOString());
      console.log('Created At:', new Date(raffle.createdAt * 1000).toISOString());
      
      if (raffle.winner !== '0x0000000000000000000000000000000000000000') {
        console.log('Winner:', raffle.winner);
        console.log('Reward Claimed:', raffle.rewardClaimed);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(console.error); 