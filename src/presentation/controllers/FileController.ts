import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '@shared/config';
import {
  UploadFileUseCase,
  GetFileUseCase,
  DeleteFileUseCase,
  ListFilesByCategoryUseCase,
} from '@application/use-cases';
import { FileCategoryHandler } from '@domain/value-objects';

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

    // Upload file
    this.router.post(
      '/upload',
      upload.single('file'),
      this.uploadFile.bind(this)
    );

    // Get file metadata
    this.router.get('/:fileId', this.getFile.bind(this));

    // Delete file
    this.router.delete('/:fileId', this.deleteFile.bind(this));

    // Health check
    this.router.get('/health', this.healthCheck.bind(this));
  }

  private async uploadFile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    let tempFilePath: string | undefined;
    
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

      // Guardar path del archivo temporal para limpieza
      tempFilePath = req.file.path;

      // Leer archivo desde disco en lugar de req.file.buffer
      const fileBuffer = await fs.promises.readFile(req.file.path);

      const uploadRequest = {
        fileName: req.file.originalname,
        fileBuffer: fileBuffer,
        mimeType: req.file.mimetype,
        size: req.file.size,
        metadata: {
          uploadedBy: req.body.uploadedBy || 'anonymous',
          description: req.body.description,
          tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
        },
      };

      const result =
        await this.dependencies.uploadFileUseCase.execute(uploadRequest);

      // Limpiar archivo temporal después de upload exitoso
      if (tempFilePath) {
        await fs.promises.unlink(tempFilePath).catch(err => 
          console.error('Error deleting temp file:', err)
        );
      }

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Limpiar archivo temporal en caso de error
      if (tempFilePath) {
        await fs.promises.unlink(tempFilePath).catch(err => 
          console.error('Error deleting temp file:', err)
        );
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

  getRouter(): Router {
    return this.router;
  }
}
