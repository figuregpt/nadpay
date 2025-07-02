const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    //////{
        //.toISOString(),
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
    
    ////.then(() => process.exit(0))
    .catch((error) => {
        //console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 