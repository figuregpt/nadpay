const { ethers } = require("hardhat");

async function main() {
  //",
    "function getPaymentLink(uint256 linkId) external view returns (tuple(address creator, string title, string description, string coverImage, uint256 price, address paymentToken, uint256 totalSales, uint256 maxPerWallet, uint256 salesCount, uint256 totalEarned, bool isActive, uint256 createdAt, uint256 expiresAt))"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, ethers.provider);
  
  try {
    // Check total links
    const totalLinks = await contract.getTotalLinks();
    ////{
        //}
    }
    
    // Test creator links with a sample address
    const testAddress = "0x00D3a6670a1E5226d6b5dc524e3243e7741C8460"; // Your wallet address (corrected checksum)
    try {
      const creatorLinks = await contract.getCreatorLinks(testAddress);
      //creatorLinks.forEach((link, index) => {
        //} ${link.paymentToken === '0x0000000000000000000000000000000000000000' ? 'MON' : 'TOKEN'}`);
      });
    } catch (error) {
      //{
    //console.error("❌ Contract Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 