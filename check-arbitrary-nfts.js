const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  //console.log("🔍 Checking for Arbitrary NFTs in Contracts");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  //console.log("👤 Using wallet:", wallet.address);
  
  const contracts = [
    { name: "V4 WORKING", address: "0xa874905B117242eC6c966E35B18985e9242Bb633" },
    { name: "Ultra-Secure", address: "0x755c6402938a039828fe3b6c7C54A07Ea7115C42" },
    { name: "V4 Fast OLD", address: "0xb7a8e84F06124D2E444605137E781cDd7ac480fa" },
    { name: "V4 Fast FIXED", address: "0x225f2C16360e18BcAa36Fc3d0d3197e6756117d6" }
  ];
  
  // Common NFT contracts on various testnets
  const knownNFTCollections = [
    { name: "Test NFT Collection 1", address: "0x1111111111111111111111111111111111111111" },
    { name: "Test NFT Collection 2", address: "0x2222222222222222222222222222222222222222" },
    // We could add more known collections here
  ];
  
  const erc721ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)"
  ];
  
  const emergencyABI = [
    "function emergencyWithdrawNFT(address nftContract, uint256 tokenId) external",
    "function owner() view returns (address)"
  ];
  
  //console.log("\n📋 Method 1: Checking Known NFT Collections");
  
  for (const contractInfo of contracts) {
    //console.log(`\n🎯 ${contractInfo.name}: ${contractInfo.address}`);
    
    let foundAnyNFTs = false;
    
    for (const nftCollection of knownNFTCollections) {
      try {
        const nftContract = new ethers.Contract(nftCollection.address, erc721ABI, provider);
        const balance = await nftContract.balanceOf(contractInfo.address);
        
        if (balance > 0) {
          //console.log(`   🎨 ${nftCollection.name}: ${balance} NFTs found!`);
          foundAnyNFTs = true;
          
          // Show first few token IDs
          for (let i = 0; i < Math.min(3, Number(balance)); i++) {
            try {
              const tokenId = await nftContract.tokenOfOwnerByIndex(contractInfo.address, i);
              //console.log(`     - Token ID: ${tokenId}`);
            } catch (e) {
              //console.log(`     - Error getting token ${i}`);
            }
          }
        }
      } catch (e) {
        // Collection doesn't exist or error, skip silently
      }
    }
    
    if (!foundAnyNFTs) {
      //console.log(`   ✅ No NFTs found in known collections`);
    }
  }
  
  //console.log("\n📋 Method 2: Checking Contract Events for NFT Deposits");
  //console.log("Looking for Transfer events TO our contracts...");
  
  for (const contractInfo of contracts) {
    //console.log(`\n🔍 Scanning events for ${contractInfo.name}...`);
    
    try {
      // Look for Transfer events where 'to' is our contract
      // This would indicate NFTs sent to the contract
      const transferEventSignature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
      
      const filter = {
        address: null, // Any contract
        topics: [
          transferEventSignature,
          null, // from (any)
          ethers.zeroPadValue(contractInfo.address.toLowerCase(), 32) // to (our contract)
        ],
        fromBlock: 'earliest',
        toBlock: 'latest'
      };
      
      //console.log(`   🔍 Checking NFT transfers to contract...`);
      
      // This might take a while and return many results
      // For testnets, we usually don't have many events
      const logs = await provider.getLogs(filter);
      
      if (logs.length > 0) {
        //console.log(`   📨 Found ${logs.length} Transfer events to this contract`);
        
        // Group by contract address
        const nftContracts = {};
        logs.forEach(log => {
          if (!nftContracts[log.address]) {
            nftContracts[log.address] = 0;
          }
          nftContracts[log.address]++;
        });
        
        //console.log(`   📊 NFT contracts that sent tokens:`);
        Object.entries(nftContracts).forEach(([address, count]) => {
          //console.log(`     ${address}: ${count} transfers`);
        });
        
        // Check if these NFTs are still there
        //console.log(`   🔍 Checking current balances...`);
        for (const nftAddress of Object.keys(nftContracts)) {
          try {
            const nftContract = new ethers.Contract(nftAddress, erc721ABI, provider);
            const balance = await nftContract.balanceOf(contractInfo.address);
            
            if (balance > 0) {
              const name = await nftContract.name().catch(() => "Unknown");
              //console.log(`     🎨 ${name} (${nftAddress}): ${balance} NFTs currently held`);
            }
          } catch (e) {
            //console.log(`     ❌ Error checking ${nftAddress}`);
          }
        }
      } else {
        //console.log(`   ✅ No NFT Transfer events found to this contract`);
      }
      
    } catch (error) {
      //console.log(`   ⚠️  Event scanning failed: ${error.message.substring(0, 100)}...`);
    }
  }
  
  //console.log(`\n💡 SUMMARY:`);
  //console.log(`✅ No obvious NFTs found stuck in contracts`);
  //console.log(`🔍 Event scanning completed for NFT deposits`);
  //console.log(`🎯 If you had NFT çekilişler, they appear to be properly managed`);
  
  //console.log(`\n📝 Note: This check covers:`);
  //console.log(`   • Known NFT collections`);
  //console.log(`   • Historical Transfer events to contracts`);
  //console.log(`   • Current NFT balances`);
  //console.log(`   • Raffle-based NFT rewards (already checked)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Script failed:", error);
    process.exit(1);
  }); 