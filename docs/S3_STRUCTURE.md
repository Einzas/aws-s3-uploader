# Estructura de Archivos en S3

## Organización Automática por Categorías

El sistema organiza automáticamente los archivos en carpetas según su tipo MIME:

```
s3://tu-bucket-name/
├── images/
│   ├── 2024-09-11T15-30-00-000Z-foto_perfil.jpg
│   ├── 2024-09-11T15-31-15-123Z-logo_empresa.png
│   └── 2024-09-11T15-32-45-456Z-banner.gif
├── documents/
│   ├── 2024-09-11T15-35-00-000Z-contrato.pdf
│   ├── 2024-09-11T15-36-30-789Z-presupuesto.xlsx
│   └── 2024-09-11T15-37-00-012Z-manual_usuario.docx
├── videos/
│   ├── 2024-09-11T15-40-00-000Z-presentacion.mp4
│   └── 2024-09-11T15-41-15-345Z-demo_producto.mov
├── audio/
│   ├── 2024-09-11T15-45-00-000Z-podcast_episodio1.mp3
│   └── 2024-09-11T15-46-30-678Z-musica_fondo.wav
├── archives/
│   ├── 2024-09-11T15-50-00-000Z-backup_datos.zip
│   └── 2024-09-11T15-51-00-901Z-codigo_fuente.tar.gz
└── other/
    └── 2024-09-11T15-55-00-000Z-archivo_especial.bin
```

## Categorías Disponibles

### 🖼️ Imágenes (`images/`)

- **JPEG**: `image/jpeg`, `image/jpg`
- **PNG**: `image/png`
- **GIF**: `image/gif`
- **WebP**: `image/webp`
- **BMP**: `image/bmp`
- **TIFF**: `image/tiff`
- **SVG**: `image/svg+xml`

### 📄 Documentos (`documents/`)

- **PDF**: `application/pdf`
- **Texto**: `text/plain`, `text/csv`, `text/html`
- **Microsoft Word**: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Microsoft Excel**: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Microsoft PowerPoint**: `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- **RTF**: `application/rtf`
- **JSON**: `application/json`

### 🎬 Videos (`videos/`)

- **MP4**: `video/mp4`
- **MPEG**: `video/mpeg`
- **QuickTime**: `video/quicktime`
- **AVI**: `video/x-msvideo`
- **WMV**: `video/x-ms-wmv`
- **WebM**: `video/webm`
- **3GP**: `video/3gpp`
- **FLV**: `video/x-flv`

### 🎵 Audio (`audio/`)

- **MP3**: `audio/mpeg`
- **WAV**: `audio/wav`
- **OGG**: `audio/ogg`
- **AAC**: `audio/aac`
- **M4A**: `audio/x-m4a`
- **FLAC**: `audio/flac`
- **WebM Audio**: `audio/webm`

### 📦 Archivos Comprimidos (`archives/`)

- **ZIP**: `application/zip`
- **RAR**: `application/x-rar-compressed`
- **7Z**: `application/x-7z-compressed`
- **TAR**: `application/x-tar`
- **GZIP**: `application/gzip`
- **BZIP2**: `application/x-bzip2`

### 📁 Otros (`other/`)

- Cualquier archivo que no coincida con las categorías anteriores

## Nomenclatura de Archivos

Cada archivo se guarda con un nombre único que incluye:

1. **Timestamp ISO**: Fecha y hora de subida en formato ISO (con caracteres especiales reemplazados)
2. **Nombre sanitizado**: Nombre original del archivo con caracteres especiales reemplazados por guiones bajos
3. **Extensión original**: Se mantiene la extensión del archivo original

**Formato**: `YYYY-MM-DDTHH-mm-ss-sssZ-nombre_archivo.ext`

**Ejemplo**: `2024-09-11T15-30-45-123Z-mi_documento_importante.pdf`

## Ventajas de esta Organización

✅ **Fácil navegación**: Los archivos están organizados lógicamente por tipo  
✅ **Escalabilidad**: La estructura se mantiene organizada independientemente del volumen  
✅ **Búsqueda eficiente**: Filtrar por categoría es más rápido  
✅ **Administración simplificada**: Fácil aplicar políticas de S3 por carpeta  
✅ **URLs predecibles**: Las URLs siguen un patrón consistente

## Configuración de Políticas S3

Puedes aplicar diferentes políticas por carpeta:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tu-bucket/images/*"
    },
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tu-bucket/documents/*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "203.0.113.0/24"
        }
      }
    }
  ]
}
```

## Migración de Archivos Existentes

Si ya tienes archivos en tu bucket, puedes reorganizarlos usando AWS CLI:

```bash
# Mover imágenes a la carpeta images/
aws s3 mv s3://tu-bucket/foto.jpg s3://tu-bucket/images/foto.jpg

# Mover documentos a la carpeta documents/
aws s3 mv s3://tu-bucket/documento.pdf s3://tu-bucket/documents/documento.pdf
```
