const hre = require("hardhat");

async function main() {
  const contractAddress = "0x7B9aAd7f00D51AdC57Ff82952F2fAfE0E6F3b7A4";
  
  //console.log("Testing NadPay contract...");
  //console.log("Contract Address:", contractAddress);
  
  // Get contract instance
  const NadPay = await hre.ethers.getContractFactory("NadPay");
  const contract = NadPay.attach(contractAddress);
  
  try {
    // Check total links
    const totalLinks = await contract.getTotalLinks();
    //console.log("Total Links:", totalLinks.toString());
    
    // If there are links, try to get the first one
    if (totalLinks > 0) {
      //console.log("\nTesting getPaymentLink(0):");
      try {
        const link = await contract.getPaymentLink(0);
        //console.log("Link 0 exists:", {
          creator: link.creator,
          title: link.title,
          price: hre.ethers.formatEther(link.price),
          isActive: link.isActive
        });
      } catch (error) {
        //console.log("Error getting link 0:", error.message);
      }
    }
    
    // Test creating a payment link
    //console.log("\nTesting payment link creation...");
    const [deployer] = await hre.ethers.getSigners();
    
    const tx = await contract.createPaymentLink(
      "Test Link",
      "Test Description", 
      "",
      hre.ethers.parseEther("0.1"), // 0.1 MON
      10, // total sales
      5   // max per wallet
    );
    
    //console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    //console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // Check total links again
    const newTotalLinks = await contract.getTotalLinks();
    //console.log("New Total Links:", newTotalLinks.toString());
    
    // Get the newly created link
    const newLinkId = newTotalLinks - 1n;
    const newLink = await contract.getPaymentLink(newLinkId);
    //console.log("New Link ID:", newLinkId.toString());
    //console.log("New Link:", {
      creator: newLink.creator,
      title: newLink.title,
      price: hre.ethers.formatEther(newLink.price),
      isActive: newLink.isActive
    });
    
  } catch (error) {
    //console.error("Contract test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 