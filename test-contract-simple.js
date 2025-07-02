const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  
  console.log("🔍 Testing Contract Deployments");
  console.log("=================================");
  
  // Test NadPay V2 Ultra-Secure
  const nadPayAddress = "0xfeF2c348d0c8a14b558df27034526d87Ac1f9f25";
  console.log("📄 Testing NadPay V2:", nadPayAddress);
  
  try {
    const code = await provider.getCode(nadPayAddress);
    if (code === "0x") {
      console.log("❌ NadPay contract NOT deployed!");
    } else {
      console.log("✅ NadPay contract deployed (", code.length, "bytes)");
      
      // Try owner function
      const ownerAbi = ["function owner() external view returns (address)"];
      const nadPayContract = new ethers.Contract(nadPayAddress, ownerAbi, provider);
      try {
        const owner = await nadPayContract.owner();
        console.log("👤 NadPay Owner:", owner);
      } catch (e) {
        console.log("❌ NadPay owner() failed:", e.message);
      }
    }
  } catch (error) {
    console.error("❌ NadPay Error:", error.message);
  }
  
  console.log("=================================");
  
  // Test NadRaffle V4 Working
  const nadRaffleAddress = "0xa874905B117242eC6c966E35B18985e9242Bb633";
  console.log("🎟️ Testing NadRaffle V4:", nadRaffleAddress);
  
  try {
    const code = await provider.getCode(nadRaffleAddress);
    if (code === "0x") {
      console.log("❌ NadRaffle contract NOT deployed!");
    } else {
      console.log("✅ NadRaffle contract deployed (", code.length, "bytes)");
      
      // Try owner function
      const ownerAbi = ["function owner() external view returns (address)"];
      const nadRaffleContract = new ethers.Contract(nadRaffleAddress, ownerAbi, provider);
      try {
        const owner = await nadRaffleContract.owner();
        console.log("👤 NadRaffle Owner:", owner);
      } catch (e) {
        console.log("❌ NadRaffle owner() failed:", e.message);
      }
    }
  } catch (error) {
    console.error("❌ NadRaffle Error:", error.message);
  }
  
  console.log("=================================");
  console.log("✅ Contract deployment check completed!");
}

main().catch(console.error); 