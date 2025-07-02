const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  //console.log("⏸️  PAUSING OLD V4 Fast Contract");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  //console.log("👤 Using wallet:", wallet.address);
  
  const oldContractAddress = "0xb7a8e84F06124D2E444605137E781cDd7ac480fa"; // OLD V4 Fast
  
  // Minimal ABI for pause function
  const pauseAbi = [
    "function pause() external",
    "function paused() external view returns (bool)",
    "function owner() external view returns (address)"
  ];
  
  const contract = new ethers.Contract(oldContractAddress, pauseAbi, wallet);
  
  //console.log("🔍 Checking contract status...");
  
  try {
    const owner = await contract.owner();
    const isPaused = await contract.paused();
    
    //console.log("👑 Contract owner:", owner);
    //console.log("⏸️  Currently paused:", isPaused);
    //console.log("🔧 Your address:", wallet.address);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      //console.log("❌ You are not the owner of this contract!");
      return;
    }
    
    if (isPaused) {
      //console.log("✅ Contract is already paused!");
      return;
    }
    
    //console.log("⏸️  Pausing old contract...");
    
    const tx = await contract.pause({
      gasLimit: 100000
    });
    
    //console.log("📤 Pause transaction:", tx.hash);
    await tx.wait();
    
    // Verify pause
    const newPauseStatus = await contract.paused();
    //console.log("✅ Contract paused successfully! Status:", newPauseStatus);
    
    //console.log("\n🎯 OLD CONTRACT PAUSED!");
    //console.log("- Address:", oldContractAddress);
    //console.log("- Status: PAUSED ⏸️");
    //console.log("- New users cannot create raffles");
    //console.log("- Existing raffles are protected");
    //console.log("- Migration to new fixed contract complete!");
    
  } catch (error) {
    //console.error("❌ Error pausing contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Pause failed:", error);
    process.exit(1);
  }); 