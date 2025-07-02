const { createPublicClient, http } = require('viem');
const { defineChain } = require('viem');

// Define Monad testnet
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet1.monad.xyz'] },
    public: { http: ['https://testnet1.monad.xyz'] }
  }
});

const client = createPublicClient({
  chain: monadTestnet,
  transport: http('https://testnet1.monad.xyz')
});

// Ultra-Secure contract
const contractAddress = '0x755c6402938a039828fe3b6c7C54A07Ea7115C42';

async function debugRaffle() {
  try {
    //console.log('🔍 Testing Ultra-Secure Contract:', contractAddress);
    
    // Test basic functions
    const totalRaffles = await client.readContract({
      address: contractAddress,
      abi: [{ name: 'getTotalRaffles', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] }],
      functionName: 'getTotalRaffles'
    });
    
    //console.log('📊 Total Raffles:', totalRaffles.toString());
    
    if (totalRaffles > 0) {
      // Get the latest raffle (ID 0)
      const raffleId = 0;
      //console.log(`\n🎫 Getting Raffle ID ${raffleId}...`);
      
      const raffleData = await client.readContract({
        address: contractAddress,
        abi: [{
          name: 'getRaffle',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'raffleId', type: 'uint256' }],
          outputs: [{
            type: 'tuple',
            components: [
              { name: 'id', type: 'uint256' },
              { name: 'creator', type: 'address' },
              { name: 'title', type: 'string' },
              { name: 'description', type: 'string' },
              { name: 'rewardType', type: 'uint8' },
              { name: 'rewardTokenAddress', type: 'address' },
              { name: 'rewardAmount', type: 'uint256' },
              { name: 'ticketPrice', type: 'uint256' },
              { name: 'ticketPaymentToken', type: 'address' },
              { name: 'maxTickets', type: 'uint256' },
              { name: 'ticketsSold', type: 'uint256' },
              { name: 'totalEarned', type: 'uint256' },
              { name: 'expirationTime', type: 'uint256' },
              { name: 'autoDistributeOnSoldOut', type: 'bool' },
              { name: 'winner', type: 'address' },
              { name: 'status', type: 'uint8' },
              { name: 'rewardClaimed', type: 'bool' },
              { name: 'createdAt', type: 'uint256' }
            ]
          }]
        }],
        functionName: 'getRaffle',
        args: [BigInt(raffleId)]
      });
      
      //console.log('\n📋 Raw Raffle Data:');
      //console.log('ID:', raffleData.id?.toString());
      //console.log('Creator:', raffleData.creator);
      //console.log('Title:', raffleData.title);
      //console.log('Description:', raffleData.description);
      //console.log('Reward Type:', raffleData.rewardType?.toString());
      //console.log('Reward Token Address:', raffleData.rewardTokenAddress);
      //console.log('Reward Amount:', raffleData.rewardAmount?.toString());
      //console.log('Ticket Price:', raffleData.ticketPrice?.toString());
      //console.log('Ticket Payment Token:', raffleData.ticketPaymentToken);
      //console.log('Max Tickets:', raffleData.maxTickets?.toString());
      //console.log('Tickets Sold:', raffleData.ticketsSold?.toString());
      //console.log('Total Earned:', raffleData.totalEarned?.toString());
      //console.log('Expiration Time:', raffleData.expirationTime?.toString());
      //console.log('Auto Distribute:', raffleData.autoDistributeOnSoldOut);
      //console.log('Winner:', raffleData.winner);
      //console.log('Status:', raffleData.status?.toString());
      //console.log('Reward Claimed:', raffleData.rewardClaimed);
      //console.log('Created At:', raffleData.createdAt?.toString());
      
      // Convert to human readable
      //console.log('\n🎯 Human Readable:');
      //console.log('Ticket Price:', (Number(raffleData.ticketPrice) / 1e18).toFixed(4), 'MON');
      //console.log('Reward Amount:', (Number(raffleData.rewardAmount) / 1e18).toFixed(4), 'MON');
      //console.log('Expiration:', new Date(Number(raffleData.expirationTime) * 1000).toLocaleString());
      //console.log('Status:', raffleData.status === 0 ? 'ACTIVE' : raffleData.status === 1 ? 'ENDED' : 'CANCELLED');
    }
    
  } catch (error) {
    //console.error('❌ Error:', error.message);
  }
}

debugRaffle(); 