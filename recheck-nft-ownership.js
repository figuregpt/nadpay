const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("🔍 Re-checking NFT Ownership (Corrected)");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("👤 Your wallet:", wallet.address);
  
  // NFT details from UI
  const nftContractAddress = "0x3019BF1dfB84E5b46Ca9D0eEC37dE08a59A41308"; // Nad Name Service
  const tokenId = "4014411"; // 0xfigure.nad
  const raffleContractAddress = "0xa874905B117242eC6c966E35B18985e9242Bb633"; // V4 WORKING
  
  const nftABI = [
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function approve(address to, uint256 tokenId) external",
    "function name() view returns (string)",
    "function symbol() view returns (string)"
  ];
  
  const nftContract = new ethers.Contract(nftContractAddress, nftABI, wallet);
  
  try {
    console.log(`\n🎯 NFT Details:`);
    console.log(`📍 Contract: ${nftContractAddress}`);
    console.log(`🆔 Token ID: ${tokenId} (0xfigure.nad)`);
    
    const name = await nftContract.name();
    const symbol = await nftContract.symbol();
    console.log(`🏷️  Collection: ${name} (${symbol})`);
    
    // Check actual ownership
    const actualOwner = await nftContract.ownerOf(tokenId);
    console.log(`\n👑 Current Owner: ${actualOwner}`);
    console.log(`👤 Your Wallet:   ${wallet.address}`);
    
    const isYourNFT = actualOwner.toLowerCase() === wallet.address.toLowerCase();
    console.log(`✅ You own this NFT: ${isYourNFT ? "YES" : "NO"}`);
    
    if (isYourNFT) {
      console.log(`\n🎉 Great! The NFT is yours!`);
      console.log(`🔍 Magic Eden shows correctly - you can list/transfer`);
      
      // Check approval for raffle contract
      const approvedAddress = await nftContract.getApproved(tokenId);
      const isApprovedForAll = await nftContract.isApprovedForAll(wallet.address, raffleContractAddress);
      
      console.log(`\n🔐 Approval Status:`);
      console.log(`📋 Approved Address: ${approvedAddress}`);
      console.log(`🌍 Approved For All: ${isApprovedForAll}`);
      
      const isApproved = (
        approvedAddress.toLowerCase() === raffleContractAddress.toLowerCase() || 
        isApprovedForAll
      );
      
      console.log(`✅ Raffle Contract Approved: ${isApproved ? "YES" : "NO"}`);
      
      if (!isApproved) {
        console.log(`\n⚠️  NFT needs approval for raffle contract!`);
        console.log(`🔧 Approving now...`);
        
        const approveTx = await nftContract.approve(raffleContractAddress, tokenId);
        console.log(`📝 Approval Transaction: ${approveTx.hash}`);
        console.log(`⏳ Waiting for confirmation...`);
        
        await approveTx.wait();
        console.log(`✅ Approval confirmed!`);
        
        // Verify
        const newApproval = await nftContract.getApproved(tokenId);
        console.log(`🔍 New Approval: ${newApproval}`);
        
        if (newApproval.toLowerCase() === raffleContractAddress.toLowerCase()) {
          console.log(`\n🎉 SUCCESS! You can now create the raffle!`);
          console.log(`💡 Go back to the UI and try creating the raffle again`);
        }
      } else {
        console.log(`\n🤔 NFT is approved but raffle creation failed...`);
        console.log(`💡 Let me check if there's another issue:`);
        
        // Check contract status
        const raffleABI = [
          "function paused() view returns (bool)",
          "function emergencyPaused() view returns (bool)",
          "function owner() view returns (address)"
        ];
        
        const raffleContract = new ethers.Contract(raffleContractAddress, raffleABI, provider);
        
        try {
          const isPaused = await raffleContract.paused();
          const isEmergencyPaused = await raffleContract.emergencyPaused();
          const raffleOwner = await raffleContract.owner();
          
          console.log(`⏸️  Contract Paused: ${isPaused}`);
          console.log(`🚨 Emergency Paused: ${isEmergencyPaused}`);
          console.log(`👑 Contract Owner: ${raffleOwner}`);
          
          if (isPaused || isEmergencyPaused) {
            console.log(`\n❌ The raffle contract is paused!`);
            console.log(`💡 This is why raffle creation failed`);
          } else {
            console.log(`\n✅ Contract is active, should work fine now`);
          }
        } catch (e) {
          console.log(`⚠️  Could not check contract status: ${e.message}`);
        }
      }
      
    } else {
      console.log(`\n❌ The NFT belongs to: ${actualOwner}`);
      console.log(`🤔 But Magic Eden shows you can list it...`);
      console.log(`💡 Possible reasons:`);
      console.log(`   • Different wallet connected to Magic Eden`);
      console.log(`   • Magic Eden caching old data`);
      console.log(`   • Wrong token ID or contract address`);
      console.log(`   • Cross-chain confusion`);
      
      // Check if the owner is a known address
      const knownAddresses = {
        "0xb7a8e84F06124D2E444605137E781cDd7ac480fa": "V4 Fast OLD Contract",
        "0xa874905B117242eC6c966E35B18985e9242Bb633": "V4 WORKING Contract",
        "0x755c6402938a039828fe3b6c7C54A07Ea7115C42": "Ultra-Secure Contract",
        "0x225f2C16360e18BcAa36Fc3d0d3197e6756117d6": "V4 Fast FIXED Contract"
      };
      
      const knownOwner = knownAddresses[actualOwner];
      if (knownOwner) {
        console.log(`🏠 Owner is: ${knownOwner}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("invalid token ID")) {
      console.log(`\n💡 Token ID ${tokenId} doesn't exist!`);
      console.log(`🔍 Please verify the token ID is correct`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 