# 🔧 Troubleshooting - Archivos Grandes (>1GB)

## Problema: 502 Bad Gateway con archivos >1GB

### ✅ Soluciones Implementadas

#### 1. **Apache Configuration**

Actualiza tu VirtualHost (`/etc/apache2/sites-available/uploader.conf`):

```apache
<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName uploader.imporfactory.app

    # === CONFIGURACIÓN PARA ARCHIVOS GRANDES ===
    
    # Timeouts extendidos (30 minutos)
    ProxyTimeout 1800
    Timeout 1800
    
    # Sin límite de tamaño de body
    LimitRequestBody 0
    
    # Aumentar buffer para conexiones largas
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
    
    # Permitir URLs codificadas
    AllowEncodedSlashes NoDecode
    
    # Proxy a Node.js con timeout extendido
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

#### 2. **Apache Global Settings**

Edita `/etc/apache2/apache2.conf`:

```apache
# Timeouts globales
Timeout 1800
KeepAlive On
KeepAliveTimeout 600
MaxKeepAliveRequests 1000

# MPM Prefork (si usas prefork)
<IfModule mpm_prefork_module>
    StartServers             5
    MinSpareServers          5
    MaxSpareServers         10
    MaxRequestWorkers      250
    MaxConnectionsPerChild   0
</IfModule>

# MPM Worker (si usas worker/event)
<IfModule mpm_worker_module>
    StartServers             3
    MinSpareThreads         75
    MaxSpareThreads        250
    ThreadsPerChild         25
    MaxRequestWorkers      400
    MaxConnectionsPerChild   0
</IfModule>
```

#### 3. **Módulos de Apache Necesarios**

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod ssl
sudo systemctl restart apache2
```

#### 4. **PM2 Configuration**

Ya actualizado en `ecosystem.config.js`:
- `max_memory_restart: '3G'` - Permite más memoria
- `kill_timeout: 30000` - 30 segundos para shutdown
- `node_args: '--max-old-space-size=4096'` - 4GB heap para Node.js

#### 5. **Multer Disk Storage**

Cambiado de `memoryStorage()` a `diskStorage()` para evitar cargar todo en RAM.

---

## 🔍 Verificar que Todo Funciona

### 1. **Reiniciar Apache**

```bash
sudo systemctl restart apache2
sudo systemctl status apache2
```

### 2. **Recompilar y Reiniciar PM2**

```bash
cd /path/to/aws-s3-uploader
npm run build
pm2 reload ecosystem.config.js --env production
pm2 save
```

### 3. **Verificar Variables de Entorno**

Asegúrate de que `.env` tenga:

```env
MAX_FILE_SIZE=5368709120  # 5GB en bytes
NODE_ENV=production
PORT=3100
```

### 4. **Monitorear Logs**

Terminal 1 - Logs de Apache:
```bash
sudo tail -f /var/log/apache2/uploader_error.log
```

Terminal 2 - Logs de PM2:
```bash
pm2 logs aws-s3-uploader-prod
```

Terminal 3 - Logs de la aplicación:
```bash
tail -f logs/combined-$(date +%Y-%m-%d).log
```

### 5. **Probar Upload**

```bash
# Crear archivo de prueba de 1.5GB
dd if=/dev/zero of=test-large.bin bs=1M count=1500

# Subir archivo
curl -X POST \
  https://uploader.imporfactory.app/api/files/upload \
  -F "file=@test-large.bin" \
  -F "uploadedBy=test" \
  -v
```

---

## 🚨 Si Aún Tienes 502

### Verificar Espacio en Disco

```bash
df -h
```

El directorio `temp-uploads/` necesita espacio suficiente.

### Verificar Memoria del Servidor

```bash
free -h
top
```

Asegúrate de tener al menos 4-6GB de RAM libre.

### Verificar Permisos

```bash
# Asegurar que el usuario de PM2 pueda escribir en temp-uploads
sudo chown -R $USER:$USER /path/to/aws-s3-uploader/temp-uploads
chmod 755 /path/to/aws-s3-uploader/temp-uploads
```

### Verificar Proceso de PM2

```bash
pm2 describe aws-s3-uploader-prod
pm2 monit
```

Observa el uso de memoria durante el upload.

### Verificar Apache Workers

```bash
# Ver procesos de Apache
ps aux | grep apache2

# Ver estado del servidor
sudo apachectl -t
sudo apachectl -M
```

### Ver Logs Detallados

```bash
# Apache error log con nivel debug
sudo nano /etc/apache2/sites-available/uploader.conf

# Agregar dentro del VirtualHost:
LogLevel warn proxy:trace2

# Reiniciar
sudo systemctl restart apache2

# Ver logs
sudo tail -f /var/log/apache2/uploader_error.log
```

---

## ⚡ Optimizaciones Adicionales

### 1. **Streaming Directo a S3** (Mejor para archivos ENORMES)

Para archivos >5GB, considera implementar `multer-s3` para streaming directo:

```bash
npm install multer-s3
```

Esto evita escribir a disco local completamente.

### 2. **Multipart Upload de AWS**

Para archivos >5GB, AWS requiere multipart upload.

### 3. **Progress Tracking**

Implementa WebSockets o polling para mostrar progreso de upload.

---

## 📊 Límites Actuales

| Componente | Límite Actual |
|------------|---------------|
| Apache Timeout | 1800s (30 min) |
| Apache Body Size | Ilimitado |
| PM2 Memory | 3GB |
| Node.js Heap | 4GB |
| Express Body Parser | ~1.5GB (configurable) |
| Multer | 1.5GB (configurable) |
| AWS S3 Single PUT | 5GB |
| AWS S3 Multipart | 5TB |

---

## 🎯 Recomendaciones

### Archivos < 1GB
✅ Configuración actual funciona perfecto

### Archivos 1-5GB
✅ Usa disk storage (implementado)
✅ Aumenta timeouts (implementado)
⚠️ Monitorea uso de memoria

### Archivos > 5GB
❌ Requiere multipart upload de AWS
❌ Considera streaming directo con multer-s3
❌ Implementa upload resumible

---

## 🔗 Referencias

- [Apache ProxyTimeout](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html#proxytimeout)
- [Multer Documentation](https://github.com/expressjs/multer)
- [AWS S3 Multipart Upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [PM2 Process File](https://pm2.keymetrics.io/docs/usage/application-declaration/)

---

## 📞 Checklist Rápido

- [ ] Apache timeout aumentado a 1800s
- [ ] Apache LimitRequestBody = 0
- [ ] Apache módulos proxy habilitados
- [ ] PM2 max_memory_restart = 3G
- [ ] PM2 node_args con --max-old-space-size=4096
- [ ] Multer usando diskStorage()
- [ ] Directorio temp-uploads/ existe con permisos
- [ ] Variables de entorno correctas
- [ ] Apache y PM2 reiniciados
- [ ] Logs monitoreados durante prueba
- [ ] Espacio en disco suficiente

Si todos están ✅, los archivos >1GB deberían funcionar.
