👨‍⚕️ Applicant 7: Dr. Arjun Mehta – Professional (Doctor), Applying for Home Loan
➕ Internal DB Records

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o3'), 'ramesh.gowda@example.com', '9876543216', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_07', '2025-10-10 15:00:00.000000', '2025-10-10 15:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o4'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o3'),
  'Ramesh', 'Gowda', '1972-04-10', 'Male', 'MARRIED', 'Indian',
  '678901234567', 'OPQPS5678J', '9876543216', 'ramesh.gowda@example.com',
  'Survey No. 45, Doddaballapur', 'Doddaballapur', 'Karnataka', '561203',
  'Survey No. 45, Doddaballapur', 'Doddaballapur', 'Karnataka', '561203',
  1, 4, 'Krishna Gowda', 'Lakshmi Gowda',
  1, 1, '2025-10-10 15:00:00.000000', '2025-10-10 15:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p9'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o3'),
  'Ramesh Gowda', 'ramesh.gowda@example.com', '9876543216',
  'CROP_LOAN', 150000.00, 12, 'Purchase seeds, fertilizers, and pesticides for Rabi season',
  'APPROVED', 'MEDIUM', 480, 15, 1, '2025-10-10 15:30:00.000000', '2025-10-10 15:00:00.000000', '2025-10-10 16:00:00.000000', 1,
  650
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses, otherIncome,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode, workAddress, workCity,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p9'), 'BUSINESS_OWNER', 'Ramesh Gowda Farms', 'Owner', '1995-06-01',
  35000.00, 8000.00, 20000.00, 0.00,
  'VERIFIED', 'MANUAL_REVIEW_REQUIRED', 'VERIFIED',
  'Canara Bank', '50123456789012', 'CNRB0001234',
  'Survey No. 45', 'Doddaballapur',
  '2025-10-10 15:00:00.000000', '2025-10-10 15:00:00.000000', 1
);

-- loan_documents
INSERT INTO loan_documents (loan_application_id, uploaded_by_id, documentType, fileName, filePath, uploadedAt, verificationStatus, verifiedAt, createdAt, updatedAt)
VALUES
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p9'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o3'), 'AADHAAR_CARD', 'aadhaar.pdf', '/docs/loan_07/aadhaar.pdf', '2025-10-10 15:10:00.000000', 'VERIFIED', '2025-10-10 15:15:00.000000', '2025-10-10 15:10:00.000000', '2025-10-10 15:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p9'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o3'), 'PAN_CARD', 'pan.pdf', '/docs/loan_07/pan.pdf', '2025-10-10 15:10:00.000000', 'VERIFIED', '2025-10-10 15:15:00.000000', '2025-10-10 15:10:00.000000', '2025-10-10 15:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p9'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o3'), 'PROPERTY_TAX_RECEIPT', 'land_tax.pdf', '/docs/loan_07/land_tax.pdf', '2025-10-10 15:20:00.000000', 'VERIFIED', '2025-10-10 15:45:00.000000', '2025-10-10 15:20:00.000000', '2025-10-10 15:45:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p9'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o3'), 'BANK_STATEMENT', 'bank_stmt.pdf', '/docs/loan_07/bank.pdf', '2025-10-10 15:20:00.000000', 'VERIFIED', '2025-10-10 15:50:00.000000', '2025-10-10 15:20:00.000000', '2025-10-10 15:50:00.000000');


➕ External DB Records

-- bank_details
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0q0'), 
  '678901234567', 'OPQPS5678J', '50123456789012', 'Canara Bank', 'Savings',
  35000.00, 20000.00, 25000.00, 10.2,
  0, 0, 0, '2025-10-09 00:00:00.000000'
);

-- credit_score_history
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('j0k1l2m3-n4o5-6789-p0q1-r2s3t4u5v6w5'),
  '678901234567', 'OPQPS5678J', 650, 3, 0,
  32000.00, 80000.00, 0, 'MEDIUM',
  '2025-10-09 00:00:00.000000', 'Seasonal income, but consistent repayment'
);

-- loan_history (2 closed crop loans, 1 active)
INSERT INTO loan_history (
  loan_id, aadhaar_number, pan_number, loan_type, loan_amount, current_outstanding,
  emi_amount, start_date, end_date, loan_status, default_flag,
  late_payment_count, missed_payments, secured_flag, last_payment_date, last_updated
) VALUES
(UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v2'), 
 '678901234567', 'OPQPS5678J', 'CROP_LOAN', 120000.00, 0.00,
 0.00, '2023-06-01', '2024-05-31', 'CLOSED', 0,
 0, 0, 0, '2024-05-31', '2024-06-01 00:00:00.000000'),
(UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v3'), 
 '678901234567', 'OPQPS5678J', 'CROP_LOAN', 130000.00, 0.00,
 0.00, '2022-06-01', '2023-05-31', 'CLOSED', 0,
 1, 0, 0, '2023-05-31', '2023-06-01 00:00:00.000000'),
(UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v4'), 
 '678901234567', 'OPQPS5678J', 'TWO_WHEELER_LOAN', 80000.00, 20000.00,
 2500.00, '2021-01-15', '2026-01-15', 'ACTIVE', 0,
 0, 0, 1, '2025-10-15', '2025-10-09 00:00:00.000000');

-- fraud_records (none)
-- (No insert)