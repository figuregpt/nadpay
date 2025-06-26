const { ethers } = require("hardhat");

async function main() {
  console.log("📊 Checking NadPay V2 Contract...");
  
  const contractAddress = "0x4A4DFB50bB7D5D8738D940Abdffce4bCF650f5E7";
  
  // Minimal ABI for checking
  const abi = [
    "function getTotalLinks() external view returns (uint256)",
    "function getCreatorLinks(address creator) external view returns (tuple(address creator, string title, string description, string coverImage, uint256 price, address paymentToken, uint256 totalSales, uint256 maxPerWallet, uint256 salesCount, uint256 totalEarned, bool isActive, uint256 createdAt, uint256 expiresAt)[])",
    "function getPaymentLink(uint256 linkId) external view returns (tuple(address creator, string title, string description, string coverImage, uint256 price, address paymentToken, uint256 totalSales, uint256 maxPerWallet, uint256 salesCount, uint256 totalEarned, bool isActive, uint256 createdAt, uint256 expiresAt))"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, ethers.provider);
  
  try {
    // Check total links
    const totalLinks = await contract.getTotalLinks();
    console.log("✅ Total Links:", totalLinks.toString());
    
    // Check specific link IDs
    for (let i = 0; i < Math.min(5, Number(totalLinks)); i++) {
      try {
        const link = await contract.getPaymentLink(i);
        console.log(`\n📋 Link ${i}:`);
        console.log("  Creator:", link.creator);
        console.log("  Title:", link.title);
        console.log("  Price:", ethers.formatEther(link.price));
        console.log("  Payment Token:", link.paymentToken);
        console.log("  Active:", link.isActive);
        console.log("  Sales Count:", link.salesCount.toString());
      } catch (error) {
        console.log(`❌ Link ${i} not found or error:`, error.message);
      }
    }
    
    // Test creator links with a sample address
    const testAddress = "0x00D3a6670a1E5226d6b5dc524e3243e7741C8460"; // Your wallet address (corrected checksum)
    try {
      const creatorLinks = await contract.getCreatorLinks(testAddress);
      console.log(`\n👤 Creator Links for ${testAddress}:`, creatorLinks.length);
      creatorLinks.forEach((link, index) => {
        console.log(`  Link ${index}: ${link.title} - ${ethers.formatEther(link.price)} ${link.paymentToken === '0x0000000000000000000000000000000000000000' ? 'MON' : 'TOKEN'}`);
      });
    } catch (error) {
      console.log("❌ Error getting creator links:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Contract Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 