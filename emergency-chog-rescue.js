const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  //console.log("🆘 Emergency CHOG Token Rescue from V4 Fast OLD");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  //console.log("👤 Rescue wallet:", wallet.address);
  
  // V4 Fast OLD contract with stuck CHOG
  const contractAddress = "0xb7a8e84F06124D2E444605137E781cDd7ac480fa";
  const chogTokenAddress = "0xe0590015a873bf326bd645c3e1266d4db41c4e6b";
  
  // Check if contract has a generic withdraw function
  const contractABI = [
    "function withdrawPlatformFees() external", // This exists but only for MON
    "function owner() view returns (address)",
    "function emergencyPause() external",
    "function setEmergencyPause(bool paused) external"
  ];
  
  // ERC20 ABI
  const erc20ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) external returns (bool)"
  ];
  
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);
  const chogContract = new ethers.Contract(chogTokenAddress, erc20ABI, provider);
  
  try {
    // Verify ownership
    const owner = await contract.owner();
    //console.log("🔐 Contract Owner:", owner);
    //console.log("🔐 Your Wallet:  ", wallet.address);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      //console.log("❌ You are not the owner of this contract!");
      return;
    }
    
    // Check CHOG balance
    const chogBalance = await chogContract.balanceOf(contractAddress);
    const chogDecimals = await chogContract.decimals();
    const chogSymbol = await chogContract.symbol();
    const formattedBalance = ethers.formatUnits(chogBalance, chogDecimals);
    
    //console.log(`\n💰 Stuck ${chogSymbol} Balance: ${formattedBalance} ${chogSymbol}`);
    
    if (chogBalance === 0n) {
      //console.log("✅ No CHOG tokens stuck!");
      return;
    }
    
    //console.log(`\n📋 Analysis:`);
    //console.log(`❌ V4 Fast OLD has a critical bug:`);
    //console.log(`   • Platform fees are never distributed for ERC20 tokens`);
    //console.log(`   • Only withdrawPlatformFees() exists (MON only)`);
    //console.log(`   • No adminWithdrawStuckFunds() function`);
    
    //console.log(`\n⚠️  This ${formattedBalance} ${chogSymbol} is permanently stuck!`);
    //console.log(`💡 Possible solutions:`);
    //console.log(`   1. Create a new contract with emergency recovery`);
    //console.log(`   2. Accept the loss (0.04 CHOG ~ small amount)`);
    //console.log(`   3. Contact Monad team for potential recovery`);
    
    // Try the only available withdraw function (will only work for MON)
    //console.log(`\n🔍 Checking MON balance in contract...`);
    const monBalance = await provider.getBalance(contractAddress);
    const formattedMon = ethers.formatEther(monBalance);
    //console.log(`💰 MON Balance: ${formattedMon} MON`);
    
    if (monBalance > 0) {
      //console.log(`\n🚀 Attempting to withdraw MON fees...`);
      const tx = await contract.withdrawPlatformFees();
      //console.log("📝 Transaction Hash:", tx.hash);
      await tx.wait();
      //console.log("✅ MON fees withdrawn!");
    } else {
      //console.log("ℹ️  No MON fees to withdraw");
    }
    
    //console.log(`\n🎯 Summary:`);
    //console.log(`✅ MON fees: Can be withdrawn`);
    //console.log(`❌ CHOG fees: Permanently stuck due to contract bug`);
    //console.log(`📊 Loss: ${formattedBalance} ${chogSymbol} (very small amount)`);
    
  } catch (error) {
    //console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Script failed:", error);
    process.exit(1);
  }); 