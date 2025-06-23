const { ethers } = require('hardhat');

async function main() {
  const provider = ethers.provider;
  
  const nftAbi = [
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)'
  ];
  
  const nftContract = new ethers.Contract('0x3019BF1dfB84E5b46Ca9D0eEC37dE08a59A41308', nftAbi, provider);
  const tokenId = '4014411';
  const raffleContract = '0x3F0F22132a0A3864B5CD0F79D211Bf28511A76f0';
  
  try {
    const owner = await nftContract.ownerOf(tokenId);
    console.log('NFT Owner:', owner);
    
    const approved = await nftContract.getApproved(tokenId);
    console.log('Approved address:', approved);
    console.log('Approved for raffle contract:', approved.toLowerCase() === raffleContract.toLowerCase());
    
    const approvedForAll = await nftContract.isApprovedForAll(owner, raffleContract);
    console.log('Approved for all:', approvedForAll);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(console.error); 