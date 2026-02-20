import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@shared/services';

export interface CleanupOptions {
  maxAge?: number; // Edad máxima en milisegundos (default: 1 hora)
  checkInterval?: number; // Intervalo de verificación en milisegundos (default: 5 minutos)
  tempDir?: string; // Directorio temporal (default: temp-uploads)
}

export interface CleanupStats {
  filesDeleted: number;
  totalSize: number;
  errors: number;
}

/**
 * Servicio de limpieza automática de archivos temporales
 * Características:
 * - Limpieza basada en edad de archivos
 * - Ejecución programada automática
 * - Logging detallado
 * - Manejo robusto de errores
 * - No bloquea el sistema
 */
export class TempFileCleanupService {
  private cleanupTimer?: NodeJS.Timeout;
  private isRunning = false;
  private readonly maxAge: number;
  private readonly checkInterval: number;
  private readonly tempDir: string;

  constructor(options?: CleanupOptions) {
    this.maxAge = options?.maxAge || 60 * 60 * 1000; // 1 hour default
    this.checkInterval = options?.checkInterval || 5 * 60 * 1000; // 5 minutes default
    this.tempDir = options?.tempDir || path.join(process.cwd(), 'temp-uploads');

    logger.info('TempFileCleanupService initialized', {
      maxAge: this.maxAge,
      checkInterval: this.checkInterval,
      tempDir: this.tempDir,
    });
  }

  /**
   * Iniciar la limpieza automática programada
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Cleanup service already running');
      return;
    }

    this.isRunning = true;

    // Ejecutar limpieza inmediatamente al iniciar
    this.cleanup().catch((error) => {
      logger.error('Initial cleanup failed', error);
    });

    // Programar limpiezas periódicas
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch((error) => {
        logger.error('Scheduled cleanup failed', error);
      });
    }, this.checkInterval);

    logger.info('Cleanup service started', {
      checkInterval: this.checkInterval,
    });
  }

  /**
   * Detener la limpieza automática
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.isRunning = false;
    logger.info('Cleanup service stopped');
  }

  /**
   * Ejecutar limpieza manual
   */
  async cleanup(): Promise<CleanupStats> {
    const startTime = Date.now();
    const stats: CleanupStats = {
      filesDeleted: 0,
      totalSize: 0,
      errors: 0,
    };

    try {
      // Verificar que el directorio existe
      if (!fs.existsSync(this.tempDir)) {
        logger.info('Temp directory does not exist, skipping cleanup', {
          tempDir: this.tempDir,
        });
        return stats;
      }

      logger.info('Starting temp file cleanup', {
        tempDir: this.tempDir,
        maxAge: this.maxAge,
      });

      const files = await fs.promises.readdir(this.tempDir);
      const now = Date.now();

      // Procesar archivos en paralelo con límite de concurrencia
      const maxConcurrent = 10;
      for (let i = 0; i < files.length; i += maxConcurrent) {
        const batch = files.slice(i, i + maxConcurrent);
        await Promise.all(
          batch.map(async (file) => {
            try {
              const filePath = path.join(this.tempDir, file);
              const fileStats = await fs.promises.stat(filePath);

              // Solo procesar archivos (no directorios)
              if (!fileStats.isFile()) {
                return;
              }

              // Calcular edad del archivo
              const fileAge = now - fileStats.mtimeMs;

              // Eliminar si es más viejo que maxAge
              if (fileAge > this.maxAge) {
                await fs.promises.unlink(filePath);
                stats.filesDeleted++;
                stats.totalSize += fileStats.size;

                logger.info('Temp file deleted', {
                  file,
                  size: fileStats.size,
                  age: fileAge,
                });
              }
            } catch (error) {
              stats.errors++;
              logger.error('Failed to delete temp file', error, {
                file,
              });
            }
          })
        );
      }

      const duration = Date.now() - startTime;

      logger.info('Temp file cleanup completed', {
        filesDeleted: stats.filesDeleted,
        totalSize: stats.totalSize,
        errors: stats.errors,
        duration,
      });

      return stats;
    } catch (error) {
      logger.error('Cleanup failed', error, {
        tempDir: this.tempDir,
      });
      throw error;
    }
  }

  /**
   * Limpiar un archivo específico de forma segura
   */
  async cleanupFile(filePath: string): Promise<boolean> {
    try {
      // Verificar que el archivo está en el directorio temporal
      const normalizedPath = path.normalize(filePath);
      const normalizedTempDir = path.normalize(this.tempDir);

      if (!normalizedPath.startsWith(normalizedTempDir)) {
        logger.warn('Attempted to delete file outside temp directory', {
          filePath,
          tempDir: this.tempDir,
        });
        return false;
      }

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return true; // Ya fue eliminado
      }

      await fs.promises.unlink(filePath);

      logger.info('File cleaned up', {
        filePath,
      });

      return true;
    } catch (error) {
      logger.error('Failed to cleanup file', error, {
        filePath,
      });
      return false;
    }
  }

  /**
   * Limpiar todos los archivos sin importar la edad (usar con cuidado)
   */
  async cleanupAll(): Promise<CleanupStats> {
    const stats: CleanupStats = {
      filesDeleted: 0,
      totalSize: 0,
      errors: 0,
    };

    try {
      if (!fs.existsSync(this.tempDir)) {
        return stats;
      }

      logger.warn('Cleaning up ALL temp files', {
        tempDir: this.tempDir,
      });

      const files = await fs.promises.readdir(this.tempDir);

      for (const file of files) {
        try {
          const filePath = path.join(this.tempDir, file);
          const fileStats = await fs.promises.stat(filePath);

          if (fileStats.isFile()) {
            await fs.promises.unlink(filePath);
            stats.filesDeleted++;
            stats.totalSize += fileStats.size;
          }
        } catch (error) {
          stats.errors++;
          logger.error('Failed to delete file', error, {
            file,
          });
        }
      }

      logger.info('All temp files cleaned', stats);

      return stats;
    } catch (error) {
      logger.error('Cleanup all failed', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del directorio temporal
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldFiles: number;
    oldFilesSize: number;
  }> {
    try {
      if (!fs.existsSync(this.tempDir)) {
        return {
          totalFiles: 0,
          totalSize: 0,
          oldFiles: 0,
          oldFilesSize: 0,
        };
      }

      const files = await fs.promises.readdir(this.tempDir);
      const now = Date.now();

      let totalFiles = 0;
      let totalSize = 0;
      let oldFiles = 0;
      let oldFilesSize = 0;

      for (const file of files) {
        try {
          const filePath = path.join(this.tempDir, file);
          const fileStats = await fs.promises.stat(filePath);

          if (fileStats.isFile()) {
            totalFiles++;
            totalSize += fileStats.size;

            const fileAge = now - fileStats.mtimeMs;
            if (fileAge > this.maxAge) {
              oldFiles++;
              oldFilesSize += fileStats.size;
            }
          }
        } catch (error) {
          // Ignorar errores en archivos individuales
        }
      }

      return {
        totalFiles,
        totalSize,
        oldFiles,
        oldFilesSize,
      };
    } catch (error) {
      logger.error('Failed to get temp directory stats', error);
      throw error;
    }
  }

  /**
   * Verificar si el servicio está activo
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
let cleanupServiceInstance: TempFileCleanupService | null = null;

/**
 * Obtener la instancia singleton del servicio de limpieza
 */
export function getCleanupService(options?: CleanupOptions): TempFileCleanupService {
  if (!cleanupServiceInstance) {
    cleanupServiceInstance = new TempFileCleanupService(options);
  }
  return cleanupServiceInstance;
}
