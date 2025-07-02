const hre = require("hardhat");

async function main() {
  ////const NadPayV2 = await hre.ethers.getContractFactory("NadPayV2");
    
    const nadPayV2 = await NadPayV2.deploy();
    await nadPayV2.waitForDeployment();

    const nadPayV2Address = await nadPayV2.getAddress();
    //// Test basic functionality
    //fs.writeFileSync(
      'nadpay-v2-deployment-monadTestnet.json',
      JSON.stringify(deploymentInfo, null, 2)
    );

    //{
    //console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("💥 Deployment script failed:", error);
    process.exit(1);
  }); 