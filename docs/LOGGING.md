# Sistema de Logging

## Descripción General

El sistema de logging está implementado usando **Winston** con logs rotativos diarios mediante `winston-daily-rotate-file`. Los logs se categorizan y almacenan en archivos separados para facilitar el análisis y debugging.

## Estructura de Archivos de Log

Los logs se almacenan en el directorio `logs/` en la raíz del proyecto:

```
logs/
├── combined-YYYY-MM-DD.log      # Todos los logs combinados
├── error-YYYY-MM-DD.log         # Solo errores
├── http-YYYY-MM-DD.log          # Requests HTTP
├── s3-YYYY-MM-DD.log            # Operaciones de S3
├── security-YYYY-MM-DD.log      # Eventos de seguridad
└── performance-YYYY-MM-DD.log   # Métricas de rendimiento
```

## Categorías de Logs

### 1. **APPLICATION**
Logs generales de la aplicación (inicio, configuración, etc.)

```typescript
logger.info('Server started', {
  category: LogCategory.APPLICATION,
  port: 3000,
});
```

### 2. **HTTP**
Logs de requests y responses HTTP

```typescript
logger.http('Request completed', {
  method: 'POST',
  path: '/api/upload',
  statusCode: 200,
  duration: 125,
});
```

### 3. **S3**
Operaciones con AWS S3 (uploads, deletes, presigned URLs)

```typescript
logger.s3('S3 upload successful', {
  key: 'images/file.jpg',
  bucket: 'my-bucket',
  duration: 1500,
});
```

### 4. **UPLOAD**
Proceso completo de upload de archivos

```typescript
logger.upload('File upload completed', {
  fileId: 'uuid-123',
  fileName: 'image.jpg',
  fileSize: 1024000,
});
```

### 5. **VALIDATION**
Validaciones de archivos (tamaño, tipo, firmas)

```typescript
logger.validation('File validation failed', {
  fileName: 'test.jpg',
  errors: ['Invalid file signature'],
});
```

### 6. **SECURITY**
Eventos de seguridad (rate limits, accesos denegados)

```typescript
logger.security('Rate limit exceeded', {
  ip: '192.168.1.1',
  path: '/api/upload',
});
```

### 7. **PERFORMANCE**
Métricas de rendimiento y operaciones lentas

```typescript
logger.performance('Slow request detected', {
  method: 'POST',
  path: '/api/upload',
  duration: 5000,
});
```

### 8. **ERROR**
Errores generales de la aplicación

```typescript
logger.error('Upload failed', error, {
  fileId: 'uuid-123',
  errorStack: error.stack,
});
```

## Uso del Logger

### Importación

```typescript
import { logger, LogCategory } from '@shared/services';
```

### Métodos Disponibles

#### Logs por Nivel

```typescript
// Info
logger.info('Message', context);

// Debug (solo en desarrollo)
logger.debug('Debug message', context);

// Warning
logger.warn('Warning message', context);

// Error
logger.error('Error message', error, context);
```

#### Logs Especializados

```typescript
// HTTP
logger.http('HTTP message', context);

// S3
logger.s3('S3 operation', context);

// Upload
logger.upload('Upload event', context);

// Validation
logger.validation('Validation result', context);

// Security
logger.security('Security event', context);

// Performance
logger.performance('Performance metric', context);
```

#### Medición de Performance

```typescript
// Iniciar operación
const startTime = logger.startOperation('UploadFile', {
  category: LogCategory.UPLOAD,
  fileName: 'test.jpg',
});

// ... realizar operación ...

// Finalizar operación (registra duración automáticamente)
logger.endOperation('UploadFile', startTime, {
  category: LogCategory.UPLOAD,
  success: true,
});
```

## Configuración de Retención

- **Error logs**: 30 días
- **Security logs**: 90 días (mayor retención por auditoría)
- **Combined logs**: 14 días
- **HTTP logs**: 7 días
- **S3 logs**: 14 días
- **Performance logs**: 7 días

## Rotación de Archivos

- **Rotación**: Diaria (a medianoche)
- **Tamaño máximo por archivo**: 20MB
- **Formato de fecha**: YYYY-MM-DD

## Formato de Logs

### Archivos JSON

Los logs se almacenan en formato JSON para facilitar el parsing:

```json
{
  "level": "info",
  "message": "S3 upload successful",
  "timestamp": "2024-11-14 10:30:45",
  "metadata": {
    "category": "s3",
    "key": "images/photo.jpg",
    "bucket": "my-bucket",
    "duration": 1500
  }
}
```

### Consola (Desarrollo)

En desarrollo, los logs también se muestran en consola con colores:

```
2024-11-14 10:30:45 info [s3]: S3 upload successful { key: 'images/photo.jpg', duration: 1500 }
```

## Contexto Adicional (LogContext)

Puedes agregar contexto adicional a cualquier log:

```typescript
interface LogContext {
  category?: LogCategory;
  userId?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  errorStack?: string;
  [key: string]: any; // Campos adicionales personalizados
}
```

## Ejemplos de Uso

### 1. Log de Upload Completo

```typescript
const startTime = logger.startOperation('UploadFile', {
  category: LogCategory.UPLOAD,
  fileName: request.fileName,
  fileSize: request.size,
});

try {
  // Validación
  logger.validation('Starting file validation', {
    fileName: request.fileName,
    fileSize: request.size,
  });

  // Upload a S3
  logger.s3('Starting S3 upload', {
    key: s3Key.toString(),
    fileSize: request.size,
  });

  // Success
  logger.upload('Upload completed successfully', {
    fileId: fileEntity.getId().toString(),
    url: uploadResult.url,
  });

  logger.endOperation('UploadFile', startTime, { success: true });
} catch (error) {
  logger.error('Upload failed', error, {
    category: LogCategory.UPLOAD,
    fileName: request.fileName,
  });

  logger.endOperation('UploadFile', startTime, { success: false });
}
```

### 2. Log de Request HTTP

```typescript
logger.http('Request completed', {
  method: req.method,
  path: req.originalUrl,
  statusCode: res.statusCode,
  duration: Date.now() - startTime,
  ip: req.ip,
});
```

### 3. Log de Seguridad

```typescript
logger.security('Rate limit exceeded', {
  ip: req.ip,
  path: req.path,
  method: req.method,
});
```

## Monitoreo de Logs

### Ver logs en tiempo real

```bash
# Todos los logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# Solo errores
tail -f logs/error-$(date +%Y-%m-%d).log

# Logs de S3
tail -f logs/s3-$(date +%Y-%m-%d).log
```

### Buscar en logs

```bash
# Buscar errores específicos
grep "UPLOAD_FAILED" logs/error-*.log

# Buscar por fileId
grep "uuid-123" logs/combined-*.log

# Contar requests por IP
grep "192.168.1.1" logs/http-*.log | wc -l
```

## Mejores Prácticas

1. **Siempre incluir contexto relevante**: fileId, fileName, userId, etc.
2. **Usar la categoría apropiada** para facilitar el filtrado
3. **No loggear información sensible**: contraseñas, tokens, datos personales
4. **Usar performance logs** para operaciones críticas
5. **Incluir duración** en operaciones largas
6. **Loggear errores con stack trace completo**

## Integración con PM2

Los logs de Winston son independientes de PM2. PM2 captura stdout/stderr, pero Winston escribe directamente a archivos.

Para ver logs de PM2:
```bash
pm2 logs aws-s3-uploader-prod
```

Para ver logs de Winston:
```bash
cat logs/combined-$(date +%Y-%m-%d).log
```

## Troubleshooting

### Los logs no se crean

1. Verificar permisos del directorio `logs/`
2. Verificar que las dependencias estén instaladas:
   ```bash
   npm install winston winston-daily-rotate-file
   ```

### Logs muy grandes

Ajustar `maxSize` y `maxFiles` en `src/shared/services/Logger.ts`:

```typescript
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  maxSize: '10m',  // Reducir tamaño
  maxFiles: '14d', // Reducir retención
});
```

### Performance degradado

Los logs asíncronos de Winston tienen mínimo impacto, pero si es necesario:

1. Aumentar el nivel de log en producción a `warn` o `error`
2. Reducir la frecuencia de logs de performance
3. Usar `logger.debug()` solo en desarrollo

## Configuración de Producción

En producción, ajustar el nivel de log en `src/shared/services/Logger.ts`:

```typescript
return winston.createLogger({
  level: this.isProduction ? 'info' : 'debug', // 'warn' en producción si hay problemas
  // ...
});
```

## Variables de Entorno

```bash
# Nivel de logging
LOG_LEVEL=info

# Directorio de logs personalizado
LOG_DIR=./logs

# Habilitar logs de consola en producción (no recomendado)
LOG_CONSOLE=false
```
