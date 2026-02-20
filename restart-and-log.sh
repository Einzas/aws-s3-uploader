#!/bin/bash

echo "🔄 Reiniciando PM2..."
pm2 restart aws-s3-prod

echo ""
echo "⏳ Esperando 2 segundos..."
sleep 2

echo ""
echo "📋 Mostrando logs (Ctrl+C para salir)..."
echo "================================================"
echo ""

pm2 logs aws-s3-prod --lines 100 --nostream
