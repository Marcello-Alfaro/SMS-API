module.exports = {
  apps: [
    {
      name: 'SMS-Service',
      script: './app.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: true,
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'production',
        API_URL: 'https://103-90-163-62.cloud-xip.com',
        API_PATH: '/api2',
        SOCKET_NAMESPACE: '/sms-service',
        SERIAL_PORT: '/dev/ttyUSB0',
        LOGS_DESTINATION: '../.pm2/logs/SMS-Service-out-2.log',
        JWT_SECRET: '6bf52822-f5ea-4602-b509-9dde31cb0da3',
        SENDGRID_API_KEY: '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',
        FROM_EMAIL: 'fileshakes@gmail.com',
        TO_EMAIL: 'marcello.alfaro1@gmail.com',
      },
    },
  ],
};
