const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("🚀 Deploying NadRaffleV4Working contract...\n");
    
    const [deployer] = await ethers.getSigners();
    
    console.log("📋 Deployment Details:");
    console.log("- Deployer address:", deployer.address);
    console.log("- Network:", network.name);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("- Deployer balance:", ethers.formatEther(balance), "MON");
    
    if (balance < ethers.parseEther("0.1")) {
        throw new Error("❌ Insufficient balance for deployment");
    }
    
    console.log("\n⚡ Contract Features:");
    console.log("- ✅ Bug fixes for expired raffles");
    console.log("- ✅ Admin functions (onlyOwner)");
    console.log("- ✅ 5-minute minimum duration (testing)");
    console.log("- ✅ 2-minute reveal window (fast)");
    console.log("- ✅ Enhanced security from ULTRA-SECURE");
    console.log("- ✅ Configurable parameters");
    console.log("- ✅ Emergency controls");
    
    console.log("\n📦 Deploying contract...");
    
    const NadRaffleV4Working = await ethers.getContractFactory("NadRaffleV4Working");
    const nadRaffle = await NadRaffleV4Working.deploy();
    
    console.log("⏳ Waiting for deployment...");
    await nadRaffle.waitForDeployment();
    
    const contractAddress = await nadRaffle.getAddress();
    
    console.log("✅ Contract deployed successfully!");
    console.log("📍 Contract address:", contractAddress);
    console.log("👤 Owner:", deployer.address);
    
    // Verify contract is working
    console.log("\n🔍 Verifying contract...");
    
    try {
        const contractInfo = await nadRaffle.getContractInfo();
        const adminConfig = await nadRaffle.getAdminConfig();
        
        console.log("✅ Contract verification passed!");
        console.log("- Version:", contractInfo[0]);
        console.log("- Total raffles:", contractInfo[1].toString());
        console.log("- Platform fee:", contractInfo[3].toString(), "bps");
        console.log("- Min duration:", adminConfig[0].toString(), "seconds");
        console.log("- Reveal window:", adminConfig[1].toString(), "seconds");
        console.log("- Max tickets per purchase:", adminConfig[2].toString());
        
    } catch (error) {
        console.log("❌ Contract verification failed:", error.message);
    }
    
    // Save deployment info
    const deploymentInfo = {
        contractName: "NadRaffleV4Working",
        contractAddress: contractAddress,
        deployerAddress: deployer.address,
        network: network.name,
        deploymentTime: new Date().toISOString(),
        blockNumber: await deployer.provider.getBlockNumber(),
        features: [
            "Fixed expired raffle bugs",
            "Admin configuration functions",
            "5-minute minimum duration (testing)",
            "2-minute reveal window (fast)",
            "Enhanced security features",
            "Emergency controls",
            "Configurable parameters"
        ],
        adminFunctions: [
            "adminSetMinDuration",
            "adminSetRevealWindow", 
            "adminSetMaxTicketsPerPurchase",
            "adminEmergencyPause",
            "adminEmergencyUnpause",
            "adminForceEndRaffle",
            "adminWithdrawStuckFunds"
        ],
        improvements: [
            "Fixed commitRandomnessForExpiredRaffle",
            "Fixed finalizeExpiredRaffles", 
            "Added _cancelRaffleInternal",
            "Enhanced error handling",
            "Better gas optimization"
        ]
    };
    
    const filename = `nadraffle-v4-working-deployment-${network.name}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n💾 Deployment info saved to: ${filename}`);
    
    console.log("\n🎯 NEXT STEPS:");
    console.log("1. Update frontend contract address");
    console.log("2. Generate new ABI file");
    console.log("3. Test raffle creation (5 min minimum)");
    console.log("4. Test expired raffle handling");
    console.log("5. Test admin functions");
    console.log("6. Deploy finalizer with new address");
    
    console.log("\n🔧 Admin Commands Available:");
    console.log("- Change min duration: adminSetMinDuration(seconds)");
    console.log("- Change reveal window: adminSetRevealWindow(seconds)");
    console.log("- Emergency pause: adminEmergencyPause()");
    console.log("- Force end raffle: adminForceEndRaffle(id, reason)");
    
    console.log("\n🚀 Deployment completed successfully!");
    
    return {
        contractAddress,
        deploymentInfo
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 