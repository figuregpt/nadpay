module.exports = {
  apps: [
    {
      name: 'nadpay-web',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'raffle-v4-fast-finalizer',
      script: './scripts/raffle-v4-fast-finalizer.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000, // 5 seconds delay between restarts (faster for V4 Fast)
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/raffle-v4-fast-finalizer-error.log',
      out_file: './logs/raffle-v4-fast-finalizer-out.log',
      log_file: './logs/raffle-v4-fast-finalizer-combined.log',
      time: true
    }
  ]
}; 