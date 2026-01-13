#!/bin/bash

# Script para limpiar archivos temporales antiguos
# Ejecutar con cron cada hora: 0 * * * * /path/to/cleanup-temp.sh

TEMP_DIR="./temp-uploads"
MAX_AGE_MINUTES=60  # Eliminar archivos más antiguos de 1 hora

echo "[$(date)] Iniciando limpieza de archivos temporales..."

if [ -d "$TEMP_DIR" ]; then
    # Contar archivos antes
    FILES_BEFORE=$(find "$TEMP_DIR" -type f | wc -l)
    
    # Eliminar archivos más antiguos de MAX_AGE_MINUTES
    find "$TEMP_DIR" -type f -mmin +$MAX_AGE_MINUTES -delete
    
    # Contar archivos después
    FILES_AFTER=$(find "$TEMP_DIR" -type f | wc -l)
    
    FILES_DELETED=$((FILES_BEFORE - FILES_AFTER))
    
    echo "[$(date)] Archivos eliminados: $FILES_DELETED"
    echo "[$(date)] Archivos restantes: $FILES_AFTER"
else
    echo "[$(date)] Directorio $TEMP_DIR no existe"
fi

echo "[$(date)] Limpieza completada"
