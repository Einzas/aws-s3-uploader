# S3 File Upload Service - DDD Architecture

Un servicio de subida de archivos a AWS S3 construido con Domain-Driven Design (DDD), TypeScript, Node.js y Express, implementando las mejores prácticas de seguridad y arquitectura limpia.

## 🏗️ Arquitectura

Este proyecto sigue los principios de Domain-Driven Design (DDD) con una arquitectura hexagonal:

```
src/
├── domain/                 # Núcleo del negocio
│   ├── entities/          # Entidades del dominio
│   ├── value-objects/     # Objetos de valor
│   ├── repositories/      # Interfaces de repositorios
│   └── services/         # Servicios del dominio
├── application/           # Casos de uso
│   ├── use-cases/        # Implementación de casos de uso
│   └── common/           # Utilidades comunes
├── infrastructure/       # Adaptadores externos
│   ├── storage/          # Implementación de almacenamiento S3
│   ├── repositories/     # Implementación de repositorios
│   └── validation/       # Servicios de validación
├── presentation/         # Capa de presentación
│   ├── controllers/      # Controladores HTTP
│   └── middlewares/      # Middlewares de Express
└── shared/              # Configuración y utilidades compartidas
```

## 🚀 Características

- **Arquitectura DDD**: Separación clara de responsabilidades
- **Organización por categorías**: Archivos organizados automáticamente en carpetas
  - `images/` - Imágenes (JPEG, PNG, GIF, WebP, etc.)
  - `documents/` - Documentos (PDF, Word, Excel, PowerPoint, etc.)
  - `videos/` - Videos (MP4, AVI, MOV, etc.)
  - `audio/` - Audio (MP3, WAV, FLAC, etc.)
  - `archives/` - Archivos comprimidos (ZIP, RAR, 7Z, etc.)
  - `other/` - Otros tipos de archivo
- **Seguridad robusta**: Rate limiting, validación de archivos, sanitización
- **Validación de archivos**: Verificación de tipo MIME y firma de archivos
- **Almacenamiento S3**: Integración completa con AWS S3
- **API RESTful**: Endpoints para listar, subir, obtener y eliminar archivos
- **Filtrado por categoría**: Listar archivos filtrados por tipo
- **Logging**: Sistema de logging estructurado
- **Testing**: Tests unitarios con Jest
- **TypeScript**: Tipado fuerte y mejor experiencia de desarrollo
- **Docker ready**: Configuración para contenedores

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- npm o yarn
- Cuenta de AWS con acceso a S3
- Bucket de S3 configurado

## 🛠️ Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd s3-file-upload-ddd
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
S3_BUCKET_NAME=tu-bucket-name

# Server Configuration
PORT=3000
NODE_ENV=development

# Security Configuration
JWT_SECRET=tu-jwt-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=524288000
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

4. **Compilar el proyecto**

```bash
npm run build
```

5. **Ejecutar en modo desarrollo**

```bash
npm run dev
```

## 🔧 Scripts Disponibles

- `npm run build` - Compilar TypeScript a JavaScript
- `npm run dev` - Ejecutar en modo desarrollo con hot reload
- `npm start` - Ejecutar la aplicación compilada
- `npm test` - Ejecutar tests unitarios
- `npm run test:watch` - Ejecutar tests en modo watch
- `npm run test:coverage` - Ejecutar tests con reporte de cobertura
- `npm run lint` - Ejecutar ESLint
- `npm run lint:fix` - Ejecutar ESLint y corregir automáticamente
- `npm run format` - Formatear código con Prettier

## 📡 API Endpoints

### Listar archivos

```http
GET /api/files?category=images&limit=10&offset=0
```

**Parámetros de consulta:**

- `category` (opcional): Filtrar por categoría (images, documents, videos, audio, archives, other)
- `limit` (opcional): Número máximo de archivos a retornar (default: 50)
- `offset` (opcional): Número de archivos a omitir (default: 0)

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "fileId": "uuid-del-archivo",
        "fileName": "imagen.jpg",
        "size": 2048000,
        "mimeType": "image/jpeg",
        "category": "images",
        "status": "uploaded",
        "url": "https://bucket.s3.amazonaws.com/images/imagen.jpg",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 25,
    "categories": [
      {
        "name": "images",
        "displayName": "Imágenes",
        "count": 15
      },
      {
        "name": "documents",
        "displayName": "Documentos",
        "count": 10
      }
    ]
  }
}
```

### Subir archivo

```http
POST /api/files/upload
Content-Type: multipart/form-data

Form data:
- file: archivo a subir
- uploadedBy: (opcional) identificador del usuario
- description: (opcional) descripción del archivo
- tags: (opcional) JSON con etiquetas
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": {
    "fileId": "uuid-del-archivo",
    "fileName": "documento.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "category": "documents",
    "status": "uploaded",
    "url": "https://bucket.s3.amazonaws.com/documents/documento.pdf",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Obtener información de archivo

```http
GET /api/files/:fileId
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "fileId": "uuid-del-archivo",
    "fileName": "documento.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "status": "uploaded",
    "url": "https://bucket.s3.amazonaws.com/archivo.pdf",
    "metadata": {
      "uploadedBy": "user123",
      "description": "Documento importante"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Eliminar archivo

```http
DELETE /api/files/:fileId
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "File documento.pdf deleted successfully"
  }
}
```

### Health Check

```http
GET /api/files/health
```

## 🔒 Seguridad

### Rate Limiting

- **Subidas**: 10 archivos por IP cada 15 minutos
- **General**: 100 requests por IP cada 15 minutos

### Validación de Archivos

- Verificación de tipo MIME
- Validación de firma de archivo
- Límite de tamaño configurable
- Sanitización de nombres de archivo
- Tipos de archivo permitidos configurables

### Configuración de S3

- Encriptación server-side (AES256)
- Metadatos de seguridad
- URLs firmadas para acceso controlado

## 🧪 Testing

El proyecto incluye tests unitarios para los componentes críticos:

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

### Estructura de Tests

```
src/__tests__/
├── domain/           # Tests de entidades y value objects
├── application/      # Tests de casos de uso
└── infrastructure/   # Tests de adaptadores
```

## 🏗️ Patrones de Diseño Implementados

### Domain-Driven Design (DDD)

- **Entidades**: `FileEntity` con identidad y comportamiento
- **Value Objects**: `FileName`, `FileSize`, `MimeType`, `S3Key`
- **Repositorios**: Abstracción para persistencia
- **Servicios de Dominio**: Lógica de negocio compleja

### Arquitectura Hexagonal

- **Puertos**: Interfaces en el dominio
- **Adaptadores**: Implementaciones en infraestructura
- **Casos de Uso**: Orquestación de la lógica de negocio

### SOLID Principles

- **S**ingle Responsibility: Cada clase tiene una responsabilidad
- **O**pen/Closed: Extensible sin modificar código existente
- **L**iskov Substitution: Interfaces bien definidas
- **I**nterface Segregation: Interfaces específicas
- **D**ependency Inversion: Dependencias hacia abstracciones

## 🐳 Docker

Crear archivo `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]
```

Crear `docker-compose.yml`:

```yaml
version: '3.8'
services:
  file-upload-service:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    env_file:
      - .env
```

## 📊 Monitoreo y Logging

El servicio incluye:

- Request logging detallado
- Error tracking con contexto
- Métricas de performance
- Health checks

## 🔧 Configuración de AWS

### Permisos IAM necesarios

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::tu-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::tu-bucket-name"
    }
  ]
}
```

### Configuración del Bucket S3

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tu-bucket-name/*"
    }
  ]
}
```

## 🚀 Despliegue

### Variables de Entorno de Producción

```env
NODE_ENV=production
PORT=3000
AWS_REGION=us-east-1
# ... otras variables
```

### Consideraciones de Producción

- Usar un load balancer
- Configurar HTTPS
- Implementar monitoring
- Configurar backup del bucket S3
- Usar AWS CloudFront para CDN

## 🤝 Contribución

1. Fork el proyecto
2. Crear una feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🔗 Links Útiles

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Domain-Driven Design](https://domainlanguage.com/ddd/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
