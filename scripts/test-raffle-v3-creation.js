const { ethers } = require("hardhat");

async function main() {
  //console.log("🎫 Testing Raffle V3 Creation with Native MON Reward...");
  
  const [deployer] = await ethers.getSigners();
  //console.log("Deployer address:", deployer.address);
  
  // V3 Contract address
  const RAFFLE_V3_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Updated V3 with 13-minute minimum
  
  // Get contract instance
  const NadRaffleV3 = await ethers.getContractAt("NadRaffleV3", RAFFLE_V3_ADDRESS);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  //console.log("Deployer balance:", ethers.formatEther(balance), "MON");
  
  // Test parameters - Native MON reward
  const testParams = {
    title: "Test V3 Raffle",
    description: "Testing native MON reward",
    imageHash: "",
    rewardType: 0, // TOKEN
    rewardTokenAddress: "0x0000000000000000000000000000000000000000", // Native MON
    rewardAmount: ethers.parseEther("1"), // 1 MON reward
    ticketPaymentToken: "0x0000000000000000000000000000000000000000", // Native MON payment
    ticketPrice: ethers.parseEther("0.01"), // 0.01 MON per ticket
    maxTickets: 5n,
    maxTicketsPerWallet: 2n,
    expirationTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    autoDistributeOnSoldOut: true
  };
  
  //console.log("Test parameters:", {
    ...testParams,
    rewardAmount: testParams.rewardAmount.toString(),
    ticketPrice: testParams.ticketPrice.toString(),
    expirationTime: new Date(testParams.expirationTime * 1000)
  });
  
  try {
    // Calculate total required: creation fee (0.001) + reward amount (1)
    const creationFee = ethers.parseEther("0.001");
    const totalRequired = creationFee + testParams.rewardAmount;
    
    //console.log("Required amounts:");
    //console.log("- Creation fee:", ethers.formatEther(creationFee), "MON");
    //console.log("- Reward amount:", ethers.formatEther(testParams.rewardAmount), "MON");
    //console.log("- Total required:", ethers.formatEther(totalRequired), "MON");
    //console.log("- Available balance:", ethers.formatEther(balance), "MON");
    
    if (balance < totalRequired) {
      //console.error("❌ Insufficient balance!");
      return;
    }
    
    // Try to create raffle
    //console.log("\n🎯 Creating V3 raffle with native MON reward...");
    const tx = await NadRaffleV3.createRaffle(
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
    
    //console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    //console.log("✅ Raffle created successfully!");
    //console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check total raffles
    const totalRaffles = await NadRaffleV3.getTotalRaffles();
    //console.log("Total raffles now:", totalRaffles.toString());
    
    // Get the created raffle details
    if (totalRaffles > 0) {
      const raffleId = totalRaffles; // Latest raffle ID
      const raffle = await NadRaffleV3.getRaffle(raffleId);
      //console.log("\n📋 Created Raffle Details:");
      //console.log("- ID:", raffle.id.toString());
      //console.log("- Title:", raffle.title);
      //console.log("- Creator:", raffle.creator);
      //console.log("- Reward Type:", raffle.rewardType === 0n ? "TOKEN" : "NFT");
      //console.log("- Reward Token:", raffle.rewardTokenAddress);
      //console.log("- Reward Amount:", ethers.formatEther(raffle.rewardAmount), "MON");
      //console.log("- Ticket Price:", ethers.formatEther(raffle.ticketPrice), "MON");
      //console.log("- Max Tickets:", raffle.maxTickets.toString());
      //console.log("- Status:", raffle.status === 0n ? "ACTIVE" : raffle.status === 1n ? "ENDED" : "CANCELLED");
    }
    
    //console.log("\n🎉 V3 Contract Test Successful!");
    //console.log("Native MON rewards are now working correctly!");
    
  } catch (error) {
    //console.error("❌ Error creating raffle:", error.message);
    
    // Try to get more details about the error
    if (error.data) {
      //console.log("Error data:", error.data);
    }
    
    // Check if it's a revert with reason
    if (error.reason) {
      //console.log("Revert reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 