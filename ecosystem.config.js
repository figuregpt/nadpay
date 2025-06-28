module.exports = {
  apps: [
    {
      name: 'nadpay-web',
      script: 'npm',
      args: 'start',
      cwd: '/app',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'raffle-finalizer',
      script: 'npm',
      args: 'run finalizer:start',
      cwd: '/app',
      env: {
        NODE_ENV: 'production'
      },
      restart_delay: 10000,
      max_restarts: 10
    }
  ]
}; 