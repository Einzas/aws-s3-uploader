import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  UploadFileUseCase,
  GetFileUseCase,
  DeleteFileUseCase,
  ListFilesByCategoryUseCase,
} from '@application/use-cases';
import { FileCategoryHandler } from '@domain/value-objects';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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

      const uploadRequest = {
        fileName: req.file.originalname,
        fileBuffer: req.file.buffer,
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

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
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
