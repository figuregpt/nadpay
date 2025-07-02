const { ethers } = require("ethers");
const fs = require('fs');
require('dotenv').config();

async function main() {
    console.log("🚀 Deploying NadRaffle V7 - Multi-Token Payment Raffle System...");
    
    // Connect to provider
    const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
    
    // Create wallet from private key
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("📍 Deploying from address:", deployer.address);
    
    // Get balance
    const balance = await provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "MON");
    
    // Contract parameters
    const feeAddress = deployer.address; // Set your fee collection address
    const creationFee = ethers.parseEther("0.1"); // 0.1 MON creation fee
    const platformFeePercentage = 250; // 2.5%
    const minDuration = 3600; // 1 hour minimum
    const maxDuration = 86400; // 24 hours maximum
    
    console.log("\n📋 Deployment Parameters:");
    console.log("  Fee Address:", feeAddress);
    console.log("  Creation Fee:", ethers.formatEther(creationFee), "MON");
    console.log("  Platform Fee:", platformFeePercentage / 100, "%");
    console.log("  Min Duration:", minDuration / 3600, "hours");
    console.log("  Max Duration:", maxDuration / 3600, "hours");
    
    // Read contract bytecode and ABI
    const contractName = "NadRaffleV7";
    const contractPath = `./artifacts/contracts/${contractName}.sol/${contractName}.json`;
    
    if (!fs.existsSync(contractPath)) {
        console.error("❌ Contract artifact not found. Please compile the contract first:");
        console.error("   npx hardhat compile");
        return;
    }
    
    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // Deploy contract
    const ContractFactory = new ethers.ContractFactory(
        contractArtifact.abi,
        contractArtifact.bytecode,
        deployer
    );
    
    console.log("\n🔨 Deploying contract...");
    const contract = await ContractFactory.deploy(
        feeAddress,
        creationFee,
        platformFeePercentage,
        minDuration,
        maxDuration
    );
    
    console.log("📜 Transaction hash:", contract.deploymentTransaction().hash);
    console.log("⏳ Waiting for confirmation...");
    
    // Wait for deployment
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log("\n✅ NadRaffle V7 deployed successfully!");
    console.log("📍 Contract address:", contractAddress);
    
    // Save deployment info
    const deploymentInfo = {
        network: "monadTestnet",
        contractName: contractName,
        contractAddress: contractAddress,
        deployer: deployer.address,
        deploymentTx: contract.deploymentTransaction().hash,
        deploymentTime: new Date().toISOString(),
        parameters: {
            feeAddress,
            creationFee: ethers.formatEther(creationFee),
            platformFeePercentage: platformFeePercentage / 100 + "%",
            minDuration: minDuration / 3600 + " hours",
            maxDuration: maxDuration / 3600 + " hours"
        }
    };
    
    const filename = `raffle-v7-deployment-monadTestnet-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to:", filename);
    
    // Save ABI separately
    const abiFilename = 'NadRaffleV7.abi.json';
    fs.writeFileSync(abiFilename, JSON.stringify(contractArtifact.abi, null, 2));
    console.log("📄 ABI saved to:", abiFilename);
    
    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const deployedCode = await provider.getCode(contractAddress);
    if (deployedCode !== '0x') {
        console.log("✅ Contract code verified on-chain");
        
        // Test contract functions
        console.log("\n🧪 Testing contract functions...");
        
        const totalRaffles = await contract.totalRaffles();
        console.log("  Total Raffles:", totalRaffles.toString());
        
        const owner = await contract.owner();
        console.log("  Owner:", owner);
        
        const feeAddr = await contract.feeAddress();
        console.log("  Fee Address:", feeAddr);
        
        const creationFeeValue = await contract.creationFee();
        console.log("  Creation Fee:", ethers.formatEther(creationFeeValue), "MON");
        
        const platformFee = await contract.platformFeePercentage();
        console.log("  Platform Fee:", platformFee.toString() / 100, "%");
        
        console.log("\n🎉 All tests passed! Contract is ready to use.");
    } else {
        console.error("❌ Contract deployment failed - no code at address");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        
        // Save error details
        const errorInfo = {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        
        const errorFilename = `deployment-error-v7-${Date.now()}.json`;
        fs.writeFileSync(errorFilename, JSON.stringify(errorInfo, null, 2));
        console.error("💾 Error details saved to:", errorFilename);
        
        process.exit(1);
    }); 