👨‍💼 Applicant 5: Rajesh Kumar – Unemployed, Applying for Gold Loan (Collateral-Based)
➕ Internal DB Records

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o1'), 'rajesh.kumar@example.com', '9876543214', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_05', '2025-10-10 13:00:00.000000', '2025-10-10 13:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o2'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o1'),
  'Rajesh', 'Kumar', '1978-12-30', 'Male', 'MARRIED', 'Indian',
  '456789012345', 'IJKPS7890H', '9876543214', 'rajesh.kumar@example.com',
  '101 Slum Lane, Patna', 'Patna', 'Bihar', '800001',
  '101 Slum Lane, Patna', 'Patna', 'Bihar', '800001',
  1, 3, 'Lalit Kumar', 'Sarita Kumari',
  1, 1, '2025-10-10 13:00:00.000000', '2025-10-10 13:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p7'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o1'),
  'Rajesh Kumar', 'rajesh.kumar@example.com', '9876543214',
  'GOLD_LOAN', 200000.00, 12, 'Daughter’s wedding expenses',
  'APPROVED', 'MEDIUM', 500, 30, 0, '2025-10-10 13:30:00.000000', '2025-10-10 13:00:00.000000', '2025-10-10 14:00:00.000000', 1,
  610
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses, otherIncome,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p7'), 'UNEMPLOYED', 'N/A', 'N/A', '2020-01-01',
  0.00, 0.00, 15000.00, 5000.00,
  'REJECTED', 'REJECTED', 'VERIFIED',
  'State Bank of India', '30123456789012', 'SBIN0002499',
  '2025-10-10 13:00:00.000000', '2025-10-10 13:00:00.000000', 1
);

-- loan_documents
INSERT INTO loan_documents (loan_application_id, uploaded_by_id, documentType, fileName, filePath, uploadedAt, verificationStatus, verifiedAt, createdAt, updatedAt)
VALUES
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p7'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o1'), 'AADHAAR_CARD', 'aadhaar.pdf', '/docs/loan_05/aadhaar.pdf', '2025-10-10 13:10:00.000000', 'VERIFIED', '2025-10-10 13:15:00.000000', '2025-10-10 13:10:00.000000', '2025-10-10 13:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p7'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o1'), 'PAN_CARD', 'pan.pdf', '/docs/loan_05/pan.pdf', '2025-10-10 13:10:00.000000', 'VERIFIED', '2025-10-10 13:15:00.000000', '2025-10-10 13:10:00.000000', '2025-10-10 13:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p7'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o1'), 'GOLD_APPRAISAL', 'gold_valuation.pdf', '/docs/loan_05/gold.pdf', '2025-10-10 13:20:00.000000', 'VERIFIED', '2025-10-10 13:45:00.000000', '2025-10-10 13:20:00.000000', '2025-10-10 13:45:00.000000');

➕ External DB Records
-- bank_details
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0q8'), 
  '456789012345', 'IJKPS7890H', '30123456789012', 'State Bank of India', 'Savings',
  0.00, 15000.00, 8000.00, 4.0,
  0, 2, 1, '2025-10-09 00:00:00.000000'
);

-- credit_score_history
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('j0k1l2m3-n4o5-6789-p0q1-r2s3t4u5v6w3'),
  '456789012345', 'IJKPS7890H', 610, 1, 0,
  0.00, 0.00, 0, 'MEDIUM',
  '2025-10-09 00:00:00.000000', 'No income, but gold collateral reduces risk'
);

-- loan_history (1 closed microloan)
INSERT INTO loan_history (
  loan_id, aadhaar_number, pan_number, loan_type, loan_amount, current_outstanding,
  emi_amount, start_date, end_date, loan_status, default_flag,
  late_payment_count, missed_payments, secured_flag, last_payment_date, last_updated
) VALUES (
  UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v1'), 
  '456789012345', 'IJKPS7890H', 'PERSONAL_LOAN', 50000.00, 0.00,
  2000.00, '2021-02-01', '2023-02-01', 'CLOSED', 0,
  3, 0, 0, '2023-02-01', '2023-02-02 00:00:00.000000'
);

-- fraud_records (none)
-- (No insert)

