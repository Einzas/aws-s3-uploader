# PM2 Configuration Guide

## Instalación de PM2

```bash
npm install -g pm2
```

## Scripts disponibles

### Producción

```bash
# Compilar y desplegar en producción
npm run deploy:prod

# Comandos individuales
npm run build           # Compilar TypeScript
npm run pm2:start       # Iniciar en producción
npm run pm2:restart     # Reiniciar aplicación
npm run pm2:reload      # Reload sin downtime
npm run pm2:stop        # Detener aplicación
npm run pm2:delete      # Eliminar de PM2
```

### Desarrollo con watch

```bash
npm run pm2:start:dev   # Iniciar en modo desarrollo con watch
```

### Monitoreo

```bash
npm run pm2:status      # Ver estado de aplicaciones
npm run pm2:logs        # Ver logs en tiempo real
npm run pm2:monit       # Monitor interactivo
```

## Configuraciones

### Producción (aws-s3-uploader)

- **Instancias**: Máximo (todos los cores)
- **Modo**: Cluster
- **Watch**: Deshabilitado
- **Auto-restart**: Habilitado
- **Max Memory**: 1GB
- **Logs**: ./logs/

### Desarrollo (aws-s3-uploader-dev)

- **Instancias**: 1
- **Modo**: Fork
- **Watch**: Habilitado
- **Puerto**: 3001
- **Auto-restart**: Habilitado

## Variables de entorno

Las variables se cargan desde `.env` automáticamente.

Para producción, PM2 usa las variables definidas en `env_production`.

## Logs

Los logs se guardan en el directorio `./logs/`:

- `combined.log` - Logs combinados de producción
- `out.log` - Output de producción
- `error.log` - Errores de producción
- `dev-*.log` - Logs de desarrollo

## Deploy automático (opcional)

```bash
# Setup inicial en servidor
pm2 deploy ecosystem.config.js production setup

# Deploy
pm2 deploy ecosystem.config.js production
```

## Comandos útiles de PM2

```bash
# Salvar configuración actual
pm2 save

# Auto-startup en reinicio del sistema
pm2 startup

# Listar aplicaciones
pm2 list

# Información detallada
pm2 show aws-s3-uploader

# Flush logs
pm2 flush

# Reset restart counter
pm2 reset aws-s3-uploader
```

## Monitoreo en producción

Para monitoreo avanzado:

```bash
# PM2 Plus (anteriormente Keymetrics)
pm2 link <secret_key> <public_key>
```
