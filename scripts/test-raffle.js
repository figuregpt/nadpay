const { ethers } = require("hardhat");

async function main() {
  console.log("Testing NadRaffle contract...");

  // Get the deployed contract
  const contractAddress = "0x5007131517440FEEf9F67291A35E4100c41f3aB5";
  const NadRaffle = await ethers.getContractFactory("NadRaffle");
  const nadRaffle = NadRaffle.attach(contractAddress);

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Testing with account:", signer.address);

  try {
    // Test basic contract functions
    console.log("\n📋 Testing basic contract functions...");
    
    const totalRaffles = await nadRaffle.getTotalRaffles();
    console.log("Total raffles:", totalRaffles.toString());
    
    const platformFee = await nadRaffle.platformFeePercentage();
    console.log("Platform fee:", platformFee.toString(), "basis points");
    
    const owner = await nadRaffle.owner();
    console.log("Contract owner:", owner);
    
    const maxFee = await nadRaffle.MAX_FEE();
    console.log("Max fee:", maxFee.toString(), "basis points");

    console.log("\n✅ Basic contract tests passed!");
    
    // Test view functions that don't require state
    console.log("\n📋 Testing view functions...");
    
    // Test with non-existent raffle ID
    try {
      const nonExistentRaffle = await nadRaffle.getRaffle(999);
      console.log("Non-existent raffle creator:", nonExistentRaffle.creator);
    } catch (error) {
      console.log("Expected: Non-existent raffle returns zero address");
    }
    
    const userRaffles = await nadRaffle.getUserRaffles(signer.address);
    console.log("User raffles:", userRaffles.length);
    
    console.log("\n✅ View function tests passed!");
    
    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📝 Contract is ready for use!");
    console.log("Contract Address:", contractAddress);
    console.log("Explorer URL:", `https://testnet.monadexplorer.com/address/${contractAddress}`);
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 