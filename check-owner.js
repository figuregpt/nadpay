const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔍 Checking V4 Fast Contract Owner");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const contractAddress = "0xb7a8e84F06124D2E444605137E781cDd7ac480fa";
  
  const abi = [
    "function owner() external view returns (address)",
    "function pendingOwner() external view returns (address)"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  try {
    const currentOwner = await contract.owner();
    console.log("👤 Current Owner:", currentOwner);
    
    try {
      const pendingOwner = await contract.pendingOwner();
      console.log("⏳ Pending Owner:", pendingOwner);
    } catch (e) {
      console.log("⏳ No pending owner");
    }
    
    // Check our wallet
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("💳 Our Wallet:", wallet.address);
    console.log("🔐 Are we owner?", currentOwner.toLowerCase() === wallet.address.toLowerCase());
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error); 