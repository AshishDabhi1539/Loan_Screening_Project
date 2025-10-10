-- CORRECTED Stored Procedure for External Credit and Risk Score Calculation
-- Fixed structural issues and logic flow

DELIMITER //

DROP PROCEDURE IF EXISTS CalculateExternalScores //

CREATE PROCEDURE CalculateExternalScores(
    IN p_aadhaar_number VARCHAR(12),
    IN p_pan_number VARCHAR(10),
    OUT p_credit_score INT,
    OUT p_risk_score VARCHAR(10),
    OUT p_risk_score_numeric INT,
    OUT p_red_alert_flag BOOLEAN,
    OUT p_total_outstanding DECIMAL(15,2),
    OUT p_active_loans_count INT,
    OUT p_total_missed_payments INT,
    OUT p_has_defaults BOOLEAN,
    OUT p_active_fraud_cases INT,
    OUT p_risk_factors TEXT,
    OUT p_credit_score_reason TEXT,
    OUT p_data_found BOOLEAN
)
BEGIN
    DECLARE v_avg_balance DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_bounces INT DEFAULT 0;
    DECLARE v_has_salary_account BOOLEAN DEFAULT FALSE;
    DECLARE v_has_fraud_history BOOLEAN DEFAULT FALSE;
    DECLARE v_previous_credit_score INT DEFAULT NULL;
    DECLARE v_previous_calculations_count INT DEFAULT 0;
    DECLARE v_base_score INT DEFAULT 300;
    DECLARE v_risk_points INT DEFAULT 0;
    DECLARE v_id_validation_count INT DEFAULT 0;
    DECLARE v_aadhaar_exists INT DEFAULT 0;
    DECLARE v_pan_exists INT DEFAULT 0;
    DECLARE v_identity_valid BOOLEAN DEFAULT TRUE;
    
    -- Initialize all output parameters first
    SET p_credit_score = NULL;
    SET p_risk_score = 'UNKNOWN';
    SET p_risk_score_numeric = 0;
    SET p_red_alert_flag = FALSE;
    SET p_total_outstanding = 0;
    SET p_active_loans_count = 0;
    SET p_total_missed_payments = 0;
    SET p_has_defaults = FALSE;
    SET p_active_fraud_cases = 0;
    SET p_risk_factors = '';
    SET p_credit_score_reason = '';
    SET p_data_found = FALSE;
    
    -- STEP 1: VALIDATE IDENTITY
    -- Check if both IDs exist together in any table
    SELECT COUNT(*) INTO v_id_validation_count
    FROM (
        SELECT 1 FROM bank_details WHERE aadhaar_number = p_aadhaar_number AND pan_number = p_pan_number
        UNION
        SELECT 1 FROM loan_history WHERE aadhaar_number = p_aadhaar_number AND pan_number = p_pan_number
        UNION
        SELECT 1 FROM fraud_records WHERE aadhaar_number = p_aadhaar_number AND pan_number = p_pan_number
        UNION
        SELECT 1 FROM credit_score_history WHERE aadhaar_number = p_aadhaar_number AND pan_number = p_pan_number
    ) AS id_check;
    
    -- If no records with both IDs together, check if they exist separately
    IF v_id_validation_count = 0 THEN
        SELECT COUNT(*) INTO v_aadhaar_exists
        FROM (
            SELECT 1 FROM bank_details WHERE aadhaar_number = p_aadhaar_number
            UNION
            SELECT 1 FROM loan_history WHERE aadhaar_number = p_aadhaar_number
            UNION
            SELECT 1 FROM fraud_records WHERE aadhaar_number = p_aadhaar_number
        ) AS aadhaar_check;
        
        SELECT COUNT(*) INTO v_pan_exists
        FROM (
            SELECT 1 FROM bank_details WHERE pan_number = p_pan_number
            UNION
            SELECT 1 FROM loan_history WHERE pan_number = p_pan_number
            UNION
            SELECT 1 FROM fraud_records WHERE pan_number = p_pan_number
        ) AS pan_check;
        
        -- If both exist separately, it's identity fraud
        IF v_aadhaar_exists > 0 AND v_pan_exists > 0 THEN
            SET v_identity_valid = FALSE;
            SET p_data_found = FALSE;
            SET p_risk_score = 'INVALID';
            SET p_risk_score_numeric = 100;
            SET p_red_alert_flag = TRUE;
            SET p_risk_factors = '🚨 CRITICAL ERROR: Aadhaar and PAN belong to different persons. Identity verification failed.';
            SET p_credit_score_reason = 'Cannot calculate score - Identity mismatch detected';
        END IF;
    END IF;
    
    -- STEP 2: PROCEED ONLY IF IDENTITY IS VALID
    IF v_identity_valid = TRUE THEN
        -- Get Bank Details Metrics
        SELECT 
            COALESCE(AVG(average_monthly_balance), 0),
            COALESCE(SUM(cheque_bounce_count), 0),
            CASE WHEN COUNT(CASE WHEN salary_account_flag = TRUE THEN 1 END) > 0 THEN TRUE ELSE FALSE END
        INTO v_avg_balance, v_total_bounces, v_has_salary_account
        FROM bank_details 
        WHERE aadhaar_number = p_aadhaar_number AND pan_number = p_pan_number;
        
        -- Get Loan History Metrics
        SELECT 
            COALESCE(SUM(current_outstanding), 0),
            COUNT(CASE WHEN loan_status = 'Active' THEN 1 END),
            COALESCE(SUM(missed_payments), 0),
            CASE WHEN COUNT(CASE WHEN default_flag = TRUE THEN 1 END) > 0 THEN TRUE ELSE FALSE END
        INTO p_total_outstanding, p_active_loans_count, p_total_missed_payments, p_has_defaults
        FROM loan_history 
        WHERE aadhaar_number = p_aadhaar_number AND pan_number = p_pan_number;
        
        -- Get Fraud Records Metrics
        SELECT 
            COUNT(CASE WHEN resolved_flag = FALSE THEN 1 END),
            CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END
        INTO p_active_fraud_cases, v_has_fraud_history
        FROM fraud_records 
        WHERE aadhaar_number = p_aadhaar_number AND pan_number = p_pan_number;
        
        -- Get Previous Credit Score History
        SELECT 
            COALESCE(MAX(credit_score), 0),
            COUNT(*)
        INTO v_previous_credit_score, v_previous_calculations_count
        FROM credit_score_history 
        WHERE aadhaar_number = p_aadhaar_number AND pan_number = p_pan_number
        ORDER BY computed_date DESC 
        LIMIT 1;
        
        -- Check if any meaningful data exists
        IF (p_total_outstanding > 0 OR p_active_loans_count > 0 OR v_avg_balance > 0 OR v_has_fraud_history = TRUE OR v_previous_calculations_count > 0) THEN
            SET p_data_found = TRUE;
            
            -- CREDIT SCORE CALCULATION
            SET v_base_score = 300;
            
            -- Banking factors
            IF v_avg_balance > 100000 THEN
                SET v_base_score = v_base_score + 50;
            ELSEIF v_avg_balance > 50000 THEN
                SET v_base_score = v_base_score + 30;
            ELSEIF v_avg_balance > 10000 THEN
                SET v_base_score = v_base_score + 15;
            END IF;
            
            IF v_has_salary_account = TRUE THEN
                SET v_base_score = v_base_score + 40;
            END IF;
            
            IF v_total_bounces = 0 THEN
                SET v_base_score = v_base_score + 30;
            ELSE
                SET v_base_score = v_base_score - LEAST(v_total_bounces * 5, 50);
            END IF;
            
            -- Loan factors
            IF p_total_missed_payments = 0 THEN
                SET v_base_score = v_base_score + 80;
            ELSE
                SET v_base_score = v_base_score - LEAST(p_total_missed_payments * 10, 100);
            END IF;
            
            IF p_has_defaults = FALSE THEN
                SET v_base_score = v_base_score + 60;
            ELSE
                SET v_base_score = v_base_score - 100;
            END IF;
            
            IF p_active_loans_count <= 2 THEN
                SET v_base_score = v_base_score + 30;
            ELSEIF p_active_loans_count <= 5 THEN
                SET v_base_score = v_base_score + 10;
            ELSE
                SET v_base_score = v_base_score - 20;
            END IF;
            
            -- Outstanding amount factor
            IF p_total_outstanding = 0 THEN
                SET v_base_score = v_base_score + 40;
            ELSEIF p_total_outstanding <= 500000 THEN
                SET v_base_score = v_base_score + 20;
            ELSEIF p_total_outstanding <= 1000000 THEN
                SET v_base_score = v_base_score + 5;
            ELSE
                SET v_base_score = v_base_score - 30;
            END IF;
            
            -- Fraud factors
            IF v_has_fraud_history = TRUE THEN
                SET v_base_score = v_base_score - 80;
            END IF;
            
            IF p_active_fraud_cases > 0 THEN
                SET v_base_score = v_base_score - 100;
            END IF;
            
            -- Historical enhancement
            IF v_previous_calculations_count >= 5 THEN
                SET v_base_score = v_base_score + 15;
            ELSEIF v_previous_calculations_count >= 3 THEN
                SET v_base_score = v_base_score + 10;
            END IF;
            
            IF v_previous_credit_score IS NOT NULL AND v_previous_credit_score > 0 THEN
                IF v_previous_credit_score >= 700 THEN
                    SET v_base_score = v_base_score + 20;
                ELSEIF v_previous_credit_score >= 600 THEN
                    SET v_base_score = v_base_score + 10;
                END IF;
            END IF;
            
            -- Ensure credit score is within valid range (300-850)
            SET p_credit_score = GREATEST(300, LEAST(850, v_base_score));
            
            -- RISK SCORE CALCULATION
            SET v_risk_points = 0;
            
            -- Credit score based risk
            IF p_credit_score < 450 THEN
                SET v_risk_points = v_risk_points + 60;
            ELSEIF p_credit_score < 550 THEN
                SET v_risk_points = v_risk_points + 40;
            ELSEIF p_credit_score < 650 THEN
                SET v_risk_points = v_risk_points + 25;
            ELSEIF p_credit_score < 750 THEN
                SET v_risk_points = v_risk_points + 10;
            END IF;
            
            -- High risk factors
            IF p_has_defaults = TRUE THEN
                SET v_risk_points = v_risk_points + 40;
            END IF;
            
            IF p_active_fraud_cases > 0 THEN
                SET v_risk_points = v_risk_points + 50;
            END IF;
            
            IF p_total_missed_payments > 5 THEN
                SET v_risk_points = v_risk_points + 30;
            ELSEIF p_total_missed_payments > 2 THEN
                SET v_risk_points = v_risk_points + 15;
            END IF;
            
            IF v_total_bounces > 3 THEN
                SET v_risk_points = v_risk_points + 20;
            ELSEIF v_total_bounces > 1 THEN
                SET v_risk_points = v_risk_points + 10;
            END IF;
            
            IF p_total_outstanding > 2000000 THEN
                SET v_risk_points = v_risk_points + 25;
            ELSEIF p_total_outstanding > 1000000 THEN
                SET v_risk_points = v_risk_points + 15;
            END IF;
            
            -- Medium risk factors
            IF p_active_loans_count > 5 THEN
                SET v_risk_points = v_risk_points + 15;
            ELSEIF p_active_loans_count > 3 THEN
                SET v_risk_points = v_risk_points + 8;
            END IF;
            
            IF v_avg_balance < 5000 THEN
                SET v_risk_points = v_risk_points + 15;
            ELSEIF v_avg_balance < 25000 THEN
                SET v_risk_points = v_risk_points + 8;
            END IF;
            
            IF v_has_fraud_history = TRUE THEN
                SET v_risk_points = v_risk_points + 20;
            END IF;
            
            -- Risk mitigation factors
            IF v_has_salary_account = TRUE THEN
                SET v_risk_points = v_risk_points - 8;
            END IF;
            
            IF p_total_missed_payments = 0 AND p_credit_score >= 650 THEN
                SET v_risk_points = v_risk_points - 12;
            END IF;
            
            IF v_has_fraud_history = FALSE AND p_credit_score >= 600 THEN
                SET v_risk_points = v_risk_points - 5;
            END IF;
            
            -- Ensure risk points are within 0-100 range
            SET v_risk_points = GREATEST(0, LEAST(100, v_risk_points));
            SET p_risk_score_numeric = v_risk_points;
            
            -- Set risk level and red alert
            IF v_risk_points >= 90 THEN
                SET p_red_alert_flag = TRUE;
                SET p_risk_score = 'HIGH';
            ELSEIF v_risk_points >= 60 THEN
                SET p_risk_score = 'HIGH';
            ELSEIF v_risk_points >= 25 THEN
                SET p_risk_score = 'MEDIUM';
            ELSE
                SET p_risk_score = 'LOW';
            END IF;
            
            -- Build risk factors explanation
            SET p_risk_factors = '';
            
            IF p_red_alert_flag = TRUE THEN
                SET p_risk_factors = CONCAT(p_risk_factors, '🚨 RED ALERT: Extremely high risk (', p_risk_score_numeric, '/100); ');
            END IF;
            
            IF p_credit_score < 450 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Very poor credit score (', p_credit_score, '); ');
            ELSEIF p_credit_score < 550 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Poor credit score (', p_credit_score, '); ');
            ELSEIF p_credit_score < 650 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Fair credit score (', p_credit_score, '); ');
            END IF;
            
            IF p_has_defaults = TRUE THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Loan defaults; ');
            END IF;
            IF p_active_fraud_cases > 0 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Active fraud cases; ');
            END IF;
            IF p_total_missed_payments > 5 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Multiple missed payments (', p_total_missed_payments, '); ');
            ELSEIF p_total_missed_payments > 2 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Some missed payments (', p_total_missed_payments, '); ');
            END IF;
            IF v_total_bounces > 3 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'High cheque bounces (', v_total_bounces, '); ');
            ELSEIF v_total_bounces > 1 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Some cheque bounces (', v_total_bounces, '); ');
            END IF;
            IF p_total_outstanding > 2000000 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Very high outstanding debt (₹', p_total_outstanding, '); ');
            ELSEIF p_total_outstanding > 1000000 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'High outstanding debt (₹', p_total_outstanding, '); ');
            END IF;
            IF p_active_loans_count > 5 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Multiple active loans (', p_active_loans_count, '); ');
            END IF;
            IF v_avg_balance < 5000 THEN
                SET p_risk_factors = CONCAT(p_risk_factors, 'Very low account balance (₹', v_avg_balance, '); ');
            END IF;
            
            IF LENGTH(p_risk_factors) = 0 THEN
                SET p_risk_factors = 'No significant risk factors identified';
            END IF;
            
            -- Build credit score reasoning
            SET p_credit_score_reason = '';
            IF p_total_missed_payments = 0 THEN
                SET p_credit_score_reason = CONCAT(p_credit_score_reason, 'No missed payments; ');
            END IF;
            IF v_has_salary_account = TRUE THEN
                SET p_credit_score_reason = CONCAT(p_credit_score_reason, 'Salary account holder; ');
            END IF;
            IF v_avg_balance > 50000 THEN
                SET p_credit_score_reason = CONCAT(p_credit_score_reason, 'Good account balance; ');
            END IF;
            IF p_has_defaults = FALSE THEN
                SET p_credit_score_reason = CONCAT(p_credit_score_reason, 'No loan defaults; ');
            END IF;
            IF v_previous_calculations_count > 0 THEN
                SET p_credit_score_reason = CONCAT(p_credit_score_reason, 'Historical credit behavior considered; ');
            END IF;
            
            IF LENGTH(p_credit_score_reason) = 0 THEN
                SET p_credit_score_reason = 'Based on available financial data';
            END IF;
            
        ELSE
            -- No meaningful data found
            SET p_data_found = FALSE;
            SET p_risk_factors = 'No external data available for assessment';
            SET p_credit_score_reason = 'Insufficient data for credit score calculation';
        END IF;
    END IF;
    
END //

DELIMITER ;
