const { ethers } = require("hardhat");

async function main() {
  console.log("Testing NadRaffle contract...");

  // Get the contract instance
  const contractAddress = "0x3F5701E0d8c7e98106e63B5E45B6F88B0453d74e";
  const NadRaffle = await ethers.getContractFactory("NadRaffle");
  const nadRaffle = NadRaffle.attach(contractAddress);

  try {
    // Test basic contract functions
    console.log("Getting total raffles...");
    const totalRaffles = await nadRaffle.getTotalRaffles();
    console.log("Total raffles:", totalRaffles.toString());

    if (totalRaffles > 0) {
      console.log("Getting all raffles...");
      for (let i = 0; i < Math.min(Number(totalRaffles), 6); i++) {
        try {
          const raffle = await nadRaffle.getRaffle(i);
          console.log(`Raffle ${i}:`, {
            id: raffle[0].toString(),
            creator: raffle[1],
            title: raffle[2],
            description: raffle[3],
            rewardType: raffle[5].toString(),
            rewardAmount: raffle[7].toString(),
            ticketPrice: raffle[8].toString(),
            status: raffle[16].toString()
          });
        } catch (error) {
          console.log(`Error getting raffle ${i}:`, error.message);
        }
      }
    }

    // Test with the deployer address
    const testAddress = "0x00D3a6670a1E5226d6b5dc524e3243e7741C8460"; // Deployer address
    console.log(`Getting raffles for address: ${testAddress}`);
    
    try {
      const userRaffles = await nadRaffle.getUserRaffles(testAddress);
      console.log("User raffles (IDs):", userRaffles.map(id => id.toString()));
    } catch (error) {
      console.log("Error getting user raffles:", error.message);
    }

  } catch (error) {
    console.error("Contract test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 