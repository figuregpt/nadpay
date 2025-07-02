const hre = require("hardhat");
const fs = require('fs');

async function main() {
  //);
  //// Verify contract on explorer if not local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    ////{
      //}
  }

  //.then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 