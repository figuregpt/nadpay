const hre = require("hardhat");

async function main() {
  //console.log("🔍 Checking contract status...");

  // Get the signer
  const [deployer] = await hre.ethers.getSigners();
  //console.log("Using account:", deployer.address);
  
  // Contract addresses
  const nadpayAddress = "0x17c31F99b27c10fbFF0aA241202DF687377DC24A";
  const raffleAddress = "0x960F8C6AaDFA3902060A61E3c612833aA05B2837";
  
  //console.log("\n📄 NadPay Contract Status:");
  //console.log("Contract Address:", nadpayAddress);
  
  try {
    const NadPay = await hre.ethers.getContractFactory("NadPay");
    const nadpay = NadPay.attach(nadpayAddress);
    
    const owner = await nadpay.owner();
    const feeRecipient = await nadpay.feeRecipient();
    const platformFee = await nadpay.platformFee();
    
    //console.log("✅ Owner:", owner);
    //console.log("✅ Fee Recipient:", feeRecipient);
    //console.log("✅ Platform Fee:", platformFee.toString(), "basis points (" + (Number(platformFee)/100).toString() + "%)");
    
    // Check if fee recipient is the secure address
    const secureAddress = "0x00d3a6670a1e5226d6b5dc524e3243e7741c8460";
    if (feeRecipient.toLowerCase() === secureAddress.toLowerCase()) {
      //console.log("🛡️  Fee recipient is SECURE ✅");
    } else {
      //console.log("⚠️  Fee recipient needs update!");
      //console.log("   Current:", feeRecipient);
      //console.log("   Should be:", secureAddress);
    }
    
  } catch (error) {
    //console.log("❌ NadPay check failed:", error.message);
  }
  
  //console.log("\n🎲 NadRaffle Contract Status:");
  //console.log("Contract Address:", raffleAddress);
  
  try {
    const NadRaffle = await hre.ethers.getContractFactory("NadRaffle");
    const raffle = NadRaffle.attach(raffleAddress);
    
    const owner = await raffle.owner();
    const platformFee = await raffle.platformFeePercentage();
    
    //console.log("✅ Owner (Fee Recipient):", owner);
    //console.log("✅ Platform Fee:", platformFee.toString(), "basis points (" + (Number(platformFee)/100).toString() + "%)");
    
    // Check if owner is the secure address
    const secureAddress = "0x00d3a6670a1e5226d6b5dc524e3243e7741c8460";
    if (owner.toLowerCase() === secureAddress.toLowerCase()) {
      //console.log("🛡️  Owner is SECURE ✅");
    } else {
      //console.log("⚠️  Owner is not the secure address!");
      //console.log("   Current:", owner);
      //console.log("   Should be:", secureAddress);
    }
    
  } catch (error) {
    //console.log("❌ Raffle check failed:", error.message);
  }
  
  //console.log("\n📊 Summary:");
  //console.log("🔐 Secure Address:", "0x00d3a6670a1e5226d6b5dc524e3243e7741c8460");
  //console.log("🚫 Old Compromised Address:", "0x168E581379F7D9af55db8e5b773f3fd71af8F0e7");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 