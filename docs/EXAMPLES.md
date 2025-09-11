# Ejemplos Prácticos de Uso

## Ejemplo 1: Subir una Imagen de Perfil

```bash
# Subir imagen
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@avatar.jpg" \
  -F "uploadedBy=user123" \
  -F "description=Foto de perfil" \
  -F "tags={\"type\":\"profile\",\"userId\":\"123\"}"
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "fileId": "abc123-def456-ghi789",
    "fileName": "avatar.jpg",
    "size": 245760,
    "mimeType": "image/jpeg",
    "category": "images",
    "status": "uploaded",
    "url": "https://mi-bucket.s3.amazonaws.com/images/2024-09-11T15-30-45-123Z-avatar.jpg",
    "uploadedAt": "2024-09-11T15:30:45.123Z"
  }
}
```

## Ejemplo 2: Listar Todas las Imágenes

```bash
# Obtener solo imágenes
curl "http://localhost:3000/api/files?category=images&limit=10"
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "fileId": "abc123-def456-ghi789",
        "fileName": "avatar.jpg",
        "size": 245760,
        "mimeType": "image/jpeg",
        "category": "images",
        "status": "uploaded",
        "url": "https://mi-bucket.s3.amazonaws.com/images/2024-09-11T15-30-45-123Z-avatar.jpg",
        "createdAt": "2024-09-11T15:30:45.123Z",
        "updatedAt": "2024-09-11T15:30:47.456Z"
      }
    ],
    "total": 1,
    "categories": [
      {
        "name": "images",
        "displayName": "Imágenes",
        "count": 1
      },
      {
        "name": "documents",
        "displayName": "Documentos",
        "count": 0
      }
    ]
  }
}
```

## Ejemplo 3: Subir un Documento y Luego Consultarlo

```bash
# 1. Subir documento
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@contrato.pdf" \
  -F "uploadedBy=admin" \
  -F "description=Contrato de servicios"

# 2. Consultar el archivo específico (usando el fileId de la respuesta anterior)
curl http://localhost:3000/api/files/abc123-def456-ghi789

# 3. Listar todos los documentos
curl "http://localhost:3000/api/files?category=documents"
```

## Ejemplo 4: Aplicación Web Frontend

```javascript
// Función para subir archivo con categorización automática
async function uploadFile(file, metadata = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploadedBy', metadata.uploadedBy || 'anonymous');
  formData.append('description', metadata.description || '');

  if (metadata.tags) {
    formData.append('tags', JSON.stringify(metadata.tags));
  }

  try {
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      console.log(
        `Archivo subido a: ${result.data.category}/${result.data.fileName}`
      );
      console.log(`URL: ${result.data.url}`);
      return result.data;
    } else {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    throw error;
  }
}

// Función para listar archivos por categoría
async function getFilesByCategory(category = null, limit = 20, offset = 0) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  try {
    const response = await fetch(`/api/files?${params}`);
    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Error obteniendo archivos:', error);
    throw error;
  }
}

// Ejemplo de uso
document
  .getElementById('fileInput')
  .addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const uploadedFile = await uploadFile(file, {
        uploadedBy: 'usuario123',
        description: 'Archivo subido desde el frontend',
        tags: { source: 'web-app', timestamp: new Date().toISOString() },
      });

      console.log('¡Archivo subido exitosamente!', uploadedFile);

      // Listar archivos de la misma categoría
      const categoryFiles = await getFilesByCategory(uploadedFile.category);
      console.log(`Archivos en ${uploadedFile.category}:`, categoryFiles.files);
    } catch (error) {
      alert('Error subiendo archivo: ' + error.message);
    }
  });
```

## Ejemplo 5: Gestión de Galería de Imágenes

```javascript
// Crear una galería de imágenes organizada
async function createImageGallery() {
  try {
    // Obtener todas las imágenes
    const result = await getFilesByCategory('images', 50, 0);
    const images = result.files;

    const gallery = document.getElementById('image-gallery');
    gallery.innerHTML = '';

    images.forEach((image) => {
      const imageCard = document.createElement('div');
      imageCard.className = 'image-card';
      imageCard.innerHTML = `
        <img src="${image.url}" alt="${image.fileName}" loading="lazy">
        <div class="image-info">
          <h4>${image.fileName}</h4>
          <p>Tamaño: ${(image.size / 1024).toFixed(2)} KB</p>
          <p>Subido: ${new Date(image.createdAt).toLocaleDateString()}</p>
          <button onclick="deleteFile('${image.fileId}')">Eliminar</button>
        </div>
      `;
      gallery.appendChild(imageCard);
    });

    console.log(`Galería creada con ${images.length} imágenes`);
  } catch (error) {
    console.error('Error creando galería:', error);
  }
}

// Función para eliminar archivo
async function deleteFile(fileId) {
  if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
    return;
  }

  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      console.log('Archivo eliminado:', result.data.message);
      // Recargar la galería
      createImageGallery();
    } else {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    alert('Error eliminando archivo: ' + error.message);
  }
}
```

## Ejemplo 6: Monitoreo y Estadísticas

```javascript
// Obtener estadísticas por categoría
async function getFileStatistics() {
  try {
    const result = await getFilesByCategory(null, 1, 0); // Solo necesitamos las categorías
    const categories = result.categories;

    console.log('📊 Estadísticas de archivos:');
    categories.forEach((category) => {
      if (category.count > 0) {
        console.log(`${category.displayName}: ${category.count} archivos`);
      }
    });

    return categories;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
  }
}

// Crear dashboard de estadísticas
async function createDashboard() {
  const stats = await getFileStatistics();
  const dashboard = document.getElementById('dashboard');

  dashboard.innerHTML = stats
    .map(
      (category) => `
    <div class="stat-card">
      <h3>${category.displayName}</h3>
      <p class="count">${category.count}</p>
      <button onclick="showCategory('${category.name}')">Ver archivos</button>
    </div>
  `
    )
    .join('');
}

async function showCategory(categoryName) {
  const files = await getFilesByCategory(categoryName);
  console.log(`Archivos en ${categoryName}:`, files.files);
  // Mostrar archivos en una modal o página separada
}
```

## Estructura de Carpetas Resultante

Después de subir diferentes tipos de archivos, tu bucket S3 se verá así:

```
mi-bucket-s3/
├── images/
│   ├── 2024-09-11T15-30-45-123Z-avatar.jpg
│   ├── 2024-09-11T15-31-00-456Z-logo.png
│   └── 2024-09-11T15-32-15-789Z-banner.gif
├── documents/
│   ├── 2024-09-11T15-35-00-012Z-contrato.pdf
│   ├── 2024-09-11T15-36-30-345Z-manual.docx
│   └── 2024-09-11T15-37-45-678Z-presupuesto.xlsx
├── videos/
│   └── 2024-09-11T15-40-00-901Z-presentacion.mp4
└── audio/
    └── 2024-09-11T15-45-00-234Z-podcast.mp3
```

¡La organización automática hace que sea muy fácil gestionar y encontrar archivos!
