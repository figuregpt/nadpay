const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x7B9aAd7f00D51AdC57Ff82952F2fAfE0E6F3b7A4";
  
  console.log("Testing purchase functionality...");
  console.log("Contract Address:", contractAddress);
  
  // Get contract instance
  const NadPay = await ethers.getContractFactory("NadPay");
  const contract = NadPay.attach(contractAddress);
  
  try {
    // Check if we have any payment links
    const totalLinks = await contract.getTotalLinks();
    console.log("Total Links:", totalLinks.toString());
    
    if (totalLinks > 0) {
      const linkId = 0; // Test with first link
      
      // Get payment link details
      try {
        const link = await contract.getPaymentLink(linkId);
        console.log("Payment Link Details:", {
          creator: link.creator,
          title: link.title,
          price: ethers.formatEther(link.price) + " MON",
          isActive: link.isActive
        });
        
        if (link.isActive) {
          // Make a purchase
          console.log("Making a purchase...");
          const purchaseAmount = 1;
          const totalPrice = link.price * BigInt(purchaseAmount);
          
          const tx = await contract.purchase(linkId, purchaseAmount, {
            value: totalPrice
          });
          
          console.log("Purchase transaction hash:", tx.hash);
          const receipt = await tx.wait();
          console.log("Purchase confirmed in block:", receipt.blockNumber);
          
          // Check purchases
          console.log("Checking purchases...");
          const purchases = await contract.getPurchases(linkId);
          console.log("Purchases for link", linkId, ":", purchases);
          
        } else {
          console.log("Payment link is not active");
        }
      } catch (error) {
        console.error("Error with payment link:", error.message);
      }
    } else {
      console.log("No payment links found");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 