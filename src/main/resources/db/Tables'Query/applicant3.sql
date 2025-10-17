👩‍💼 Applicant 3: Priya Patel – Self-Employed Business Owner (Beauty Salon)
➕ Internal DB Records

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n9'), 'priya.patel@example.com', '9876543212', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_03', '2025-10-10 11:00:00.000000', '2025-10-10 11:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName, spouseName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o0'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n9'),
  'Priya', 'Patel', '1990-11-05', 'Female', 'MARRIED', 'Indian',
  '234567890123', 'DEFPS9012F', '9876543212', 'priya.patel@example.com',
  '123 Fashion Street, Ahmedabad', 'Ahmedabad', 'Gujarat', '380015',
  '123 Fashion Street, Ahmedabad', 'Ahmedabad', 'Gujarat', '380015',
  1, 1, 'Ramesh Patel', 'Sunita Patel', 'Vikram Patel',
  1, 1, '2025-10-10 11:00:00.000000', '2025-10-10 11:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p5'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n9'),
  'Priya Patel', 'priya.patel@example.com', '9876543212',
  'BUSINESS_LOAN', 800000.00, 48, 'Expand beauty salon to second location',
  'APPROVED', 'MEDIUM', 450, 25, 1, '2025-10-10 11:30:00.000000', '2025-10-10 11:00:00.000000', '2025-10-10 12:00:00.000000', 1,
  710
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses, otherIncome,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode, workAddress, workCity,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p5'), 'SELF_EMPLOYED', 'Glamour Beauty Salon', 'Owner', '2019-07-01',
  65000.00, 12000.00, 25000.00, 0.00,
  'VERIFIED', 'MANUAL_REVIEW_REQUIRED', 'VERIFIED',
  'Axis Bank', '91200098765432', 'UTIB0000987',
  '123 Fashion Street', 'Ahmedabad',
  '2025-10-10 11:00:00.000000', '2025-10-10 11:00:00.000000', 1
);

-- loan_documents (key business docs)
INSERT INTO loan_documents (loan_application_id, uploaded_by_id, documentType, fileName, filePath, uploadedAt, verificationStatus, verifiedAt, createdAt, updatedAt)
VALUES
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p5'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n9'), 'AADHAAR_CARD', 'aadhaar.pdf', '/docs/loan_03/aadhaar.pdf', '2025-10-10 11:10:00.000000', 'VERIFIED', '2025-10-10 11:15:00.000000', '2025-10-10 11:10:00.000000', '2025-10-10 11:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p5'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n9'), 'PAN_CARD', 'pan.pdf', '/docs/loan_03/pan.pdf', '2025-10-10 11:10:00.000000', 'VERIFIED', '2025-10-10 11:15:00.000000', '2025-10-10 11:10:00.000000', '2025-10-10 11:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p5'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n9'), 'GST_CERTIFICATE', 'gst.pdf', '/docs/loan_03/gst.pdf', '2025-10-10 11:10:00.000000', 'VERIFIED', '2025-10-10 11:20:00.000000', '2025-10-10 11:10:00.000000', '2025-10-10 11:20:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p5'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n9'), 'BUSINESS_ITR', 'itr_2023-24.pdf', '/docs/loan_03/itr.pdf', '2025-10-10 11:10:00.000000', 'VERIFIED', '2025-10-10 11:25:00.000000', '2025-10-10 11:10:00.000000', '2025-10-10 11:25:00.000000');

➕ External DB Records
-- bank_details
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0q6'), 
  '234567890123', 'DEFPS9012F', '91200098765432', 'Axis Bank', 'Current',
  65000.00, 25000.00, 95000.00, 6.3,
  0, 1, 0, '2025-10-09 00:00:00.000000'
);

-- credit_score_history
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('j0k1l2m3-n4o5-6789-p0q1-r2s3t4u5v6w1'),
  '234567890123', 'DEFPS9012F', 710, 2, 0,
  62000.00, 150000.00, 0, 'MEDIUM',
  '2025-10-09 00:00:00.000000', 'Stable business income, one active loan'
);

-- loan_history (1 active business loan)
INSERT INTO loan_history (
  loan_id, aadhaar_number, pan_number, loan_type, loan_amount, current_outstanding,
  emi_amount, start_date, end_date, loan_status, default_flag,
  late_payment_count, missed_payments, secured_flag, last_payment_date, last_updated
) VALUES (
  UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v0'), 
  '234567890123', 'DEFPS9012F', 'BUSINESS_LOAN', 500000.00, 320000.00,
  12000.00, '2022-09-01', '2027-09-01', 'ACTIVE', 0,
  2, 0, 0, '2025-10-01', '2025-10-02 00:00:00.000000'
);

-- fraud_records (none)
-- (No insert — clean record)

