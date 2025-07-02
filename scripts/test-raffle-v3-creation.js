const { ethers } = require("hardhat");

async function main() {
  ////,
    ticketPrice: testParams.ticketPrice.toString(),
    expirationTime: new Date(testParams.expirationTime * 1000)
  });
  
  try {
    // Calculate total required: creation fee (0.001) + reward amount (1)
    const creationFee = ethers.parseEther("0.001");
    const totalRequired = creationFee + testParams.rewardAmount;
    
    //const tx = await NadRaffleV3.createRaffle(
      testParams.title,
      testParams.description,
      testParams.imageHash,
      testParams.rewardType,
      testParams.rewardTokenAddress,
      testParams.rewardAmount,
      testParams.ticketPaymentToken,
      testParams.ticketPrice,
      testParams.maxTickets,
      testParams.maxTicketsPerWallet,
      testParams.expirationTime,
      testParams.autoDistributeOnSoldOut,
      { value: totalRequired } // Send creation fee + reward amount
    );
    
    ////{
    //console.error("❌ Error creating raffle:", error.message);
    
    // Try to get more details about the error
    if (error.data) {
      //{
      //.then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 