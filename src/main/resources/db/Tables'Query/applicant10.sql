🎥 Applicant 11: Imran Siddiqui – Fraudster (Synthetic Identity)
⚠️ High-risk profile: Fake Aadhaar, mismatched PAN, active fraud record 

➕ Internal DB Records

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o7'), 'imran.siddiqui@example.com', '9876543220', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_11', '2025-10-10 19:00:00.000000', '2025-10-10 19:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o8'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o7'),
  'Imran', 'Siddiqui', '1992-08-05', 'Male', 'SINGLE', 'Indian',
  '112233445566', 'AAAFA1111A', '9876543220', 'imran.siddiqui@example.com',
  'Flat 101, Fake Towers, Delhi', 'Delhi', 'Delhi', '110001',
  'Village Unknown, Bihar', 'Patna', 'Bihar', '800001',
  0, 0, 'Fake Father', 'Fake Mother',
  0, 0, '2025-10-10 19:00:00.000000', '2025-10-10 19:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore, decisionType, rejectionReason
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q3'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o7'),
  'Imran Siddiqui', 'imran.siddiqui@example.com', '9876543220',
  'PERSONAL_LOAN', 250000.00, 24, 'Medical emergency',
  'REJECTED', 'CRITICAL', 920, 98, 0, '2025-10-10 19:30:00.000000', '2025-10-10 19:00:00.000000', '2025-10-10 19:35:00.000000', 1,
  0, 'AUTO_REJECTED', 'Synthetic identity detected: PAN not issued, Aadhaar invalid'
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q3'), 'SALARIED', 'Fake Company Ltd', 'Manager', '2023-01-01',
  50000.00, 0.00, 20000.00,
  'FAILED', 'FAILED', 'FAILED',
  'Punjab National Bank', '99999999999999', 'PNBN0009999',
  '2025-10-10 19:00:00.000000', '2025-10-10 19:00:00.000000', 1
);

-- loan_documents
INSERT INTO loan_documents (loan_application_id, uploaded_by_id, documentType, fileName, filePath, uploadedAt, verificationStatus, createdAt, updatedAt)
VALUES
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q3'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o7'), 'AADHAAR_CARD', 'aadhaar.pdf', '/docs/loan_11/aadhaar.pdf', '2025-10-10 19:10:00.000000', 'FAILED', '2025-10-10 19:10:00.000000', '2025-10-10 19:10:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q3'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o7'), 'PAN_CARD', 'pan.pdf', '/docs/loan_11/pan.pdf', '2025-10-10 19:10:00.000000', 'FAILED', '2025-10-10 19:10:00.000000', '2025-10-10 19:10:00.000000');

➕ External DB Records

-- bank_details (suspicious account)
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0r4'), 
  '112233445566', 'AAAFA1111A', '99999999999999', 'Punjab National Bank', 'Savings',
  0.00, 0.00, 500.00, 0.2,
  0, 10, 1, '2025-10-09 00:00:00.000000'
);

-- fraud_records (active fraud case)
INSERT INTO fraud_records (
  fraud_id, aadhaar_number, pan_number, fraud_type, severity_level,
  reported_date, resolved_flag, source_authority, remarks
) VALUES (
  UUID_TO_BIN('h8i9j0k1-l2m3-4567-n8o9-p0q1r2s3t4u9'),
  '112233445566', 'AAAFA1111A', 'SYNTHETIC_IDENTITY', 'HIGH',
  '2025-09-15', 0, 'CIBIL Fraud Bureau', 'PAN AAAFA1111A not issued by ITD. Aadhaar checksum invalid.'
);

-- credit_score_history (no valid score)
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('j0k1l2m3-n4o5-6789-p0q1-r2s3t4u5v6w9'),
  '112233445566', 'AAAFA1111A', NULL, 0, 0,
  0.00, 0.00, 1, 'HIGH',
  '2025-10-09 00:00:00.000000', 'Synthetic identity - no credit history'
);

-- loan_history (none - no legitimate loans)
-- (No insert)