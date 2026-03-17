// PM2 ecosystem — dùng khi deploy lên VPS trực tiếp (không dùng Docker)
// Chạy: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      name: "weblikefood",
      script: "node_modules/.bin/next",
      args: "start",
      instances: "max",        // Fork 1 instance mỗi CPU core
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Logging
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
