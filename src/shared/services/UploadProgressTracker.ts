/**
 * Sistema de tracking de progreso para uploads
 * Permite consultar el progreso en tiempo real de uploads en curso
 */

export interface UploadProgress {
  fileId: string;
  fileName: string;
  totalSize: number;
  uploadedSize: number;
  percentage: number;
  status: 'validating' | 'uploading' | 'completed' | 'failed' | 'pending';
  currentPart?: number;
  totalParts?: number;
  speed?: number; // bytes por segundo
  estimatedTimeRemaining?: number; // segundos
  startedAt: number;
  updatedAt: number;
  error?: string;
}

class UploadProgressTrackerService {
  private progressMap: Map<string, UploadProgress> = new Map();
  private readonly MAX_RETENTION_TIME = 5 * 60 * 1000; // 5 minutos

  /**
   * Iniciar tracking de un nuevo upload
   */
  startTracking(fileId: string, fileName: string, totalSize: number): void {
    console.log(`📊 [PROGRESS] Iniciando tracking de upload: ${fileName} (${this.formatBytes(totalSize)})`);
    
    this.progressMap.set(fileId, {
      fileId,
      fileName,
      totalSize,
      uploadedSize: 0,
      percentage: 0,
      status: 'pending',
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /**
   * Actualizar progreso del upload
   */
  updateProgress(
    fileId: string,
    uploadedSize: number,
    status?: UploadProgress['status'],
    currentPart?: number,
    totalParts?: number
  ): void {
    const progress = this.progressMap.get(fileId);
    if (!progress) {
      return;
    }

    const now = Date.now();
    const elapsedTime = (now - progress.startedAt) / 1000; // segundos
    const speed = uploadedSize / elapsedTime; // bytes por segundo
    const remainingBytes = progress.totalSize - uploadedSize;
    const estimatedTimeRemaining = speed > 0 ? remainingBytes / speed : 0;

    const percentage = Math.min(
      Math.round((uploadedSize / progress.totalSize) * 100),
      100
    );

    progress.uploadedSize = uploadedSize;
    progress.percentage = percentage;
    progress.speed = speed;
    progress.estimatedTimeRemaining = estimatedTimeRemaining;
    progress.updatedAt = now;
    
    if (status) {
      progress.status = status;
    }
    
    if (currentPart !== undefined && totalParts !== undefined) {
      progress.currentPart = currentPart;
      progress.totalParts = totalParts;
    }

    // Log detallado para PM2
    const speedStr = this.formatSpeed(speed);
    const etaStr = this.formatTime(estimatedTimeRemaining);
    const uploadedStr = this.formatBytes(uploadedSize);
    const totalStr = this.formatBytes(progress.totalSize);
    
    let logMsg = `📊 [PROGRESS] ${progress.fileName}: ${percentage}% (${uploadedStr}/${totalStr}) - ${speedStr}`;
    
    if (currentPart && totalParts) {
      logMsg += ` - Parte ${currentPart}/${totalParts}`;
    }
    
    if (estimatedTimeRemaining > 0) {
      logMsg += ` - ETA: ${etaStr}`;
    }
    
    console.log(logMsg);

    this.progressMap.set(fileId, progress);
  }

  /**
   * Marcar upload como completado
   */
  completeUpload(fileId: string): void {
    const progress = this.progressMap.get(fileId);
    if (progress) {
      progress.status = 'completed';
      progress.percentage = 100;
      progress.uploadedSize = progress.totalSize;
      progress.updatedAt = Date.now();
      
      const duration = (progress.updatedAt - progress.startedAt) / 1000;
      const avgSpeed = progress.totalSize / duration;
      
      console.log(
        `✅ [PROGRESS] Upload completado: ${progress.fileName} - ` +
        `${this.formatBytes(progress.totalSize)} en ${this.formatTime(duration)} ` +
        `(${this.formatSpeed(avgSpeed)})`
      );
      
      this.progressMap.set(fileId, progress);
      
      // Limpiar después de 30 segundos
      setTimeout(() => this.removeProgress(fileId), 30000);
    }
  }

  /**
   * Marcar upload como fallido
   */
  failUpload(fileId: string, error: string): void {
    const progress = this.progressMap.get(fileId);
    if (progress) {
      progress.status = 'failed';
      progress.error = error;
      progress.updatedAt = Date.now();
      
      console.log(`❌ [PROGRESS] Upload fallido: ${progress.fileName} - ${error}`);
      
      this.progressMap.set(fileId, progress);
      
      // Limpiar después de 1 minuto
      setTimeout(() => this.removeProgress(fileId), 60000);
    }
  }

  /**
   * Obtener progreso de un upload específico
   */
  getProgress(fileId: string): UploadProgress | null {
    return this.progressMap.get(fileId) || null;
  }

  /**
   * Obtener todos los uploads en progreso
   */
  getAllProgress(): UploadProgress[] {
    return Array.from(this.progressMap.values());
  }

  /**
   * Eliminar progreso de un upload
   */
  removeProgress(fileId: string): void {
    this.progressMap.delete(fileId);
  }

  /**
   * Limpiar uploads antiguos
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [fileId, progress] of this.progressMap.entries()) {
      const age = now - progress.updatedAt;
      if (age > this.MAX_RETENTION_TIME) {
        this.progressMap.delete(fileId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [PROGRESS] Limpiados ${cleaned} registros de progreso antiguos`);
    }
  }

  /**
   * Formatear bytes a formato legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Formatear velocidad
   */
  private formatSpeed(bytesPerSecond: number): string {
    return this.formatBytes(bytesPerSecond) + '/s';
  }

  /**
   * Formatear tiempo
   */
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }
}

// Singleton
export const uploadProgressTracker = new UploadProgressTrackerService();

// Limpiar cada minuto
setInterval(() => {
  uploadProgressTracker.cleanup();
}, 60000);
