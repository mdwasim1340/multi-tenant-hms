/**
 * PM2 Ecosystem Configuration
 * Manages production and development processes
 * 
 * Usage:
 * - Production: pm2 start ecosystem.config.js --env production
 * - Development: pm2 start ecosystem.config.js --env development
 * - Stop: pm2 stop all
 * - Restart: pm2 restart all
 * - Logs: pm2 logs
 * - Monitor: pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'backend-api-prod',
      script: 'dist/index.js',
      instances: 2, // Use 2 instances for load balancing
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000
    },
    {
      name: 'backend-api-dev',
      script: 'ts-node-dev',
      args: '--respawn --transpile-only src/index.ts',
      instances: 1,
      exec_mode: 'fork',
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      error_file: './logs/pm2-dev-error.log',
      out_file: './logs/pm2-dev-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs', 'dist'],
      watch_delay: 1000
    }
  ]
};
