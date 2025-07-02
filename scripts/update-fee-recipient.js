const hre = require("hardhat");

async function main() {
  ////{
    //const NadRaffle = await hre.ethers.getContractFactory("NadRaffle");
  const raffle = NadRaffle.attach(raffleAddress);
  
  try {
    const owner = await raffle.owner();
    const platformFee = await raffle.platformFeePercentage();
    //{
    //}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 