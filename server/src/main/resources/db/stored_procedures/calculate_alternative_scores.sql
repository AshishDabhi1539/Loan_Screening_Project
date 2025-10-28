-- =====================================================
-- Alternative Credit Scoring Stored Procedure
-- Purpose: Calculate credit scores using alternative data sources
-- When: Used when external credit bureau data is unavailable
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS CalculateAlternativeScore //

CREATE PROCEDURE CalculateAlternativeScore(
    IN p_user_id VARCHAR(36),
    IN p_mobile VARCHAR(15),
    IN p_email VARCHAR(100),
    OUT p_alt_credit_score INT,
    OUT p_alt_risk_score VARCHAR(10),
    OUT p_alt_risk_numeric INT,
    OUT p_confidence_level DECIMAL(3,2),
    OUT p_data_sources VARCHAR(500),
    OUT p_banking_score INT,
    OUT p_digital_score INT,
    OUT p_employment_score INT,
    OUT p_total_score INT,
    OUT p_calculation_success BOOLEAN
)
BEGIN
    -- Variable declarations
    DECLARE v_banking_score INT DEFAULT 0;
    DECLARE v_digital_score INT DEFAULT 0;
    DECLARE v_employment_score INT DEFAULT 0;
    DECLARE v_total_score INT DEFAULT 0;
    DECLARE v_data_points INT DEFAULT 0;
    DECLARE v_confidence DECIMAL(3,2) DEFAULT 0.00;
    DECLARE v_sources VARCHAR(500) DEFAULT '';
    
    -- Banking behavior variables
    DECLARE v_avg_balance DECIMAL(15,2) DEFAULT 0;
    DECLARE v_transaction_freq INT DEFAULT 0;
    DECLARE v_salary_credits INT DEFAULT 0;
    DECLARE v_bounce_count INT DEFAULT 0;
    DECLARE v_account_age INT DEFAULT 0;
    DECLARE v_account_type VARCHAR(20) DEFAULT '';
    
    -- Digital footprint variables
    DECLARE v_digital_trans_score INT DEFAULT 0;
    DECLARE v_social_media BOOLEAN DEFAULT FALSE;
    DECLARE v_online_months INT DEFAULT 0;
    DECLARE v_upi_count INT DEFAULT 0;
    DECLARE v_ecommerce_count INT DEFAULT 0;
    DECLARE v_wallet_usage BOOLEAN DEFAULT FALSE;
    
    -- Employment variables
    DECLARE v_employment_duration INT DEFAULT 0;
    DECLARE v_employment_type VARCHAR(30) DEFAULT '';
    DECLARE v_monthly_income DECIMAL(15,2) DEFAULT 0;
    DECLARE v_income_stability VARCHAR(20) DEFAULT '';
    
    -- Error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_calculation_success = FALSE;
        SET p_alt_credit_score = NULL;
        SET p_alt_risk_score = 'HIGH';
        SET p_alt_risk_numeric = 85;
        SET p_confidence_level = 0.00;
        SET p_data_sources = 'ERROR_OCCURRED';
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- =====================================================
    -- 1. BANKING BEHAVIOR SCORING (40% weight)
    -- =====================================================
    
    SELECT 
        COALESCE(avg_monthly_balance, 0),
        COALESCE(transaction_frequency, 0),
        COALESCE(salary_credits_count, 0),
        COALESCE(bounce_count, 0),
        COALESCE(account_age_months, 0),
        COALESCE(account_type, 'UNKNOWN')
    INTO 
        v_avg_balance, v_transaction_freq, v_salary_credits,
        v_bounce_count, v_account_age, v_account_type
    FROM applicant_banking_behavior 
    WHERE user_id = p_user_id
    LIMIT 1;
    
    -- Calculate banking score if data exists
    IF v_avg_balance > 0 OR v_transaction_freq > 0 THEN
        SET v_data_points = v_data_points + 1;
        SET v_sources = CONCAT(v_sources, 'BANKING_BEHAVIOR,');
        
        -- Average balance scoring (0-40 points)
        SET v_banking_score = v_banking_score + 
            CASE 
                WHEN v_avg_balance >= 100000 THEN 40
                WHEN v_avg_balance >= 50000 THEN 35
                WHEN v_avg_balance >= 25000 THEN 30
                WHEN v_avg_balance >= 10000 THEN 25
                WHEN v_avg_balance >= 5000 THEN 20
                ELSE 10
            END;
        
        -- Transaction frequency scoring (0-25 points)
        SET v_banking_score = v_banking_score + 
            CASE 
                WHEN v_transaction_freq >= 30 THEN 25
                WHEN v_transaction_freq >= 20 THEN 20
                WHEN v_transaction_freq >= 10 THEN 15
                WHEN v_transaction_freq >= 5 THEN 10
                ELSE 5
            END;
        
        -- Salary credits scoring (0-20 points)
        SET v_banking_score = v_banking_score + 
            CASE 
                WHEN v_salary_credits >= 12 THEN 20
                WHEN v_salary_credits >= 6 THEN 15
                WHEN v_salary_credits >= 3 THEN 10
                ELSE 5
            END;
        
        -- Bounce penalty (subtract points)
        SET v_banking_score = v_banking_score - (v_bounce_count * 10);
        
        -- Account age bonus (0-15 points)
        SET v_banking_score = v_banking_score + 
            CASE 
                WHEN v_account_age >= 36 THEN 15
                WHEN v_account_age >= 24 THEN 12
                WHEN v_account_age >= 12 THEN 8
                WHEN v_account_age >= 6 THEN 5
                ELSE 0
            END;
        
        -- Account type bonus
        SET v_banking_score = v_banking_score + 
            CASE 
                WHEN v_account_type = 'SALARY' THEN 10
                WHEN v_account_type = 'CURRENT' THEN 5
                ELSE 0
            END;
        
        -- Ensure banking score is within bounds
        SET v_banking_score = GREATEST(0, LEAST(100, v_banking_score));
    END IF;
    
    -- =====================================================
    -- 2. DIGITAL FOOTPRINT SCORING (30% weight)
    -- =====================================================
    
    SELECT 
        COALESCE(digital_transaction_score, 0),
        COALESCE(social_media_presence, FALSE),
        COALESCE(online_presence_months, 0),
        COALESCE(upi_transaction_count, 0),
        COALESCE(ecommerce_purchase_count, 0),
        COALESCE(digital_wallet_usage, FALSE)
    INTO 
        v_digital_trans_score, v_social_media, v_online_months,
        v_upi_count, v_ecommerce_count, v_wallet_usage
    FROM applicant_digital_footprint 
    WHERE user_id = p_user_id
    LIMIT 1;
    
    -- Calculate digital score if data exists
    IF v_digital_trans_score > 0 OR v_upi_count > 0 OR v_ecommerce_count > 0 THEN
        SET v_data_points = v_data_points + 1;
        SET v_sources = CONCAT(v_sources, 'DIGITAL_FOOTPRINT,');
        
        -- Digital transaction score (0-40 points)
        SET v_digital_score = v_digital_score + 
            CASE 
                WHEN v_digital_trans_score >= 90 THEN 40
                WHEN v_digital_trans_score >= 80 THEN 35
                WHEN v_digital_trans_score >= 70 THEN 30
                WHEN v_digital_trans_score >= 60 THEN 25
                WHEN v_digital_trans_score >= 50 THEN 20
                ELSE 10
            END;
        
        -- UPI transaction scoring (0-25 points)
        SET v_digital_score = v_digital_score + 
            CASE 
                WHEN v_upi_count >= 100 THEN 25
                WHEN v_upi_count >= 50 THEN 20
                WHEN v_upi_count >= 20 THEN 15
                WHEN v_upi_count >= 10 THEN 10
                ELSE 5
            END;
        
        -- E-commerce purchase scoring (0-20 points)
        SET v_digital_score = v_digital_score + 
            CASE 
                WHEN v_ecommerce_count >= 20 THEN 20
                WHEN v_ecommerce_count >= 10 THEN 15
                WHEN v_ecommerce_count >= 5 THEN 10
                ELSE 5
            END;
        
        -- Social media presence bonus (0-10 points)
        IF v_social_media THEN
            SET v_digital_score = v_digital_score + 10;
        END IF;
        
        -- Digital wallet usage bonus (0-5 points)
        IF v_wallet_usage THEN
            SET v_digital_score = v_digital_score + 5;
        END IF;
        
        -- Ensure digital score is within bounds
        SET v_digital_score = GREATEST(0, LEAST(100, v_digital_score));
    END IF;
    
    -- =====================================================
    -- 3. EMPLOYMENT SCORING (30% weight)
    -- =====================================================
    
    SELECT 
        COALESCE(employment_duration_months, 0),
        COALESCE(employment_type, 'UNKNOWN'),
        COALESCE(monthly_income, 0),
        COALESCE(income_stability, 'UNKNOWN')
    INTO 
        v_employment_duration, v_employment_type,
        v_monthly_income, v_income_stability
    FROM applicant_financial_profile 
    WHERE user_id = p_user_id
    LIMIT 1;
    
    -- Calculate employment score if data exists
    IF v_employment_duration > 0 OR v_monthly_income > 0 THEN
        SET v_data_points = v_data_points + 1;
        SET v_sources = CONCAT(v_sources, 'EMPLOYMENT_DATA,');
        
        -- Employment duration scoring (0-40 points)
        SET v_employment_score = v_employment_score + 
            CASE 
                WHEN v_employment_duration >= 60 THEN 40
                WHEN v_employment_duration >= 36 THEN 35
                WHEN v_employment_duration >= 24 THEN 30
                WHEN v_employment_duration >= 12 THEN 25
                WHEN v_employment_duration >= 6 THEN 20
                ELSE 10
            END;
        
        -- Employment type scoring (0-25 points)
        SET v_employment_score = v_employment_score + 
            CASE 
                WHEN v_employment_type = 'PERMANENT' THEN 25
                WHEN v_employment_type = 'CONTRACT' THEN 20
                WHEN v_employment_type = 'TEMPORARY' THEN 15
                WHEN v_employment_type = 'SELF_EMPLOYED' THEN 20
                ELSE 10
            END;
        
        -- Monthly income scoring (0-25 points)
        SET v_employment_score = v_employment_score + 
            CASE 
                WHEN v_monthly_income >= 100000 THEN 25
                WHEN v_monthly_income >= 75000 THEN 22
                WHEN v_monthly_income >= 50000 THEN 20
                WHEN v_monthly_income >= 30000 THEN 18
                WHEN v_monthly_income >= 20000 THEN 15
                ELSE 10
            END;
        
        -- Income stability bonus (0-10 points)
        SET v_employment_score = v_employment_score + 
            CASE 
                WHEN v_income_stability = 'STABLE' THEN 10
                WHEN v_income_stability = 'MODERATE' THEN 7
                WHEN v_income_stability = 'VARIABLE' THEN 5
                ELSE 0
            END;
        
        -- Ensure employment score is within bounds
        SET v_employment_score = GREATEST(0, LEAST(100, v_employment_score));
    END IF;
    
    -- =====================================================
    -- 4. CALCULATE FINAL ALTERNATIVE SCORE
    -- =====================================================
    
    IF v_data_points > 0 THEN
        -- Weighted average calculation
        SET v_total_score = (
            (v_banking_score * 0.4) + 
            (v_digital_score * 0.3) + 
            (v_employment_score * 0.3)
        );
        
        -- Calculate confidence based on data availability
        SET v_confidence = v_data_points / 3.0;
        
        -- Convert to credit score range (300-650 for alternative scoring)
        SET p_alt_credit_score = 300 + (v_total_score * 3.5);
        
        -- Determine risk category and numeric score
        IF v_total_score >= 80 THEN 
            SET p_alt_risk_score = 'LOW';
            SET p_alt_risk_numeric = 25;
        ELSEIF v_total_score >= 65 THEN
            SET p_alt_risk_score = 'MEDIUM';
            SET p_alt_risk_numeric = 45;
        ELSEIF v_total_score >= 50 THEN
            SET p_alt_risk_score = 'MEDIUM';
            SET p_alt_risk_numeric = 55;
        ELSE
            SET p_alt_risk_score = 'HIGH';
            SET p_alt_risk_numeric = 70;
        END IF;
        
        -- Adjust confidence based on score quality
        IF v_total_score >= 70 THEN
            SET v_confidence = v_confidence * 1.1; -- Boost confidence for good scores
        ELSEIF v_total_score < 40 THEN
            SET v_confidence = v_confidence * 0.8; -- Reduce confidence for poor scores
        END IF;
        
        -- Ensure confidence is within bounds
        SET v_confidence = GREATEST(0.0, LEAST(1.0, v_confidence));
        
    ELSE
        -- No alternative data available
        SET p_alt_credit_score = NULL;
        SET p_alt_risk_score = 'HIGH';
        SET p_alt_risk_numeric = 75;
        SET v_confidence = 0.0;
        SET v_sources = 'NO_DATA_AVAILABLE';
        SET v_total_score = 0;
    END IF;
    
    -- =====================================================
    -- 5. SAVE ALTERNATIVE SCORE RECORD
    -- =====================================================
    
    INSERT INTO alternative_data_scores (
        user_id, banking_score, digital_score, employment_score,
        total_score, confidence_level, data_sources, risk_category,
        alternative_credit_score, calculation_method
    ) VALUES (
        p_user_id, v_banking_score, v_digital_score, v_employment_score,
        v_total_score, v_confidence, TRIM(TRAILING ',' FROM v_sources), 
        p_alt_risk_score, p_alt_credit_score, 'WEIGHTED_ALTERNATIVE'
    );
    
    -- Set output parameters
    SET p_confidence_level = v_confidence;
    SET p_data_sources = TRIM(TRAILING ',' FROM v_sources);
    SET p_banking_score = v_banking_score;
    SET p_digital_score = v_digital_score;
    SET p_employment_score = v_employment_score;
    SET p_total_score = v_total_score;
    SET p_calculation_success = TRUE;
    
    COMMIT;
    
END //

-- =====================================================
-- Enhanced Scoring Metrics Procedure
-- =====================================================

DROP PROCEDURE IF EXISTS GetScoringPerformanceMetrics //

CREATE PROCEDURE GetScoringPerformanceMetrics(
    IN p_start_date DATETIME,
    IN p_end_date DATETIME,
    IN p_scoring_type VARCHAR(50)
)
BEGIN
    SELECT 
        scoring_type,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_attempts,
        ROUND(AVG(duration_ms), 2) as avg_duration_ms,
        ROUND(AVG(CASE WHEN success = TRUE THEN duration_ms END), 2) as avg_success_duration_ms,
        COUNT(DISTINCT application_id) as unique_applications,
        COUNT(DISTINCT user_id) as unique_users,
        ROUND(AVG(confidence_achieved), 3) as avg_confidence,
        
        -- Risk distribution
        SUM(CASE WHEN risk_category = 'LOW' THEN 1 ELSE 0 END) as low_risk_count,
        SUM(CASE WHEN risk_category = 'MEDIUM' THEN 1 ELSE 0 END) as medium_risk_count,
        SUM(CASE WHEN risk_category = 'HIGH' THEN 1 ELSE 0 END) as high_risk_count,
        
        -- Success rate by risk
        ROUND(
            SUM(CASE WHEN risk_category = 'LOW' AND success = TRUE THEN 1 ELSE 0 END) * 100.0 / 
            NULLIF(SUM(CASE WHEN risk_category = 'LOW' THEN 1 ELSE 0 END), 0), 2
        ) as low_risk_success_rate,
        
        -- Data source analysis
        GROUP_CONCAT(DISTINCT data_sources_used) as data_sources_variety
        
    FROM scoring_metrics 
    WHERE created_at BETWEEN p_start_date AND p_end_date
    AND (p_scoring_type IS NULL OR scoring_type = p_scoring_type)
    GROUP BY scoring_type
    ORDER BY total_attempts DESC;
END //

DELIMITER ;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to application user
-- GRANT EXECUTE ON PROCEDURE CalculateAlternativeScore TO 'loan_app_user'@'%';
-- GRANT EXECUTE ON PROCEDURE GetScoringPerformanceMetrics TO 'loan_app_user'@'%';
