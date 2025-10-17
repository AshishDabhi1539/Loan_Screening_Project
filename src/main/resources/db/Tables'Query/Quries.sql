-- User's Table:

CREATE TABLE `users` (
  `id` binary(16) NOT NULL,
  `createdAt` datetime(6) NOT NULL,
  `email` varchar(150) NOT NULL,
  `failedLoginAttempts` int NOT NULL,
  `isEmailVerified` bit(1) NOT NULL,
  `isPhoneVerified` bit(1) NOT NULL,
  `lastLoginAt` datetime(6) DEFAULT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `role` enum('ADMIN','APPLICANT','COMPLIANCE_OFFICER','LOAN_OFFICER') NOT NULL,
  `status` enum('ACTIVE','BLOCKED','EXPIRED','INACTIVE','LOCKED','PENDING_VERIFICATION','SUSPENDED') NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  UNIQUE KEY `idx_users_phone` (`phone`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


-- applicant personal details:

CREATE TABLE `applicant_personal_details` (
  `id` binary(16) NOT NULL,
  `aadhaarNumber` varchar(12) NOT NULL,
  `alternatePhoneNumber` varchar(15) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL,
  `currentAddress` text,
  `currentCity` varchar(100) DEFAULT NULL,
  `currentPincode` varchar(6) DEFAULT NULL,
  `currentState` varchar(100) DEFAULT NULL,
  `dateOfBirth` date NOT NULL,
  `dependentsCount` int NOT NULL,
  `emailAddress` varchar(150) NOT NULL,
  `fatherName` varchar(100) DEFAULT NULL,
  `firstName` varchar(50) NOT NULL,
  `gender` varchar(10) NOT NULL,
  `isSameAddress` bit(1) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `maritalStatus` varchar(50) NOT NULL,
  `middleName` varchar(50) DEFAULT NULL,
  `motherName` varchar(100) DEFAULT NULL,
  `nationality` varchar(100) NOT NULL,
  `panNumber` varchar(10) NOT NULL,
  `permanentAddress` text,
  `permanentCity` varchar(100) DEFAULT NULL,
  `permanentPincode` varchar(6) DEFAULT NULL,
  `permanentState` varchar(100) DEFAULT NULL,
  `phoneNumber` varchar(15) NOT NULL,
  `spouseName` varchar(100) DEFAULT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `version` bigint DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
  `addressVerificationNotes` text,
  `addressVerified` bit(1) NOT NULL,
  `addressVerifiedAt` datetime(6) DEFAULT NULL,
  `identityVerificationNotes` text,
  `identityVerified` bit(1) NOT NULL,
  `identityVerifiedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_personal_user` (`user_id`),
  UNIQUE KEY `idx_personal_pan` (`panNumber`),
  UNIQUE KEY `idx_personal_aadhaar` (`aadhaarNumber`),
  KEY `idx_personal_phone` (`phoneNumber`),
  CONSTRAINT `FKf6lx49tb1a3l6ka45e9qc1n0` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


-- applicant financial profile:
CREATE TABLE `applicant_financial_profile` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `accountType` varchar(50) DEFAULT NULL,
  `avgMonthlyCredits` decimal(15,2) DEFAULT NULL,
  `avgMonthlyDebits` decimal(15,2) DEFAULT NULL,
  `bankVerificationStatus` enum('AWAITING_DOCUMENTS','EXPIRED','EXTERNAL_VERIFICATION_PENDING','FAILED','IN_PROGRESS','MANUAL_REVIEW_REQUIRED','PARTIALLY_VERIFIED','PENDING','REJECTED','VERIFIED') NOT NULL,
  `bankVerifiedAt` datetime(6) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL,
  `designation` varchar(100) NOT NULL,
  `employerName` varchar(200) NOT NULL,
  `employmentStartDate` date NOT NULL,
  `employmentType` enum('BUSINESS_OWNER','FREELANCER','PROFESSIONAL','RETIRED','SALARIED','SELF_EMPLOYED','STUDENT','UNEMPLOYED') NOT NULL,
  `employmentVerificationStatus` enum('AWAITING_DOCUMENTS','EXPIRED','EXTERNAL_VERIFICATION_PENDING','FAILED','IN_PROGRESS','MANUAL_REVIEW_REQUIRED','PARTIALLY_VERIFIED','PENDING','REJECTED','VERIFIED') NOT NULL,
  `employmentVerifiedAt` datetime(6) DEFAULT NULL,
  `existingEmiAmount` decimal(12,2) DEFAULT NULL,
  `financialAnomalies` text,
  `ifscCode` varchar(20) DEFAULT NULL,
  `incomeVerificationStatus` enum('AWAITING_DOCUMENTS','EXPIRED','EXTERNAL_VERIFICATION_PENDING','FAILED','IN_PROGRESS','MANUAL_REVIEW_REQUIRED','PARTIALLY_VERIFIED','PENDING','REJECTED','VERIFIED') NOT NULL,
  `incomeVerifiedAt` datetime(6) DEFAULT NULL,
  `monthlyExpenses` decimal(12,2) DEFAULT NULL,
  `otherIncome` decimal(12,2) DEFAULT NULL,
  `primaryAccountNumber` varchar(50) DEFAULT NULL,
  `primaryBankName` varchar(150) DEFAULT NULL,
  `primaryMonthlyIncome` decimal(12,2) NOT NULL,
  `salaryConsistencyRatio` decimal(5,2) DEFAULT NULL,
  `secondaryIncome` decimal(12,2) DEFAULT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `verificationNotes` text,
  `version` bigint DEFAULT NULL,
  `workAddress` varchar(200) DEFAULT NULL,
  `workCity` varchar(100) DEFAULT NULL,
  `workEmail` varchar(150) DEFAULT NULL,
  `workPhone` varchar(15) DEFAULT NULL,
  `loan_application_id` binary(16) NOT NULL,
  `branchName` varchar(100) DEFAULT NULL,
  `companyAddress` varchar(200) DEFAULT NULL,
  `hrEmail` varchar(150) DEFAULT NULL,
  `hrPhone` varchar(15) DEFAULT NULL,
  `managerName` varchar(100) DEFAULT NULL,
  `managerPhone` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_fin_profile_application` (`loan_application_id`),
  KEY `idx_fin_profile_income` (`primaryMonthlyIncome`),
  KEY `idx_fin_profile_employment` (`employmentType`),
  KEY `idx_fin_profile_emp_verification` (`employmentVerificationStatus`),
  KEY `idx_fin_profile_income_verification` (`incomeVerificationStatus`),
  CONSTRAINT `FKlpgi3f1q7913vrokcct42u0lx` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- loan Application

CREATE TABLE `loan_applications` (
  `id` binary(16) NOT NULL,
  `applicantEmail` varchar(150) NOT NULL,
  `applicantName` varchar(100) NOT NULL,
  `applicantPhone` varchar(15) NOT NULL,
  `approvedAmount` decimal(15,2) DEFAULT NULL,
  `approvedInterestRate` decimal(5,2) DEFAULT NULL,
  `approvedTenureMonths` int DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL,
  `decidedAt` datetime(6) DEFAULT NULL,
  `decisionReason` text,
  `decisionType` enum('APPROVED','AUTO_APPROVED','AUTO_REJECTED','CANCELLED_BY_APPLICANT','CONDITIONAL_APPROVAL','DEFERRED','ESCALATED','EXPIRED','MANUAL_APPROVED','MANUAL_REJECTED','PENDING','PENDING_INVESTIGATION','REJECTED') DEFAULT NULL,
  `existingEmi` decimal(15,2) DEFAULT NULL,
  `existingLoans` bit(1) NOT NULL,
  `finalDecisionAt` datetime(6) DEFAULT NULL,
  `fraudReasons` text,
  `fraudScore` int DEFAULT NULL,
  `loanType` enum('BUSINESS_LOAN','CAR_LOAN','COMMERCIAL_VEHICLE_LOAN','CREDIT_CARD','CROP_LOAN','EDUCATION_LOAN','EQUIPMENT_FINANCE','FARM_EQUIPMENT_LOAN','GOLD_LOAN','HOME_LOAN','LOAN_AGAINST_PROPERTY','OVERDRAFT_FACILITY','PERSONAL_LOAN','PROFESSIONAL_COURSE_LOAN','PROPERTY_LOAN','SALARY_ADVANCE','TWO_WHEELER_LOAN','WORKING_CAPITAL_LOAN') NOT NULL,
  `purpose` text,
  `remarks` text,
  `requestedAmount` decimal(15,2) NOT NULL,
  `reviewedAt` datetime(6) DEFAULT NULL,
  `riskLevel` enum('CRITICAL','HIGH','LOW','MEDIUM','VERY_HIGH','VERY_LOW') NOT NULL,
  `riskScore` int DEFAULT NULL,
  `status` enum('APPROVED','CANCELLED','COLLATERAL_VERIFICATION','COMPLIANCE_REVIEW','CREDIT_CHECK','DISBURSED','DISBURSEMENT_PENDING','DOCUMENTATION','DOCUMENT_INCOMPLETE','DOCUMENT_VERIFICATION','DRAFT','EMPLOYMENT_VERIFICATION','EXPIRED','FINANCIAL_REVIEW','FRAUD_CHECK','MANAGER_APPROVAL','ON_HOLD','PRE_APPROVED','REJECTED','RISK_ASSESSMENT','SUBMITTED','UNDER_REVIEW') NOT NULL,
  `submittedAt` datetime(6) NOT NULL,
  `tenureMonths` int NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `version` bigint DEFAULT NULL,
  `applicant_id` binary(16) NOT NULL,
  `assigned_officer_id` binary(16) DEFAULT NULL,
  `decided_by` binary(16) DEFAULT NULL,
  `complianceNotes` text,
  `creditScore` int DEFAULT NULL,
  `rejectionReason` text,
  `assigned_compliance_officer_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_loan_app_applicant` (`applicant_id`),
  KEY `idx_loan_app_status` (`status`),
  KEY `idx_loan_app_type` (`loanType`),
  KEY `idx_loan_app_risk` (`riskLevel`),
  KEY `idx_loan_app_created` (`createdAt`),
  KEY `FKs7ljqh0b7vv3vjwt1cb9dywdl` (`assigned_officer_id`),
  KEY `FKrhwxi6dgy7pdlsds70l2xx97y` (`decided_by`),
  KEY `FKk06dw56vqls9cuo8micio8anv` (`assigned_compliance_officer_id`),
  CONSTRAINT `FKfk0c8kqr3de2l1uevd7mrm3im` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKk06dw56vqls9cuo8micio8anv` FOREIGN KEY (`assigned_compliance_officer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKrhwxi6dgy7pdlsds70l2xx97y` FOREIGN KEY (`decided_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKs7ljqh0b7vv3vjwt1cb9dywdl` FOREIGN KEY (`assigned_officer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


-- loan documents

CREATE TABLE `loan_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL,
  `documentType` enum('AADHAAR_CARD','APPOINTMENT_LETTER','BALANCE_SHEET','BANK_STATEMENT','BANK_STATEMENT_ADDRESS','BIOMETRIC_VERIFICATION','BUSINESS_BANK_STATEMENT','BUSINESS_ITR','BUSINESS_REGISTRATION','CO_APPLICANT_BANK_STATEMENT','CO_APPLICANT_IDENTITY','CO_APPLICANT_INCOME','DIGITAL_SIGNATURE','DRIVING_LICENSE','EMPLOYMENT_CERTIFICATE','ENCUMBRANCE_CERTIFICATE','FD_CERTIFICATE','FINANCIAL_STATEMENT','FORM_16','GOLD_APPRAISAL','GST_CERTIFICATE','INSURANCE_DOCUMENTS','ITR_FORM','LOAN_APPLICATION_FORM','PAN_CARD','PASSPORT','PHOTOGRAPH','PROCESSING_FEE_RECEIPT','PROFIT_LOSS_STATEMENT','PROPERTY_PAPERS','PROPERTY_TAX_DOCUMENT','PROPERTY_TAX_RECEIPT','PROPERTY_VALUATION','RENTAL_AGREEMENT','SALARY_SLIP','SHARE_CERTIFICATE','SIGNATURE_VERIFICATION','SURVEY_SETTLEMENT','UTILITY_BILL','VEHICLE_INSURANCE','VEHICLE_RC','VIDEO_KYC','VOTER_ID') NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `filePath` varchar(500) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `uploadedAt` datetime(6) NOT NULL,
  `verificationNotes` text,
  `verificationStatus` enum('AWAITING_DOCUMENTS','EXPIRED','EXTERNAL_VERIFICATION_PENDING','FAILED','IN_PROGRESS','MANUAL_REVIEW_REQUIRED','PARTIALLY_VERIFIED','PENDING','REJECTED','VERIFIED') NOT NULL,
  `verifiedAt` datetime(6) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `loan_application_id` binary(16) NOT NULL,
  `uploaded_by_id` binary(16) NOT NULL,
  `fileSize` bigint DEFAULT NULL,
  `fileType` varchar(100) DEFAULT NULL,
  `publicId` varchar(255) DEFAULT NULL,
  `verified_by_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_loan_doc_application` (`loan_application_id`),
  KEY `idx_loan_doc_type` (`documentType`),
  KEY `idx_loan_doc_status` (`verificationStatus`),
  KEY `idx_loan_doc_uploaded` (`uploadedAt`),
  KEY `idx_loan_doc_uploaded_by` (`uploaded_by_id`),
  KEY `FKfyklpiy2i7kckgrimd8b0i1d8` (`verified_by_id`),
  CONSTRAINT `FK1gfku0y2qdcttxaafw9r0qkwa` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`id`),
  CONSTRAINT `FKfyklpiy2i7kckgrimd8b0i1d8` FOREIGN KEY (`verified_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKh3n0bfn1ugapriksm03gydw8j` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- fraud check result

CREATE TABLE `fraud_check_results` (
  `apiEndpoint` varchar(100) DEFAULT NULL,
  `apiResponse` text,
  `bankruptcyFiled` bit(1) NOT NULL,
  `checkedAt` datetime(6) NOT NULL,
  `checkedBy` varchar(100) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL,
  `creditBureau` varchar(50) DEFAULT NULL,
  `creditScore` int DEFAULT NULL,
  `defaultsCount` int DEFAULT NULL,
  `fraudReasons` text,
  `fraudScore` int NOT NULL,
  `fraudTags` text,
  `isDefaulterFound` bit(1) NOT NULL,
  `riskLevel` enum('CRITICAL','HIGH','LOW','MEDIUM','VERY_HIGH','VERY_LOW') NOT NULL,
  `totalActiveLoans` int DEFAULT NULL,
  `totalOutstandingDebt` decimal(15,2) DEFAULT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `version` bigint DEFAULT NULL,
  `loan_application_id` binary(16) NOT NULL,
  PRIMARY KEY (`loan_application_id`),
  KEY `idx_fraud_application` (`loan_application_id`),
  KEY `idx_fraud_risk` (`riskLevel`),
  KEY `idx_fraud_score` (`fraudScore`),
  KEY `idx_fraud_checked` (`checkedAt`),
  CONSTRAINT `FKcwj11j2aatg1dd3hya3xvx29b` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


-- application workflow
CREATE TABLE `application_workflow` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comments` text,
  `decisionType` enum('APPROVED','AUTO_APPROVED','AUTO_REJECTED','CANCELLED_BY_APPLICANT','CONDITIONAL_APPROVAL','DEFERRED','ESCALATED','EXPIRED','MANUAL_APPROVED','MANUAL_REJECTED','PENDING','PENDING_INVESTIGATION','REJECTED') DEFAULT NULL,
  `fromStatus` enum('APPROVED','CANCELLED','COLLATERAL_VERIFICATION','COMPLIANCE_REVIEW','CREDIT_CHECK','DISBURSED','DISBURSEMENT_PENDING','DOCUMENTATION','DOCUMENT_INCOMPLETE','DOCUMENT_VERIFICATION','DRAFT','EMPLOYMENT_VERIFICATION','EXPIRED','FINANCIAL_REVIEW','FLAGGED_FOR_COMPLIANCE','FRAUD_CHECK','MANAGER_APPROVAL','ON_HOLD','PENDING_COMPLIANCE_DOCS','PENDING_EXTERNAL_VERIFICATION','PRE_APPROVED','READY_FOR_DECISION','REJECTED','RISK_ASSESSMENT','SUBMITTED','UNDER_REVIEW') NOT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `isSystemGenerated` bit(1) NOT NULL,
  `processedAt` datetime(6) NOT NULL,
  `systemRemarks` text,
  `toStatus` enum('APPROVED','CANCELLED','COLLATERAL_VERIFICATION','COMPLIANCE_REVIEW','CREDIT_CHECK','DISBURSED','DISBURSEMENT_PENDING','DOCUMENTATION','DOCUMENT_INCOMPLETE','DOCUMENT_VERIFICATION','DRAFT','EMPLOYMENT_VERIFICATION','EXPIRED','FINANCIAL_REVIEW','FLAGGED_FOR_COMPLIANCE','FRAUD_CHECK','MANAGER_APPROVAL','ON_HOLD','PENDING_COMPLIANCE_DOCS','PENDING_EXTERNAL_VERIFICATION','PRE_APPROVED','READY_FOR_DECISION','REJECTED','RISK_ASSESSMENT','SUBMITTED','UNDER_REVIEW') NOT NULL,
  `userAgent` varchar(500) DEFAULT NULL,
  `loan_application_id` binary(16) NOT NULL,
  `processed_by_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_workflow_application` (`loan_application_id`),
  KEY `idx_workflow_status` (`fromStatus`,`toStatus`),
  KEY `idx_workflow_user` (`processed_by_id`),
  KEY `idx_workflow_timestamp` (`processedAt`),
  CONSTRAINT `FK7r7nq042lui13yu1fx6d2ls0e` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`id`),
  CONSTRAINT `FKam1bu4v49uht56y5q3vftasjs` FOREIGN KEY (`processed_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci




-- audit logs

CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(100) NOT NULL,
  `additionalInfo` text,
  `entityId` bigint NOT NULL,
  `entityType` varchar(100) NOT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `newValues` text,
  `oldValues` text,
  `timestamp` datetime(6) NOT NULL,
  `userAgent` varchar(500) DEFAULT NULL,
  `user_id` binary(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_entity` (`entityType`,`entityId`),
  KEY `idx_audit_timestamp` (`timestamp`),
  CONSTRAINT `FKjs4iimve3y0xssbtve5ysyef0` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci



-- otp verification table:
CREATE TABLE `otp_verifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `attemptCount` int NOT NULL,
  `createdAt` datetime(6) NOT NULL,
  `expiresAt` datetime(6) NOT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `isExpired` bit(1) NOT NULL,
  `isVerified` bit(1) NOT NULL,
  `maxAttempts` int NOT NULL,
  `otpCode` varchar(10) NOT NULL,
  `otpType` varchar(50) NOT NULL,
  `sentTo` varchar(150) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `verifiedAt` datetime(6) DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_otp_user` (`user_id`),
  KEY `idx_otp_type` (`otpType`),
  KEY `idx_otp_status` (`isVerified`,`isExpired`),
  KEY `idx_otp_created` (`createdAt`),
  CONSTRAINT `FKssn2wgmijxelm0u26ti271lcf` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


-- notifications table:
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) NOT NULL,
  `isRead` bit(1) NOT NULL,
  `isSent` bit(1) NOT NULL,
  `message` text NOT NULL,
  `readAt` datetime(6) DEFAULT NULL,
  `relatedEntityId` bigint DEFAULT NULL,
  `relatedEntityType` varchar(100) DEFAULT NULL,
  `sentAt` datetime(6) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `type` varchar(50) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `version` bigint DEFAULT NULL,
  `user_id` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`),
  KEY `idx_notif_type` (`type`),
  KEY `idx_notif_read` (`isRead`),
  KEY `idx_notif_created` (`createdAt`),
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci



-- -----------------------------------------------------------------------------------------------------

-- EXTERNAL DB

-- Bank details

CREATE TABLE `bank_details` (
  `bank_id` binary(16) NOT NULL,
  `aadhaar_number` varchar(12) NOT NULL,
  `account_age_years` decimal(5,2) DEFAULT NULL,
  `account_number` varchar(25) DEFAULT NULL,
  `account_type` varchar(20) DEFAULT NULL,
  `average_monthly_balance` decimal(12,2) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `cheque_bounce_count` int NOT NULL,
  `credit_card_usage_ratio` decimal(5,2) DEFAULT NULL,
  `last_updated` datetime(6) NOT NULL,
  `monthly_expense` decimal(12,2) DEFAULT NULL,
  `monthly_income` decimal(12,2) DEFAULT NULL,
  `overdraft_used` bit(1) NOT NULL,
  `pan_number` varchar(10) NOT NULL,
  `salary_account_flag` bit(1) NOT NULL,
  PRIMARY KEY (`bank_id`),
  UNIQUE KEY `UK57a2rlpn14buvs3qqtlt7okyy` (`account_number`),
  KEY `idx_bank_aadhaar` (`aadhaar_number`),
  KEY `idx_bank_pan` (`pan_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- fraud records
CREATE TABLE `fraud_records` (
  `fraud_id` binary(16) NOT NULL,
  `aadhaar_number` varchar(12) NOT NULL,
  `fraud_type` varchar(100) DEFAULT NULL,
  `pan_number` varchar(10) NOT NULL,
  `remarks` text,
  `reported_date` date DEFAULT NULL,
  `resolution_date` date DEFAULT NULL,
  `resolved_flag` bit(1) NOT NULL,
  `severity_level` enum('HIGH','LOW','MEDIUM') DEFAULT NULL,
  `source_authority` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`fraud_id`),
  KEY `idx_fraud_aadhaar` (`aadhaar_number`),
  KEY `idx_fraud_pan` (`pan_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- loan history
CREATE TABLE `loan_history` (
  `loan_id` binary(16) NOT NULL,
  `aadhaar_number` varchar(12) NOT NULL,
  `closed_loans_count` int NOT NULL,
  `credit_limit` decimal(12,2) DEFAULT NULL,
  `current_outstanding` decimal(12,2) DEFAULT NULL,
  `default_flag` bit(1) NOT NULL,
  `dti_ratio` decimal(5,2) DEFAULT NULL,
  `emi_amount` decimal(10,2) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `interest_rate` decimal(5,2) DEFAULT NULL,
  `last_payment_date` date DEFAULT NULL,
  `last_updated` datetime(6) NOT NULL,
  `late_payment_count` int NOT NULL,
  `loan_amount` decimal(12,2) DEFAULT NULL,
  `loan_status` varchar(20) DEFAULT NULL,
  `loan_type` varchar(50) DEFAULT NULL,
  `missed_payments` int NOT NULL,
  `pan_number` varchar(10) NOT NULL,
  `secured_flag` bit(1) NOT NULL,
  `start_date` date DEFAULT NULL,
  `tenure_months` int DEFAULT NULL,
  PRIMARY KEY (`loan_id`),
  KEY `idx_loan_updated` (`last_updated`),
  KEY `idx_loan_aadhaar` (`aadhaar_number`),
  KEY `idx_loan_pan` (`pan_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


-- credit score history

CREATE TABLE `credit_score_history` (
  `score_id` binary(16) NOT NULL,
  `aadhaar_number` varchar(12) NOT NULL,
  `avg_monthly_income` decimal(12,2) DEFAULT NULL,
  `avg_outstanding_amount` decimal(12,2) DEFAULT NULL,
  `computed_date` datetime(6) NOT NULL,
  `credit_score` int DEFAULT NULL,
  `fraud_cases` int DEFAULT NULL,
  `pan_number` varchar(10) NOT NULL,
  `remarks` text,
  `risk_score` enum('HIGH','LOW','MEDIUM') DEFAULT NULL,
  `total_defaults` int DEFAULT NULL,
  `total_loans` int DEFAULT NULL,
  PRIMARY KEY (`score_id`),
  KEY `idx_credit_aadhaar` (`aadhaar_number`),
  KEY `idx_credit_pan` (`pan_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci