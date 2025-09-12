// Solo registrar aliases en producción (código compilado)
if (process.env.NODE_ENV === 'production') {
  require('module-alias/register');

  const moduleAlias = require('module-alias');
  const path = require('path');

  // Registrar aliases para el código compilado en dist/
  moduleAlias.addAliases({
    '@domain': path.join(__dirname, 'domain'),
    '@application': path.join(__dirname, 'application'),
    '@infrastructure': path.join(__dirname, 'infrastructure'),
    '@presentation': path.join(__dirname, 'presentation'),
    '@shared': path.join(__dirname, 'shared'),
  });
}
