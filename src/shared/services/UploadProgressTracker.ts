/**
 * Sistema de tracking de progreso para uploads
 * Permite consultar el progreso en tiempo real de uploads en curso
 * USA FILESYSTEM PARA COMPARTIR ENTRE WORKERS DE PM2 EN CLUSTER MODE
 */

import { sharedProgressStore, UploadProgress } from './SharedProgressStore';

class UploadProgressTrackerService {
  /**
   * Iniciar tracking de un nuevo upload
   */
  startTracking(fileId: string, fileName: string, totalSize: number): void {
    console.log(`\n========================================`);
    console.log(`📊 [PROGRESS] INICIANDO TRACKING`);
    console.log(`   FileId: ${fileId}`);
    console.log(`   Archivo: ${fileName}`);
    console.log(`   Tamaño: ${this.formatBytes(totalSize)}`);
    console.log(`   Worker: ${process.pid}`);
    console.log(`========================================\n`);
    
    const progress: UploadProgress = {
      fileId,
      fileName,
      totalSize,
      uploadedSize: 0,
      percentage: 0,
      status: 'pending',
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    sharedProgressStore.set(fileId, progress);
    
    console.log(`✅ [PROGRESS] Tracking almacenado en FileSystem (worker: ${process.pid})`);
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
    const progress = sharedProgressStore.get(fileId);
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

    sharedProgressStore.set(fileId, progress);
  }

  /**
   * Marcar upload como completado
   */
  completeUpload(fileId: string): void {
    const progress = sharedProgressStore.get(fileId);
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
      
      sharedProgressStore.set(fileId, progress);
      
      // Limpiar después de 30 segundos
      setTimeout(() => this.removeProgress(fileId), 30000);
    }
  }

  /**
   * Marcar upload como fallido
   */
  failUpload(fileId: string, error: string): void {
    const progress = sharedProgressStore.get(fileId);
    if (progress) {
      progress.status = 'failed';
      progress.error = error;
      progress.updatedAt = Date.now();
      
      console.log(`❌ [PROGRESS] Upload fallido: ${progress.fileName} - ${error}`);
      
      sharedProgressStore.set(fileId, progress);
      
      // Limpiar después de 1 minuto
      setTimeout(() => this.removeProgress(fileId), 60000);
    }
  }

  /**
   * Obtener progreso de un upload específico
   */
  getProgress(fileId: string): UploadProgress | null {
    return sharedProgressStore.get(fileId);
  }

  /**
   * Obtener todos los uploads en progreso
   */
  getAllProgress(): UploadProgress[] {
    return sharedProgressStore.getAll();
  }

  /**
   * Eliminar progreso de un upload
   */
  removeProgress(fileId: string): void {
    sharedProgressStore.delete(fileId);
  }

  /**
   * Limpiar uploads antiguos
   */
  cleanup(): void {
    sharedProgressStore.cleanup();
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
