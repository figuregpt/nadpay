const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    ////.toISOString();

    try {
        // ✅ 1. Deploy NadPayV2 Ultra-Secure
        //const NadSwapV3Factory = await ethers.getContractFactory("contracts/NadSwapV3-ULTRA-SECURE.sol:NadSwapV3");
        const nadSwapV3 = await NadSwapV3Factory.deploy();
        await nadSwapV3.waitForDeployment();
        
        const nadSwapV3Address = await nadSwapV3.getAddress();
        //const NadRaffleV4Factory = await ethers.getContractFactory("contracts/NadRaffleV4-ULTRA-SECURE.sol:NadRaffleV4");
        const nadRaffleV4 = await NadRaffleV4Factory.deploy();
        await nadRaffleV4.waitForDeployment();
        
        const nadRaffleV4Address = await nadRaffleV4.getAddress();
        //// NadPayV2 ABI
        const nadPayABI = JSON.parse(NadPayV2Factory.interface.formatJson());
        fs.writeFileSync(
            path.join(__dirname, '../NadPayV2-UltraSecure.abi.json'),
            JSON.stringify(nadPayABI, null, 2)
        );
        
        // NadSwapV3 ABI
        const nadSwapABI = JSON.parse(NadSwapV3Factory.interface.formatJson());
        fs.writeFileSync(
            path.join(__dirname, '../NadSwapV3-UltraSecure.abi.json'),
            JSON.stringify(nadSwapABI, null, 2)
        );
        
        // NadRaffleV4 ABI
        const nadRaffleABI = JSON.parse(NadRaffleV4Factory.interface.formatJson());
        fs.writeFileSync(
            path.join(__dirname, '../NadRaffleV4-UltraSecure.abi.json'),
            JSON.stringify(nadRaffleABI, null, 2)
        );
        
        //}.json`;
        fs.writeFileSync(
            path.join(__dirname, `../${deploymentFileName}`),
            JSON.stringify(deploymentInfo, null, 2)
        );

        // ✅ 7. Create environment file for frontend
        const envContent = `# Ultra-Secure Contract Addresses - Generated ${timestamp}
NEXT_PUBLIC_NADPAY_V2_ADDRESS=${nadPayV2Address}
NEXT_PUBLIC_NADSWAP_V3_ADDRESS=${nadSwapV3Address}
NEXT_PUBLIC_NADRAFFKE_V4_ADDRESS=${nadRaffleV4Address}
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
`;

        fs.writeFileSync(
            path.join(__dirname, '../ultra-secure-contracts.env'),
            envContent
        );

        // ✅ Success Summary
        //{
        //console.error("❌ Deployment failed:", error);
        
        // Save error info
        const errorInfo = {
            error: error.message,
            stack: error.stack,
            timestamp: timestamp,
            deployer: deployer.address
        };
        
        fs.writeFileSync(
            path.join(__dirname, `../deployment-error-${Date.now()}.json`),
            JSON.stringify(errorInfo, null, 2)
        );
        
        throw error;
    }
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            //console.error(error);
            process.exit(1);
        });
}

module.exports = main; 