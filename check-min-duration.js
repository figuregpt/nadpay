const { ethers } = require('hardhat');

const NADRAFFLE_V6_ADDRESS = '0x51bA8C7AFA1bf51cCba0Abf0Da56f4e5c07D351A';
const V6_ABI = [
  {
    "inputs": [],
    "name": "minRaffleDuration",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkMinDuration() {
  const [signer] = await ethers.getSigners();
  
  const contract = new ethers.Contract(NADRAFFLE_V6_ADDRESS, V6_ABI, signer);
  
  try {
    const minDuration = await contract.minRaffleDuration();
    console.log('✅ Current minimum duration:', minDuration.toString(), 'seconds');
    console.log('⏰ In minutes:', (Number(minDuration) / 60).toFixed(1), 'minutes');
    console.log('⏰ In hours:', (Number(minDuration) / 3600).toFixed(2), 'hours');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMinDuration();
