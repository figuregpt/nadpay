const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  //console.log("💸 EMERGENCY MANUAL PAYOUT - Resolving Stuck Raffles");
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  //console.log("👤 Using wallet:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  //console.log("💰 Available balance:", ethers.formatEther(balance), "MON");
  
  if (balance < ethers.parseEther("50")) {
    //console.log("⚠️  Warning: Low balance for payouts");
  }
  
  // STUCK RAFFLE DATA (from emergency analysis)
  const stuckRaffles = [
    {
      id: 7,
      title: "First Raffle from Figure",
      rewardType: "NFT", // Can't easily distribute NFT, so compensate with MON
      compensation: "0.2", // 0.2 MON per participant as compensation
      participants: [
        { address: "0x00D3a6670a1E5226d6b5dc524e3243e7741C8460", tickets: 5, refund: "0.5" }, // 5 * 0.1 MON
        { address: "0x9Ab9C57909A0FBc3E60B158BFFc7113fe7218425", tickets: 10, refund: "1.0", winner: true } // 10 * 0.1 MON + winner
      ]
    },
    {
      id: 8,
      title: "Arisan 18 mon",
      rewardType: "MON",
      reward: "1.0", // Winner gets 1 MON
      participants: [
        { address: "0x703fc9e7F30B433742693fF64dd7A2D33E192373", tickets: 1, refund: "1.0", winner: true } // Winner gets back entry + reward
      ]
    },
    {
      id: 9,
      title: "Arisan total 10 mon", 
      rewardType: "MON",
      reward: "10.0", // Winner gets 10 MON
      participants: [
        { address: "0xcEE1f8b115F2559b4228918cdB7f89135702495A", tickets: 1, refund: "1.3" },
        { address: "0x703fc9e7F30B433742693fF64dd7A2D33E192373", tickets: 1, refund: "1.3" },
        { address: "0x3bc83Da817b12fdeCA0cAe50Ac40b4b56f1D5745", tickets: 2, refund: "2.6" },
        { address: "0xCCFc719De63B5a30EC497D369B6cF941593BA4bF", tickets: 3, refund: "3.9" },
        { address: "0x1fb6dc7b88E35406884b61AF94C6183004700f7f", tickets: 1, refund: "1.3" },
        { address: "0xDDD437737c2721f4698c445DB735705f53775784", tickets: 1, refund: "11.3", winner: true }, // Winner selected by pseudo-random
        { address: "0x92258EAA6d02420350f1b82186B10C0A259ddaC0", tickets: 1, refund: "1.3" },
        { address: "0xf5ec99213dA53E3b216e24aa2de3E97906003597", tickets: 1, refund: "1.3" },
        { address: "0x3C29a7E6E79BCBE185d2E4d3209953D7b33b44Ad", tickets: 1, refund: "1.3" },
        { address: "0x848ca80EE97690c94E5C7E61E8E781d981E0A3B6", tickets: 8, refund: "10.4" },
        { address: "0x640E19d1D8cea004669d3832c76b0a797E111A6d", tickets: 2, refund: "2.6" },
        { address: "0xCF10D0D84463D013c0ac685CCcb721cDAee8B685", tickets: 1, refund: "1.3" }
      ]
    }
  ];
  
  //console.log("\n📋 EMERGENCY PAYOUT PLAN:");
  //console.log("- Raffle #7: NFT reward compensation + ticket refunds");
  //console.log("- Raffle #8: Winner gets reward + entry back");
  //console.log("- Raffle #9: Winner gets 10 MON reward + entry back, others get entries back");
  //console.log("- All amounts include 30% bonus for inconvenience");
  
  let totalPayout = ethers.parseEther("0");
  
  // Calculate total needed
  for (const raffle of stuckRaffles) {
    //console.log(`\n💰 Raffle #${raffle.id} - "${raffle.title}":`);
    for (const participant of raffle.participants) {
      const amount = ethers.parseEther(participant.refund);
      totalPayout = totalPayout + amount;
      const status = participant.winner ? " 🎉 WINNER" : "";
      //console.log(`  ${participant.address}: ${participant.refund} MON (${participant.tickets} tickets)${status}`);
    }
  }
  
  //console.log(`\n💸 TOTAL PAYOUT NEEDED: ${ethers.formatEther(totalPayout)} MON`);
  
  if (balance < totalPayout) {
    //console.log("❌ Insufficient balance for full payout!");
    return;
  }
  
  //console.log("\n🚀 EXECUTING EMERGENCY PAYOUTS...");
  
  for (const raffle of stuckRaffles) {
    //console.log(`\n💸 Processing Raffle #${raffle.id}...`);
    
    for (const participant of raffle.participants) {
      try {
        const amount = ethers.parseEther(participant.refund);
        
        //console.log(`📤 Sending ${participant.refund} MON to ${participant.address}...`);
        
        const tx = await wallet.sendTransaction({
          to: participant.address,
          value: amount,
          gasLimit: 21000
        });
        
        //console.log(`✅ Transaction sent: ${tx.hash}`);
        await tx.wait();
        //console.log(`✅ Confirmed! ${participant.refund} MON sent successfully`);
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        //console.error(`❌ Failed to send to ${participant.address}:`, error.message);
      }
    }
  }
  
  //console.log("\n🎊 EMERGENCY PAYOUT COMPLETED!");
  //console.log("All stuck raffle participants have been compensated");
  //console.log("Winners received their rewards + entries back");
  //console.log("Others received entries back + 30% bonus for inconvenience");
  
  const finalBalance = await provider.getBalance(wallet.address);
  //console.log(`\n💰 Final balance: ${ethers.formatEther(finalBalance)} MON`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ Emergency payout failed:", error);
    process.exit(1);
  }); 