const fs = require('fs');
const path = require('path');

// Path to the compiled contract
const contractPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'NadRaffle.sol', 'NadRaffle.json');
const outputPath = path.join(__dirname, '..', 'src', 'lib', 'raffle-contract.ts');

try {
  // Read the compiled contract
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  
  // Read deployment information
  let deploymentInfo = { contractAddress: "0x0000000000000000000000000000000000000000" };
  const deploymentPath = path.join(__dirname, '..', 'raffle-deployment-monadTestnet.json');
  
  if (fs.existsSync(deploymentPath)) {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  }

  // Create the TypeScript file content
  const tsContent = `// Auto-generated raffle contract configuration
// Do not edit manually - run 'npm run generate-raffle-abi' to regenerate

export const NADRFFLE_CONTRACT = {
  "address": "${deploymentInfo.contractAddress}",
  "abi": ${JSON.stringify(contractJson.abi, null, 2)}
} as const;

// Type definitions for the contract
export type RewardType = "TOKEN" | "NFT";
export type RaffleStatus = "ACTIVE" | "ENDED" | "CANCELLED";

export type Raffle = {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  imageHash: string;
  rewardType: number; // 0 = TOKEN, 1 = NFT
  rewardTokenAddress: string;
  rewardAmount: bigint;
  ticketPrice: bigint;
  maxTickets: bigint;
  maxTicketsPerWallet: bigint;
  expirationTime: bigint;
  autoDistributeOnSoldOut: boolean;
  ticketsSold: bigint;
  totalEarned: bigint;
  winner: string;
  status: number; // 0 = ACTIVE, 1 = ENDED, 2 = CANCELLED
  createdAt: bigint;
  rewardClaimed: boolean;
};

export type Ticket = {
  raffleId: bigint;
  buyer: string;
  ticketNumber: bigint;
  purchaseTime: bigint;
  randomSeed: string;
};

export const REWARD_TYPES = {
  TOKEN: 0,
  NFT: 1
} as const;

export const RAFFLE_STATUS = {
  ACTIVE: 0,
  ENDED: 1,
  CANCELLED: 2
} as const;
`;

  // Write the TypeScript file
  fs.writeFileSync(outputPath, tsContent);
  
  //console.log('✅ Raffle ABI generated successfully!');
  //console.log(`📝 Contract address: ${deploymentInfo.contractAddress}`);
  //console.log(`📂 Output file: ${outputPath}`);
  
} catch (error) {
  console.error('❌ Error generating raffle ABI:', error.message);
  process.exit(1);
} 