const hre = require("hardhat");

async function main() {
  ////{
      //const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deploymentBlock: await hre.ethers.provider.getBlockNumber(),
    deployer: await nadpay.runner.getAddress(),
    timestamp: new Date().toISOString(),
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString()
  };
  
  fs.writeFileSync(
    `deployment-${hre.network.name}.json`, 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  //}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error(error);
    process.exit(1);
  }); 