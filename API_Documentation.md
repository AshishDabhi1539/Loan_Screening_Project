# 🏦 Loan Screening & Fraud Detection System - Complete API Documentation

## 📋 Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Public APIs](#public-apis)
3. [Loan Application APIs](#loan-application-apis)
4. [Document Management APIs](#document-management-apis)
5. [Admin APIs](#admin-apis)
6. [Common Response Formats](#common-response-formats)
7. [Error Handling](#error-handling)
8. [Security & Authorization](#security--authorization)

---

## 🔐 Authentication APIs

### Base URL: `/api/auth`

#### 1. **User Registration**
- **Endpoint**: `POST /api/auth/register`
- **Description**: Register a new user account
- **Access**: Public
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+919876543210",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "acceptTerms": true
}
```

**Response (201 Created):**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "status": "PENDING_VERIFICATION",
  "role": "APPLICANT",
  "requiresEmailVerification": true,
  "requiresPhoneVerification": false,
  "message": "📧 Registration successful! Your account is PENDING_VERIFICATION. Please check your email and verify to activate your account.",
  "timestamp": "2025-10-09T14:30:00"
}
```

---

#### 2. **User Login**
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticate user and get JWT token
- **Access**: Public
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com",
  "password": "SecurePassword123!",
  "rememberMe": false
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "expiresAt": "2025-10-10T14:35:00",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "APPLICANT",
  "message": "🎉 Login successful! Welcome back."
}
```

---

#### 3. **Email OTP Verification**
- **Endpoint**: `POST /api/auth/verify-email`
- **Description**: Verify email using OTP to activate account
- **Access**: Public
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456",
  "otpType": "EMAIL_VERIFICATION"
}
```

**Response (200 OK):**
```json
{
  "message": "🎉 Account activated successfully! Welcome user@example.com. Your account is now ACTIVE and you can login with your credentials.",
  "timestamp": "2025-10-09T14:35:00",
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "status": "ACTIVE",
  "role": "APPLICANT",
  "requiresEmailVerification": false,
  "requiresPhoneVerification": false
}
```

---

#### 4. **Resend Email OTP**
- **Endpoint**: `POST /api/auth/resend-otp`
- **Description**: Resend OTP to user's email
- **Access**: Public
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
"OTP sent successfully to your email address"
```

---

#### 5. **User Logout**
- **Endpoint**: `POST /api/auth/logout`
- **Description**: Logout user and invalidate JWT token
- **Access**: Authenticated
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):**
```json
"Logged out successfully"
```

---

## 🌐 Public APIs

### Base URL: `/api/public`

#### 1. **Health Check**
- **Endpoint**: `GET /api/public/health`
- **Description**: Check service health status
- **Access**: Public

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "UP",
    "timestamp": "2025-10-09T14:30:00",
    "service": "Loan Screening App",
    "version": "1.0.0"
  },
  "timestamp": "2025-10-09T14:30:00"
}
```

---

#### 2. **Application Info**
- **Endpoint**: `GET /api/public/info`
- **Description**: Get application information and features
- **Access**: Public

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Application information",
  "data": {
    "application": "Loan Screening & Fraud Detection System",
    "version": "1.0.0",
    "description": "Comprehensive loan applicant screening system with fraud detection",
    "features": [
      "User Registration & Authentication",
      "Email OTP Verification",
      "Role-based Access Control",
      "JWT Security",
      "Audit Logging",
      "Email Notifications"
    ]
  },
  "timestamp": "2025-10-09T14:30:00"
}
```

---

## 📋 Loan Application APIs

### Base URL: `/api/loan-application`
### Required Role: `APPLICANT`

### 🔄 **CORRECT FLOW SEQUENCE:**
1. **First**: `POST /api/loan-application/personal-details` - Complete personal details
2. **Then**: `POST /api/loan-application/create` - Create loan application
3. **Then**: `POST /api/loan-application/{id}/financial-details` - Add financial details
4. **Then**: `POST /api/loan-application/{id}/documents/upload` - Upload required documents (multiple calls)
5. **Optional**: `PUT /api/loan-application/{id}/personal-details` - Update personal details
6. **Optional**: `PUT /api/loan-application/{id}/financial-details` - Update financial details
7. **Finally**: `POST /api/loan-application/{id}/submit` - Submit application (validates all requirements)

**⚠️ IMPORTANT**: Personal details → Loan Application → Financial Details → Documents → Submit!

#### 1. **Create Loan Application**
- **Endpoint**: `POST /api/loan-application/create`
- **Description**: Create a new loan application (requires personal details)
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "loanType": "PERSONAL_LOAN",
  "loanAmount": 500000.00,
  "tenureMonths": 24,
  "purpose": "Home renovation and furniture purchase",
  "additionalNotes": "Stable income, good credit history"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "loanType": "PERSONAL_LOAN",
  "requestedAmount": 500000.00,
  "tenureMonths": 24,
  "status": "DRAFT",
  "message": "✅ Loan application created successfully!",
  "createdAt": "2025-10-09T14:30:00",
  "nextStep": "Add Financial Details",
  "nextStepUrl": "/api/loan-application/550e8400-e29b-41d4-a716-446655440001/financial-details"
}
```

---

#### 2. **Check Profile Status**
- **Endpoint**: `GET /api/loan-application/profile-status`
- **Description**: Check if user has completed personal details
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "hasPersonalDetails": true,
  "message": "✅ Personal details completed. You can now apply for loans.",
  "nextAction": "Apply for Loan",
  "nextActionUrl": "/api/loan-application/create"
}
```

**Response (200 OK) - Profile Incomplete:**
```json
{
  "hasPersonalDetails": false,
  "message": "⚠️ Personal details required. Please complete your profile to apply for loans.",
  "nextAction": "Complete Profile",
  "nextActionUrl": "/api/loan-application/personal-details"
}
```

---

#### 3. **Create/Update Personal Details** ⭐ **MAIN ENDPOINT**
- **Endpoint**: `POST /api/loan-application/personal-details`
- **Description**: Create or update personal details (REQUIRED BEFORE creating loan application)
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `application/json`
- **Note**: This is the PRIMARY endpoint for personal details - no applicationId needed!

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "middleName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  "maritalStatus": "MARRIED",
  "fatherName": "Robert Smith",
  "motherName": "Mary Smith",
  "panNumber": "ABCDE1234F",
  "aadhaarNumber": "123456789012",
  "currentAddressLine1": "123 Main Street",
  "currentAddressLine2": "Apartment 4B",
  "currentCity": "Mumbai",
  "currentState": "Maharashtra",
  "currentPincode": "400001",
  "sameAsCurrent": false,
  "permanentAddressLine1": "456 Oak Avenue",
  "permanentAddressLine2": "House No. 12",
  "permanentCity": "Pune",
  "permanentState": "Maharashtra",
  "permanentPincode": "411001"
}
```

**Response (200 OK):**
```json
{
  "message": "✅ Personal details updated successfully! You can now apply for loans.",
  "canApplyForLoan": true,
  "nextAction": "Apply for Loan",
  "nextActionUrl": "/api/loan-application/create",
  "updatedAt": "2025-10-09T15:20:00"
}
```

---

#### 4. **Update Personal Details for Application** 🔄 **SECONDARY ENDPOINT**
- **Endpoint**: `PUT /api/loan-application/{applicationId}/personal-details`
- **Description**: Update personal details for EXISTING loan application (fetches existing data from application context)
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `application/json`
- **Note**: Only use this if you already have a loan application and want to update its personal details

**Request Body:** Same as Create Personal Details

**Response (200 OK):**
```json
{
  "applicationId": "550e8400-e29b-41d4-a716-446655440001",
  "message": "✅ Personal details updated successfully!",
  "isComplete": false,
  "nextStep": "Complete Financial Details",
  "nextStepUrl": "/api/loan-application/550e8400-e29b-41d4-a716-446655440001/financial-details",
  "updatedAt": "2025-10-09T14:30:00"
}
```

**Response (200 OK) - Application Complete:**
```json
{
  "applicationId": "550e8400-e29b-41d4-a716-446655440001",
  "message": "✅ Personal details updated successfully!",
  "isComplete": true,
  "nextStep": "Submit Application",
  "nextStepUrl": "/api/loan-application/550e8400-e29b-41d4-a716-446655440001/submit",
  "updatedAt": "2025-10-09T14:30:00"
}
```

---

#### 5. **Create Financial Details** ⭐ **REQUIRED**
- **Endpoint**: `POST /api/loan-application/{applicationId}/financial-details`
- **Description**: Create financial details for loan application (REQUIRED after creating application)
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "employmentType": "SALARIED",
  "companyName": "Tech Solutions Pvt Ltd",
  "jobTitle": "Senior Software Engineer",
  "employmentStartDate": "2020-01-15",
  "companyAddress": "123 Tech Park",
  "companyCity": "Bangalore",
  "companyState": "Karnataka",
  "companyPincode": "560001",
  "incomeType": "SALARY",
  "monthlyIncome": 75000.00,
  "additionalIncome": 10000.00,
  "existingLoanEmi": 15000.00,
  "creditCardOutstanding": 25000.00,
  "monthlyExpenses": 30000.00,
  "bankAccountBalance": 150000.00,
  "bankName": "HDFC Bank",
  "accountNumber": "12345678901234",
  "ifscCode": "HDFC0001234",
  "accountType": "SAVINGS"
}
```

**Response (201 Created):**
```json
{
  "applicationId": "550e8400-e29b-41d4-a716-446655440001",
  "message": "✅ Financial details created successfully!",
  "isComplete": false,
  "nextStep": "Upload Required Documents",
  "nextStepUrl": "/api/loan-application/550e8400-e29b-41d4-a716-446655440001/documents/upload",
  "updatedAt": "2025-10-09T15:30:00"
}
```

---

#### 6. **Update Financial Details**
- **Endpoint**: `PUT /api/loan-application/{applicationId}/financial-details`
- **Description**: Update existing financial details for loan application
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `application/json`

**Request Body:** Same as Create Financial Details

**Response (200 OK):**
```json
{
  "applicationId": "550e8400-e29b-41d4-a716-446655440001",
  "message": "✅ Financial details updated successfully!",
  "isComplete": false,
  "nextStep": "Upload Required Documents",
  "nextStepUrl": "/api/loan-application/550e8400-e29b-41d4-a716-446655440001/documents/upload",
  "updatedAt": "2025-10-09T15:30:00"
}
```

---

#### 7. **Upload Document** 📄 **REQUIRED STEP**
- **Endpoint**: `POST /api/loan-application/{applicationId}/documents/upload`
- **Description**: Upload required documents for loan application (call multiple times for different documents)
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`

**Required Documents:**
- `PAN_CARD` - PAN Card copy
- `AADHAAR_CARD` - Aadhaar Card copy
- `SALARY_SLIP` - Latest 3 months salary slips
- `BANK_STATEMENT` - Last 6 months bank statements
- `EMPLOYMENT_CERTIFICATE` - Employment verification letter

**Request Parameters:**
- `file`: MultipartFile (required)
- `documentType`: DocumentType enum (required - see above list)

**Response (201 Created):**
```json
{
  "documentId": 1,
  "applicationId": "550e8400-e29b-41d4-a716-446655440001",
  "documentType": "PAN_CARD",
  "fileName": "pan_card.pdf",
  "message": "✅ Document uploaded successfully!",
  "canSubmitApplication": false,
  "nextStep": "Upload More Documents",
  "nextStepUrl": "/api/loan-application/550e8400-e29b-41d4-a716-446655440001/documents/upload",
  "uploadedAt": "2025-10-09T16:30:00",
  "totalDocumentsUploaded": 1,
  "requiredDocumentsCount": 5
}
```

**Response when all documents uploaded:**
```json
{
  "documentId": 5,
  "applicationId": "550e8400-e29b-41d4-a716-446655440001",
  "documentType": "EMPLOYMENT_CERTIFICATE",
  "fileName": "employment_cert.pdf",
  "message": "✅ All required documents uploaded! Ready to submit application.",
  "canSubmitApplication": true,
  "nextStep": "Submit Application",
  "nextStepUrl": "/api/loan-application/550e8400-e29b-41d4-a716-446655440001/submit",
  "uploadedAt": "2025-10-09T16:30:00",
  "totalDocumentsUploaded": 5,
  "requiredDocumentsCount": 5
}
```

---

#### 7. **Get Application Documents**
- **Endpoint**: `GET /api/loan-application/{applicationId}/documents`
- **Description**: Get all documents for loan application
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):** Returns List<LoanDocument>

---

#### 8. **Submit Loan Application**
- **Endpoint**: `POST /api/loan-application/{applicationId}/submit`
- **Description**: Submit loan application for review
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):** Returns updated LoanApplication entity

---

#### 9. **Get Loan Application**
- **Endpoint**: `GET /api/loan-application/{applicationId}`
- **Description**: Get loan application by ID
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):** Returns LoanApplicationResponse

---

#### 10. **Get My Applications**
- **Endpoint**: `GET /api/loan-application/my-applications`
- **Description**: Get all loan applications for current user
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):** Returns List<LoanApplicationResponse>

---

#### 11. **Get Application Progress**
- **Endpoint**: `GET /api/loan-application/{applicationId}/progress`
- **Description**: Get completion progress percentage
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):**
```json
75
```

---

#### 12. **Check Application Completion**
- **Endpoint**: `GET /api/loan-application/{applicationId}/complete`
- **Description**: Check if application is complete
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):**
```json
true
```

---

## 📄 Document Management APIs

### Base URL: `/api/documents`
### Required Role: `APPLICANT`

#### 1. **Upload Multiple Documents**
- **Endpoint**: `POST /api/documents/upload-multiple`
- **Description**: Upload multiple documents at once
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`

**Request Parameters:**
- `files`: List<MultipartFile> (required)
- `documentTypes`: List<DocumentType> (required)
- `loanApplicationId`: UUID (required)

**Response (201 Created):** Returns List<LoanDocument>

---

#### 2. **Get Document**
- **Endpoint**: `GET /api/documents/{documentId}`
- **Description**: Get document details by ID
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):** Returns LoanDocument entity

---

#### 3. **Get Document URL**
- **Endpoint**: `GET /api/documents/{documentId}/url`
- **Description**: Get document URL for viewing/downloading
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):**
```json
"https://cloudinary.com/documents/abc123.pdf"
```

---

#### 4. **Delete Document**
- **Endpoint**: `DELETE /api/documents/{documentId}`
- **Description**: Delete document
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):**
```json
"Document deleted successfully"
```

---

#### 5. **Get Supported Document Types**
- **Endpoint**: `GET /api/documents/types`
- **Description**: Get all supported document types
- **Access**: APPLICANT role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):**
```json
[
  "PAN_CARD",
  "AADHAAR_CARD",
  "PASSPORT",
  "DRIVING_LICENSE",
  "SALARY_SLIP",
  "BANK_STATEMENT",
  "ITR_DOCUMENT",
  "EMPLOYMENT_CERTIFICATE",
  "PROPERTY_DOCUMENT",
  "OTHER"
]
```

---

## 👨‍💼 Admin APIs

### Base URL: `/api/admin`
### Required Role: `ADMIN`

#### 1. **Create Officer Account**
- **Endpoint**: `POST /api/admin/create-officer`
- **Description**: Create a new loan officer account
- **Access**: ADMIN role
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "email": "officer@company.com",
  "phone": "+919876543211",
  "role": "LOAN_OFFICER",
  "password": "TempPassword123!"
}
```

**Response (201 Created):**
```json
"Officer account created successfully. Credentials sent to email: officer@company.com"
```

---

#### 2. **Get All Officers**
- **Endpoint**: `GET /api/admin/officers`
- **Description**: Get list of all loan officers
- **Access**: ADMIN role
- **Headers**: `Authorization: Bearer <token>`

**Response (200 OK):** Returns List<User> (officers only)

---

## 📋 Field Validation Rules

### User Registration Validation
- **Email**: Valid email format, max 150 characters
- **Phone**: Indian mobile number (10 digits, starting with 6-9)
- **Password**: 8-100 characters, must contain uppercase, lowercase, digit, and special character (@$!%*?&)
- **Accept Terms**: Must be true

### Personal Details Validation
- **PAN Number**: Format ABCDE1234F (5 letters, 4 digits, 1 letter)
- **Aadhaar Number**: Exactly 12 digits
- **Pincode**: Exactly 6 digits
- **Date of Birth**: Must be in the past

### Financial Details Validation
- **Monthly Income**: Minimum ₹10,000
- **Loan Amount**: Minimum ₹10,000
- **All amounts**: Cannot be negative

### OTP Validation
- **OTP Code**: Exactly 6 digits
- **OTP Type**: EMAIL_VERIFICATION, LOGIN_2FA, or PASSWORD_RESET

---

## 🔢 Enum Values

### LoanType
```
PERSONAL_LOAN, HOME_LOAN, CAR_LOAN, EDUCATION_LOAN, BUSINESS_LOAN, GOLD_LOAN
```

### Gender
```
MALE, FEMALE, OTHER
```

### MaritalStatus
```
SINGLE, MARRIED, DIVORCED, WIDOWED
```

### EmploymentType
```
SALARIED, SELF_EMPLOYED, BUSINESS_OWNER, FREELANCER, RETIRED, UNEMPLOYED
```

### IncomeType
```
SALARY, BUSINESS_INCOME, RENTAL_INCOME, INVESTMENT_INCOME, PENSION, OTHER
```

### DocumentType
```
PAN_CARD, AADHAAR_CARD, PASSPORT, DRIVING_LICENSE, SALARY_SLIP, BANK_STATEMENT, ITR_DOCUMENT, EMPLOYMENT_CERTIFICATE, PROPERTY_DOCUMENT, OTHER
```

### RoleType
```
APPLICANT, LOAN_OFFICER, COMPLIANCE_OFFICER, ADMIN
```

---

## 📊 Common Response Formats

### Success Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "timestamp": "2025-10-09T14:30:00"
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": "Detailed error information",
  "timestamp": "2025-10-09T14:30:00"
}
```

---

## ⚠️ Error Handling

### Common HTTP Status Codes

| Status Code | Description | Example |
|-------------|-------------|---------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate data (email exists) |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server-side errors |

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  },
  "timestamp": "2025-10-09T14:30:00"
}
```

---

## 🔒 Security & Authorization

### Authentication
- **Type**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Token Expiry**: 24 hours
- **Refresh**: Login again to get new token

### Role-based Access Control

| Role | Access Level | Endpoints |
|------|-------------|-----------|
| **APPLICANT** | User Level | `/api/loan-application/*`, `/api/documents/*` |
| **LOAN_OFFICER** | Officer Level | Application review, fraud checks |
| **COMPLIANCE_OFFICER** | Compliance Level | Final decisions, investigations |
| **ADMIN** | Admin Level | `/api/admin/*`, User management |

### Rate Limiting
- **Authentication endpoints**: 5 requests per minute
- **File upload endpoints**: 10 requests per minute
- **General endpoints**: 100 requests per minute

### Security Headers
```
Content-Type: application/json
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## 📝 Notes

1. **Personal Details Required**: Users must complete personal details before creating loan applications
2. **Progressive Data Collection**: Users can update details at any stage
3. **File Upload Limits**: Maximum 10MB per file, supported formats: PDF, JPG, PNG
4. **Smart Name Resolution**: System uses personal details name if available, falls back to email
5. **Audit Trail**: All actions are logged for compliance and security
6. **Email Notifications**: Automatic notifications sent at each stage

---

## 🚀 Getting Started

1. **Register**: Create account using `/api/auth/register`
2. **Verify Email**: Use OTP from email with `/api/auth/verify-email`
3. **Login**: Get JWT token using `/api/auth/login`
4. **Complete Profile**: Add personal details using `/api/loan-application/personal-details`
5. **Apply for Loan**: Create application using `/api/loan-application/create`
6. **Upload Documents**: Add required documents
7. **Submit**: Submit application for review

---

**🏦 Loan Screening & Fraud Detection System v1.0.0**  
**📧 Support**: support@loanscreening.com  
**📱 Last Updated**: October 9, 2025
