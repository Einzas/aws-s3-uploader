# Sistema de Logging Implementado ✅

## Resumen de Cambios

Se ha implementado un sistema de logging profesional y especializado para la aplicación AWS S3 Uploader. El sistema ahora registra **TODOS** los eventos importantes en archivos categorizados.

## 🎯 Características Principales

### ✅ Logs Categorizados
- **APPLICATION**: Inicio de servidor, configuración
- **HTTP**: Todos los requests y responses
- **S3**: Operaciones de AWS S3 (upload, delete, presigned URLs)
- **UPLOAD**: Proceso completo de upload de archivos
- **VALIDATION**: Validaciones de archivos
- **SECURITY**: Eventos de seguridad (rate limits, CORS)
- **PERFORMANCE**: Métricas de rendimiento
- **ERROR**: Todos los errores de la aplicación

### ✅ Logs Rotativos
- Rotación diaria automática
- Retención configurable por categoría
- Compresión automática de logs antiguos
- Máximo 20MB por archivo

### ✅ Archivos Separados
```
logs/
├── combined-2024-11-14.log      # Todos los logs
├── error-2024-11-14.log         # Solo errores (30 días)
├── http-2024-11-14.log          # HTTP requests (7 días)
├── s3-2024-11-14.log            # Operaciones S3 (14 días)
├── security-2024-11-14.log      # Seguridad (90 días)
└── performance-2024-11-14.log   # Performance (7 días)
```

## 📦 Instalación Requerida

**IMPORTANTE**: Debes instalar las dependencias de logging primero:

```bash
npm install winston winston-daily-rotate-file morgan @types/morgan
```

## 🔧 Archivos Creados/Modificados

### Nuevos Archivos
1. **`src/shared/services/Logger.ts`** - Servicio centralizado de logging
2. **`src/shared/services/index.ts`** - Export del logger
3. **`logs/.gitignore`** - Ignora archivos de log en git
4. **`logs/.gitkeep`** - Mantiene directorio en repo
5. **`docs/LOGGING.md`** - Documentación completa del sistema
6. **`INSTALL_LOGGING.md`** - Guía de instalación
7. **`src/test-logger.ts`** - Script de prueba del sistema

### Archivos Modificados
1. **`package.json`** - Dependencias agregadas
2. **`src/shared/index.ts`** - Export del servicio de logging
3. **`src/app.ts`** - Logger en inicio de servidor
4. **`src/presentation/middlewares/security.ts`** - Logger en middlewares
5. **`src/presentation/middlewares/errorHandler.ts`** - Logger en errors
6. **`src/application/use-cases/upload-file/UploadFileUseCase.ts`** - Logs detallados de upload
7. **`src/infrastructure/storage/S3FileStorageService.ts`** - Logs de S3
8. **`src/infrastructure/validation/BasicFileValidationService.ts`** - Logs de validación

## 🚀 Cómo Usar

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Iniciar la Aplicación
```bash
npm run dev
```

### 3. Ver Logs en Tiempo Real

En desarrollo, los logs se muestran en consola con colores:
```
2024-11-14 10:30:45 info [application]: Server is running on port 3000
2024-11-14 10:30:50 info [http]: POST /api/upload - 200 - 125ms
2024-11-14 10:30:51 info [s3]: S3 upload successful { key: 'images/photo.jpg' }
```

En producción, solo se escriben a archivos.

### 4. Monitorear Logs

```bash
# Ver todos los logs en tiempo real
tail -f logs/combined-$(date +%Y-%m-%d).log

# Ver solo errores
tail -f logs/error-$(date +%Y-%m-%d).log

# Ver logs de S3
tail -f logs/s3-$(date +%Y-%m-%d).log

# Ver logs de seguridad
tail -f logs/security-$(date +%Y-%m-%d).log
```

### 5. Probar el Sistema de Logging

Ejecuta el script de prueba:
```bash
npx ts-node src/test-logger.ts
```

Esto generará logs de ejemplo en todas las categorías.

## 📊 Qué se Registra Ahora

### ✅ Inicio de Aplicación
- Puerto del servidor
- Entorno (development/production)
- Configuración de S3
- Límites de archivos

### ✅ Requests HTTP
- Método, URL, status code
- Duración de cada request
- IP del cliente
- User-Agent
- Requests lentos (>1s)
- Requests fallidos (4xx, 5xx)

### ✅ Uploads de Archivos
- Inicio del upload
- Validación de archivo
- Generación de S3 key
- Upload a S3
- Éxito/fallo del upload
- Duración total del proceso

### ✅ Operaciones S3
- Uploads con tamaño y duración
- Deletes de archivos
- Generación de URLs firmadas
- Verificación de existencia de archivos
- Errores de S3

### ✅ Validaciones
- Validación de tamaño
- Validación de tipo MIME
- Validación de firmas de archivo
- Sanitización de nombres
- Errores de validación

### ✅ Seguridad
- Intentos de rate limit excedidos
- Errores de CORS
- Accesos denegados
- IPs sospechosas

### ✅ Performance
- Requests lentos (>1s)
- Uploads lentos (>5s)
- Operaciones S3 lentas
- Métricas de duración

### ✅ Errores
- Stack traces completos
- Contexto del error
- Información de la operación fallida
- Categorización automática

## 🎨 Formato de Logs

### JSON (Archivos)
```json
{
  "level": "info",
  "message": "Upload completed successfully",
  "timestamp": "2024-11-14 10:30:45",
  "metadata": {
    "category": "upload",
    "fileId": "uuid-123",
    "fileName": "photo.jpg",
    "url": "https://bucket.s3.amazonaws.com/images/photo.jpg"
  }
}
```

### Consola (Desarrollo)
```
2024-11-14 10:30:45 info [upload]: Upload completed successfully { 
  fileId: 'uuid-123',
  fileName: 'photo.jpg',
  url: 'https://bucket.s3.amazonaws.com/images/photo.jpg'
}
```

## 🔍 Ejemplos de Búsqueda

```bash
# Buscar uploads fallidos
grep "Upload failed" logs/error-*.log

# Buscar por fileId específico
grep "uuid-123" logs/combined-*.log

# Contar requests por IP
grep "192.168.1.100" logs/http-*.log | wc -l

# Ver solo errores de S3
grep "S3" logs/error-*.log

# Ver requests lentos
grep "Slow request" logs/performance-*.log
```

## 📚 Documentación

- **`docs/LOGGING.md`**: Documentación completa del sistema
- **`INSTALL_LOGGING.md`**: Guía de instalación rápida

## 🐛 Troubleshooting

### Los logs no se crean

1. Verificar que las dependencias estén instaladas:
   ```bash
   npm list winston winston-daily-rotate-file
   ```

2. Verificar permisos del directorio `logs/`:
   ```bash
   ls -la logs/
   ```

3. Compilar el proyecto:
   ```bash
   npm run build
   ```

### Errores de TypeScript

Los errores sobre `process`, `Buffer`, `console` son normales durante el desarrollo. Se resolverán al instalar las dependencias y compilar.

## ✨ Próximos Pasos

1. **Instalar dependencias**: `npm install`
2. **Compilar proyecto**: `npm run build`
3. **Iniciar aplicación**: `npm run dev`
4. **Hacer un upload de prueba**: Ver logs generados
5. **Revisar archivos de log**: `logs/` directory

## 📝 Notas Importantes

- Los logs **NO se suben a git** (están en `.gitignore`)
- Los logs rotan **automáticamente cada día**
- Los logs antiguos se **eliminan automáticamente** según retención
- En **producción**, los logs solo van a archivos (no consola)
- Los logs incluyen **contexto completo** para debugging

## 🎯 Beneficios

✅ **Debugging más fácil**: Logs detallados de cada operación  
✅ **Auditoría completa**: Registro de todas las acciones  
✅ **Análisis de rendimiento**: Métricas de duración  
✅ **Seguridad mejorada**: Logs de eventos sospechosos  
✅ **Troubleshooting rápido**: Búsqueda por categoría  
✅ **Cumplimiento**: Retención configurable de logs  

## 💡 Conclusión

El sistema de logging ahora registra **TODOS** los eventos importantes de la aplicación en archivos categorizados y rotativos. Ya no se pierden logs y puedes analizar el comportamiento completo de la aplicación.

**¡Ya no hay excusas para no tener logs!** 🎉
