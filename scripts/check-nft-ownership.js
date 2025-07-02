const { ethers } = require('hardhat');

async function main() {
  //console.log("🔍 Checking NFT Ownership in Contract...");
  
  const provider = ethers.provider;
  
  const nftAbi = [
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)'
  ];
  
  const nftContractAddress = '0x3019BF1dfB84E5b46Ca9D0eC37dE08a59A41308'; // Nad Name Service
  const nftTokenId = 4014411;
  const userAddress = '0x00D3a6670a1E5226d6b5dc524e3243e7741C8460'; // Your address
  
  const raffleContractAddress = '0x755c6402938a039828fe3b6c7C54A07Ea7115C42'; // Ultra-Secure contract
  
  try {
    const nftContract = new ethers.Contract(nftContractAddress, nftAbi, provider);
    
    const owner = await nftContract.ownerOf(nftTokenId);
    //console.log('NFT Owner:', owner);
    //console.log('Your Address:', userAddress);
    //console.log('You own this NFT:', owner.toLowerCase() === userAddress.toLowerCase());
    
    const approved = await nftContract.getApproved(nftTokenId);
    //console.log('Approved address:', approved);
    //console.log('Approved for raffle contract:', approved.toLowerCase() === raffleContractAddress.toLowerCase());
    
    const approvedForAll = await nftContract.isApprovedForAll(owner, raffleContractAddress);
    //console.log('Approved for all:', approvedForAll);
    
    //console.log('\n📋 Summary:');
    //console.log('- NFT Contract:', nftContractAddress);
    //console.log('- Token ID:', nftTokenId);
    //console.log('- Raffle Contract:', raffleContractAddress);
    //console.log('- Owner Check:', owner.toLowerCase() === userAddress.toLowerCase() ? '✅ You own this NFT' : '❌ You do not own this NFT');
    //console.log('- Approval Check:', (approved.toLowerCase() === raffleContractAddress.toLowerCase() || approvedForAll) ? '✅ Approved' : '❌ Not approved');
    
  } catch (error) {
    //console.error('Error:', error.message);
  }
}

main().catch(//console.error); 