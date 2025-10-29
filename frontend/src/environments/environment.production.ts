export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api', // Update with your production API URL
  api: {
    timeout: 30000,
    retryAttempts: 3
  },
  auth: {
    tokenKey: 'loan_screening_token',
    refreshTokenKey: 'loan_screening_refresh_token',
    tokenExpiryBuffer: 300000
  },
  features: {
    enableNotifications: true,
    enableFileUpload: true,
    maxFileSize: 10485760,
    allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp']
  }
};