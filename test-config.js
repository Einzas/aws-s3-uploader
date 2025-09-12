const { config } = require('./dist/shared/config');
const {
  FileCategoryHandler,
} = require('./dist/domain/value-objects/FileCategory');

console.log('=== CONFIGURACIÓN DE MIME TYPES ===');
console.log('Tipos permitidos en config:', config.upload.allowedFileTypes);
console.log('Total de tipos:', config.upload.allowedFileTypes.length);
console.log(
  '¿Incluye video/mp4?',
  config.upload.allowedFileTypes.includes('video/mp4')
);
console.log('\n=== TIPOS DE FileCategoryHandler ===');
const allTypes = FileCategoryHandler.getAllAllowedMimeTypes();
console.log('Todos los tipos de categorías:', allTypes);
console.log('Total:', allTypes.length);
console.log('¿Incluye video/mp4?', allTypes.includes('video/mp4'));
