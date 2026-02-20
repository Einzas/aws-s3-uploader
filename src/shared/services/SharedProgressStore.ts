/**
 * Store de progreso compartido entre workers de PM2 usando FileSystem
 * Solución para cluster mode donde cada worker tiene memoria aislada
 */

import * as fs from 'fs';
import * as path from 'path';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  totalSize: number;
  uploadedSize: number;
  percentage: number;
  status: 'validating' | 'uploading' | 'completed' | 'failed' | 'pending';
  currentPart?: number;
  totalParts?: number;
  speed?: number;
  estimatedTimeRemaining?: number;
  startedAt: number;
  updatedAt: number;
  error?: string;
}

class SharedProgressStore {
  private readonly storePath: string;
  private readonly MAX_RETENTION_TIME = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Usar directorio temporal del sistema
    const tmpDir = process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';
    this.storePath = path.join(tmpDir, 'aws-s3-upload-progress.json');
    
    // Asegurar que el archivo existe
    if (!fs.existsSync(this.storePath)) {
      this.writeStore({});
    }

    // Cleanup cada minuto
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Leer el store desde el archivo
   */
  private readStore(): Record<string, UploadProgress> {
    try {
      const data = fs.readFileSync(this.storePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Si hay error, retornar objeto vacío
      return {};
    }
  }

  /**
   * Escribir el store al archivo
   */
  private writeStore(store: Record<string, UploadProgress>): void {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(store), 'utf-8');
    } catch (error) {
      console.error('Error writing progress store:', error);
    }
  }

  /**
   * Obtener progreso de un upload
   */
  get(fileId: string): UploadProgress | null {
    const store = this.readStore();
    return store[fileId] || null;
  }

  /**
   * Guardar progreso de un upload
   */
  set(fileId: string, progress: UploadProgress): void {
    const store = this.readStore();
    store[fileId] = progress;
    this.writeStore(store);
  }

  /**
   * Eliminar progreso de un upload
   */
  delete(fileId: string): void {
    const store = this.readStore();
    delete store[fileId];
    this.writeStore(store);
  }

  /**
   * Obtener todos los uploads en progreso
   */
  getAll(): UploadProgress[] {
    const store = this.readStore();
    return Object.values(store);
  }

  /**
   * Limpiar uploads antiguos
   */
  cleanup(): void {
    const store = this.readStore();
    const now = Date.now();
    let cleaned = 0;

    for (const [fileId, progress] of Object.entries(store)) {
      const age = now - progress.updatedAt;
      if (age > this.MAX_RETENTION_TIME) {
        delete store[fileId];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.writeStore(store);
      console.log(`🧹 [SHARED-STORE] Limpiados ${cleaned} registros antiguos`);
    }
  }
}

// Singleton
export const sharedProgressStore = new SharedProgressStore();
