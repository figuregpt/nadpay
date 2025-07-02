const { ethers } = require("hardhat");
require("dotenv").config({ path: './nadpay/.env' });

async function main() {
  console.log("🔍 SIMPLE RAFFLE STATE ANALYSIS");
  console.log("=".repeat(50));
  
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const contractAddress = "0xa874905B117242eC6c966E35B18985e9242Bb633";
  const abi = [
    "function getTotalRaffles() external view returns (uint256)",
    "function getRaffle(uint256 raffleId) external view returns (tuple(uint256 id, address creator, string title, string description, uint8 rewardType, address rewardTokenAddress, uint256 rewardAmount, uint256 ticketPrice, address ticketPaymentToken, uint256 maxTickets, uint256 ticketsSold, uint256 totalEarned, uint256 expirationTime, bool autoDistributeOnSoldOut, address winner, uint8 status, bool rewardClaimed, uint256 createdAt))"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  console.log("🎯 Contract:", contractAddress);
  console.log("");
  
  // Get total raffles
  const totalRaffles = await contract.getTotalRaffles();
  console.log(`📊 Total Raffles Ever Created: ${totalRaffles}`);
  console.log("");
  
  // Analyze all raffles
  const currentTime = Math.floor(Date.now() / 1000);
  
  const raffleStates = {
    active: [],
    expired_no_winner: [],
    finished: [],
    cancelled: [],
    no_tickets: []
  };
  
  console.log("🔍 Analyzing all 19 raffles...");
  
  for (let i = 0; i < totalRaffles; i++) {
    try {
      const raffle = await contract.getRaffle(i);
      
      const isExpired = currentTime >= Number(raffle.expirationTime);
      const hasTickets = Number(raffle.ticketsSold) > 0;
      const hasWinner = raffle.winner !== '0x0000000000000000000000000000000000000000';
      const status = Number(raffle.status);
      
      const raffleInfo = {
        id: i,
        title: raffle.title.length > 30 ? raffle.title.substring(0, 30) + '...' : raffle.title,
        ticketsSold: Number(raffle.ticketsSold),
        maxTickets: Number(raffle.maxTickets),
        hasWinner: hasWinner,
        status: status,
        isExpired: isExpired,
        winner: raffle.winner,
        expirationDate: new Date(Number(raffle.expirationTime) * 1000).toLocaleDateString()
      };
      
      if (status === 2) {
        raffleStates.cancelled.push(raffleInfo);
      } else if (!hasTickets) {
        raffleStates.no_tickets.push(raffleInfo);
      } else if (hasWinner) {
        raffleStates.finished.push(raffleInfo);
      } else if (isExpired) {
        raffleStates.expired_no_winner.push(raffleInfo);
      } else {
        raffleStates.active.push(raffleInfo);
      }
      
    } catch (error) {
      console.log(`❌ Error checking raffle ${i}:`, error.message);
    }
  }
  
  console.log("");
  console.log("📊 RAFFLE STATE BREAKDOWN:");
  console.log("━".repeat(50));
  
  console.log(`🟢 ACTİVE (${raffleStates.active.length}): Henüz bitmemiş`);
  raffleStates.active.forEach(r => {
    console.log(`   - #${r.id}: ${r.title} (${r.ticketsSold}/${r.maxTickets} bilet, bitiş: ${r.expirationDate})`);
  });
  
  console.log(`🟡 SÜRESİ BİTMİŞ AMA KAZANAN YOK (${raffleStates.expired_no_winner.length}): FİNALİZATİON GEREKLİ`);
  raffleStates.expired_no_winner.forEach(r => {
    console.log(`   - #${r.id}: ${r.title} (${r.ticketsSold} bilet, ${r.expirationDate})`);
  });
  
  console.log(`✅ BİTMİŞ (${raffleStates.finished.length}): Kazananı var, FİNALİZE EDİLMİŞ`);
  raffleStates.finished.forEach(r => {
    console.log(`   - #${r.id}: ${r.title} (Kazanan: ${r.winner.substring(0, 10)}...)`);
  });
  
  console.log(`❌ İPTAL EDİLMİŞ (${raffleStates.cancelled.length}): Status = 2`);
  raffleStates.cancelled.forEach(r => {
    console.log(`   - #${r.id}: ${r.title}`);
  });
  
  console.log(`⚪ BİLETSİZ (${raffleStates.no_tickets.length}): Hiç bilet satılmamış`);
  raffleStates.no_tickets.forEach(r => {
    console.log(`   - #${r.id}: ${r.title}`);
  });
  
  console.log("");
  console.log("💸 FİNALİZER WASTE ANALİZİ:");
  console.log("━".repeat(50));
  
  const needsFinalization = raffleStates.expired_no_winner.length;
  const alreadyFinished = raffleStates.finished.length;
  
  console.log(`🎯 Finalize edilmesi gereken: ${needsFinalization} raffle`);
  console.log(`✅ Zaten finalize edilmiş: ${alreadyFinished} raffle`);
  console.log("");
  
  console.log("💰 MALIYET HESABI:");
  console.log(`   Gerekli finalization: ${needsFinalization} × 0.526 MON = ${(needsFinalization * 0.526).toFixed(1)} MON`);
  console.log(`   🚨 EĞER bitmiş raffles'leri tekrar process ederse:`);
  console.log(`   İsraf: ${alreadyFinished} × 0.526 MON = ${(alreadyFinished * 0.526).toFixed(1)} MON WASTE!`);
  console.log("");
  
  console.log("🔍 FİNALİZER SCRIPT LOGİĞİ:");
  console.log("━".repeat(50));
  console.log("Finalizer script şu koşullarda raffle process eder:");
  console.log("1. ✅ Expired + Winner yok + Bilet var → GEREKLİ");
  console.log("2. ✅ Sold out + Winner yok + Bilet var → GEREKLİ");  
  console.log("3. ❌ Winner var (finished) → GEREKSIZ (WASTE!)");
  console.log("4. ❌ Bilet yok → GEREKSIZ");
  console.log("");
  
  if (alreadyFinished > 0) {
    console.log("🚨 WASTE RİSKİ:");
    console.log(`   ${alreadyFinished} raffle zaten bitmiş (winner var)`);
    console.log("   Finalizer bunları tekrar process etmemeli!");
    console.log(`   Eğer bug varsa: ${(alreadyFinished * 0.526).toFixed(1)} MON israf olur`);
  } else {
    console.log("✅ İYİ HABER:");
    console.log("   Henüz bitmiş raffle yok, waste riski düşük");
  }
  
  console.log("");
  console.log("📈 PLATFORM BÜYÜYÜNCE:");
  console.log("━".repeat(50));
  console.log("🔄 100 raffle oluşsa:");
  console.log(`   - 80 bitmiş, 20 finalize gerekli`);
  console.log(`   - Gerekli cost: 20 × 0.526 = 10.5 MON`);
  console.log(`   - Bug varsa waste: 80 × 0.526 = 42.1 MON!`);
  console.log("");
  console.log("🔧 ÖNERİ:");
  console.log("   Finalizer'da kesin kontrol:");
  console.log("   if (raffle.winner != 0x0) skip; // Zaten bitmiş");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌", error);
    process.exit(1);
  }); 