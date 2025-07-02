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
    },
    {
      name: 'raffle-v7-finalizer',
      script: 'node',
      args: 'finalizer-v7-ultra-fast.js --interval 60', // Safe 60-second interval
      cwd: '/app',
      env: {
        NODE_ENV: 'production'
      },
      restart_delay: 30000, // 30 second restart delay
      max_restarts: 10,     // Max 10 restarts
      min_uptime: '60s',    // Must run for at least 60 seconds
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      error_file: '/app/logs/finalizer-error.log',
      out_file: '/app/logs/finalizer-out.log',
      log_file: '/app/logs/finalizer-combined.log',
      time: true
    }
  ]
}; 