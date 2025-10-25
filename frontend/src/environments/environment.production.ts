export const environment = {
  production: true,
  apiUrl: 'https://your-production-api-url.com/api',
  appName: 'Loan Screening Application',
  version: '1.0.0',
  enableLogging: false,
  tokenExpirationTime: 3600000, // 1 hour in milliseconds
  refreshTokenExpirationTime: 604800000, // 7 days in milliseconds
  fileUploadMaxSize: 10485760, // 10MB in bytes
  supportedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100
  },
  features: {
    enableNotifications: true,
    enableFileUpload: true,
    enableRealTimeUpdates: true,
    enableAnalytics: true
  }
};
