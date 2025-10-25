📊 Applicant 1: Rahul Sharma – Prime Salaried Borrower
➕ Internal DB Records (Recap with UUIDs as BIN)

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n1'), 'rahul.sharma@example.com', '9876543210', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_01', '2025-10-10 10:00:00.000000', '2025-10-10 10:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o2'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n1'),
  'Rahul', 'Sharma', '1988-05-12', 'Male', 'MARRIED', 'Indian',
  '123456789012', 'ABCPS1234D', '9876543210', 'rahul.sharma@example.com',
  '456 Tech Park, Bangalore', 'Bangalore', 'Karnataka', '560001',
  '456 Tech Park, Bangalore', 'Bangalore', 'Karnataka', '560001',
  1, 2, 'Suresh Sharma', 'Meena Sharma',
  1, 1, '2025-10-10 10:00:00.000000', '2025-10-10 10:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p3'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n1'),
  'Rahul Sharma', 'rahul.sharma@example.com', '9876543210',
  'PERSONAL_LOAN', 500000.00, 36, 'Home renovation',
  'APPROVED', 'LOW', 200, 10, 0, '2025-10-10 10:30:00.000000', '2025-10-10 10:00:00.000000', '2025-10-10 11:00:00.000000', 1,
  780
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p3'), 'SALARIED', 'Infosys Ltd', 'Senior Developer', '2018-03-01',
  95000.00, 15000.00, 30000.00,
  'VERIFIED', 'VERIFIED', 'VERIFIED',
  'HDFC Bank', '50100012345678', 'HDFC0000123',
  '2025-10-10 10:00:00.000000', '2025-10-10 10:00:00.000000', 1
);


➕ External DB Records (Consistent via PAN/Aadhaar)

-- bank_details
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0q4'), 
  '123456789012', 'ABCPS1234D', '50100012345678', 'HDFC Bank', 'Savings',
  95000.00, 30000.00, 120000.00, 7.5,
  1, 0, 0, '2025-10-09 00:00:00.000000'
);

-- credit_score_history
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('e5f6g7h8-i9j0-1234-k5l6-m7n8o9p0q1r5'),
  '123456789012', 'ABCPS1234D', 780, 2, 0,
  92000.00, 200000.00, 0, 'LOW',
  '2025-10-09 00:00:00.000000', 'Good repayment history'
);

-- loan_history (2 closed loans)
INSERT INTO loan_history (
  loan_id, aadhaar_number, pan_number, loan_type, loan_amount, current_outstanding,
  emi_amount, start_date, end_date, loan_status, default_flag,
  late_payment_count, missed_payments, secured_flag, last_payment_date, last_updated
) VALUES
(UUID_TO_BIN('f6g7h8i9-j0k1-2345-l6m7-n8o9p0q1r2s6'), '123456789012', 'ABCPS1234D', 'CAR_LOAN', 800000.00, 0.00,
  15000.00, '2020-01-15', '2025-01-15', 'CLOSED', 0,
  0, 0, 1, '2025-01-15', '2025-01-16 00:00:00.000000'),
(UUID_TO_BIN('g7h8i9j0-k1l2-3456-m7n8-o9p0q1r2s3t7'), '123456789012', 'ABCPS1234D', 'PERSONAL_LOAN', 300000.00, 0.00,
  9000.00, '2022-03-10', '2025-03-10', 'CLOSED', 0,
  1, 0, 0, '2025-03-10', '2025-03-11 00:00:00.000000');

-- fraud_records (none)
-- (No insert — clean record)


