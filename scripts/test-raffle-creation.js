const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Raffle Creation...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Contract addresses
  const RAFFLE_V2_ADDRESS = "0x136bC59567f12a49F8485f3E76CbAd13f3bB56cF";
  
  // Get contract instance
  const NadRaffleV2 = await ethers.getContractAt("NadRaffleV2", RAFFLE_V2_ADDRESS);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "MON");
  
  // Test parameters - similar to what UI is sending
  const testParams = {
    title: "Test Raffle",
    description: "Test Description",
    imageHash: "",
    rewardType: 0, // TOKEN
    rewardTokenAddress: "0x0000000000000000000000000000000000000000", // Native MON
    rewardAmount: ethers.parseEther("1"), // 1 MON
    ticketPaymentToken: "0x0000000000000000000000000000000000000000", // Native MON
    ticketPrice: ethers.parseEther("0.01"), // 0.01 MON
    maxTickets: 1n,
    maxTicketsPerWallet: 1n,
    expirationTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    autoDistributeOnSoldOut: true
  };
  
  console.log("Test parameters:", {
    ...testParams,
    rewardAmount: testParams.rewardAmount.toString(),
    ticketPrice: testParams.ticketPrice.toString(),
    expirationTime: new Date(testParams.expirationTime * 1000)
  });
  
  try {
    // Check if we have enough balance for reward + creation fee
    const totalRequired = testParams.rewardAmount + ethers.parseEther("0.001");
    if (balance < totalRequired) {
      console.error("❌ Insufficient balance!");
      console.log("Required:", ethers.formatEther(totalRequired), "MON");
      console.log("Available:", ethers.formatEther(balance), "MON");
      return;
    }
    
    // Try to create raffle
    console.log("Creating raffle...");
    const tx = await NadRaffleV2.createRaffle(
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
    
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Raffle created successfully!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check total raffles
    const totalRaffles = await NadRaffleV2.getTotalRaffles();
    console.log("Total raffles now:", totalRaffles.toString());
    
  } catch (error) {
    console.error("❌ Error creating raffle:", error.message);
    
    // Try to get more details about the error
    if (error.data) {
      console.log("Error data:", error.data);
    }
    
    // Check if it's a revert with reason
    if (error.reason) {
      console.log("Revert reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 