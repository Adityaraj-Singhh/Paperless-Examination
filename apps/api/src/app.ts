import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import universityRoutes from './routes/university.routes';
import schoolRoutes from './routes/school.routes';
import departmentRoutes from './routes/department.routes';
import programmeRoutes from './routes/programme.routes';
import courseRoutes from './routes/course.routes';

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
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
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
    // API Version 1
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/universities', universityRoutes);
    this.app.use('/api/v1/schools', schoolRoutes);
    this.app.use('/api/v1/departments', departmentRoutes);
    this.app.use('/api/v1/programmes', programmeRoutes);
    this.app.use('/api/v1/courses', courseRoutes);

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
