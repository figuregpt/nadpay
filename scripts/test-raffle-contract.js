const { ethers } = require("hardhat");

async function main() {
  //,
            creator: raffle[1],
            title: raffle[2],
            description: raffle[3],
            rewardType: raffle[5].toString(),
            rewardAmount: raffle[7].toString(),
            ticketPrice: raffle[8].toString(),
            status: raffle[16].toString()
          });
        } catch (error) {
          //}
      }
    }

    // Test with the deployer address
    const testAddress = "0x00D3a6670a1E5226d6b5dc524e3243e7741C8460"; // Deployer address
    //try {
      const userRaffles = await nadRaffle.getUserRaffles(testAddress);
      //{
      //{
    //console.error("Contract test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 