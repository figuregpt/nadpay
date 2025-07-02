const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    //console.log("🚀 Starting Ultra-Secure Contracts Deployment...\n");
    
    const [deployer] = await ethers.getSigners();
    //console.log("Deploying contracts with account:", deployer.address);
    //console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "MON\n");

    const deploymentResults = {};
    const timestamp = new Date().toISOString();

    try {
        // ✅ 1. Deploy NadPayV2 Ultra-Secure
        //console.log("📄 Deploying NadPayV2 Ultra-Secure...");
        // Use a well-known test address for fee recipient (proper checksum)
        const feeRecipient = ethers.getAddress("0x742d35cc6634c0532925a3b8d4e4f1b7e8c4f4e1");
        
        const NadPayV2Factory = await ethers.getContractFactory("contracts/NadPayV2-ULTRA-SECURE.sol:NadPayV2");
        const nadPayV2 = await NadPayV2Factory.deploy(feeRecipient);
        await nadPayV2.waitForDeployment();
        
        const nadPayV2Address = await nadPayV2.getAddress();
        //console.log("✅ NadPayV2 Ultra-Secure deployed to:", nadPayV2Address);
        
        deploymentResults.nadPayV2 = {
            address: nadPayV2Address,
            constructorArgs: [feeRecipient],
            deploymentTx: nadPayV2.deploymentTransaction().hash
        };

        // ✅ 2. Deploy NadSwapV3 Ultra-Secure
        //console.log("\n🔄 Deploying NadSwapV3 Ultra-Secure...");
        
        const NadSwapV3Factory = await ethers.getContractFactory("contracts/NadSwapV3-ULTRA-SECURE.sol:NadSwapV3");
        const nadSwapV3 = await NadSwapV3Factory.deploy();
        await nadSwapV3.waitForDeployment();
        
        const nadSwapV3Address = await nadSwapV3.getAddress();
        //console.log("✅ NadSwapV3 Ultra-Secure deployed to:", nadSwapV3Address);
        
        deploymentResults.nadSwapV3 = {
            address: nadSwapV3Address,
            constructorArgs: [],
            deploymentTx: nadSwapV3.deploymentTransaction().hash
        };

        // ✅ 3. Deploy NadRaffleV4 Ultra-Secure
        //console.log("\n🎲 Deploying NadRaffleV4 Ultra-Secure...");
        
        const NadRaffleV4Factory = await ethers.getContractFactory("contracts/NadRaffleV4-ULTRA-SECURE.sol:NadRaffleV4");
        const nadRaffleV4 = await NadRaffleV4Factory.deploy();
        await nadRaffleV4.waitForDeployment();
        
        const nadRaffleV4Address = await nadRaffleV4.getAddress();
        //console.log("✅ NadRaffleV4 Ultra-Secure deployed to:", nadRaffleV4Address);
        
        deploymentResults.nadRaffleV4 = {
            address: nadRaffleV4Address,
            constructorArgs: [],
            deploymentTx: nadRaffleV4.deploymentTransaction().hash
        };

        // ✅ 4. Generate ABIs
        //console.log("\n📋 Generating ABIs...");
        
        // NadPayV2 ABI
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
        
        //console.log("✅ ABIs generated successfully");

        // ✅ 5. Test basic functionality
        //console.log("\n🧪 Testing basic functionality...");
        
        // Test NadPayV2
        //console.log("Testing NadPayV2...");
        const totalLinks = await nadPayV2.getTotalLinks();
        //console.log("✅ NadPayV2 total links:", totalLinks.toString());
        
        // Test NadSwapV3
        //console.log("Testing NadSwapV3...");
        const totalProposals = await nadSwapV3.getTotalProposals();
        //console.log("✅ NadSwapV3 total proposals:", totalProposals.toString());
        
        // Test NadRaffleV4
        //console.log("Testing NadRaffleV4...");
        const totalRaffles = await nadRaffleV4.getTotalRaffles();
        //console.log("✅ NadRaffleV4 total raffles:", totalRaffles.toString());

        // ✅ 6. Save deployment information
        const deploymentInfo = {
            network: "monadTestnet",
            chainId: 10143,
            deployer: deployer.address,
            deploymentTime: timestamp,
            contracts: deploymentResults,
            gasUsed: {
                nadPayV2: nadPayV2.deploymentTransaction().gasLimit?.toString() || "N/A",
                nadSwapV3: nadSwapV3.deploymentTransaction().gasLimit?.toString() || "N/A",
                nadRaffleV4: nadRaffleV4.deploymentTransaction().gasLimit?.toString() || "N/A"
            },
            notes: "Ultra-secure versions with all security vulnerabilities fixed"
        };

        const deploymentFileName = `ultra-secure-deployment-monadTestnet-${Date.now()}.json`;
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
        //console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
        //console.log("=" * 50);
        //console.log("📄 NadPayV2 Ultra-Secure:", nadPayV2Address);
        //console.log("🔄 NadSwapV3 Ultra-Secure:", nadSwapV3Address);
        //console.log("🎲 NadRaffleV4 Ultra-Secure:", nadRaffleV4Address);
        //console.log("=" * 50);
        //console.log("📁 Deployment info saved to:", deploymentFileName);
        //console.log("🔧 Environment file created: ultra-secure-contracts.env");
        //console.log("📋 ABIs generated in root directory");
        //console.log("\n✅ Ready for frontend integration!");

        return deploymentResults;

    } catch (error) {
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