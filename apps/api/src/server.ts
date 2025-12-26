import App from './app';
import { logger } from './config/logger';
import { prisma } from './config/database';

/**
 * Initialize and Start Server
 */
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info(' Database connected successfully');

    // Start Express server
    const app = new App();
    app.listen();
  } catch (error) {
    logger.error(' Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Starting graceful shutdown...');

  try {
    await prisma.$disconnect();
    logger.info(' Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error(' Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Starting graceful shutdown...');

  try {
    await prisma.$disconnect();
    logger.info(' Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error(' Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
startServer();
