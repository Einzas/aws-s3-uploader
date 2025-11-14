# Instalación de Dependencias de Logging

Este proyecto utiliza un sistema de logging profesional con Winston. 

## Instalar Dependencias

Ejecuta el siguiente comando para instalar las dependencias de logging:

```bash
npm install winston winston-daily-rotate-file morgan @types/morgan --save
```

O si prefieres yarn:

```bash
yarn add winston winston-daily-rotate-file morgan @types/morgan
```

## Dependencias Instaladas

- **winston**: ^3.11.0 - Sistema de logging flexible y potente
- **winston-daily-rotate-file**: ^4.7.1 - Rotación automática de archivos de log
- **morgan**: ^1.10.0 - Middleware HTTP logger para Express
- **@types/morgan**: ^1.9.9 - Tipos TypeScript para Morgan

## Verificar Instalación

Después de instalar, verifica que todo esté correcto:

```bash
npm list winston winston-daily-rotate-file morgan
```

## Siguiente Paso

Una vez instaladas las dependencias, el proyecto debería compilar sin errores:

```bash
npm run build
```

Para desarrollo:

```bash
npm run dev
```

## Estructura de Logs

Los logs se guardarán automáticamente en:

```
logs/
├── combined-YYYY-MM-DD.log      # Todos los logs
├── error-YYYY-MM-DD.log         # Solo errores
├── http-YYYY-MM-DD.log          # Requests HTTP
├── s3-YYYY-MM-DD.log            # Operaciones S3
├── security-YYYY-MM-DD.log      # Eventos de seguridad
└── performance-YYYY-MM-DD.log   # Métricas de rendimiento
```

## Documentación Completa

Ver `docs/LOGGING.md` para documentación completa del sistema de logging.
