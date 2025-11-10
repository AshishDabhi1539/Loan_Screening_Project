🎥 Applicant 4: Farhan Khan – Freelancer (YouTuber)
➕ Internal DB Records

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o0'), 'farhan.khan@example.com', '9876543213', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_04', '2025-10-10 12:00:00.000000', '2025-10-10 12:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o1'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o0'),
  'Farhan', 'Khan', '1995-03-18', 'Male', 'SINGLE', 'Indian',
  '345678901234', 'FGHPS3456G', '9876543213', 'farhan.khan@example.com',
  '456 Creator Hub, Mumbai', 'Mumbai', 'Maharashtra', '400001',
  '789 Village Road, Lucknow', 'Lucknow', 'Uttar Pradesh', '226001',
  0, 0, 'Akbar Khan', 'Fatima Khan',
  1, 0, '2025-10-10 12:00:00.000000', '2025-10-10 12:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p6'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o0'),
  'Farhan Khan', 'farhan.khan@example.com', '9876543213',
  'PERSONAL_LOAN', 300000.00, 24, 'Buy camera equipment for YouTube channel',
  'UNDER_REVIEW', 'HIGH', 620, 40, 0, '2025-10-10 12:30:00.000000', '2025-10-10 12:00:00.000000', '2025-10-10 12:30:00.000000', 1,
  680
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses, otherIncome,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode, salaryConsistencyRatio,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p6'), 'FREELANCER', 'Self', 'Content Creator', '2020-01-01',
  42000.00, 0.00, 28000.00, 8000.00,
  'VERIFIED', 'EXTERNAL_VERIFICATION_PENDING', 'VERIFIED',
  'ICICI Bank', '60123456789012', 'ICIC0001234', 0.65,
  '2025-10-10 12:00:00.000000', '2025-10-10 12:00:00.000000', 1
);

-- loan_documents
INSERT INTO loan_documents (loan_application_id, uploaded_by_id, documentType, fileName, filePath, uploadedAt, verificationStatus, createdAt, updatedAt)
VALUES
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p6'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o0'), 'AADHAAR_CARD', 'aadhaar.pdf', '/docs/loan_04/aadhaar.pdf', '2025-10-10 12:10:00.000000', 'VERIFIED', '2025-10-10 12:10:00.000000', '2025-10-10 12:10:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p6'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o0'), 'PAN_CARD', 'pan.pdf', '/docs/loan_04/pan.pdf', '2025-10-10 12:10:00.000000', 'VERIFIED', '2025-10-10 12:10:00.000000', '2025-10-10 12:10:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p6'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o0'), 'BANK_STATEMENT', 'bank_stmt.pdf', '/docs/loan_04/bank.pdf', '2025-10-10 12:10:00.000000', 'IN_PROGRESS', '2025-10-10 12:10:00.000000', '2025-10-10 12:10:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p6'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o0'), 'VIDEO_KYC', 'video_kyc.mp4', '/docs/loan_04/kyc.mp4', '2025-10-10 12:15:00.000000', 'PENDING', '2025-10-10 12:15:00.000000', '2025-10-10 12:15:00.000000');

➕ External DB Records

-- bank_details
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0q7'), 
  '345678901234', 'FGHPS3456G', '60123456789012', 'ICICI Bank', 'Savings',
  42000.00, 28000.00, 45000.00, 5.2,
  0, 0, 1, '2025-10-09 00:00:00.000000'
);

-- credit_score_history
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('j0k1l2m3-n4o5-6789-p0q1-r2s3t4u5v6w2'),
  '345678901234', 'FGHPS3456G', 680, 1, 0,
  40000.00, 0.00, 0, 'MEDIUM',
  '2025-10-09 00:00:00.000000', 'Thin file, but consistent income'
);

-- loan_history (no prior loans)
-- (No insert — first-time borrower)

-- fraud_records (none)
-- (No insert)

