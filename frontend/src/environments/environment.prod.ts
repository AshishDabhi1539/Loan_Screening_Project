export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api',
  appName: 'Loan Screening App',
  version: '1.0.0',
  features: {
    enableDemoCredentials: false,
    enableEmailVerification: true,
    enablePhoneVerification: true,
    enableFileUpload: true,
    enableNotifications: true
  },
  storage: {
    tokenKey: 'loan_app_token',
    userKey: 'loan_app_user',
    refreshTokenKey: 'loan_app_refresh_token'
  },
  api: {
    timeout: 30000,
    retryAttempts: 3
  }
};
