const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x7B9aAd7f00D51AdC57Ff82952F2fAfE0E6F3b7A4";
  
  console.log("Creating test payment link...");
  console.log("Contract Address:", contractAddress);
  
  // Get contract instance
  const NadPay = await ethers.getContractFactory("NadPay");
  const contract = NadPay.attach(contractAddress);
  
  try {
    // Create a test payment link
    console.log("Creating payment link...");
    const tx = await contract.createPaymentLink(
      "My First Product",
      "This is my first product on NadPay. Buy it with MON!", 
      "https://via.placeholder.com/400x300/6366f1/ffffff?text=Product",
      ethers.parseEther("0.05"), // 0.05 MON
      100, // total sales limit
      10   // max per wallet
    );
    
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // Check total links
    const totalLinks = await contract.getTotalLinks();
    console.log("Total Links after creation:", totalLinks.toString());
    
    // Get the newly created link
    if (totalLinks > 0) {
      const newLinkId = totalLinks - 1n;
      const newLink = await contract.getPaymentLink(newLinkId);
      console.log("New Link ID:", newLinkId.toString());
      console.log("New Link Details:", {
        creator: newLink.creator,
        title: newLink.title,
        description: newLink.description,
        price: ethers.formatEther(newLink.price) + " MON",
        isActive: newLink.isActive
      });
    }
    
    console.log("✅ Test payment link created successfully!");
    
  } catch (error) {
    console.error("❌ Failed to create payment link:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 