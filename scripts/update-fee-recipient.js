const hre = require("hardhat");

async function main() {
  //console.log("🔧 Updating fee recipient addresses...");

  // Get the signer
  const [deployer] = await hre.ethers.getSigners();
  //console.log("Using account:", deployer.address);
  
  // New fee recipient address
  const newFeeRecipient = "0x00d3a6670a1e5226d6b5dc524e3243e7741c8460";
  //console.log("New fee recipient:", newFeeRecipient);
  
  // Contract addresses
  const nadpayAddress = "0x17c31F99b27c10fbFF0aA241202DF687377DC24A";
  const raffleAddress = "0x960F8C6AaDFA3902060A61E3c612833aA05B2837";
  
  // Update NadPay contract
  //console.log("\n📄 Updating NadPay contract...");
  const NadPay = await hre.ethers.getContractFactory("NadPay");
  const nadpay = NadPay.attach(nadpayAddress);
  
  try {
    const tx1 = await nadpay.setFeeRecipient(newFeeRecipient);
    await tx1.wait();
    //console.log("✅ NadPay fee recipient updated!");
    //console.log("📋 Transaction:", tx1.hash);
  } catch (error) {
    //console.log("❌ NadPay update failed:", error.message);
  }
  
  // Note: NadRaffle doesn't have setFeeRecipient function, 
  // fees go to contract owner which is already the correct address
  //console.log("\n🎲 NadRaffle contract:");
  const NadRaffle = await hre.ethers.getContractFactory("NadRaffle");
  const raffle = NadRaffle.attach(raffleAddress);
  
  try {
    const owner = await raffle.owner();
    const platformFee = await raffle.platformFeePercentage();
    //console.log("✅ Owner (fee recipient):", owner);
    //console.log("✅ Platform fee:", platformFee.toString(), "basis points (" + (platformFee/100).toString() + "%)");
  } catch (error) {
    //console.log("❌ Raffle check failed:", error.message);
  }
  
  //console.log("\n🎉 Fee recipient update completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 