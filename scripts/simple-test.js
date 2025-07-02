const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x7B9aAd7f00D51AdC57Ff82952F2fAfE0E6F3b7A4";
  
  //console.log("Testing NadPay contract with simple calls...");
  //console.log("Contract Address:", contractAddress);
  
  // Get contract instance
  const NadPay = await ethers.getContractFactory("NadPay");
  const contract = NadPay.attach(contractAddress);
  
  try {
    // Test getTotalLinks
    //console.log("Calling getTotalLinks...");
    const totalLinks = await contract.getTotalLinks();
    //console.log("Total Links:", totalLinks.toString());
    
    // Test owner
    //console.log("Calling owner...");
    const owner = await contract.owner();
    //console.log("Owner:", owner);
    
    // Test platform fee
    //console.log("Calling platformFee...");
    const platformFee = await contract.platformFee();
    //console.log("Platform Fee:", platformFee.toString());
    
    //console.log("✅ Contract is working correctly!");
    
  } catch (error) {
    //console.error("❌ Contract test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 