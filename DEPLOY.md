# 🚀 Despliegue a Producción con PM2

## 1. Instalación de PM2 (en el servidor)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Verificar instalación
pm2 --version
```

## 2. Preparación del proyecto

### Instalar `module-alias` para resolver paths:

```bash
npm install module-alias
```

### Crear archivo de aliases (obligatorio):

```javascript
// src/module-alias.ts
import 'module-alias/register';
import * as moduleAlias from 'module-alias';
import * as path from 'path';

moduleAlias.addAliases({
  '@domain': path.join(__dirname, 'domain'),
  '@application': path.join(__dirname, 'application'),
  '@infrastructure': path.join(__dirname, 'infrastructure'),
  '@presentation': path.join(__dirname, 'presentation'),
  '@shared': path.join(__dirname, 'shared'),
});
```

### Actualizar `src/index.ts`:

```typescript
// IMPORTANTE: Importar PRIMERO los aliases
import './module-alias';

import { app } from './app';
import { config, validateConfig } from '@shared/config';

// ... resto del código
```

## 3. Scripts de producción (agregar al package.json)

```json
{
  "scripts": {
    "deploy": "npm run build && pm2 start ecosystem.production.js --env production",
    "pm2:start": "pm2 start ecosystem.production.js --env production",
    "pm2:stop": "pm2 stop aws-s3-uploader-prod",
    "pm2:restart": "pm2 restart aws-s3-uploader-prod",
    "pm2:reload": "pm2 reload aws-s3-uploader-prod",
    "pm2:logs": "pm2 logs aws-s3-uploader-prod",
    "pm2:status": "pm2 status",
    "pm2:delete": "pm2 delete aws-s3-uploader-prod"
  }
}
```

## 4. Despliegue paso a paso

```bash
# 1. Compilar el proyecto
npm run build

# 2. Crear directorio de logs
mkdir -p logs

# 3. Configurar variables de entorno de producción
cp .env.production .env
# Editar .env con valores reales de producción

# 4. Instalar dependencias de producción
npm install --production

# 5. Iniciar con PM2
npm run deploy

# 6. Guardar configuración PM2
pm2 save

# 7. Configurar auto-inicio en reinicio del servidor
pm2 startup
# Ejecutar el comando que PM2 te muestre
```

## 5. Variables de entorno requeridas

Crear `.env` en producción con:

```bash
# AWS Configuration (OBLIGATORIO)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu-access-key-real
AWS_SECRET_ACCESS_KEY=tu-secret-key-real
S3_BUCKET_NAME=tu-bucket-de-produccion

# Server Configuration
PORT=3000
NODE_ENV=production

# Security (CAMBIAR POR VALORES SEGUROS)
JWT_SECRET=tu-jwt-secret-super-seguro-de-64-caracteres-minimo
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
```

## 6. Comandos útiles en producción

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs aws-s3-uploader-prod

# Reiniciar sin downtime
pm2 reload aws-s3-uploader-prod

# Monitoreo
pm2 monit

# Información detallada
pm2 show aws-s3-uploader-prod
```

## 7. Nginx (recomendado para producción)

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 8. Seguridad adicional

```bash
# Crear usuario no-root para la aplicación
sudo useradd -m -s /bin/bash nodeuser
sudo chown -R nodeuser:nodeuser /var/www/aws-s3-uploader

# Configurar firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## ⚠️ IMPORTANTE

1. **NUNCA** uses las credenciales AWS del .env de desarrollo en producción
2. **CAMBIA** el JWT_SECRET por uno único y seguro
3. **CONFIGURA** un bucket S3 dedicado para producción
4. **USA** Nginx como proxy reverso
5. **ACTIVA** HTTPS con certificados SSL (Let's Encrypt)

## 📦 Checklist de despliegue

- [ ] PM2 instalado globalmente
- [ ] `module-alias` instalado en el proyecto
- [ ] Archivo `module-alias.ts` creado
- [ ] `index.ts` actualizado con import de aliases
- [ ] `.env` configurado con valores de producción
- [ ] Proyecto compilado (`npm run build`)
- [ ] Directorio `logs` creado
- [ ] PM2 iniciado y configuración guardada
- [ ] Auto-startup configurado
- [ ] Nginx configurado (opcional pero recomendado)
