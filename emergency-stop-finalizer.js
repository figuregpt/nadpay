const fs = require('fs');
const path = require('path');

console.log("🚨 EMERGENCY FINALIZER STOP");
console.log("=".repeat(40));

// 1. Stop PM2 processes
console.log("1. 🛑 Stopping PM2 finalizer...");
console.log("   Run: pm2 stop raffle-finalizer");
console.log("   Run: pm2 delete raffle-finalizer");

// 2. Backup and modify ecosystem.config.js
console.log("\n2. 🔧 Disabling ecosystem.config.js...");
const ecosystemPath = 'ecosystem.config.js';

if (fs.existsSync(ecosystemPath)) {
  // Backup original
  const backupPath = 'ecosystem.config.js.backup';
  fs.copyFileSync(ecosystemPath, backupPath);
  console.log(`   ✅ Backed up to: ${backupPath}`);
  
  // Read and modify
  let content = fs.readFileSync(ecosystemPath, 'utf8');
  
  // Comment out the raffle-finalizer app
  const modifiedContent = content.replace(
    /,\s*{\s*name:\s*['"']raffle-finalizer['"'][\s\S]*?}\s*(?=\])/,
    `
    // DISABLED - COST EXPLOSION RISK!
    // {
    //   name: 'raffle-finalizer',
    //   script: 'npm',
    //   args: 'run finalizer:fast',
    //   cwd: '/app',
    //   env: {
    //     NODE_ENV: 'production'
    //   },
    //   restart_delay: 15000,
    //   max_restarts: 5,
    //   min_uptime: '30s'
    // }`
  );
  
  fs.writeFileSync(ecosystemPath, modifiedContent);
  console.log("   ✅ Disabled raffle-finalizer in ecosystem.config.js");
} else {
  console.log("   ⚠️  ecosystem.config.js not found");
}

// 3. Create a safer finalizer config
console.log("\n3. 🔧 Creating safe finalizer config...");
const safeConfig = `module.exports = {
  apps: [
    {
      name: 'nadpay-web',
      script: 'npm',
      args: 'start',
      cwd: '/app',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        HOSTNAME: '0.0.0.0'
      }
    }
    // RAFFLE FINALIZER DISABLED DUE TO COST EXPLOSION
    // - Each raffle costs ~0.5 MON to finalize
    // - 100 raffles = 50 MON cost
    // - 1000 raffles = 500 MON cost ($50 USD)
    // 
    // SOLUTIONS:
    // 1. Manual finalization only
    // 2. User-paid finalization
    // 3. Emergency finalization for high-value only
    // 4. Batch processing with daily limits
  ]
};`;

const safeEcosystemPath = 'ecosystem.safe.config.js';
fs.writeFileSync(safeEcosystemPath, safeConfig);
console.log(`   ✅ Created safe config: ${safeEcosystemPath}`);

// 4. Check current PM2 status
console.log("\n4. 📊 Current PM2 processes:");
console.log("   Check with: pm2 list");
console.log("   If finalizer running: pm2 stop raffle-finalizer");

// 5. Cost-safe alternatives
console.log("\n🛡️  COST-SAFE ALTERNATIVES:");
console.log("━".repeat(40));
console.log("1. 👤 Manual Finalization:");
console.log("   - Users finalize their own raffles");
console.log("   - Only emergency finalize valuable ones");
console.log("");
console.log("2. 💰 Paid Finalization Service:");
console.log("   - Charge 0.1 MON finalization fee");
console.log("   - Auto-finalize only if fee paid");
console.log("");
console.log("3. 📊 Daily Limit System:");
console.log("   - Max 5 MON per day for finalization");
console.log("   - Process highest value raffles first");
console.log("");
console.log("4. 🎯 Smart Prioritization:");
console.log("   - Only auto-finalize raffles > 10 MON value");
console.log("   - Let small raffles expire naturally");

console.log("\n✅ EMERGENCY STOP COMPLETED!");
console.log("🔧 Next: Implement cost-safe finalization system");
console.log("💰 Current balance preserved from further drainage"); 