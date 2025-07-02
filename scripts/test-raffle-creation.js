const { ethers } = require("hardhat");

async function main() {
  ////,
    ticketPrice: testParams.ticketPrice.toString(),
    expirationTime: new Date(testParams.expirationTime * 1000)
  });
  
  try {
    // Check if we have enough balance for reward + creation fee
    const totalRequired = testParams.rewardAmount + ethers.parseEther("0.001");
    if (balance < totalRequired) {
      //console.error("❌ Insufficient balance!");
      //const tx = await NadRaffleV2.createRaffle(
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
      { value: ethers.parseEther("0.001") } // Creation fee
    );
    
    //{
    //console.error("❌ Error creating raffle:", error.message);
    
    // Try to get more details about the error
    if (error.data) {
      //{
      //.then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 