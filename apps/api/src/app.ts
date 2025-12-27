import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import mainRouter from './routes/index';

// Load environment variables
dotenv.config();

/**
 * Express Application Setup
 */
class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize Express Middlewares
   */
  private initializeMiddlewares(): void {
    // Security headers
    this.app.use(helmet());

    // CORS configuration
    this.app.use(
      cors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 200,
      })
    );

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy (for accurate IP addresses behind reverse proxy)
    this.app.set('trust proxy', 1);

    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  }

  /**
   * Initialize API Routes
   */
  private initializeRoutes(): void {
    // Mount all API v1 routes
    this.app.use('/api/v1', mainRouter);

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        name: 'Paperless Examination System API',
        version: '1.0.0',
        status: 'Running',
      });
    });
  }

  /**
   * Initialize Error Handling
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start Server
   */
  public listen(): void {
    const PORT = process.env.PORT || 5000;

    this.app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
    });
  }
}

export default App;
