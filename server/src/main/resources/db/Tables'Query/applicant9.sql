🧑‍🎓 Applicant 10: Dev Joshi – Student Applying for Professional Course Loan
➕ Internal DB Records

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o6'), 'dev.joshi@example.com', '9876543219', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_10', '2025-10-10 18:00:00.000000', '2025-10-10 18:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o7'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o6'),
  'Dev', 'Joshi', '2000-02-14', 'Male', 'SINGLE', 'Indian',
  '901234567890', 'XYZPS7890M', '9876543219', 'dev.joshi@example.com',
  'Hostel Room 305, Bangalore', 'Bangalore', 'Karnataka', '560037',
  '456 Residential Colony, Jaipur', 'Jaipur', 'Rajasthan', '302001',
  0, 0, 'Vikram Joshi', 'Anita Joshi',
  1, 1, '2025-10-10 18:00:00.000000', '2025-10-10 18:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q2'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o6'),
  'Dev Joshi', 'dev.joshi@example.com', '9876543219',
  'PROFESSIONAL_COURSE_LOAN', 450000.00, 36, 'Full-stack developer bootcamp at Masai School (6 months). Co-applicant: Vikram Joshi (Father), PAN: ABCPD2222N',
  'UNDER_REVIEW', 'HIGH', 650, 15, 0, '2025-10-10 18:30:00.000000', '2025-10-10 18:00:00.000000', '2025-10-10 18:30:00.000000', 1,
  0  -- No credit history
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses, otherIncome,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q2'), 'STUDENT', 'Masai School', 'Student', '2025-09-01',
  0.00, 0.00, 10000.00, 0.00,
  'VERIFIED', 'AWAITING_DOCUMENTS', 'VERIFIED',
  'HDFC Bank', '80123456789012', 'HDFC0002499',
  '2025-10-10 18:00:00.000000', '2025-10-10 18:00:00.000000', 1
);

-- loan_documents
INSERT INTO loan_documents (loan_application_id, uploaded_by_id, documentType, fileName, filePath, uploadedAt, verificationStatus, createdAt, updatedAt)
VALUES
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q2'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o6'), 'AADHAAR_CARD', 'aadhaar.pdf', '/docs/loan_10/aadhaar.pdf', '2025-10-10 18:10:00.000000', 'VERIFIED', '2025-10-10 18:10:00.000000', '2025-10-10 18:10:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q2'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o6'), 'PAN_CARD', 'pan.pdf', '/docs/loan_10/pan.pdf', '2025-10-10 18:10:00.000000', 'VERIFIED', '2025-10-10 18:10:00.000000', '2025-10-10 18:10:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q2'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o6'), 'CO_APPLICANT_IDENTITY', 'father_aadhaar.pdf', '/docs/loan_10/father_aadhaar.pdf', '2025-10-10 18:15:00.000000', 'PENDING', '2025-10-10 18:15:00.000000', '2025-10-10 18:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q2'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o6'), 'CO_APPLICANT_INCOME', 'father_salary_slip.pdf', '/docs/loan_10/father_salary.pdf', '2025-10-10 18:15:00.000000', 'PENDING', '2025-10-10 18:15:00.000000', '2025-10-10 18:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q2'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o6'), 'ADMISSION_LETTER', 'masai_admit.pdf', '/docs/loan_10/admit.pdf', '2025-10-10 18:20:00.000000', 'VERIFIED', '2025-10-10 18:20:00.000000', '2025-10-10 18:20:00.000000');

➕ External DB Records

-- bank_details (student account)
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0r3'), 
  '901234567890', 'XYZPS7890M', '80123456789012', 'HDFC Bank', 'Savings',
  0.00, 10000.00, 15000.00, 1.8,
  0, 0, 0, '2025-10-09 00:00:00.000000'
);

-- credit_score_history (no credit history)
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('j0k1l2m3-n4o5-6789-p0q1-r2s3t4u5v6w8'),
  '901234567890', 'XYZPS7890M', NULL, 0, 0,
  0.00, 0.00, 0, 'LOW',
  '2025-10-09 00:00:00.000000', 'No credit history - first-time borrower'
);

-- loan_history (none)
-- (No insert)

-- fraud_records (none)
-- (No insert)