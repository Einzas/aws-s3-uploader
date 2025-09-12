import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from '@shared/config';
import {
  errorHandler,
  generalRateLimit,
  requestLogger,
} from '@presentation/middlewares';
import { FileController } from '@presentation/controllers';
import {
  UploadFileUseCase,
  GetFileUseCase,
  DeleteFileUseCase,
  ListFilesByCategoryUseCase,
} from '@application/use-cases';
import { S3FileStorageService } from '@infrastructure/storage';
import { BasicFileValidationService } from '@infrastructure/validation';
import { InMemoryFileRepository } from '@infrastructure/repositories';

class App {
  private app: express.Application;
  private fileController!: FileController;

  constructor() {
    this.app = express();
    this.setupDependencies();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupDependencies(): void {
    // Repositories
    const fileRepository = new InMemoryFileRepository();

    // Services
    const storageService = new S3FileStorageService(
      config.aws.s3BucketName,
      config.aws.region
    );
    const validationService = new BasicFileValidationService(
      config.upload.maxFileSize,
      config.upload.allowedFileTypes
    );

    // Use Cases
    const uploadFileUseCase = new UploadFileUseCase(
      fileRepository,
      storageService,
      validationService
    );
    const getFileUseCase = new GetFileUseCase(fileRepository);
    const deleteFileUseCase = new DeleteFileUseCase(
      fileRepository,
      storageService
    );
    const listFilesByCategoryUseCase = new ListFilesByCategoryUseCase(
      fileRepository
    );

    // Controllers
    this.fileController = new FileController({
      uploadFileUseCase,
      getFileUseCase,
      deleteFileUseCase,
      listFilesByCategoryUseCase,
    });
  }

  private setupMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: (origin, callback) => {
          const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001',
          ];

          // Permitir requests sin origin (Postman, apps móviles, etc)
          if (!origin) return callback(null, true);

          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      })
    );

    // Rate limiting
    this.app.use(generalRateLimit);

    // Request logging
    this.app.use(requestLogger);

    // Body parsing
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api/files', this.fileController.getRouter());

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'File Upload Service API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          upload: 'POST /api/files/upload',
          getFile: 'GET /api/files/:fileId',
          deleteFile: 'DELETE /api/files/:fileId',
          health: 'GET /api/files/health',
        },
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.originalUrl} not found`,
        },
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public start(): void {
    try {
      validateConfig();

      this.app.listen(config.server.port, () => {
        console.log(`🚀 Server is running on port ${config.server.port}`);
        console.log(`📝 Environment: ${config.server.nodeEnv}`);
        console.log(`🪣 S3 Bucket: ${config.aws.s3BucketName}`);
        console.log(`📁 Max file size: ${config.upload.maxFileSize} bytes`);
        console.log(
          `🔒 Rate limit: ${config.security.rateLimitMaxRequests} requests per ${config.security.rateLimitWindowMs}ms`
        );
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default App;
