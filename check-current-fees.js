const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("🔍 Checking Current Fee Settings Across All Contracts");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("👤 Using wallet:", wallet.address);
  
  const targetWallet = "0xddadef163ad373f9a0e7bec3bc5f4d0c61d247b1";
  console.log("🎯 Target fee wallet:", targetWallet);
  
  const contracts = [
    {
      name: "NadPay V2",
      address: "0x091f3ae2E54584BE7195E2A8C5eD3976d0851905", 
      type: "payment",
      targetFee: "2%"
    },
    {
      name: "NadRaffle V4 WORKING",
      address: "0xa874905B117242eC6c966E35B18985e9242Bb633",
      type: "raffle",
      targetFee: "2.5%"
    },
    {
      name: "NadSwap V3",
      address: "0x0ebDFAFbef16A22eA8ffaba4DdA051AC4df8f979",
      type: "swap", 
      targetFee: "0.1 MON per action"
    }
  ];
  
  const nadpayABI = [
    "function owner() external view returns (address)",
    "function feeRecipient() external view returns (address)",
    "function platformFee() external view returns (uint256)",
    "function setPlatformFee(uint256) external",
    "function setFeeRecipient(address) external"
  ];
  
  const raffleABI = [
    "function owner() external view returns (address)",
    "function platformFeePercentage() external view returns (uint256)",
    "function transferOwnership(address) external"
  ];
  
  const swapABI = [
    "function owner() external view returns (address)",
    "function proposalFee() external view returns (uint256)",
    "function setProposalFee(uint256) external"
  ];
  
  console.log(`\n📊 CURRENT SETTINGS VS TARGET:\n`);
  
  for (const contractInfo of contracts) {
    console.log(`📋 ${contractInfo.name} (Target: ${contractInfo.targetFee})`);
    console.log(`📍 Address: ${contractInfo.address}`);
    
    try {
      if (contractInfo.type === "payment") {
        const contract = new ethers.Contract(contractInfo.address, nadpayABI, wallet);
        
        const owner = await contract.owner();
        const feeRecipient = await contract.feeRecipient();
        const currentFee = await contract.platformFee();
        
        console.log(`👑 Owner: ${owner}`);
        console.log(`💰 Fee Recipient: ${feeRecipient}`);
        console.log(`📊 Current Fee: ${currentFee.toString()} basis points (${Number(currentFee)/100}%)`);
        console.log(`🎯 Target Fee: 200 basis points (2%)`);
        
        const isOwner = owner.toLowerCase() === wallet.address.toLowerCase();
        const correctRecipient = feeRecipient.toLowerCase() === targetWallet.toLowerCase();
        const correctFee = Number(currentFee) === 200;
        
        console.log(`✅ Owner Check: ${isOwner ? 'You are owner' : 'NOT OWNER'}`);
        console.log(`✅ Recipient Check: ${correctRecipient ? 'CORRECT' : 'NEEDS UPDATE'}`);
        console.log(`✅ Fee Check: ${correctFee ? 'CORRECT (2%)' : 'NEEDS UPDATE (currently ' + (Number(currentFee)/100) + '%)'}`);
        
        if (isOwner && (!correctFee || !correctRecipient)) {
          console.log(`🔧 ACTIONS NEEDED:`);
          if (!correctFee) console.log(`   - Update fee to 200 basis points (2%)`);
          if (!correctRecipient) console.log(`   - Update recipient to ${targetWallet}`);
        }
        
      } else if (contractInfo.type === "raffle") {
        const contract = new ethers.Contract(contractInfo.address, raffleABI, wallet);
        
        const owner = await contract.owner();
        const currentFee = await contract.platformFeePercentage();
        
        console.log(`👑 Owner (Fee Recipient): ${owner}`);
        console.log(`📊 Current Fee: ${currentFee.toString()} basis points (${Number(currentFee)/100}%)`);
        console.log(`🎯 Target Fee: 250 basis points (2.5%)`);
        
        const isOwner = owner.toLowerCase() === wallet.address.toLowerCase();
        const correctRecipient = owner.toLowerCase() === targetWallet.toLowerCase();
        const correctFee = Number(currentFee) === 250;
        
        console.log(`✅ Owner Check: ${isOwner ? 'You are owner' : 'NOT OWNER'}`);
        console.log(`✅ Recipient Check: ${correctRecipient ? 'CORRECT' : 'FEES GO TO YOU, NOT TARGET'}`);
        console.log(`✅ Fee Check: ${correctFee ? 'CORRECT (2.5%)' : 'WRONG PERCENTAGE'}`);
        
        if (!correctRecipient) {
          console.log(`🔧 ACTIONS NEEDED:`);
          console.log(`   - Transfer ownership to ${targetWallet} (RISKY - you lose control)`);
          console.log(`   - OR Deploy new raffle contract with automatic fee recipient`);
        }
        
      } else if (contractInfo.type === "swap") {
        const contract = new ethers.Contract(contractInfo.address, swapABI, wallet);
        
        const owner = await contract.owner();
        const currentFee = await contract.proposalFee();
        
        console.log(`👑 Owner: ${owner}`);
        console.log(`📊 Current Fee: ${ethers.formatEther(currentFee)} MON per proposal`);
        console.log(`🎯 Target Fee: 0.1 MON per proposal + 0.1 MON per acceptance = 0.2 MON total`);
        
        const isOwner = owner.toLowerCase() === wallet.address.toLowerCase();
        const currentFeeInMON = Number(ethers.formatEther(currentFee));
        
        console.log(`✅ Owner Check: ${isOwner ? 'You are owner' : 'NOT OWNER'}`);
        console.log(`✅ Fee System: Manual withdrawal - NOT AUTOMATIC`);
        console.log(`💡 Current system: ${currentFeeInMON} MON fee accumulates, needs manual withdrawal`);
        
        console.log(`🔧 ACTIONS NEEDED:`);
        console.log(`   - Deploy new NadSwap V4 with automatic fee transfer`);
        console.log(`   - Change fee structure: 0.1 MON create + 0.1 MON accept`);
        console.log(`   - Direct transfer to ${targetWallet}`);
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${contractInfo.name}:`, error.message);
    }
    
    console.log(`\n`);
  }
  
  console.log(`🎯 SUMMARY - WHAT NEEDS TO BE DONE:\n`);
  console.log(`💳 NadPay V2: Update fee from 1% to 2%`);
  console.log(`🎫 NadRaffle V4: Deploy new contract with auto fee recipient (current goes to you)`);
  console.log(`🔄 NadSwap V3: Deploy new contract with auto fee + new fee structure`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  }); 