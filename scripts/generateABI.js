const fs = require('fs');
const path = require('path');

async function main() {
  // Read the compiled contract artifact
  const artifactPath = path.join(__dirname, '../artifacts/contracts/NadPay.sol/NadPay.json');
  
  if (!fs.existsSync(artifactPath)) {
    console.error('❌ Contract artifact not found. Please compile first with: npx hardhat compile');
    process.exit(1);
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Extract ABI
  const abi = artifact.abi;
  
  // Create contract config for frontend
  const contractConfig = {
    address: "0x0000000000000000000000000000000000000000", // Will be updated after deployment
    abi: abi,
    chainId: 10143, // Monad Testnet
    blockCreated: 0 // Will be updated after deployment
  };
  
  // Create lib directory if it doesn't exist
  const libDir = path.join(__dirname, '../src/lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  
  // Write contract config
  const contractConfigPath = path.join(libDir, 'contract.ts');
  const contractConfigContent = `// Auto-generated contract configuration
// Do not edit manually - run 'npm run generate-abi' to regenerate

export const NADPAY_CONTRACT = ${JSON.stringify(contractConfig, null, 2)} as const;

export type PaymentLink = {
  creator: string;
  title: string;
  description: string;
  coverImage: string;
  price: bigint;
  totalSales: bigint;
  maxPerWallet: bigint;
  salesCount: bigint;
  totalEarned: bigint;
  isActive: boolean;
  createdAt: bigint;
};

export type Purchase = {
  buyer: string;
  amount: bigint;
  timestamp: bigint;
  txHash: string;
};
`;
  
  fs.writeFileSync(contractConfigPath, contractConfigContent);
  
  console.log('✅ Contract ABI generated successfully!');
  console.log('📄 File created:', contractConfigPath);
  console.log('🔧 Usage: import { NADPAY_CONTRACT } from "@/lib/contract"');
  
  // Also create a pure ABI file for wagmi
  const abiPath = path.join(libDir, 'nadpay-abi.ts');
  const abiContent = `// Auto-generated ABI
export const NADPAY_ABI = ${JSON.stringify(abi, null, 2)} as const;
`;
  
  fs.writeFileSync(abiPath, abiContent);
  console.log('📄 ABI file created:', abiPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 