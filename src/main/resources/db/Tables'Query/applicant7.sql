👩‍⚕️ Applicant 8: Lakshmi Nair – Retired Widow Applying for Loan Against Property
➕ Internal DB Records

-- users
INSERT INTO users (id, email, phone, role, status, isEmailVerified, isPhoneVerified, passwordHash, createdAt, updatedAt, version)
VALUES (UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o4'), 'lakshmi.nair@example.com', '9876543217', 'APPLICANT', 'ACTIVE', 1, 1, 'hashed_pw_08', '2025-10-10 16:00:00.000000', '2025-10-10 16:00:00.000000', 1);

-- applicant_personal_details
INSERT INTO applicant_personal_details (
  id, user_id, firstName, lastName, dateOfBirth, gender, maritalStatus, nationality,
  aadhaarNumber, panNumber, phoneNumber, emailAddress,
  currentAddress, currentCity, currentState, currentPincode,
  permanentAddress, permanentCity, permanentState, permanentPincode,
  isSameAddress, dependentsCount, fatherName, motherName, spouseName,
  identityVerified, addressVerified, createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o5'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o4'),
  'Lakshmi', 'Nair', '1958-09-22', 'Female', 'WIDOWED', 'Indian',
  '789012345678', 'RSTPS9012K', '9876543217', 'lakshmi.nair@example.com',
  'Villa No. 12, Kochi', 'Kochi', 'Kerala', '682001',
  'Villa No. 12, Kochi', 'Kochi', 'Kerala', '682001',
  1, 0, 'Raman Nair', 'Saraswati Nair', 'Late Rajan Nair',
  1, 1, '2025-10-10 16:00:00.000000', '2025-10-10 16:00:00.000000', 1
);

-- loan_applications
INSERT INTO loan_applications (
  id, applicant_id, applicantName, applicantEmail, applicantPhone,
  loanType, requestedAmount, tenureMonths, purpose,
  status, riskLevel, riskScore, fraudScore, existingLoans, submittedAt, createdAt, updatedAt, version,
  creditScore
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q0'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o4'),
  'Lakshmi Nair', 'lakshmi.nair@example.com', '9876543217',
  'LOAN_AGAINST_PROPERTY', 2500000.00, 120, 'Medical treatment for chronic illness',
  'APPROVED', 'LOW', 300, 10, 0, '2025-10-10 16:30:00.000000', '2025-10-10 16:00:00.000000', '2025-10-10 17:00:00.000000', 1,
  740
);

-- applicant_financial_profile
INSERT INTO applicant_financial_profile (
  loan_application_id, employmentType, employerName, designation, employmentStartDate,
  primaryMonthlyIncome, existingEmiAmount, monthlyExpenses, otherIncome,
  employmentVerificationStatus, incomeVerificationStatus, bankVerificationStatus,
  primaryBankName, primaryAccountNumber, ifscCode,
  createdAt, updatedAt, version
) VALUES (
  UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q0'), 'RETIRED', 'Kerala State Electricity Board', 'Ex-Engineer', '1980-07-01',
  0.00, 0.00, 18000.00, 45000.00,  -- Pension as otherIncome
  'VERIFIED', 'VERIFIED', 'VERIFIED',
  'Federal Bank', '60123456789012', 'FDRL0001234',
  '2025-10-10 16:00:00.000000', '2025-10-10 16:00:00.000000', 1
);

-- loan_documents
INSERT INTO loan_documents (loan_application_id, uploaded_by_id, documentType, fileName, filePath, uploadedAt, verificationStatus, verifiedAt, createdAt, updatedAt)
VALUES
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q0'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o4'), 'AADHAAR_CARD', 'aadhaar.pdf', '/docs/loan_08/aadhaar.pdf', '2025-10-10 16:10:00.000000', 'VERIFIED', '2025-10-10 16:15:00.000000', '2025-10-10 16:10:00.000000', '2025-10-10 16:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q0'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o4'), 'PAN_CARD', 'pan.pdf', '/docs/loan_08/pan.pdf', '2025-10-10 16:10:00.000000', 'VERIFIED', '2025-10-10 16:15:00.000000', '2025-10-10 16:10:00.000000', '2025-10-10 16:15:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q0'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o4'), 'PROPERTY_PAPERS', 'property_deed.pdf', '/docs/loan_08/deed.pdf', '2025-10-10 16:20:00.000000', 'VERIFIED', '2025-10-10 16:50:00.000000', '2025-10-10 16:20:00.000000', '2025-10-10 16:50:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q0'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o4'), 'PROPERTY_VALUATION', 'valuation_report.pdf', '/docs/loan_08/valuation.pdf', '2025-10-10 16:20:00.000000', 'VERIFIED', '2025-10-10 16:55:00.000000', '2025-10-10 16:20:00.000000', '2025-10-10 16:55:00.000000'),
(UUID_TO_BIN('c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9q0'), UUID_TO_BIN('a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7o4'), 'PENSION_LETTER', 'pension_proof.pdf', '/docs/loan_08/pension.pdf', '2025-10-10 16:25:00.000000', 'VERIFIED', '2025-10-10 17:00:00.000000', '2025-10-10 16:25:00.000000', '2025-10-10 17:00:00.000000');


➕ External DB Records

-- bank_details
INSERT INTO bank_details (
  bank_id, aadhaar_number, pan_number, account_number, bank_name, account_type,
  monthly_income, monthly_expense, average_monthly_balance, account_age_years,
  salary_account_flag, cheque_bounce_count, overdraft_used, last_updated
) VALUES (
  UUID_TO_BIN('d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0r1'), 
  '789012345678', 'RSTPS9012K', '60123456789012', 'Federal Bank', 'Savings',
  0.00, 18000.00, 320000.00, 25.0,
  0, 0, 0, '2025-10-09 00:00:00.000000'
);

-- credit_score_history
INSERT INTO credit_score_history (
  score_id, aadhaar_number, pan_number, credit_score, total_loans, total_defaults,
  avg_monthly_income, avg_outstanding_amount, fraud_cases, risk_score,
  computed_date, remarks
) VALUES (
  UUID_TO_BIN('j0k1l2m3-n4o5-6789-p0q1-r2s3t4u5v6w6'),
  '789012345678', 'RSTPS9012K', 740, 2, 0,
  42000.00, 0.00, 0, 'LOW',
  '2025-10-09 00:00:00.000000', 'Excellent repayment history, owns property'
);

-- loan_history (1 closed home loan)
INSERT INTO loan_history (
  loan_id, aadhaar_number, pan_number, loan_type, loan_amount, current_outstanding,
  emi_amount, start_date, end_date, loan_status, default_flag,
  late_payment_count, missed_payments, secured_flag, last_payment_date, last_updated
) VALUES (
  UUID_TO_BIN('i9j0k1l2-m3n4-5678-o9p0-q1r2s3t4u5v5'), 
  '789012345678', 'RSTPS9012K', 'HOME_LOAN', 1800000.00, 0.00,
  22000.00, '2005-03-01', '2025-03-01', 'CLOSED', 0,
  0, 0, 1, '2025-03-01', '2025-03-02 00:00:00.000000'
);

-- fraud_records (none)
-- (No insert)