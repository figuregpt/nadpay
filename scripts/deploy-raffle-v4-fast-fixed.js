const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  ////}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  //// Generate ABI
  //.then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 