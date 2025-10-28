-- =====================================================
-- Alternative Data Scoring System - Database Migration
-- Version: 2.0
-- Purpose: Add tables and procedures for alternative credit scoring
-- =====================================================

-- Table 1: Applicant Banking Behavior
-- Stores banking transaction patterns and account behavior
CREATE TABLE applicant_banking_behavior (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    user_id UUID NOT NULL,
    avg_monthly_balance DECIMAL(15,2) DEFAULT 0.00,
    transaction_frequency INT DEFAULT 0,
    salary_credits_count INT DEFAULT 0,
    bounce_count INT DEFAULT 0,
    account_age_months INT DEFAULT 0,
    account_type VARCHAR(20) DEFAULT 'SAVINGS',
    bank_name VARCHAR(100),
    last_salary_credit_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_banking_behavior_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_banking_behavior_user (user_id),
    INDEX idx_banking_behavior_balance (avg_monthly_balance),
    INDEX idx_banking_behavior_created (created_at)
);

-- Table 2: Applicant Digital Footprint
-- Stores digital presence and online transaction behavior
CREATE TABLE applicant_digital_footprint (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    user_id UUID NOT NULL,
    mobile_number VARCHAR(15),
    email_domain VARCHAR(100),
    social_media_presence BOOLEAN DEFAULT FALSE,
    digital_transaction_score INT DEFAULT 0,
    online_presence_months INT DEFAULT 0,
    upi_transaction_count INT DEFAULT 0,
    ecommerce_purchase_count INT DEFAULT 0,
    digital_wallet_usage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_digital_footprint_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_digital_footprint_user (user_id),
    INDEX idx_digital_footprint_mobile (mobile_number),
    INDEX idx_digital_footprint_score (digital_transaction_score)
);

-- Table 3: Alternative Data Scores
-- Stores calculated alternative credit scores
CREATE TABLE alternative_data_scores (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    user_id UUID NOT NULL,
    banking_score INT DEFAULT 0,
    digital_score INT DEFAULT 0,
    employment_score INT DEFAULT 0,
    total_score INT DEFAULT 0,
    confidence_level DECIMAL(3,2) DEFAULT 0.00,
    data_sources VARCHAR(500),
    risk_category VARCHAR(20) DEFAULT 'HIGH',
    alternative_credit_score INT,
    calculation_method VARCHAR(50) DEFAULT 'WEIGHTED_AVERAGE',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_alt_scores_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_alt_scores_user (user_id),
    INDEX idx_alt_scores_total (total_score),
    INDEX idx_alt_scores_calculated (calculated_at),
    INDEX idx_alt_scores_confidence (confidence_level)
);

-- Table 4: Loan Scoring Rules
-- Configurable rules for loan-specific scoring adjustments
CREATE TABLE loan_scoring_rules (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    loan_type VARCHAR(30) NOT NULL,
    min_amount DECIMAL(15,2) DEFAULT 0.00,
    max_amount DECIMAL(15,2) DEFAULT 999999999.99,
    min_credit_score_required INT DEFAULT 300,
    max_risk_score_allowed INT DEFAULT 100,
    additional_criteria TEXT,
    requires_collateral BOOLEAN DEFAULT FALSE,
    requires_guarantor BOOLEAN DEFAULT FALSE,
    risk_multiplier DECIMAL(3,2) DEFAULT 1.00,
    score_adjustment INT DEFAULT 0,
    rule_name VARCHAR(100) NOT NULL,
    rule_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_scoring_rules_loan_type (loan_type),
    INDEX idx_scoring_rules_amount_range (min_amount, max_amount),
    INDEX idx_scoring_rules_active (is_active)
);

-- Table 5: Scoring Metrics
-- Performance monitoring and analytics
CREATE TABLE scoring_metrics (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    scoring_type VARCHAR(50) NOT NULL,
    duration_ms BIGINT NOT NULL,
    success BOOLEAN NOT NULL,
    risk_category VARCHAR(20),
    application_id UUID,
    user_id UUID,
    error_message TEXT,
    data_sources_used VARCHAR(500),
    confidence_achieved DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_metrics_application 
        FOREIGN KEY (application_id) REFERENCES loan_applications(id) ON DELETE SET NULL,
    CONSTRAINT fk_metrics_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance and analytics
    INDEX idx_metrics_scoring_type (scoring_type),
    INDEX idx_metrics_success (success),
    INDEX idx_metrics_created (created_at),
    INDEX idx_metrics_application (application_id),
    INDEX idx_metrics_duration (duration_ms)
);

-- =====================================================
-- ALTER EXISTING TABLES
-- =====================================================

-- Add new columns to loan_applications table
ALTER TABLE loan_applications 
ADD COLUMN alternative_score_used BOOLEAN DEFAULT FALSE,
ADD COLUMN scoring_confidence DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN data_sources VARCHAR(500),
ADD COLUMN scoring_method VARCHAR(50) DEFAULT 'PRIMARY';

-- Add new columns to credit_score_history table
ALTER TABLE credit_score_history 
ADD COLUMN alternative_data_used BOOLEAN DEFAULT FALSE,
ADD COLUMN confidence_level DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN data_sources VARCHAR(500),
ADD COLUMN scoring_method VARCHAR(50) DEFAULT 'EXTERNAL_BUREAU';

-- Add new columns to applicant_financial_profile table
ALTER TABLE applicant_financial_profile 
ADD COLUMN employment_stability_score INT DEFAULT 0,
ADD COLUMN income_verification_status VARCHAR(30) DEFAULT 'PENDING',
ADD COLUMN debt_to_income_ratio DECIMAL(5,2) DEFAULT 0.00;

-- =====================================================
-- INSERT DEFAULT LOAN SCORING RULES
-- =====================================================

-- Personal Loan Rules
INSERT INTO loan_scoring_rules (
    loan_type, min_amount, max_amount, min_credit_score_required, 
    max_risk_score_allowed, requires_collateral, requires_guarantor,
    risk_multiplier, score_adjustment, rule_name, rule_description
) VALUES 
('PERSONAL', 10000.00, 100000.00, 600, 60, FALSE, FALSE, 1.0, 0, 
 'Personal Loan Standard', 'Standard personal loan rules for amounts up to 1 lakh'),
 
('PERSONAL', 100001.00, 500000.00, 650, 50, FALSE, TRUE, 1.2, -20, 
 'Personal Loan High Amount', 'Higher scrutiny for personal loans above 1 lakh'),
 
('PERSONAL', 500001.00, 2000000.00, 700, 40, TRUE, TRUE, 1.5, -50, 
 'Personal Loan Premium', 'Premium personal loans requiring collateral');

-- Home Loan Rules
INSERT INTO loan_scoring_rules (
    loan_type, min_amount, max_amount, min_credit_score_required, 
    max_risk_score_allowed, requires_collateral, requires_guarantor,
    risk_multiplier, score_adjustment, rule_name, rule_description
) VALUES 
('HOME', 500000.00, 5000000.00, 650, 50, TRUE, FALSE, 0.8, 30, 
 'Home Loan Standard', 'Standard home loan with property as collateral'),
 
('HOME', 5000001.00, 20000000.00, 700, 40, TRUE, TRUE, 0.9, 20, 
 'Home Loan Premium', 'Premium home loans above 50 lakhs');

-- Business Loan Rules
INSERT INTO loan_scoring_rules (
    loan_type, min_amount, max_amount, min_credit_score_required, 
    max_risk_score_allowed, requires_collateral, requires_guarantor,
    risk_multiplier, score_adjustment, rule_name, rule_description
) VALUES 
('BUSINESS', 50000.00, 500000.00, 600, 65, FALSE, TRUE, 1.3, -30, 
 'Business Loan SME', 'Small business loans with guarantor requirement'),
 
('BUSINESS', 500001.00, 5000000.00, 650, 55, TRUE, TRUE, 1.4, -40, 
 'Business Loan Corporate', 'Corporate business loans with collateral');

-- Vehicle Loan Rules
INSERT INTO loan_scoring_rules (
    loan_type, min_amount, max_amount, min_credit_score_required, 
    max_risk_score_allowed, requires_collateral, requires_guarantor,
    risk_multiplier, score_adjustment, rule_name, rule_description
) VALUES 
('VEHICLE', 100000.00, 2000000.00, 600, 60, TRUE, FALSE, 0.9, 10, 
 'Vehicle Loan Standard', 'Vehicle loans with vehicle as collateral');

-- Education Loan Rules
INSERT INTO loan_scoring_rules (
    loan_type, min_amount, max_amount, min_credit_score_required, 
    max_risk_score_allowed, requires_collateral, requires_guarantor,
    risk_multiplier, score_adjustment, rule_name, rule_description
) VALUES 
('EDUCATION', 50000.00, 1000000.00, 550, 70, FALSE, TRUE, 1.1, -10, 
 'Education Loan Standard', 'Education loans with co-applicant/guarantor');

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Sample banking behavior data (for testing)
INSERT INTO applicant_banking_behavior (
    user_id, avg_monthly_balance, transaction_frequency, salary_credits_count,
    bounce_count, account_age_months, account_type, bank_name
) VALUES 
-- High-quality banking behavior
((SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1), 
 75000.00, 25, 12, 0, 36, 'SALARY', 'HDFC Bank'),
 
-- Medium-quality banking behavior  
((SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1), 
 35000.00, 15, 8, 1, 18, 'SAVINGS', 'SBI'),
 
-- Low-quality banking behavior
((SELECT id FROM users WHERE email = 'sample@example.com' LIMIT 1), 
 8000.00, 8, 3, 3, 6, 'SAVINGS', 'PNB');

-- Sample digital footprint data (for testing)
INSERT INTO applicant_digital_footprint (
    user_id, mobile_number, email_domain, social_media_presence,
    digital_transaction_score, online_presence_months, upi_transaction_count,
    ecommerce_purchase_count, digital_wallet_usage
) VALUES 
-- High digital presence
((SELECT id FROM users WHERE email = 'test@example.com' LIMIT 1), 
 '9876543210', 'gmail.com', TRUE, 85, 48, 150, 25, TRUE),
 
-- Medium digital presence
((SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1), 
 '8765432109', 'yahoo.com', TRUE, 65, 24, 80, 12, TRUE),
 
-- Low digital presence
((SELECT id FROM users WHERE email = 'sample@example.com' LIMIT 1), 
 '7654321098', 'gmail.com', FALSE, 30, 12, 20, 3, FALSE);

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Additional composite indexes for complex queries
CREATE INDEX idx_banking_behavior_composite ON applicant_banking_behavior(user_id, avg_monthly_balance, bounce_count);
CREATE INDEX idx_digital_footprint_composite ON applicant_digital_footprint(user_id, digital_transaction_score, social_media_presence);
CREATE INDEX idx_alt_scores_composite ON alternative_data_scores(user_id, total_score, confidence_level);
CREATE INDEX idx_loan_rules_composite ON loan_scoring_rules(loan_type, is_active, min_amount, max_amount);

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

-- Table comments for documentation
ALTER TABLE applicant_banking_behavior COMMENT = 'Stores banking behavior patterns for alternative credit scoring';
ALTER TABLE applicant_digital_footprint COMMENT = 'Stores digital presence and online transaction behavior';
ALTER TABLE alternative_data_scores COMMENT = 'Calculated alternative credit scores when external data unavailable';
ALTER TABLE loan_scoring_rules COMMENT = 'Configurable rules for loan-specific risk adjustments';
ALTER TABLE scoring_metrics COMMENT = 'Performance monitoring and scoring analytics';
