const { ethers } = require("hardhat");

async function main() {
  //",
    "function getRaffle(uint256 raffleId) external view returns (tuple(uint256 id, address creator, string title, string description, string imageHash, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, address ticketPaymentToken, uint256 ticketPrice, uint256 maxTickets, uint256 maxTicketsPerWallet, uint256 expirationTime, bool autoDistributeOnSoldOut, uint256 ticketsSold, uint256 totalEarned, address winner, uint8 status, uint256 createdAt, bool rewardClaimed))"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, ethers.provider);
  
  try {
    // Check total raffles
    const totalRaffles = await contract.getTotalRaffles();
    ////{
        //}
    }
    
    // Test creator raffles with a sample address
    const testAddress = "0x00D3a6670a1E5226d6b5dc524e3243e7741C8460"; // Your wallet address
    try {
      const creatorRaffles = await contract.getUserRaffles(testAddress);
      //creatorRaffles.forEach((raffleId, index) => {
        //}`);
      });
    } catch (error) {
      //{
    //console.error("❌ Contract Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 