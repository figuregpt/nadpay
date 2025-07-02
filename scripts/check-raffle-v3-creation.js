const { ethers } = require('hardhat');

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Updated V3 with 13-minute minimum
  
  // Connect to the contract
  const RaffleV3 = await ethers.getContractAt("NadRaffleV3", contractAddress);
  
  try {
    // Get total raffles
    const totalRaffles = await RaffleV3.getTotalRaffles();
    //{
    //console.error('Error:', error.message);
  }
}

main().catch(//console.error); 