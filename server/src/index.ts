import { httpServer } from './app.js';
import { config } from './config.js';

// Graceful shutdown handling
const shutdown = (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log('Forcing shutdown...');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
httpServer.listen(config.port, config.host, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║     🪧  Corkboard Server Running          ║
  ╠═══════════════════════════════════════════╣
  ║  REST API:  http://localhost:${config.port}/api    ║
  ║  WebSocket: ws://localhost:${config.port}          ║
  ╚═══════════════════════════════════════════╝

  Try: curl http://localhost:${config.port}/api/pins
  Binding: ${config.host}:${config.port}
  `);
  
  // Signal PM2 that we're ready (if using wait_ready)
  if (process.send) {
    process.send('ready');
  }
});
