# Deployment Guide

## Production Deployment

### 1. Environment Variables

Ensure all required environment variables are set:

```bash
# Required
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_production_access_key
AWS_SECRET_ACCESS_KEY=your_production_secret_key
S3_BUCKET_NAME=your-production-bucket

# Server
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=your-strong-jwt-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Build and Start

```bash
npm run build
npm start
```

### 3. Docker Deployment

```bash
# Build image
docker build -t file-upload-service .

# Run container
docker run -d \
  --name file-upload-service \
  -p 3000:3000 \
  --env-file .env \
  file-upload-service
```

### 4. Docker Compose

```bash
docker-compose up -d
```

## AWS Setup

### IAM User Policy

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
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

### S3 Bucket Configuration

1. Create bucket with appropriate name
2. Enable versioning (recommended)
3. Configure CORS if needed:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

## Health Monitoring

The service provides health check endpoints:

- `GET /api/files/health` - Service health
- `GET /` - Basic service info

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Rate Limiting**: Configure appropriate rate limits
3. **File Validation**: Ensure virus scanning if handling user uploads
4. **Logging**: Monitor all file operations
5. **Access Control**: Implement authentication if needed

## Performance Optimization

1. **CDN**: Use CloudFront for file delivery
2. **Compression**: Enable gzip compression
3. **Caching**: Implement appropriate caching headers
4. **Load Balancing**: Use multiple instances behind a load balancer
