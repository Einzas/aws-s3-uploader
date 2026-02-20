# 📋 Comandos para Ver Logs

## 🚀 Inicio Rápido

```bash
# Ver logs en tiempo real (RECOMENDADO)
pm2 logs aws-s3-uploader-prod

# O usa el script interactivo
./view-logs.sh
```

---

## 📊 Comandos PM2 (Los Más Útiles)

### Ver logs en tiempo real
```bash
pm2 logs
# o específicamente tu app:
pm2 logs aws-s3-uploader-prod
```

### Ver últimas 100 líneas
```bash
pm2 logs aws-s3-uploader-prod --lines 100 --nostream
```

### Ver solo errores
```bash
pm2 logs aws-s3-uploader-prod --err
```

### Ver solo output
```bash
pm2 logs aws-s3-uploader-prod --out
```

### Limpiar logs de PM2
```bash
pm2 flush
```

### Ver estado y memoria
```bash
pm2 status
pm2 monit
```

---

## 📁 Archivos de Log

Los logs se guardan en el directorio `logs/`:

```bash
logs/
├── pm2-out.log           # Logs de PM2 (stdout)
├── pm2-error.log         # Logs de PM2 (stderr)
├── pm2-combined.log      # Logs de PM2 (combinado)
├── combined-YYYY-MM-DD.log    # Todos los logs
├── error-YYYY-MM-DD.log       # Solo errores
├── http-YYYY-MM-DD.log        # Requests HTTP
├── s3-YYYY-MM-DD.log          # Operaciones S3
├── security-YYYY-MM-DD.log    # Eventos de seguridad
└── performance-YYYY-MM-DD.log # Métricas de performance
```

---

## 🔍 Ver Logs Específicos

### Ver logs de errores de hoy
```bash
cat logs/error-$(date +%Y-%m-%d).log
# O últimas 50 líneas:
tail -50 logs/error-$(date +%Y-%m-%d).log
```

### Ver logs de HTTP de hoy
```bash
tail -50 logs/http-$(date +%Y-%m-%d).log
```

### Ver logs de S3/Uploads
```bash
tail -50 logs/s3-$(date +%Y-%m-%d).log
```

### Ver todos los logs en tiempo real
```bash
tail -f logs/*.log
```

### Buscar algo específico en logs
```bash
# Buscar "upload" en logs de hoy
grep -i "upload" logs/combined-$(date +%Y-%m-%d).log

# Buscar "error" en todos los logs
grep -r "error" logs/

# Buscar por fileId específico
grep "abc-123" logs/combined-*.log
```

---

## 🎯 Logs por Categoría

### Ver logs de upload de videos
```bash
grep "UPLOAD" logs/combined-$(date +%Y-%m-%d).log
```

### Ver logs de validación
```bash
grep "VALIDATION" logs/combined-$(date +%Y-%m-%d).log
```

### Ver logs de S3
```bash
grep "S3" logs/combined-$(date +%Y-%m-%d).log
```

### Ver logs de limpieza automática
```bash
grep -i "cleanup" logs/combined-$(date +%Y-%m-%d).log
```

### Ver logs de multipart upload
```bash
grep -i "multipart" logs/s3-$(date +%Y-%m-%d).log
```

---

## 🔧 Comandos de Diagnóstico

### Ver si el servidor está corriendo
```bash
pm2 status
```

### Ver uso de recursos
```bash
pm2 monit
```

### Ver información detallada
```bash
pm2 describe aws-s3-uploader-prod
```

### Reiniciar sin perder logs
```bash
pm2 reload aws-s3-uploader-prod
```

### Ver logs del sistema operativo
```bash
# En Linux/Unix
journalctl -u pm2-<user>.service -f

# En Windows con PM2
pm2 logs --raw
```

---

## 📈 Monitoreo en Tiempo Real

### Ver logs mientras subes un archivo

Terminal 1:
```bash
pm2 logs aws-s3-uploader-prod
```

Terminal 2:
```bash
curl -X POST http://localhost:3100/api/files/upload \
  -F "file=@video.mp4"
```

Deberías ver en Terminal 1:
```
[INFO] [UPLOAD] Starting file validation
[INFO] [UPLOAD] File validation successful
[INFO] [S3] Starting S3 upload
[INFO] [S3] Multipart upload initiated
[INFO] [S3] Parts uploaded: 10/50 (progress: 20.00%)
...
[INFO] [UPLOAD] File upload completed successfully
```

---

## 🚨 Troubleshooting

### No veo ningún log

1. **Verifica que el servidor esté corriendo:**
```bash
pm2 status
```

2. **Verifica que el directorio logs existe:**
```bash
ls -la logs/
```

3. **Reinicia el servidor:**
```bash
pm2 restart aws-s3-uploader-prod
```

4. **Intenta subir un archivo y ve si aparecen logs:**
```bash
# En una terminal:
pm2 logs aws-s3-uploader-prod

# En otra terminal:
curl http://localhost:3100/
```

### Los logs aparecen pero están vacíos

Verifica el archivo `.env`:
```bash
cat .env | grep NODE_ENV
# Debe mostrar: NODE_ENV=production o development
```

### PM2 dice "No process found"

```bash
# Iniciar el proceso
pm2 start ecosystem.config.js --env production

# Verificar
pm2 list
```

---

## 💡 Tips Útiles

### Ver logs de las últimas X horas
```bash
# Últimas 2 horas
find logs/ -name "*.log" -mmin -120 -exec tail -20 {} \;
```

### Ver tamaño de logs
```bash
du -sh logs/
ls -lh logs/
```

### Rotar logs manualmente
```bash
pm2 reloadLogs
```

### Exportar logs para análisis
```bash
# Copiar logs de hoy a un archivo
cat logs/combined-$(date +%Y-%m-%d).log > logs-backup-$(date +%Y%m%d-%H%M%S).log
```

### Ver solo warnings y errores
```bash
grep -E "WARN|ERROR" logs/combined-$(date +%Y-%m-%d).log
```

---

## 📱 Script Interactivo

Usa el script incluido para navegación fácil:

```bash
./view-logs.sh
```

Esto te mostrará un menú interactivo con todas las opciones.

---

## 🎓 Comandos Avanzados

### Ver logs de un rango de tiempo específico
```bash
# Entre 10:00 y 11:00 de hoy
awk '/2026-02-20 10:/{flag=1} /2026-02-20 11:/{flag=0} flag' logs/combined-2026-02-20.log
```

### Contar errores por hora
```bash
awk '{print $2}' logs/error-$(date +%Y-%m-%d).log | cut -d: -f1 | sort | uniq -c
```

### Ver uploads más grandes
```bash
grep "fileSize" logs/s3-$(date +%Y-%m-%d).log | sort -t: -k4 -n | tail -10
```

### Ver tiempos de respuesta promedio
```bash
grep "duration" logs/performance-$(date +%Y-%m-%d).log | awk '{sum+=$NF; count++} END {print sum/count " ms"}'
```

---

## 🔔 Alertas Automáticas

Para configurar alertas cuando hay errores:

```bash
# Crear script de monitoreo
cat > monitor-errors.sh << 'EOF'
#!/bin/bash
while true; do
    errors=$(tail -100 logs/error-$(date +%Y-%m-%d).log | wc -l)
    if [ $errors -gt 10 ]; then
        echo "⚠️ ALERTA: $errors errores en los últimos 100 registros"
        # Aquí puedes enviar email, Slack, etc.
    fi
    sleep 300  # Cada 5 minutos
done
EOF

chmod +x monitor-errors.sh
./monitor-errors.sh &
```

---

**¡Ahora tienes control total sobre tus logs! 🎉**
