💼 Applicant 9: Karan Malhotra – Business Owner (Textile Exporter)
➕ Internal DB Records

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o5'), 'karan.malhotra@example.com', '9876543218', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_09', '2025-10-10 17:00:00.000000', '2025-10-10 17:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName, spouseName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o6'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o5'),
  'Karan', 'Malhotra', '1982-11-30', 'Male', 'MARRIED', 'Indian',
  '890123456789', 'UVWPS3456L', '9876543218', 'karan.malhotra@example.com',
  '789 Export Complex, Surat', 'Surat', 'Gujarat', '395010',
  '789 Export Complex, Surat', 'Surat', 'Gujarat', '395010',
  1, 2, 'Raj Malhotra', 'Sunita Malhotra', 'Pooja Malhotra',
  1, 1, '2025-10-10 17:00:00.000000', '2025-10-10 17:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q1'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o5'),
  'Karan Malhotra', 'karan.malhotra@example.com', '9876543218',
  'WORKING_CAPITAL_LOAN', 2500000.00, 36, 'Purchase raw materials and manage payroll for export orders',
  'APPROVED', 'MEDIUM', 420, 20, 2, '2025-10-10 17:30:00.000000', '2025-10-10 17:00:00.000000', '2025-10-10 18:00:00.000000', 1,
  720
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses, otherIncome,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode, workAddress, workCity,
  branchName, companyAddress, hrEmail, hrPhone, managerName, managerPhone,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q1'), 'BUSINESS_OWNER', 'Malhotra Textiles Pvt Ltd', 'Director', '2010-05-01',
  180000.00, 45000.00, 90000.00, 0.00,
  'VERIFIED', 'VERIFIED', 'VERIFIED',
  'Kotak Mahindra Bank', '70123456789012', 'KKBK0001234',
  '789 Export Complex', 'Surat',
  'Surat Main Branch', '789 Export Complex, Surat, Gujarat 395010',
  'hr@malhotratextiles.com', '02612345678', 'Rajesh Patel', '9876543290',
  '2025-10-10 17:00:00.000000', '2025-10-10 17:00:00.000000', 1
);

-- loan_documents
INSERT INTO loan_documents (loan_application_id, uploaded_by_id, documentType, fileName, filePath, uploadedAt, verificationStatus, verifiedAt, createdAt, updatedAt)
VALUES
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q1'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o5'), 'AADHAAR_CARD', 'aadhaar.pdf', '/docs/loan_09/aadhaar.pdf', '2025-10-10 17:10:00.000000', 'VERIFIED', '2025-10-10 17:15:00.000000', '2025-10-10 17:10:00.000000', '2025-10-10 17:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q1'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o5'), 'PAN_CARD', 'pan.pdf', '/docs/loan_09/pan.pdf', '2025-10-10 17:10:00.000000', 'VERIFIED', '2025-10-10 17:15:00.000000', '2025-10-10 17:10:00.000000', '2025-10-10 17:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q1'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o5'), 'BUSINESS_REGISTRATION', 'certificate_of_incorporation.pdf', '/docs/loan_09/incorp.pdf', '2025-10-10 17:20:00.000000', 'VERIFIED', '2025-10-10 17:40:00.000000', '2025-10-10 17:20:00.000000', '2025-10-10 17:40:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q1'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o5'), 'GST_CERTIFICATE', 'gst_certificate.pdf', '/docs/loan_09/gst.pdf', '2025-10-10 17:20:00.000000', 'VERIFIED', '2025-10-10 17:45:00.000000', '2025-10-10 17:20:00.000000', '2025-10-10 17:45:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q1'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o5'), 'BALANCE_SHEET', 'balance_sheet_2024.pdf', '/docs/loan_09/bs.pdf', '2025-10-10 17:25:00.000000', 'VERIFIED', '2025-10-10 17:50:00.000000', '2025-10-10 17:25:00.000000', '2025-10-10 17:50:00.000000');


➕ External DB Records

-- bank_details
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0r2'), 
  '890123456789', 'UVWPS3456L', '70123456789012', 'Kotak Mahindra Bank', 'Current',
  180000.00, 90000.00, 450000.00, 14.5,
  0, 0, 1, '2025-10-09 00:00:00.000000'
);

-- credit_score_history
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('j0k1l2m3-n4o5-6789-p0q1-r2s3t4u5v6w7'),
  '890123456789', 'UVWPS3456L', 720, 4, 0,
  175000.00, 850000.00, 0, 'MEDIUM',
  '2025-10-09 00:00:00.000000', 'Strong business cash flow, multiple active loans'
);

-- loan_history (3 active business loans)
INSERT INTO loan_history (
  loan_id, aadhaar_number, pan_number, loan_type, loan_amount, current_outstanding,
  emi_amount, start_date, end_date, loan_status, default_flag,
  late_payment_count, missed_payments, secured_flag, last_payment_date, last_updated
) VALUES
(UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v6'), 
 '890123456789', 'UVWPS3456L', 'BUSINESS_LOAN', 1000000.00, 600000.00,
 35000.00, '2023-01-15', '2028-01-15', 'ACTIVE', 0,
 1, 0, 0, '2025-10-15', '2025-10-09 00:00:00.000000'),
(UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v7'), 
 '890123456789', 'UVWPS3456L', 'EQUIPMENT_FINANCE', 750000.00, 500000.00,
 28000.00, '2024-03-10', '2029-03-10', 'ACTIVE', 0,
 0, 0, 1, '2025-10-10', '2025-10-09 00:00:00.000000'),
(UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v8'), 
 '890123456789', 'UVWPS3456L', 'OVERDRAFT_FACILITY', 500000.00, 250000.00,
 0.00, '2022-06-01', NULL, 'ACTIVE', 0,
 2, 0, 0, '2025-10-05', '2025-10-09 00:00:00.000000');

-- fraud_records (none)
-- (No insert)