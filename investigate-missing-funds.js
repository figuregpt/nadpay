const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("🔍 INVESTIGATING MISSING 10 MON");
  console.log("=".repeat(50));
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const deployerAddress = wallet.address;
  console.log("👤 Your Wallet:", deployerAddress);
  console.log("🔗 Explorer:", `https://testnet.monadexplorer.com/address/${deployerAddress}`);
  console.log("");
  
  // Current balance
  const currentBalance = await provider.getBalance(deployerAddress);
  console.log(`💰 Current Balance: ${ethers.formatEther(currentBalance)} MON`);
  console.log("");
  
  // Check if finalizer scripts exist and what they do
  console.log("🔍 CHECKING FINALIZER SCRIPTS:");
  console.log("━".repeat(40));
  
  const fs = require('fs');
  const finalizerFiles = [
    'emergency-raffle-resolver.js',
    'manual-expired-raffle-finalizer.js',
    'RAFFLE_V4_FAST_FINALIZER_README.md'
  ];
  
  for (const file of finalizerFiles) {
    if (fs.existsSync(file)) {
      console.log(`📄 Found: ${file}`);
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Look for suspicious patterns
        const patterns = [
          /sendTransaction/g,
          /transfer/g,
          /withdraw/g,
          /\.send\(/g,
          /\.call\(/g,
          /private.*key/gi,
          /wallet\.address/g
        ];
        
        let suspicious = false;
        patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            console.log(`   ⚠️  Contains: ${pattern.source} (${matches.length} times)`);
            suspicious = true;
          }
        });
        
        if (!suspicious) {
          console.log(`   ✅ Looks safe (no transfer/withdraw operations)`);
        }
      } catch (error) {
        console.log(`   ❌ Error reading file: ${error.message}`);
      }
    } else {
      console.log(`❌ Not found: ${file}`);
    }
  }
  
  console.log("");
  console.log("🔍 CHECKING CONTRACT INTERACTIONS:");
  console.log("━".repeat(40));
  
  // Check if any contracts have withdraw functions that might have been called
  const contracts = [
    { name: "NadPay V2", address: "0x091f3ae2E54584BE7195E2A8C5eD3976d0851905" },
    { name: "NadRaffle V4", address: "0xa874905B117242eC6c966E35B18985e9242Bb633" },
    { name: "NadSwap V3", address: "0x0ebDFAFbef16A22eA8ffaba4DdA051AC4df8f979" }
  ];
  
  for (const contract of contracts) {
    try {
      const balance = await provider.getBalance(contract.address);
      console.log(`📦 ${contract.name}: ${ethers.formatEther(balance)} MON`);
      console.log(`   🔗 ${contract.address}`);
    } catch (error) {
      console.log(`❌ Error checking ${contract.name}: ${error.message}`);
    }
  }
  
  console.log("");
  console.log("🔍 RECENT TRANSACTION ANALYSIS:");
  console.log("━".repeat(40));
  console.log("❌ Cannot get transaction history via RPC");
  console.log("🔗 Please check manually:");
  console.log(`   https://testnet.monadexplorer.com/address/${deployerAddress}`);
  console.log("");
  
  console.log("🚨 SECURITY CHECK:");
  console.log("━".repeat(40));
  console.log("1. 🔐 Check if private key is secure");
  console.log("2. 👀 Look for unauthorized transactions in explorer");
  console.log("3. 🤖 Check if any scripts auto-executed");
  console.log("4. 💸 Look for large outgoing transactions");
  console.log("");
  
  // Generate new wallet for comparison
  const randomWallet = ethers.Wallet.createRandom();
  console.log("🆕 For security, consider generating new wallet:");
  console.log(`   New Address: ${randomWallet.address}`);
  console.log(`   New Private Key: ${randomWallet.privateKey}`);
  console.log("   ⚠️  ONLY if current wallet is compromised!");
  console.log("");
  
  console.log("🔧 IMMEDIATE ACTIONS:");
  console.log("1. 🔍 Check explorer for transaction history");
  console.log("2. 🔐 Secure your private key immediately");
  console.log("3. 💰 If compromised, transfer remaining funds to new wallet");
  console.log("4. 🚫 Pause any auto-running scripts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌", error);
    process.exit(1);
  }); 