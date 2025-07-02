const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("💳 Updating NadPay V2 Fee to 2%");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("👤 Using wallet:", wallet.address);
  
  const nadpayAddress = "0x091f3ae2E54584BE7195E2A8C5eD3976d0851905";
  
  const nadpayABI = [
    "function owner() external view returns (address)",
    "function feeRecipient() external view returns (address)",
    "function platformFee() external view returns (uint256)",
    "function setPlatformFee(uint256) external"
  ];
  
  try {
    const contract = new ethers.Contract(nadpayAddress, nadpayABI, wallet);
    
    // Check current status
    const owner = await contract.owner();
    const feeRecipient = await contract.feeRecipient();
    const currentFee = await contract.platformFee();
    
    console.log(`📍 Contract: ${nadpayAddress}`);
    console.log(`👑 Owner: ${owner}`);
    console.log(`💰 Fee Recipient: ${feeRecipient}`);
    console.log(`📊 Current Fee: ${currentFee.toString()} basis points (${Number(currentFee)/100}%)`);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.log("❌ You are not the owner. Cannot update fee.");
      return;
    }
    
    if (Number(currentFee) === 200) {
      console.log("✅ Fee is already 2% (200 basis points)!");
      return;
    }
    
    console.log("\n🔄 Updating fee to 2% (200 basis points)...");
    
    const tx = await contract.setPlatformFee(200);
    console.log(`📤 Transaction sent: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    
    await tx.wait();
    console.log("✅ Fee updated successfully!");
    
    // Verify the change
    const newFee = await contract.platformFee();
    console.log(`\n📊 VERIFICATION:`);
    console.log(`✅ New Fee: ${newFee.toString()} basis points (${Number(newFee)/100}%)`);
    console.log(`✅ Fee Recipient: ${feeRecipient}`);
    
    console.log(`\n🎉 NadPay V2 NOW CONFIGURED:`);
    console.log(`💳 Every purchase → ${Number(newFee)/100}% fee → ${feeRecipient}`);
    console.log(`⚡ Fees transfer INSTANTLY on each purchase!`);
    
  } catch (error) {
    console.log(`❌ Update failed:`, error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 