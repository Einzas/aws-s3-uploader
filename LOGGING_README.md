# 🎯 Sistema de Logging Implementado

## ¿Por qué no se guardaban los logs antes?

El proyecto **solo usaba `console.log`**, que:
- ❌ No se guarda en archivos
- ❌ Se pierde al cerrar el terminal
- ❌ No tiene categorización
- ❌ No tiene rotación automática
- ❌ No permite búsquedas eficientes

## ✅ Solución Implementada

Ahora el proyecto tiene un **sistema de logging profesional** con Winston que:
- ✅ Guarda TODOS los logs en archivos
- ✅ Categoriza por tipo (HTTP, S3, Upload, etc.)
- ✅ Rota archivos diariamente
- ✅ Retiene logs por tiempo configurable
- ✅ Permite búsquedas y análisis

## 🚀 Instalación RÁPIDA

### Opción 1: NPM directo

```bash
npm install winston winston-daily-rotate-file morgan @types/morgan
npm run build
npm run dev
```

### Opción 2: Script automatizado

```bash
bash install-logging.sh
```

## 📊 Logs que se Guardan

### 1. **HTTP Requests** (`logs/http-*.log`)
- Todos los requests HTTP
- Método, URL, status code
- Duración de cada request
- IP del cliente

### 2. **Operaciones S3** (`logs/s3-*.log`)
- Uploads a S3
- Deletes de archivos
- Generación de URLs firmadas
- Duraciones y errores

### 3. **Uploads de Archivos** (`logs/combined-*.log`)
- Proceso completo de upload
- Validaciones
- Estados (pending, uploading, uploaded, failed)
- Metadata del archivo

### 4. **Errores** (`logs/error-*.log`)
- Stack traces completos
- Contexto del error
- Información de debugging

### 5. **Seguridad** (`logs/security-*.log`)
- Rate limits excedidos
- Errores de CORS
- Accesos denegados
- IPs sospechosas

### 6. **Performance** (`logs/performance-*.log`)
- Requests lentos (>1s)
- Uploads grandes
- Métricas de duración

## 📁 Estructura de Archivos

```
logs/
├── combined-2024-11-14.log      # Todos los logs
├── error-2024-11-14.log         # Solo errores
├── http-2024-11-14.log          # HTTP requests
├── s3-2024-11-14.log            # Operaciones S3
├── security-2024-11-14.log      # Eventos de seguridad
└── performance-2024-11-14.log   # Métricas de rendimiento
```

## 🔍 Ejemplos de Uso

### Ver logs en tiempo real

```bash
# Todos los logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# Solo errores
tail -f logs/error-$(date +%Y-%m-%d).log

# Solo HTTP
tail -f logs/http-$(date +%Y-%m-%d).log
```

### Buscar en logs

```bash
# Buscar uploads fallidos
grep "Upload failed" logs/error-*.log

# Buscar por archivo específico
grep "myfile.jpg" logs/combined-*.log

# Contar requests de una IP
grep "192.168.1.100" logs/http-*.log | wc -l
```

### Analizar performance

```bash
# Ver requests lentos
grep "Slow request" logs/performance-*.log

# Ver uploads grandes
grep "duration" logs/s3-*.log | sort -n
```

## 📚 Documentación Completa

- **[LOGGING_SUMMARY.md](./LOGGING_SUMMARY.md)**: Resumen completo de cambios
- **[docs/LOGGING.md](./docs/LOGGING.md)**: Documentación técnica detallada
- **[INSTALL_LOGGING.md](./INSTALL_LOGGING.md)**: Guía de instalación

## 🎨 Formato de Logs

### En Archivos (JSON)
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

### En Consola (Desarrollo)
```
2024-11-14 10:30:45 info [upload]: Upload completed successfully
```

## 🔧 Archivos Modificados

### Nuevo Código
- `src/shared/services/Logger.ts` - Servicio de logging
- `src/test-logger.ts` - Script de prueba

### Código Actualizado
- `src/app.ts` - Logger en inicio
- `src/presentation/middlewares/security.ts` - Logger en middlewares
- `src/presentation/middlewares/errorHandler.ts` - Logger en errores
- `src/application/use-cases/upload-file/UploadFileUseCase.ts` - Logs de upload
- `src/infrastructure/storage/S3FileStorageService.ts` - Logs de S3
- `src/infrastructure/validation/BasicFileValidationService.ts` - Logs de validación

## ⚙️ Configuración

### Retención de Logs
- **Errores**: 30 días
- **Seguridad**: 90 días
- **Combinados**: 14 días
- **HTTP**: 7 días
- **S3**: 14 días
- **Performance**: 7 días

### Rotación
- **Frecuencia**: Diaria (medianoche)
- **Tamaño máximo**: 20MB por archivo
- **Compresión**: Automática

## 💡 Ventajas

### Antes (solo console.log)
```typescript
console.log('Upload started'); // ❌ Se pierde
```

### Ahora (Winston Logger)
```typescript
logger.upload('Upload started', {
  fileId: '123',
  fileName: 'photo.jpg',
  fileSize: 1024000
});
// ✅ Se guarda en logs/combined-*.log
// ✅ Se guarda en logs/s3-*.log
// ✅ Incluye timestamp
// ✅ Incluye contexto
// ✅ Se puede buscar después
```

## 🐛 Troubleshooting

### "Cannot find module 'winston'"
```bash
npm install winston winston-daily-rotate-file morgan @types/morgan
```

### Los logs no aparecen
1. Verificar que la app esté corriendo
2. Verificar permisos del directorio `logs/`
3. Revisar que las dependencias estén instaladas

### Logs muy grandes
Ajustar retención en `src/shared/services/Logger.ts`

## 📞 Soporte

Si tienes problemas:
1. Lee `docs/LOGGING.md`
2. Verifica instalación: `npm list winston`
3. Revisa errores: `npm run build`

## ✨ Próximos Pasos

1. **Instalar dependencias**: `npm install`
2. **Compilar**: `npm run build`
3. **Iniciar app**: `npm run dev`
4. **Ver logs**: `tail -f logs/combined-*.log`
5. **Hacer upload de prueba**: Ver logs generados

---

## 🎉 ¡Listo!

Ahora **TODOS los logs se guardan** en archivos y puedes:
- ✅ Analizar uploads fallidos
- ✅ Debuggear problemas
- ✅ Auditar accesos
- ✅ Medir performance
- ✅ Buscar por archivo/usuario/IP
- ✅ Mantener histórico

**¡Ya no se pierde ningún log!** 🎊
