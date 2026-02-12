# Configuración Apache para Archivos Grandes

## 📋 Archivo a Editar

```bash
sudo nano /etc/apache2/sites-available/uploader.conf
```

O en algunos sistemas:

```bash
sudo nano /etc/apache2/sites-available/uploader-le-ssl.conf
```

---

## 🔧 CONFIGURACIÓN COMPLETA

**Copia y pega esta configuración completa:**

```apache
<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName uploader.imporfactory.app

    # ============================================
    # CONFIGURACIÓN PARA ARCHIVOS GRANDES >1GB
    # ============================================
    
    # Timeouts extendidos (30 minutos para uploads grandes)
    ProxyTimeout 1800
    Timeout 1800
    
    # Sin límite de tamaño de body (permite archivos de cualquier tamaño)
    LimitRequestBody 0
    
    # Buffer aumentado para conexiones largas
    ProxyIOBufferSize 65536
    
    # KeepAlive para mantener conexiones activas durante uploads largos
    KeepAlive On
    KeepAliveTimeout 600
    MaxKeepAliveRequests 1000
    
    # ============================================
    # CONFIGURACIÓN DE REVERSE PROXY
    # ============================================
    
    ProxyPreserveHost On
    ProxyRequests Off
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
    
    # Permitir URLs codificadas (para presigned URLs de S3)
    AllowEncodedSlashes NoDecode
    
    # Proxy pass a Node.js/PM2 con retry=0 y timeout extendido
    ProxyPass        "/"  "http://127.0.0.1:3100/" retry=0 timeout=1800
    ProxyPassReverse "/"  "http://127.0.0.1:3100/"
    
    # ============================================
    # LOGS
    # ============================================
    
    ErrorLog  ${APACHE_LOG_DIR}/uploader_error.log
    CustomLog ${APACHE_LOG_DIR}/uploader_access.log combined
    
    # Opcional: Para debugging detallado, descomentar esta línea
    # LogLevel warn proxy:trace2
    
    # ============================================
    # SSL CONFIGURATION
    # ============================================
    
    Include /etc/letsencrypt/options-ssl-apache.conf
    SSLCertificateFile /etc/letsencrypt/live/uploader.imporfactory.app/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/uploader.imporfactory.app/privkey.pem
</VirtualHost>
</IfModule>
```

---

## 🌐 Configuración Global de Apache

También edita el archivo global de Apache:

```bash
sudo nano /etc/apache2/apache2.conf
```

**Busca y modifica/agrega estas líneas:**

```apache
# ============================================
# TIMEOUTS GLOBALES
# ============================================
Timeout 1800

# ============================================
# KEEPALIVE
# ============================================
KeepAlive On
KeepAliveTimeout 600
MaxKeepAliveRequests 1000

# ============================================
# MPM CONFIGURATION (según tu módulo activo)
# ============================================

# Si usas MPM Prefork (verifica con: apache2 -V | grep MPM)
<IfModule mpm_prefork_module>
    StartServers             5
    MinSpareServers          5
    MaxSpareServers         10
    MaxRequestWorkers      250
    MaxConnectionsPerChild   0
</IfModule>

# Si usas MPM Worker o Event
<IfModule mpm_worker_module>
    StartServers             3
    MinSpareThreads         75
    MaxSpareThreads        250
    ThreadsPerChild         25
    MaxRequestWorkers      400
    MaxConnectionsPerChild   0
</IfModule>

<IfModule mpm_event_module>
    StartServers             3
    MinSpareThreads         75
    MaxSpareThreads        250
    ThreadsPerChild         25
    MaxRequestWorkers      400
    MaxConnectionsPerChild   0
</IfModule>
```

---

## ✅ Verificar y Aplicar

### 1. Verificar sintaxis

```bash
sudo apachectl configtest
# O
sudo apache2ctl configtest
```

**Debe devolver:** `Syntax OK`

### 2. Habilitar módulos necesarios

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod ssl
```

### 3. Verificar qué MPM estás usando

```bash
apache2 -V | grep MPM
# O
apachectl -V | grep MPM
```

Te dirá algo como:
- `Server MPM: Prefork`
- `Server MPM: Worker`
- `Server MPM: Event`

### 4. Reiniciar Apache

```bash
sudo systemctl restart apache2
```

### 5. Verificar que está corriendo

```bash
sudo systemctl status apache2
```

### 6. Ver logs en tiempo real

```bash
sudo tail -f /var/log/apache2/uploader_error.log
```

---

## 🔍 Verificar la Configuración Actual

### Ver configuración activa del VirtualHost

```bash
sudo apache2ctl -S
# O
sudo apachectl -S
```

Esto muestra todos los VirtualHosts activos y sus archivos de configuración.

### Ver timeout actual

```bash
apache2ctl -M | grep proxy
```

### Ver MPM activo

```bash
apache2ctl -M | grep mpm
```

---

## 🚨 Troubleshooting Apache

### Si Apache no reinicia

```bash
# Ver errores
sudo systemctl status apache2 -l

# Ver logs
sudo tail -50 /var/log/apache2/error.log

# Verificar sintaxis
sudo apachectl configtest
```

### Si hay conflicto de configuración

```bash
# Ver todas las configuraciones de sitios
ls -la /etc/apache2/sites-available/
ls -la /etc/apache2/sites-enabled/

# Desactivar sitio viejo si existe
sudo a2dissite uploader
sudo a2dissite uploader-le-ssl

# Activar el correcto
sudo a2ensite uploader-le-ssl
sudo systemctl reload apache2
```

### Si el puerto 3100 no responde

```bash
# Verificar que Node.js está escuchando
sudo netstat -tlnp | grep 3100
# O
sudo ss -tlnp | grep 3100

# Debe mostrar algo como:
# tcp  0  0 127.0.0.1:3100  0.0.0.0:*  LISTEN  12345/node
```

### Si hay error de timeout

```bash
# Aumentar aún más el timeout (1 hora)
ProxyTimeout 3600
Timeout 3600
```

---

## 📊 Valores Recomendados Según Tamaño de Archivo

| Tamaño Max | ProxyTimeout | Timeout | KeepAliveTimeout |
|------------|--------------|---------|------------------|
| < 1 GB     | 600 (10 min) | 600     | 300              |
| 1-5 GB     | 1800 (30 min)| 1800    | 600              |
| 5-10 GB    | 3600 (1 hora)| 3600    | 1200             |
| > 10 GB    | 7200 (2 horas)| 7200   | 2400             |

**Configuración actual (arriba): 1800 segundos = 30 minutos**  
Esto es adecuado para archivos de hasta 5GB con conexión de 100Mbps.

---

## ✅ Checklist Post-Configuración

- [ ] Archivo VirtualHost actualizado
- [ ] apache2.conf actualizado con timeouts globales
- [ ] `apachectl configtest` devuelve `Syntax OK`
- [ ] Módulos proxy habilitados
- [ ] Apache reiniciado sin errores
- [ ] `systemctl status apache2` muestra "active (running)"
- [ ] Puerto 3100 respondiendo (verificado con netstat)
- [ ] Logs de Apache visibles en tiempo real

---

## 🎯 Siguiente Paso

Después de configurar Apache, continúa con el deployment de la aplicación:

```bash
cd /path/to/aws-s3-uploader
npm run deploy:large-files
```

Ver: `SOLUCION-502-RESUMEN.md` para los pasos completos.
