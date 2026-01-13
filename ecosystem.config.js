module.exports = {
  apps: [
    {
      name: 'aws-s3-uploader-prod',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
      // Configuración de logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Configuración de restart
      max_memory_restart: '3G', // Aumentado para archivos grandes
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // No watch en producción
      watch: false,

      // Configuración adicional - Timeouts extendidos
      kill_timeout: 30000, // 30 segundos para shutdown graceful
      wait_ready: true,
      listen_timeout: 30000, // 30 segundos
      merge_logs: true,
      time: true,
      
      // Variables de entorno para Node.js
      node_args: '--max-old-space-size=4096', // 4GB heap para Node.js
    },
  ],
};
