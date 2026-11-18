import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { redisClient } from './shared/redis/redisClient.js';

const PORT = process.env.PORT || 5000;

/**
 * Initialize critical services and start server
 */
async function startServer() {
  try {
    // Initialize Redis connection (non-blocking)
    await redisClient.initialize();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: GET http://localhost:${PORT}/health`);
      console.log(`Cache metrics: GET http://localhost:${PORT}/health/cache`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
