import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '@shared/config';
import { uploadProgressTracker } from '@shared/services';
import {
  UploadFileUseCase,
  GetFileUseCase,
  DeleteFileUseCase,
  ListFilesByCategoryUseCase,
} from '@application/use-cases';
import { FileCategoryHandler } from '@domain/value-objects';

const VALIDATION_CHUNK_SIZE = 64 * 1024;
let activeLargeUploads = 0;

// Crear directorio temporal si no existe
const tempDir = path.join(process.cwd(), 'temp-uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for DISK storage (mejor para archivos grandes)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage, // Usar disk storage en lugar de memory
  limits: {
    fileSize: config.upload.maxFileSize, // Use config from .env
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = FileCategoryHandler.getAllAllowedMimeTypes();

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

async function readValidationChunk(filePath: string): Promise<Buffer> {
  const fileHandle = await fs.promises.open(filePath, 'r');

  try {
    const buffer = Buffer.alloc(VALIDATION_CHUNK_SIZE);
    const { bytesRead } = await fileHandle.read(
      buffer,
      0,
      VALIDATION_CHUNK_SIZE,
      0
    );

    return buffer.subarray(0, bytesRead);
  } finally {
    await fileHandle.close();
  }
}

export interface FileControllerDependencies {
  uploadFileUseCase: UploadFileUseCase;
  getFileUseCase: GetFileUseCase;
  deleteFileUseCase: DeleteFileUseCase;
  listFilesByCategoryUseCase: ListFilesByCategoryUseCase;
}

export class FileController {
  private router: Router;

  constructor(private dependencies: FileControllerDependencies) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // List files (with optional category filter)
    this.router.get('/', this.listFiles.bind(this));

    // Start upload tracking (BEFORE sending file)
    this.router.post('/upload/start', this.startUploadTracking.bind(this));

    // Upload file with pre-multer logging
    this.router.post(
      '/upload',
      (req, res, next) => {
        console.log('\n🚨 ============ POST /upload RECIBIDO ============');
        console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
        console.log('📦 Content-Type:', req.headers['content-type']);
        console.log('📏 Content-Length:', req.headers['content-length']);
        console.log('🔧 Body keys:', Object.keys(req.body));
        console.log('=================================================\n');
        next();
      },
      upload.single('file'),
      (req, res, next) => {
        console.log('\n✅ ============ MULTER COMPLETADO ============');
        console.log('📁 File:', req.file ? req.file.originalname : 'NO FILE');
        console.log('📋 Body fields:', Object.keys(req.body));
        console.log('🆔 FileId from body:', req.body.fileId);
        console.log('==============================================\n');
        next();
      },
      this.uploadFile.bind(this)
    );

    // Get upload progress
    this.router.get('/progress/:fileId', this.getUploadProgress.bind(this));

    // Get all uploads in progress
    this.router.get('/progress', this.getAllProgress.bind(this));

    // Get file metadata
    this.router.get('/:fileId', this.getFile.bind(this));

    // Delete file
    this.router.delete('/:fileId', this.deleteFile.bind(this));

    // Health check
    this.router.get('/health', this.healthCheck.bind(this));
  }

  /**
   * Iniciar tracking de upload ANTES de enviar el archivo
   * POST /api/files/upload/start
   * Body: { fileId, fileName, fileSize }
   */
  private async startUploadTracking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileId, fileName, fileSize } = req.body;

      if (!fileId || !fileName || !fileSize) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Se requieren fileId, fileName y fileSize',
          },
        });
        return;
      }

      console.log(`\n🎬 ============ INICIANDO TRACKING ============`);
      console.log(`🆔 FileId: ${fileId}`);
      console.log(`📁 FileName: ${fileName}`);
      console.log(`📦 FileSize: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`==============================================\n`);

      // Iniciar tracking inmediatamente
      uploadProgressTracker.startTracking(fileId, fileName, fileSize);

      res.json({
        success: true,
        message: 'Tracking iniciado',
        data: { fileId },
      });
    } catch (error) {
      next(error);
    }
  }

  private async uploadFile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    let tempFilePath: string | undefined;
    let isLargeUploadInProgress = false;
    
    try {
      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'NO_FILE_PROVIDED',
            message: 'No file was provided',
          },
        });
        return;
      }

      tempFilePath = req.file.path;
      const isLargeFile =
        req.file.size >= config.upload.largeFileThresholdBytes;

      if (isLargeFile) {
        if (
          activeLargeUploads >= config.upload.maxConcurrentLargeUploads
        ) {
          await fs.promises.unlink(tempFilePath).catch(() => {});
          res.status(429).json({
            error: {
              code: 'TOO_MANY_LARGE_UPLOADS',
              message:
                'Too many large uploads in progress. Please retry in a moment.',
            },
          });
          return;
        }
        activeLargeUploads += 1;
        isLargeUploadInProgress = true;
      }

      // Get fileId from frontend or generate new one
      const fileId = req.body.fileId || (() => {
        const { v4: uuidv4 } = require('uuid');
        return uuidv4();
      })();

      console.log(`\n========== UPLOAD START ==========`);
      console.log(`🎯 FileId: ${fileId}`);
      console.log(`📁 Archivo: ${req.file.originalname}`);
      console.log(`📦 Tamaño: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`==================================\n`);

      // Iniciar tracking si no existe (puede que ya se haya iniciado con /upload/start)
      const existingProgress = uploadProgressTracker.getProgress(fileId);
      if (!existingProgress) {
        uploadProgressTracker.startTracking(fileId, req.file.originalname, req.file.size);
      } else {
        console.log(`📊 Tracking ya existía, continuando...`);
      }

      const validationBuffer = await readValidationChunk(req.file.path);

      const uploadRequest = {
        fileId, // Use fileId from frontend or generated
        fileName: req.file.originalname,
        validationBuffer,
        tempFilePath: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        metadata: {
          uploadedBy: req.body.uploadedBy || 'anonymous',
          description: req.body.description,
          tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
        },
      };

      // Execute upload synchronously (tracking updates during upload)
      const result = await this.dependencies.uploadFileUseCase.execute(uploadRequest);

      // Clean up temp file after successful upload
      await fs.promises.unlink(tempFilePath).catch((err) =>
        console.error('Error deleting temp file:', err)
      );

      if (isLargeUploadInProgress) {
        activeLargeUploads = Math.max(0, activeLargeUploads - 1);
      }

      console.log(`\n========== UPLOAD COMPLETE ==========`);
      console.log(`✅ FileId: ${fileId}`);
      console.log(`🔗 URL: ${result.url}`);
      console.log(`====================================\n`);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Clean up temp file on error
      if (tempFilePath) {
        await fs.promises.unlink(tempFilePath).catch((err) =>
          console.error('Error deleting temp file:', err)
        );
      }

      if (isLargeUploadInProgress) {
        activeLargeUploads = Math.max(0, activeLargeUploads - 1);
      }

      next(error);
    }
  }

  private async getFile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileId } = req.params;

      const result = await this.dependencies.getFileUseCase.execute({ fileId });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  private async listFiles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { category, limit, offset } = req.query;

      const result = await this.dependencies.listFilesByCategoryUseCase.execute(
        {
          category: category as string,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  private async deleteFile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileId } = req.params;

      const result = await this.dependencies.deleteFileUseCase.execute({
        fileId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  private healthCheck(req: Request, res: Response): void {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'file-upload-service',
    });
  }

  /**
   * Obtener progreso de un upload específico
   * GET /api/files/progress/:fileId
   */
  private async getUploadProgress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileId } = req.params;
      console.log(`🔍 [API] Consultando progreso para fileId: ${fileId}`);
      
      const progress = uploadProgressTracker.getProgress(fileId);

      if (!progress) {
        console.log(`❌ [API] Progreso NO encontrado para: ${fileId}`);
        console.log(`   Total en Map: ${uploadProgressTracker.getAllProgress().length} items`);
        res.status(404).json({
          success: false,
          error: {
            code: 'PROGRESS_NOT_FOUND',
            message: 'No se encontró progreso para este archivo. Puede que el upload haya terminado o no haya comenzado.',
          },
        });
        return;
      }
      
      console.log(`✅ [API] Progreso encontrado: ${progress.percentage}% - ${progress.status}`);

      res.json({
        success: true,
        data: {
          fileId: progress.fileId,
          fileName: progress.fileName,
          status: progress.status,
          percentage: progress.percentage,
          uploadedSize: progress.uploadedSize,
          totalSize: progress.totalSize,
          currentPart: progress.currentPart,
          totalParts: progress.totalParts,
          speed: progress.speed,
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
          startedAt: new Date(progress.startedAt).toISOString(),
          updatedAt: new Date(progress.updatedAt).toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los uploads en progreso
   * GET /api/files/progress
   */
  private async getAllProgress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const allProgress = uploadProgressTracker.getAllProgress();

      res.json({
        success: true,
        data: {
          uploads: allProgress.map(progress => ({
            fileId: progress.fileId,
            fileName: progress.fileName,
            status: progress.status,
            percentage: progress.percentage,
            uploadedSize: progress.uploadedSize,
            totalSize: progress.totalSize,
            currentPart: progress.currentPart,
            totalParts: progress.totalParts,
            speed: progress.speed,
            estimatedTimeRemaining: progress.estimatedTimeRemaining,
            startedAt: new Date(progress.startedAt).toISOString(),
            updatedAt: new Date(progress.updatedAt).toISOString(),
          })),
          total: allProgress.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
