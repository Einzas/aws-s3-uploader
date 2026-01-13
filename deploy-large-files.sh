#!/bin/bash

# Script de deployment para producción con soporte de archivos grandes
# Uso: ./deploy-large-files.sh

set -e  # Salir si hay error

echo "🚀 Iniciando deployment con soporte de archivos grandes..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: No se encuentra package.json. Ejecuta este script desde la raíz del proyecto.${NC}"
    exit 1
fi

# 1. Crear directorio temporal si no existe
echo -e "${YELLOW}📁 Creando directorio temporal...${NC}"
mkdir -p temp-uploads
chmod 755 temp-uploads
echo -e "${GREEN}✓ Directorio temporal creado${NC}"

# 2. Instalar dependencias
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# 3. Compilar TypeScript
echo -e "${YELLOW}🔨 Compilando TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ Compilación exitosa${NC}"

# 4. Verificar configuración de PM2
echo -e "${YELLOW}🔍 Verificando configuración de PM2...${NC}"
if pm2 list | grep -q "aws-s3-uploader-prod"; then
    echo -e "${YELLOW}⚠️  Aplicación ya existe en PM2, reloading...${NC}"
    pm2 reload ecosystem.config.js --env production
else
    echo -e "${YELLOW}🆕 Iniciando nueva aplicación en PM2...${NC}"
    pm2 start ecosystem.config.js --env production
fi
echo -e "${GREEN}✓ PM2 actualizado${NC}"

# 5. Guardar configuración de PM2
echo -e "${YELLOW}💾 Guardando configuración de PM2...${NC}"
pm2 save
echo -e "${GREEN}✓ Configuración guardada${NC}"

# 6. Mostrar estado
echo -e "${YELLOW}📊 Estado de la aplicación:${NC}"
pm2 describe aws-s3-uploader-prod

# 7. Configurar limpieza automática de archivos temporales
echo -e "${YELLOW}🧹 Configurando limpieza automática...${NC}"
chmod +x cleanup-temp.sh

# Verificar si ya existe en crontab
if crontab -l 2>/dev/null | grep -q "cleanup-temp.sh"; then
    echo -e "${GREEN}✓ Limpieza automática ya configurada en crontab${NC}"
else
    echo -e "${YELLOW}ℹ️  Para configurar limpieza automática, ejecuta:${NC}"
    echo -e "   crontab -e"
    echo -e "   Y agrega: 0 * * * * $(pwd)/cleanup-temp.sh >> $(pwd)/logs/cleanup.log 2>&1"
fi

# 8. Recordatorios
echo ""
echo -e "${GREEN}✅ Deployment completado exitosamente!${NC}"
echo ""
echo -e "${YELLOW}📋 RECORDATORIOS IMPORTANTES:${NC}"
echo ""
echo "1️⃣  Apache Configuration:"
echo "   - Verifica que ProxyTimeout esté en 1800"
echo "   - Verifica que LimitRequestBody esté en 0"
echo "   - Reinicia Apache: sudo systemctl restart apache2"
echo ""
echo "2️⃣  Variables de Entorno (.env):"
echo "   - MAX_FILE_SIZE debe estar configurado (ej: 5368709120 para 5GB)"
echo "   - Verifica AWS credentials"
echo ""
echo "3️⃣  Monitoreo:"
echo "   - Logs de PM2: pm2 logs aws-s3-uploader-prod"
echo "   - Logs de app: tail -f logs/combined-$(date +%Y-%m-%d).log"
echo "   - Monitor: pm2 monit"
echo ""
echo "4️⃣  Espacio en Disco:"
echo "   - Verifica espacio: df -h"
echo "   - Directorio temp-uploads necesita espacio para archivos grandes"
echo ""
echo -e "${GREEN}🎉 Todo listo para subir archivos grandes!${NC}"
echo ""
