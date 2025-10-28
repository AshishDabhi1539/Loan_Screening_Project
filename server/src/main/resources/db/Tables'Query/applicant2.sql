📉 Applicant 2: Vikram Singh – High-Risk Defaulter
➕ Internal DB Records

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8'), 'vikram.singh@example.com', '9876543211', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_02', '2025-10-10 10:00:00.000000', '2025-10-10 10:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o9'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8'),
  'Vikram', 'Singh', '1985-08-22', 'Male', 'SINGLE', 'Indian',
  '987654321098', 'XYZPS5678E', '9876543211', 'vikram.singh@example.com',
  '789 Slum Area, Delhi', 'Delhi', 'Delhi', '110001',
  '789 Slum Area, Delhi', 'Delhi', 'Delhi', '110001',
  1, 0, 'Raj Singh', 'Sita Singh',
  1, 1, '2025-10-10 10:00:00.000000', '2025-10-10 10:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore, decisionType, rejectionReason
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p4'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8'),
  'Vikram Singh', 'vikram.singh@example.com', '9876543211',
  'PERSONAL_LOAN', 200000.00, 24, 'Medical emergency',
  'REJECTED', 'CRITICAL', 850, 95, 1, '2025-10-10 10:30:00.000000', '2025-10-10 10:00:00.000000', '2025-10-10 10:35:00.000000', 1,
  520, 'AUTO_REJECTED', 'Active default and high fraud score'
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p4'), 'SALARIED', 'Unknown Pvt Ltd', 'Clerk', '2023-01-01',
  25000.00, 18000.00, 20000.00,
  'FAILED', 'FAILED', 'FAILED',
  'Punjab National Bank', '12345678901234', 'PNBN0001234',
  '2025-10-10 10:00:00.000000', '2025-10-10 10:00:00.000000', 1
);

➕ External DB Records (High Risk)
-- bank_details
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0q5'), 
  '987654321098', 'XYZPS5678E', '12345678901234', 'Punjab National Bank', 'Savings',
  25000.00, 20000.00, 3000.00, 2.0,
  1, 5, 1, '2025-10-09 00:00:00.000000'
);

-- fraud_records
INSERT INTO fraud_records (
  fraud_id, aadhaar_number, pan_number, fraud_type, severity_level,
  reported_date, resolved_flag, source_authority, remarks
) VALUES (
  UUID_TO_BIN('h8i9j0k1-l2m3-4567-n8o9-p0q1r2s3t4u8'),
  '987654321098', 'XYZPS5678E', 'LOAN_DEFAULT', 'HIGH',
  '2024-05-15', 0, 'CIBIL', 'Defaulted on personal loan in 2024'
);

-- loan_history (active default)
INSERT INTO loan_history (
  loan_id, aadhaar_number, pan_number, loan_type, loan_amount, current_outstanding,
  emi_amount, start_date, end_date, loan_status, default_flag,
  late_payment_count, missed_payments, secured_flag, last_payment_date, last_updated
) VALUES (
  UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v9'), 
  '987654321098', 'XYZPS5678E', 'PERSONAL_LOAN', 150000.00, 120000.00,
  6000.00, '2023-06-01', NULL, 'ACTIVE', 1,
  8, 5, 0, '2024-02-01', '2025-10-09 00:00:00.000000'
);

-- credit_score_history
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('j0k1l2m3-n4o5-6789-p0q1-r2s3t4u5v6w0'),
  '987654321098', 'XYZPS5678E', 520, 3, 2,
  24000.00, 180000.00, 1, 'HIGH',
  '2025-10-09 00:00:00.000000', 'Multiple defaults, high risk'
);


