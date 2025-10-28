💅 Applicant 12: Ayesha Rahman – Self-Employed (Beauty Salon Owner)
➕ Internal DB Records

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o8'), 'ayesha.rahman@example.com', '9876543221', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_12', '2025-10-10 20:00:00.000000', '2025-10-10 20:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName, spouseName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o9'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o8'),
  'Ayesha', 'Rahman', '1993-06-18', 'Female', 'MARRIED', 'Indian',
  '223344556677', 'BBBPS2222B', '9876543221', 'ayesha.rahman@example.com',
  '567 Beauty Lane, Hyderabad', 'Hyderabad', 'Telangana', '500001',
  '567 Beauty Lane, Hyderabad', 'Hyderabad', 'Telangana', '500001',
  1, 1, 'Rahim Rahman', 'Fatima Rahman', 'Salman Rahman',
  1, 1, '2025-10-10 20:00:00.000000', '2025-10-10 20:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q4'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o8'),
  'Ayesha Rahman', 'ayesha.rahman@example.com', '9876543221',
  'BUSINESS_LOAN', 600000.00, 48, 'Open second branch of "Glamour Studio"',
  'APPROVED', 'MEDIUM', 460, 22, 1, '2025-10-10 20:30:00.000000', '2025-10-10 20:00:00.000000', '2025-10-10 21:00:00.000000', 1,
  690
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses, otherIncome,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode, workAddress, workCity,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q4'), 'SELF_EMPLOYED', 'Glamour Studio', 'Owner', '2018-03-01',
  55000.00, 10000.00, 22000.00, 0.00,
  'VERIFIED', 'MANUAL_REVIEW_REQUIRED', 'VERIFIED',
  'Axis Bank', '10123456789012', 'UTIB0001234',
  '567 Beauty Lane', 'Hyderabad',
  '2025-10-10 20:00:00.000000', '2025-10-10 20:00:00.000000', 1
);

-- loan_documents
INSERT INTO loan_documents (loan_application_id, uploaded_by_id, documentType, fileName, filePath, uploadedAt, verificationStatus, verifiedAt, createdAt, updatedAt)
VALUES
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q4'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o8'), 'AADHAAR_CARD', 'aadhaar.pdf', '/docs/loan_12/aadhaar.pdf', '2025-10-10 20:10:00.000000', 'VERIFIED', '2025-10-10 20:15:00.000000', '2025-10-10 20:10:00.000000', '2025-10-10 20:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q4'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o8'), 'PAN_CARD', 'pan.pdf', '/docs/loan_12/pan.pdf', '2025-10-10 20:10:00.000000', 'VERIFIED', '2025-10-10 20:15:00.000000', '2025-10-10 20:10:00.000000', '2025-10-10 20:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q4'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o8'), 'BUSINESS_REGISTRATION', 'shop_act_license.pdf', '/docs/loan_12/shop_act.pdf', '2025-10-10 20:20:00.000000', 'VERIFIED', '2025-10-10 20:40:00.000000', '2025-10-10 20:20:00.000000', '2025-10-10 20:40:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q4'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o8'), 'PROFIT_LOSS_STATEMENT', 'pnl_2023-24.pdf', '/docs/loan_12/pnl.pdf', '2025-10-10 20:20:00.000000', 'VERIFIED', '2025-10-10 20:45:00.000000', '2025-10-10 20:20:00.000000', '2025-10-10 20:45:00.000000');


➕ External DB Records

-- bank_details
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0r5'), 
  '223344556677', 'BBBPS2222B', '10123456789012', 'Axis Bank', 'Current',
  55000.00, 22000.00, 85000.00, 7.0,
  0, 0, 0, '2025-10-09 00:00:00.000000'
);

-- credit_score_history
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('j0k1l2m3-n4o5-6789-p0q1-r2s3t4u5v6x0'),
  '223344556677', 'BBBPS2222B', 690, 2, 0,
  52000.00, 120000.00, 0, 'MEDIUM',
  '2025-10-09 00:00:00.000000', 'Stable business income, one active loan'
);

-- loan_history (1 active business loan)
INSERT INTO loan_history (
  loan_id, aadhaar_number, pan_number, loan_type, loan_amount, current_outstanding,
  emi_amount, start_date, end_date, loan_status, default_flag,
  late_payment_count, missed_payments, secured_flag, last_payment_date, last_updated
) VALUES (
  UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v9'), 
  '223344556677', 'BBBPS2222B', 'BUSINESS_LOAN', 400000.00, 280000.00,
  10000.00, '2022-08-01', '2027-08-01', 'ACTIVE', 0,
  1, 0, 0, '2025-10-01', '2025-10-02 00:00:00.000000'
);

-- fraud_records (none)
-- (No insert)

