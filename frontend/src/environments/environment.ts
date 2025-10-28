export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 2
  },
  auth: {
    tokenKey: 'loan_screening_token',
    refreshTokenKey: 'loan_screening_refresh_token',
    tokenExpiryBuffer: 300000 // 5 minutes before expiry
  },
  features: {
    enableNotifications: true,
    enableFileUpload: true,
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp']
  }
};