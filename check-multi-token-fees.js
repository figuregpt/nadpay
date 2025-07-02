const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  //console.log("🌈 Checking Multi-Token Fees Across Contracts");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  //console.log("👤 Checking wallet:", wallet.address);
  
  // Supported tokens from knownAssets.ts
  const supportedTokens = [
    {
      symbol: "MON",
      address: "0x0000000000000000000000000000000000000000", // Native
      decimals: 18
    },
    {
      symbol: "CHOG",
      address: "0xe0590015a873bf326bd645c3e1266d4db41c4e6b",
      decimals: 18
    },
    {
      symbol: "USDC",
      address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
      decimals: 6
    },
    {
      symbol: "USDT", 
      address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
      decimals: 6
    },
    {
      symbol: "YAKI",
      address: "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
      decimals: 18
    },
    {
      symbol: "DAK",
      address: "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
      decimals: 18
    }
  ];
  
  // All our raffle contracts
  const contracts = [
    {
      name: "V4 WORKING (Main UI)",
      address: "0xa874905B117242eC6c966E35B18985e9242Bb633"
    },
    {
      name: "Ultra-Secure",
      address: "0x755c6402938a039828fe3b6c7C54A07Ea7115C42"
    },
    {
      name: "V4 Fast OLD",
      address: "0xb7a8e84F06124D2E444605137E781cDd7ac480fa"
    },
    {
      name: "V4 Fast FIXED",
      address: "0x225f2C16360e18BcAa36Fc3d0d3197e6756117d6"
    }
  ];
  
  const erc20ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ];
  
  //console.log("\n💰 Checking Token Balances in Contracts...\n");
  
  let totalFeesFound = false;
  
  for (const contract of contracts) {
    //console.log(`🏠 Contract: ${contract.name}`);
    //console.log(`📍 Address: ${contract.address}`);
    
    let contractHasFees = false;
    
    for (const token of supportedTokens) {
      try {
        let balance;
        
        if (token.address === "0x0000000000000000000000000000000000000000") {
          // Native MON balance
          balance = await provider.getBalance(contract.address);
        } else {
          // ERC20 token balance
          const tokenContract = new ethers.Contract(token.address, erc20ABI, provider);
          balance = await tokenContract.balanceOf(contract.address);
        }
        
        const formattedBalance = ethers.formatUnits(balance, token.decimals);
        const balanceNum = parseFloat(formattedBalance);
        
        if (balanceNum > 0) {
          //console.log(`   💰 ${token.symbol}: ${formattedBalance} ${token.symbol}`);
          contractHasFees = true;
          totalFeesFound = true;
        }
        
      } catch (error) {
        //console.log(`   ❌ ${token.symbol}: Error checking balance - ${error.message}`);
      }
    }
    
    if (!contractHasFees) {
      //console.log(`   ✅ No token balances found`);
    }
    
    //console.log("");
  }
  
  if (totalFeesFound) {
    //console.log("🎯 SUMMARY: Found accumulated fees in some contracts!");
    //console.log("💡 Create withdrawal scripts for non-zero balances");
  } else {
    //console.log("🎯 SUMMARY: No accumulated fees found in any supported tokens");
    //console.log("✅ All contracts are clean!");
  }
  
  //console.log("\n📋 Supported Tokens Checked:");
  supportedTokens.forEach(token => {
    //console.log(`   • ${token.symbol} (${token.address === "0x0000000000000000000000000000000000000000" ? "Native" : token.address})`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Script failed:", error);
    process.exit(1);
  }); 