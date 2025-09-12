module.exports = {
  apps: [
    {
      name: 'aws-s3-uploader',
      script: './dist/index.js',
      instances: 'max', // Usa todos los cores disponibles
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        AWS_REGION: 'us-east-1',
        S3_BUCKET_NAME: 'imp-datas',
        MAX_FILE_SIZE: '10485760',
        RATE_LIMIT_WINDOW_MS: '900000',
        RATE_LIMIT_MAX_REQUESTS: '100',
      },
      // Configuración de watch para desarrollo
      watch: false, // Deshabilitado por defecto para producción
      ignore_watch: [
        'node_modules',
        'logs',
        'dist',
        '.git',
        '*.log',
        'temp',
        'uploads',
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: false,
      },
      // Configuración de logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Configuración de restart
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      // Auto restart en caso de crash
      autorestart: true,
      // Configuración de monitoreo
      monitoring: false,
      // Configuración de cluster
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Variables de entorno específicas
      env_file: '.env',
      // Configuración de merge logs
      merge_logs: true,
      // Configuración de tiempo
      time: true,
    },
    // Configuración adicional para desarrollo con watch
    {
      name: 'aws-s3-uploader-dev',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: true,
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '*.log',
        'temp',
        'uploads',
        'test',
        'coverage',
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: false,
      },
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      log_file: './logs/dev-combined.log',
      out_file: './logs/dev-out.log',
      error_file: './logs/dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 5,
      min_uptime: '5s',
      autorestart: true,
      env_file: '.env',
      merge_logs: true,
      time: true,
    },
  ],

  // Configuración de deploy (opcional)
  deploy: {
    production: {
      user: 'node',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:Einzas/aws-s3-uploader.git',
      path: '/var/www/aws-s3-uploader',
      'pre-deploy-local': '',
      'post-deploy':
        'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
    staging: {
      user: 'node',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:Einzas/aws-s3-uploader.git',
      path: '/var/www/aws-s3-uploader-staging',
      'post-deploy':
        'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
    },
  },
};
