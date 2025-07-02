const hre = require("hardhat");

async function main() {
  const contractAddress = "0x7B9aAd7f00D51AdC57Ff82952F2fAfE0E6F3b7A4";
  
  //} catch (error) {
        //const [deployer] = await hre.ethers.getSigners();
    
    const tx = await contract.createPaymentLink(
      "Test Link",
      "Test Description", 
      "",
      hre.ethers.parseEther("0.1"), // 0.1 MON
      10, // total sales
      5   // max per wallet
    );
    
    //} catch (error) {
    //console.error("Contract test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 