module.exports = {
  apps: [
    {
      name: "corkie-server",
      cwd: "./server",
      script: "npx",
      args: "tsx watch src/index.ts",
      watch: false,
      kill_timeout: 5000,        // Give 5s for graceful shutdown
      wait_ready: true,          // Wait for 'ready' signal
      listen_timeout: 10000,     // 10s timeout for startup
      max_restarts: 10,          // Limit restart attempts
      restart_delay: 2000,       // Wait 2s between restarts (port cleanup)
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "corkie-client",
      cwd: "./client",
      script: "npx",
      args: "vite",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};