# 🎯 Resumen: Solución para 502 Bad Gateway con Archivos >1GB

## 🔴 Problema Identificado

Tu aplicación funcionaba bien con archivos <1GB pero daba **502 Bad Gateway** con archivos más grandes.

### Causas Principales:

1. **Multer usando `memoryStorage()`** - Cargaba todo el archivo en RAM
2. **PM2 `max_memory_restart: '1G'`** - Reiniciaba la app cuando usaba >1GB
3. **Apache sin timeouts extendidos** - Terminaba la conexión antes de tiempo
4. **No había gestión de archivos temporales**

---

## ✅ Cambios Implementados

### 1. **FileController.ts** - Cambio Crítico ⚠️

**ANTES (problemático):**
```typescript
const upload = multer({
  storage: multer.memoryStorage(), // ❌ Todo en RAM
  // ...
});
```

**AHORA (corregido):**
```typescript
const storage = multer.diskStorage({
  destination: './temp-uploads',  // ✅ Escribe a disco
  filename: (req, file, cb) => {
    // Nombre único con timestamp
  }
});

const upload = multer({
  storage: storage, // ✅ Disk storage
  // ...
});
```

**Beneficio:** Los archivos grandes se escriben a disco temporal en lugar de RAM.

### 2. **ecosystem.config.js** - PM2 Mejorado

**Cambios:**
- `max_memory_restart: '3G'` (antes: '1G') - Más memoria permitida
- `kill_timeout: 30000` (antes: 5000) - Más tiempo para shutdown
- `listen_timeout: 30000` (antes: 10000) - Más tiempo para iniciar
- `node_args: '--max-old-space-size=4096'` - 4GB heap para Node.js

**Beneficio:** PM2 no reinicia la app durante uploads grandes.

### 3. **Apache Configuration** - VirtualHost

Debes actualizar tu archivo Apache con:

```apache
ProxyTimeout 1800          # 30 minutos
Timeout 1800              # 30 minutos
LimitRequestBody 0        # Sin límite
ProxyIOBufferSize 65536   # Buffer más grande
KeepAlive On
KeepAliveTimeout 600
```

**Beneficio:** Apache espera el tiempo necesario para uploads grandes.

### 4. **Gestión de Archivos Temporales**

**Nuevos archivos:**
- `temp-uploads/` - Directorio para archivos temporales
- `cleanup-temp.sh` - Script de limpieza automática
- `deploy-large-files.sh` - Script de deployment completo

**Beneficio:** No se acumulan archivos temporales y se libera espacio.

### 5. **Documentación**

- `LARGE-FILES-TROUBLESHOOTING.md` - Guía completa de troubleshooting
- README actualizado con información de archivos grandes

---

## 🚀 Pasos para Aplicar la Solución

### 1️⃣ En el Servidor - Recompilar y Deploy

```bash
cd /path/to/aws-s3-uploader

# Método rápido (recomendado)
npm run deploy:large-files

# O método manual:
npm run build
pm2 reload ecosystem.config.js --env production
pm2 save
```

### 2️⃣ Actualizar Apache VirtualHost

Edita tu configuración de Apache:

```bash
sudo nano /etc/apache2/sites-available/uploader.conf
```

**Copia esta configuración completa:**

```apache
<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName uploader.imporfactory.app

    # Timeouts extendidos (30 minutos)
    ProxyTimeout 1800
    Timeout 1800
    
    # Sin límite de tamaño
    LimitRequestBody 0
    
    # Buffer aumentado
    ProxyIOBufferSize 65536
    
    # KeepAlive para conexiones largas
    KeepAlive On
    KeepAliveTimeout 600
    MaxKeepAliveRequests 1000
    
    # Reverse proxy
    ProxyPreserveHost On
    ProxyRequests Off
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
    AllowEncodedSlashes NoDecode
    
    # Proxy a Node.js con timeout
    ProxyPass        "/"  "http://127.0.0.1:3100/" retry=0 timeout=1800
    ProxyPassReverse "/"  "http://127.0.0.1:3100/"
    
    # Logs
    ErrorLog  ${APACHE_LOG_DIR}/uploader_error.log
    CustomLog ${APACHE_LOG_DIR}/uploader_access.log combined
    
    # SSL
    Include /etc/letsencrypt/options-ssl-apache.conf
    SSLCertificateFile /etc/letsencrypt/live/uploader.imporfactory.app/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/uploader.imporfactory.app/privkey.pem
</VirtualHost>
</IfModule>
```

**Reinicia Apache:**

```bash
sudo apachectl -t  # Verificar sintaxis
sudo systemctl restart apache2
sudo systemctl status apache2
```

### 3️⃣ Verificar Variables de Entorno

Asegúrate de que tu `.env` tenga:

```env
MAX_FILE_SIZE=5368709120  # 5GB en bytes
NODE_ENV=production
PORT=3100
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
```

### 4️⃣ Configurar Limpieza Automática (Opcional pero Recomendado)

```bash
cd /path/to/aws-s3-uploader
chmod +x cleanup-temp.sh

# Configurar cron
crontab -e

# Agregar esta línea (limpia cada hora):
0 * * * * /ruta/completa/aws-s3-uploader/cleanup-temp.sh >> /ruta/completa/aws-s3-uploader/logs/cleanup.log 2>&1
```

---

## 🧪 Probar que Funciona

### Monitorear Logs en Tiempo Real

Abre 3 terminales:

**Terminal 1 - Apache:**
```bash
sudo tail -f /var/log/apache2/uploader_error.log
```

**Terminal 2 - PM2:**
```bash
pm2 logs aws-s3-uploader-prod --lines 50
```

**Terminal 3 - App:**
```bash
tail -f /path/to/aws-s3-uploader/logs/combined-$(date +%Y-%m-%d).log
```

### Probar Upload de Archivo Grande

Desde tu máquina local o el servidor:

```bash
# Crear archivo de prueba de 1.5GB
dd if=/dev/zero of=test-1.5gb.bin bs=1M count=1500

# Subir
curl -X POST \
  https://uploader.imporfactory.app/api/files/upload \
  -F "file=@test-1.5gb.bin" \
  -F "uploadedBy=test" \
  -v
```

**Observa los logs** - Deberías ver:
- Apache aceptando la conexión
- PM2 sin reinicios
- La app procesando el upload
- S3 recibiendo el archivo

---

## 📊 Qué Esperar

### ✅ Funcionamiento Correcto

- **Apache**: Mantiene la conexión sin 502
- **PM2**: No reinicia durante el upload
- **Temp Files**: Se crean en `temp-uploads/` y se eliminan después
- **Logs**: Muestran progreso del upload
- **S3**: Recibe el archivo completo

### ⏱️ Tiempos Aproximados

| Tamaño | Tiempo Estimado (100 Mbps) |
|--------|----------------------------|
| 1 GB   | ~1-2 minutos              |
| 2 GB   | ~2-4 minutos              |
| 5 GB   | ~5-10 minutos             |

### 💾 Espacio en Disco

El servidor necesita espacio libre igual al tamaño del archivo más grande:
- Upload de 5GB → Mínimo 5GB libres en `temp-uploads/`
- Verifica: `df -h`

---

## 🚨 Si Aún Hay Problemas

### 1. Verificar Procesos

```bash
# Ver PM2
pm2 describe aws-s3-uploader-prod
pm2 monit

# Ver memoria
free -h
top
```

### 2. Verificar Permisos

```bash
# Directorio temp debe ser escribible
ls -la temp-uploads/
sudo chown -R $USER:$USER temp-uploads/
chmod 755 temp-uploads/
```

### 3. Aumentar Logs de Apache (Debug)

```apache
# En el VirtualHost
LogLevel warn proxy:trace2

# Reiniciar y ver logs detallados
sudo systemctl restart apache2
sudo tail -f /var/log/apache2/uploader_error.log
```

### 4. Consultar Guía Completa

Ver: `LARGE-FILES-TROUBLESHOOTING.md` para troubleshooting detallado.

---

## 🎯 Checklist Final

Antes de probar, verifica que TODO esté ✅:

- [ ] Código recompilado (`npm run build`)
- [ ] PM2 reiniciado (`pm2 reload ecosystem.config.js --env production`)
- [ ] Apache actualizado con nuevos timeouts
- [ ] Apache reiniciado (`sudo systemctl restart apache2`)
- [ ] Variables de entorno correctas en `.env`
- [ ] Directorio `temp-uploads/` existe con permisos 755
- [ ] Espacio en disco suficiente (`df -h`)
- [ ] Logs monitoreados en 3 terminales
- [ ] Prueba con archivo >1GB

---

## 📈 Límites Actuales

Después de estos cambios, tu sistema soporta:

| Componente | Límite |
|------------|--------|
| **Apache** | Sin límite de tamaño, timeout 30 min |
| **PM2** | 3GB memoria por instancia |
| **Node.js** | 4GB heap máximo |
| **Multer** | Configurable vía MAX_FILE_SIZE |
| **AWS S3 PUT** | Hasta 5GB por archivo |

**Recomendación:** Para archivos >5GB, necesitas implementar multipart upload de AWS.

---

## 🎉 Resultado Esperado

Después de aplicar todos los cambios:

✅ Archivos de 1-5GB suben sin problemas  
✅ Sin errores 502 Bad Gateway  
✅ Memoria del servidor estable  
✅ Archivos temporales se limpian automáticamente  
✅ Logs muestran progreso completo  

---

## 📞 Comandos Rápidos

```bash
# Deploy completo
npm run deploy:large-files

# Ver estado
pm2 status
pm2 monit

# Ver logs
npm run pm2:logs

# Limpiar archivos temporales manualmente
npm run cleanup:temp

# Reiniciar Apache
sudo systemctl restart apache2

# Ver espacio en disco
df -h
```

---

**¿Listo?** Ahora puedes subir archivos >1GB sin problemas de 502! 🚀
