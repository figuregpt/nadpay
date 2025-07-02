module.exports = {
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
};