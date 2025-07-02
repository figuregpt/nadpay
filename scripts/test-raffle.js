const { ethers } = require("hardhat");

async function main() {
  //console.log("Testing NadRaffle contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  //console.log("Testing with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  //console.log("Account balance:", ethers.formatEther(balance), "MON");

  // Connect to the deployed contract
  const contractAddress = "0x3F5701E0d8c7e98106e63B5E45B6F88B0453d74e";
  const NadRaffle = await ethers.getContractFactory("NadRaffle");
  const nadRaffle = NadRaffle.attach(contractAddress);

  //console.log("Contract Address:", contractAddress);

  try {
    // Test basic contract calls
    //console.log("\n🔍 Testing contract functions...");
    
    const totalRaffles = await nadRaffle.getTotalRaffles();
    //console.log("✅ Total raffles:", totalRaffles.toString());
    
    const platformFee = await nadRaffle.platformFeePercentage();
    //console.log("✅ Platform fee:", platformFee.toString(), "basis points");
    
    const owner = await nadRaffle.owner();
    //console.log("✅ Contract owner:", owner);
    
    //console.log("\n🎯 Testing MON raffle creation...");
    
    // Create a test raffle with MON reward
    const rewardAmount = ethers.parseEther("1.0"); // 1 MON reward
    const creationFee = ethers.parseEther("0.001"); // 0.001 MON creation fee
    const totalValue = rewardAmount + creationFee; // Total: 1.001 MON
    
    //console.log("Reward amount:", ethers.formatEther(rewardAmount), "MON");
    //console.log("Creation fee:", ethers.formatEther(creationFee), "MON");
    //console.log("Total value:", ethers.formatEther(totalValue), "MON");
    
    const tx = await nadRaffle.createRaffle(
      "Test MON Raffle",
      "Testing native MON rewards",
      "", // imageHash
      0, // RewardType.TOKEN
      "0x0000000000000000000000000000000000000000", // Native MON
      rewardAmount,
      ethers.parseEther("0.01"), // 0.01 MON per ticket
      10, // max tickets
      5, // max per wallet
      Math.floor(Date.now() / 1000) + 86400, // expires in 1 day
      true, // auto distribute
      { value: totalValue }
    );
    
    //console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    //console.log("✅ Raffle created! Block:", receipt.blockNumber);
    
    // Check total raffles again
    const newTotalRaffles = await nadRaffle.getTotalRaffles();
    //console.log("✅ New total raffles:", newTotalRaffles.toString());
    
    // Get the raffle details
    const raffleId = newTotalRaffles;
    const raffle = await nadRaffle.getRaffle(raffleId);
    //console.log("✅ Raffle details:");
    //console.log("  - ID:", raffle.id.toString());
    //console.log("  - Title:", raffle.title);
    //console.log("  - Creator:", raffle.creator);
    //console.log("  - Reward Type:", raffle.rewardType.toString());
    //console.log("  - Reward Token:", raffle.rewardTokenAddress);
    //console.log("  - Reward Amount:", ethers.formatEther(raffle.rewardAmount), "MON");
    //console.log("  - Ticket Price:", ethers.formatEther(raffle.ticketPrice), "MON");
    //console.log("  - Status:", raffle.status.toString());
    
  } catch (error) {
    //console.error("❌ Contract test failed:", error.message);
    if (error.data) {
      //console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 