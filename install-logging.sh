#!/bin/bash

# Script de instalación del sistema de logging
# Ejecutar con: bash install-logging.sh

echo "🚀 Instalando sistema de logging para AWS S3 Uploader..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json"
    echo "Por favor, ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

echo "📦 Instalando dependencias de logging..."
npm install winston winston-daily-rotate-file morgan @types/morgan --save

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo ""
echo "✅ Dependencias instaladas correctamente"
echo ""

echo "🔨 Compilando proyecto..."
npm run build

if [ $? -ne 0 ]; then
    echo "⚠️  Advertencia: El proyecto tiene errores de compilación"
    echo "Esto es normal si hay otras dependencias faltantes"
    echo ""
else
    echo "✅ Proyecto compilado correctamente"
    echo ""
fi

echo "📁 Verificando directorio de logs..."
if [ -d "logs" ]; then
    echo "✅ Directorio logs/ existe"
else
    echo "⚠️  Creando directorio logs/..."
    mkdir -p logs
    echo "✅ Directorio logs/ creado"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✨ ¡Sistema de logging instalado correctamente!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📚 Documentación:"
echo "  - docs/LOGGING.md          (Documentación completa)"
echo "  - LOGGING_SUMMARY.md       (Resumen de cambios)"
echo "  - INSTALL_LOGGING.md       (Guía de instalación)"
echo ""
echo "🧪 Probar el sistema:"
echo "  npm run dev"
echo ""
echo "📊 Ver logs en tiempo real:"
echo "  tail -f logs/combined-\$(date +%Y-%m-%d).log"
echo ""
echo "═══════════════════════════════════════════════════════"
