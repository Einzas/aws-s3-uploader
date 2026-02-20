# 📊 Sistema de Progreso de Uploads en Tiempo Real

## ✅ Lo que se implementó

### 1. **Logs Visibles en PM2**
Ahora puedes ver TODOS los logs cuando ejecutas:
```bash
pm2 logs aws-s3-prod
```

Los logs muestran:
- ✅ Inicio de uploads
- ✅ Progreso en tiempo real (porcentaje, velocidad, ETA)
- ✅ Partes subidas en multipart uploads
- ✅ Finalización o errores

### 2. **Sistema de Progreso en Tiempo Real**
Se agregaron endpoints para consultar el progreso de uploads:
- `GET /api/files/progress/:fileId` - Ver progreso de un archivo específico
- `GET /api/files/progress` - Ver todos los uploads en progreso

---

## 🚀 Cómo Usar

### Ver Logs en PM2

```bash
# Ver logs en tiempo real
pm2 logs aws-s3-prod

# Verás algo como:
# 📊 [PROGRESS] Iniciando tracking de upload: video.mp4 (524.29 MB)
# 📊 [PROGRESS] video.mp4: 15% (78.64 MB/524.29 MB) - 5.2 MB/s - Parte 10/65 - ETA: 1m 25s
# 📊 [PROGRESS] video.mp4: 30% (157.29 MB/524.29 MB) - 5.5 MB/s - Parte 20/65 - ETA: 1m 7s
# 📊 [PROGRESS] video.mp4: 50% (262.14 MB/524.29 MB) - 5.3 MB/s - Parte 33/65 - ETA: 49s
# 📊 [PROGRESS] video.mp4: 75% (393.22 MB/524.29 MB) - 5.4 MB/s - Parte 50/65 - ETA: 24s
# ✅ [PROGRESS] Upload completado: video.mp4 - 524.29 MB en 1m 38s (5.36 MB/s)
```

---

## 📡 Endpoints de Progreso

### 1. Consultar Progreso de un Archivo

**Request:**
```http
GET /api/files/progress/:fileId
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "data": {
    "fileId": "abc-123-xyz",
    "fileName": "video-grande.mp4",
    "status": "uploading",
    "percentage": 45,
    "uploadedSize": 235929600,
    "totalSize": 524288000,
    "currentPart": 29,
    "totalParts": 65,
    "speed": 5242880,
    "estimatedTimeRemaining": 55.2,
    "startedAt": "2026-02-20T10:30:00.000Z",
    "updatedAt": "2026-02-20T10:31:15.000Z"
  }
}
```

**Estados posibles:**
- `pending` - En cola
- `validating` - Validando archivo
- `uploading` - Subiendo
- `completed` - Completado
- `failed` - Fallido

**Respuesta cuando no se encuentra:**
```json
{
  "success": false,
  "error": {
    "code": "PROGRESS_NOT_FOUND",
    "message": "No se encontró progreso para este archivo..."
  }
}
```

### 2. Ver Todos los Uploads en Progreso

**Request:**
```http
GET /api/files/progress
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "uploads": [
      {
        "fileId": "abc-123",
        "fileName": "video1.mp4",
        "status": "uploading",
        "percentage": 45,
        "uploadedSize": 235929600,
        "totalSize": 524288000,
        "speed": 5242880,
        "estimatedTimeRemaining": 55.2,
        ...
      },
      {
        "fileId": "xyz-789",
        "fileName": "video2.mp4",
        "status": "uploading",
        "percentage": 80,
        ...
      }
    ],
    "total": 2
  }
}
```

---

## 💻 Integración con Frontend

### Opción 1: Polling (Recomendado para simplicidad)

```javascript
// 1. Subir archivo y obtener fileId
const formData = new FormData();
formData.append('file', videoFile);

const uploadResponse = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData,
});

const { data } = await uploadResponse.json();
const fileId = data.fileId;

// 2. Consultar progreso cada 1 segundo
const progressInterval = setInterval(async () => {
  const progressResponse = await fetch(`/api/files/progress/${fileId}`);
  const progressData = await progressResponse.json();
  
  if (progressData.success) {
    const progress = progressData.data;
    
    // Actualizar UI
    console.log(`Progreso: ${progress.percentage}%`);
    console.log(`Velocidad: ${formatSpeed(progress.speed)}`);
    console.log(`Tiempo restante: ${formatTime(progress.estimatedTimeRemaining)}`);
    
    // Si completó o falló, detener polling
    if (progress.status === 'completed' || progress.status === 'failed') {
      clearInterval(progressInterval);
      
      if (progress.status === 'completed') {
        console.log('¡Upload completado!');
      } else {
        console.error('Upload falló:', progress.error);
      }
    }
  } else {
    // Ya no existe el progreso (puede haber terminado hace rato)
    clearInterval(progressInterval);
  }
}, 1000);

function formatSpeed(bytesPerSecond) {
  return `${(bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}
```

### Opción 2: React Component con Hook

```jsx
import { useState, useEffect } from 'react';

function VideoUploader() {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Hook para consultar progreso
  useEffect(() => {
    if (!fileId || !isUploading) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/files/progress/${fileId}`);
        const data = await response.json();

        if (data.success) {
          setProgress(data.data);

          // Detener si completó o falló
          if (data.data.status === 'completed' || data.data.status === 'failed') {
            setIsUploading(false);
            clearInterval(interval);
          }
        } else {
          // Ya no existe el progreso
          setIsUploading(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error consultando progreso:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fileId, isUploading]);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setFileId(data.data.fileId);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      
      <button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? 'Subiendo...' : 'Subir Video'}
      </button>

      {progress && (
        <div className="progress-info">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          
          <p>Progreso: {progress.percentage}%</p>
          <p>Velocidad: {formatSpeed(progress.speed)}</p>
          <p>Tiempo restante: {formatTime(progress.estimatedTimeRemaining)}</p>
          
          {progress.totalParts && (
            <p>Parte {progress.currentPart} de {progress.totalParts}</p>
          )}
          
          <p>Estado: {getStatusText(progress.status)}</p>
        </div>
      )}
    </div>
  );
}

function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond) return 'Calculando...';
  return `${(bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
}

function formatTime(seconds) {
  if (!seconds) return 'Calculando...';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

function getStatusText(status) {
  const statusMap = {
    pending: 'En cola',
    validating: 'Validando',
    uploading: 'Subiendo',
    completed: 'Completado',
    failed: 'Fallido',
  };
  return statusMap[status] || status;
}

export default VideoUploader;
```

### Opción 3: Vue Component

```vue
<template>
  <div class="video-uploader">
    <input 
      type="file" 
      accept="video/*" 
      @change="handleFileSelect"
      :disabled="isUploading"
    />
    
    <button @click="handleUpload" :disabled="!file || isUploading">
      {{ isUploading ? 'Subiendo...' : 'Subir Video' }}
    </button>

    <div v-if="progress" class="progress-info">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: progress.percentage + '%' }"
        ></div>
      </div>
      
      <p>{{ progress.percentage }}%</p>
      <p>{{ formatSpeed(progress.speed) }}</p>
      <p>Tiempo restante: {{ formatTime(progress.estimatedTimeRemaining) }}</p>
      <p v-if="progress.totalParts">
        Parte {{ progress.currentPart }} de {{ progress.totalParts }}
      </p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      file: null,
      fileId: null,
      progress: null,
      isUploading: false,
      progressInterval: null,
    };
  },
  methods: {
    handleFileSelect(event) {
      this.file = event.target.files[0];
    },
    
    async handleUpload() {
      if (!this.file) return;
      
      this.isUploading = true;
      
      const formData = new FormData();
      formData.append('file', this.file);
      
      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        this.fileId = data.data.fileId;
        
        // Iniciar polling de progreso
        this.startProgressPolling();
      } catch (error) {
        console.error('Error:', error);
        this.isUploading = false;
      }
    },
    
    startProgressPolling() {
      this.progressInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/files/progress/${this.fileId}`);
          const data = await response.json();
          
          if (data.success) {
            this.progress = data.data;
            
            if (data.data.status === 'completed' || data.data.status === 'failed') {
              this.stopProgressPolling();
              this.isUploading = false;
            }
          } else {
            this.stopProgressPolling();
            this.isUploading = false;
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }, 1000);
    },
    
    stopProgressPolling() {
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
    },
    
    formatSpeed(bytesPerSecond) {
      if (!bytesPerSecond) return 'Calculando...';
      return `${(bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
    },
    
    formatTime(seconds) {
      if (!seconds) return 'Calculando...';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    },
  },
  beforeUnmount() {
    this.stopProgressPolling();
  },
};
</script>
```

---

## 🔍 Información que Obtienes

Para cada upload activo, obtienes:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fileId` | string | ID único del archivo |
| `fileName` | string | Nombre del archivo |
| `status` | string | Estado actual (`pending`, `validating`, `uploading`, `completed`, `failed`) |
| `percentage` | number | Porcentaje completado (0-100) |
| `uploadedSize` | number | Bytes subidos |
| `totalSize` | number | Tamaño total en bytes |
| `currentPart` | number | Parte actual (multipart) |
| `totalParts` | number | Total de partes (multipart) |
| `speed` | number | Velocidad en bytes/segundo |
| `estimatedTimeRemaining` | number | Tiempo restante en segundos |
| `startedAt` | string | Timestamp de inicio (ISO 8601) |
| `updatedAt` | string | Último update (ISO 8601) |

---

## 🎬 Ejemplo de Logs en PM2

Al iniciar el servidor y subir un video, verás:

```
2026-02-20 10:30:00 info [APPLICATION]: Server is running on port 3100
2026-02-20 10:30:00 info [APPLICATION]: Temp file cleanup service started

# Cuando alguien sube un video:
2026-02-20 10:30:45 info [UPLOAD]: File entity created
📊 [PROGRESS] Iniciando tracking de upload: mi-video.mp4 (524.29 MB)
2026-02-20 10:30:45 info [S3]: Starting S3 multipart upload from file path
📊 [PROGRESS] mi-video.mp4: 0% (0 B/524.29 MB) - 0 B/s - Parte 0/65
📊 [PROGRESS] mi-video.mp4: 5% (26.21 MB/524.29 MB) - 5.1 MB/s - Parte 3/65 - ETA: 1m 38s
📊 [PROGRESS] mi-video.mp4: 15% (78.64 MB/524.29 MB) - 5.2 MB/s - Parte 10/65 - ETA: 1m 25s
📊 [PROGRESS] mi-video.mp4: 30% (157.29 MB/524.29 MB) - 5.5 MB/s - Parte 20/65 - ETA: 1m 7s
📊 [PROGRESS] mi-video.mp4: 50% (262.14 MB/524.29 MB) - 5.3 MB/s - Parte 33/65 - ETA: 49s
📊 [PROGRESS] mi-video.mp4: 75% (393.22 MB/524.29 MB) - 5.4 MB/s - Parte 50/65 - ETA: 24s
📊 [PROGRESS] mi-video.mp4: 95% (498.07 MB/524.29 MB) - 5.3 MB/s - Parte 62/65 - ETA: 5s
✅ [PROGRESS] Upload completado: mi-video.mp4 - 524.29 MB en 1m 38s (5.36 MB/s)
2026-02-20 10:32:23 info [UPLOAD]: File upload completed successfully
```

---

## 📦 Resumen de Cambios

### Archivos Modificados:
- ✏️ `src/shared/services/Logger.ts` - Logs siempre a consola (para PM2)
- ✏️ `src/application/use-cases/upload-file/UploadFileUseCase.ts` - Integración con tracker
- ✏️ `src/infrastructure/storage/S3FileStorageService.ts` - Reporta progreso durante upload
- ✏️ `src/presentation/controllers/FileController.ts` - Nuevos endpoints de progreso

### Archivos Nuevos:
- ✨ `src/shared/services/UploadProgressTracker.ts` - Sistema de tracking

---

## 🎯 Próximos Pasos

1. **Compilar**: `npm run build`
2. **Reiniciar PM2**: `pm2 restart aws-s3-prod`
3. **Ver logs**: `pm2 logs aws-s3-prod`
4. **Subir un video** y ver el progreso en tiempo real
5. **Integrar en tu frontend** usando los ejemplos de código

---

¡Ahora tienes visibilidad completa de tus uploads! 🎉
