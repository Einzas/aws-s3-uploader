module.exports = {
  apps: [
    {
      name: 'aws-s3-uploader-prod',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Configuración de logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Configuración de restart
      max_memory_restart: '1G',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // No watch en producción
      watch: false,

      // Configuración adicional
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      merge_logs: true,
      time: true,
    },
  ],
};
