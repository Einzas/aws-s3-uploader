# API Testing with curl

## Environment Setup

```bash
# Set base URL
BASE_URL="http://localhost:3000"
```

## List files

```bash
# List all files
curl -X GET \
  ${BASE_URL}/api/files \
  -H "Accept: application/json"

# List files by category
curl -X GET \
  "${BASE_URL}/api/files?category=images&limit=10&offset=0" \
  -H "Accept: application/json"

# List files with pagination
curl -X GET \
  "${BASE_URL}/api/files?limit=5&offset=10" \
  -H "Accept: application/json"
```

## Upload a file

```bash
# Upload an image
curl -X POST \
  ${BASE_URL}/api/files/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/image.jpg" \
  -F "uploadedBy=testuser" \
  -F "description=Test image" \
  -F "tags={\"category\":\"profile\",\"priority\":\"high\"}"

# Upload a document
curl -X POST \
  ${BASE_URL}/api/files/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/document.pdf" \
  -F "uploadedBy=testuser" \
  -F "description=Important document"

# Upload a video
curl -X POST \
  ${BASE_URL}/api/files/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/video.mp4" \
  -F "uploadedBy=testuser"
```

## Get file information

```bash
# Replace FILE_ID with actual file ID from upload response
FILE_ID="your-file-id-here"

curl -X GET \
  ${BASE_URL}/api/files/${FILE_ID} \
  -H "Accept: application/json"
```

## Delete a file

```bash
curl -X DELETE \
  ${BASE_URL}/api/files/${FILE_ID}
```

## Health check

```bash
curl -X GET \
  ${BASE_URL}/api/files/health
```

## Server status

```bash
curl -X GET \
  ${BASE_URL}/
```
