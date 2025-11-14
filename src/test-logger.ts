/**
 * Script de prueba del sistema de logging
 * Ejecutar con: npm run dev
 * 
 * Genera logs de ejemplo en todas las categorías
 */

import { logger, LogCategory } from './shared/services';

async function testLogging() {
  console.log('🧪 Iniciando prueba del sistema de logging...\n');

  // 1. Logs de aplicación
  logger.info('Aplicación iniciada', {
    category: LogCategory.APPLICATION,
    version: '1.0.0',
    environment: 'test',
  });

  // 2. Logs HTTP
  logger.http('Request recibido', {
    method: 'POST',
    path: '/api/upload',
    statusCode: 200,
    duration: 125,
    ip: '192.168.1.100',
  });

  // 3. Logs de S3
  logger.s3('Upload a S3 iniciado', {
    key: 'images/test-image.jpg',
    bucket: 'my-test-bucket',
    fileSize: 1024000,
  });

  logger.s3('Upload a S3 completado', {
    key: 'images/test-image.jpg',
    bucket: 'my-test-bucket',
    duration: 1500,
    etag: 'abc123',
  });

  // 4. Logs de Upload
  const uploadStart = logger.startOperation('TestUpload', {
    category: LogCategory.UPLOAD,
    fileName: 'test-image.jpg',
    fileSize: 1024000,
  });

  logger.upload('Archivo validado', {
    fileName: 'test-image.jpg',
    mimeType: 'image/jpeg',
  });

  // Simular delay
  await new Promise(resolve => setTimeout(resolve, 100));

  logger.upload('Upload completado exitosamente', {
    fileId: 'test-uuid-123',
    fileName: 'test-image.jpg',
    url: 'https://bucket.s3.amazonaws.com/images/test-image.jpg',
  });

  logger.endOperation('TestUpload', uploadStart, {
    category: LogCategory.UPLOAD,
    success: true,
  });

  // 5. Logs de Validación
  logger.validation('Validación de archivo iniciada', {
    fileName: 'test-image.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
  });

  logger.validation('Archivo validado exitosamente', {
    fileName: 'test-image.jpg',
    sanitizedName: 'test-image.jpg',
  });

  // 6. Logs de Seguridad
  logger.security('Intento de rate limit detectado', {
    ip: '192.168.1.50',
    path: '/api/upload',
    method: 'POST',
    attempts: 11,
  });

  logger.security('Acceso denegado por CORS', {
    origin: 'https://malicious-site.com',
    path: '/api/upload',
  });

  // 7. Logs de Performance
  logger.performance('Request lento detectado', {
    method: 'POST',
    path: '/api/upload',
    duration: 5500,
    statusCode: 200,
  });

  // 8. Logs de Error
  const testError = new Error('Error de prueba simulado');
  logger.error('Error durante el upload', testError, {
    category: LogCategory.UPLOAD,
    fileName: 'error-file.jpg',
    fileSize: 2048000,
  });

  // 9. Logs de Debug (solo en desarrollo)
  logger.debug('Información de debug', {
    category: LogCategory.APPLICATION,
    debugData: {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    },
  });

  // 10. Logs de Warning
  logger.warn('Advertencia: archivo grande detectado', {
    category: LogCategory.VALIDATION,
    fileName: 'large-file.mp4',
    fileSize: 50 * 1024 * 1024,
    maxSize: 10 * 1024 * 1024,
  });

  console.log('\n✅ Prueba de logging completada!');
  console.log('📁 Revisa los archivos en el directorio logs/\n');
  console.log('Archivos generados:');
  console.log('  - logs/combined-YYYY-MM-DD.log (todos los logs)');
  console.log('  - logs/error-YYYY-MM-DD.log (solo errores)');
  console.log('  - logs/http-YYYY-MM-DD.log (requests HTTP)');
  console.log('  - logs/s3-YYYY-MM-DD.log (operaciones S3)');
  console.log('  - logs/security-YYYY-MM-DD.log (seguridad)');
  console.log('  - logs/performance-YYYY-MM-DD.log (rendimiento)\n');
}

// Ejecutar test si se ejecuta directamente
if (require.main === module) {
  testLogging()
    .then(() => {
      console.log('✨ Test finalizado con éxito\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el test:', error);
      process.exit(1);
    });
}

export { testLogging };
