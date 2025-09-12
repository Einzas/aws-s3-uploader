#!/bin/bash

# Script de deploy para producción

echo "🚀 Iniciando deploy a producción..."

# 1. Compilar proyecto
echo "📦 Compilando proyecto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en la compilación"
    exit 1
fi

# 2. Crear directorio de logs si no existe
mkdir -p logs

# 3. Detener PM2 si está corriendo
echo "🛑 Deteniendo instancia anterior..."
pm2 delete aws-s3-uploader-prod 2>/dev/null || echo "No hay instancia previa"

# 4. Iniciar con PM2
echo "▶️ Iniciando aplicación con PM2..."
NODE_ENV=production pm2 start ecosystem.production.js

if [ $? -ne 0 ]; then
    echo "❌ Error al iniciar con PM2"
    exit 1
fi

# 5. Guardar configuración PM2
pm2 save

echo "✅ Deploy completado exitosamente!"
echo "📊 Estado actual:"
pm2 status

echo ""
echo "📋 Comandos útiles:"
echo "  pm2 logs aws-s3-uploader-prod  # Ver logs"
echo "  pm2 monit                      # Monitor"
echo "  pm2 restart aws-s3-uploader-prod # Reiniciar"
