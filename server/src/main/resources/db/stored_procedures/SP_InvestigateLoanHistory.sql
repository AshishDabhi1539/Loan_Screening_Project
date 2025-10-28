-- =====================================================
-- COMPLIANCE INVESTIGATION: LOAN HISTORY ANALYSIS
-- =====================================================
-- Purpose: Analyze credit history and loan performance for compliance officers
-- Table: loan_history
-- Usage: CALL SP_InvestigateLoanHistory('123456789012', 'ABCDE1234F');

DELIMITER //

DROP PROCEDURE IF EXISTS SP_InvestigateLoanHistory//

CREATE PROCEDURE SP_InvestigateLoanHistory(
    IN p_aadhaar VARCHAR(12),
    IN p_pan VARCHAR(10)
)
BEGIN
    DECLARE v_total_loans INT DEFAULT 0;
    DECLARE v_risk_score INT DEFAULT 100; -- start from 100, reduce for risk factors
    DECLARE v_overall_risk VARCHAR(20) DEFAULT 'LOW';
    DECLARE v_risk_tags JSON DEFAULT JSON_ARRAY();
    DECLARE v_key_findings JSON DEFAULT JSON_ARRAY();
    DECLARE v_recommendations JSON DEFAULT JSON_ARRAY();
    
    -- Loan performance metrics
    DECLARE v_active_loans INT DEFAULT 0;
    DECLARE v_closed_loans INT DEFAULT 0;
    DECLARE v_defaulted_loans INT DEFAULT 0;
    DECLARE v_total_missed_payments INT DEFAULT 0;
    DECLARE v_total_late_payments INT DEFAULT 0;
    DECLARE v_total_outstanding DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_credit_limit DECIMAL(15,2) DEFAULT 0;
    DECLARE v_avg_dti_ratio DECIMAL(5,2) DEFAULT 0;
    DECLARE v_max_dti_ratio DECIMAL(5,2) DEFAULT 0;
    DECLARE v_secured_loans INT DEFAULT 0;
    DECLARE v_unsecured_loans INT DEFAULT 0;
    DECLARE v_days_since_last_payment INT DEFAULT 0;
    DECLARE v_avg_interest_rate DECIMAL(5,2) DEFAULT 0;
    DECLARE v_recent_defaults INT DEFAULT 0;
    
    -- Check if loan data exists
    SELECT COUNT(*) INTO v_total_loans
    FROM loan_history 
    WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
    
    IF v_total_loans = 0 THEN
        -- No loan history found - First-time borrower
        SELECT JSON_OBJECT(
            'dataFound', FALSE,
            'riskTags', JSON_ARRAY('NO_CREDIT_HISTORY: No previous loan history found - first-time borrower'),
            'description', JSON_OBJECT(
                'overallRisk', 'HIGH',
                'riskScore', 75,
                'creditSummary', 'No credit history available for assessment - first-time borrower risk',
                'keyFindings', JSON_ARRAY(
                    'No previous loan experience to assess repayment behavior',
                    'Unable to verify creditworthiness through historical performance',
                    'First-time borrower presents unknown credit risk'
                ),
                'recommendations', JSON_ARRAY(
                    'Require additional income verification and guarantor',
                    'Consider lower loan amount for first-time borrower',
                    'Enhanced monitoring required if approved',
                    'Verify employment stability and income sources'
                )
            )
        ) AS investigation_result;
    ELSE
        -- Analyze loan history data
        SELECT 
            COUNT(*) as total_loans,
            SUM(CASE WHEN loan_status IN ('Active', 'Current') THEN 1 ELSE 0 END) as active_loans,
            SUM(closed_loans_count) as closed_loans,
            SUM(CASE WHEN default_flag = 1 OR loan_status = 'Defaulted' THEN 1 ELSE 0 END) as defaulted_loans,
            SUM(missed_payments) as total_missed_payments,
            SUM(late_payment_count) as total_late_payments,
            COALESCE(SUM(current_outstanding), 0) as total_outstanding,
            COALESCE(SUM(credit_limit), 0) as total_credit_limit,
            COALESCE(AVG(dti_ratio), 0) as avg_dti_ratio,
            COALESCE(MAX(dti_ratio), 0) as max_dti_ratio,
            SUM(CASE WHEN secured_flag = 1 THEN 1 ELSE 0 END) as secured_loans,
            SUM(CASE WHEN secured_flag = 0 THEN 1 ELSE 0 END) as unsecured_loans,
            COALESCE(MIN(DATEDIFF(NOW(), last_payment_date)), 0) as days_since_last_payment,
            COALESCE(AVG(interest_rate), 0) as avg_interest_rate,
            SUM(CASE WHEN default_flag = 1 AND start_date > DATE_SUB(NOW(), INTERVAL 2 YEAR) THEN 1 ELSE 0 END) as recent_defaults
        INTO v_total_loans, v_active_loans, v_closed_loans, v_defaulted_loans, 
             v_total_missed_payments, v_total_late_payments, v_total_outstanding, 
             v_total_credit_limit, v_avg_dti_ratio, v_max_dti_ratio, v_secured_loans, 
             v_unsecured_loans, v_days_since_last_payment, v_avg_interest_rate, v_recent_defaults
        FROM loan_history 
        WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
        
        -- Risk Assessment (start at 100, subtract for risk factors)
        SET v_risk_score = 100;
        
        -- 1. Default History (High Risk)
        IF v_defaulted_loans > 0 THEN
            SET v_risk_score = v_risk_score - 50;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('LOAN_DEFAULT_HISTORY: ', v_defaulted_loans, ' loan(s) defaulted - severe credit risk'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT(v_defaulted_loans, ' defaulted loan(s) indicate inability to meet financial obligations'));
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Reject application due to default history');
        END IF;
        
        -- 2. Recent Defaults
        IF v_recent_defaults > 0 THEN
            SET v_risk_score = v_risk_score - 30;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('RECENT_DEFAULT: ', v_recent_defaults, ' default(s) within last 2 years'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Recent defaults indicate current financial stress and high probability of future defaults');
        END IF;
        
        -- 3. High DTI Ratio
        IF v_max_dti_ratio > 60 THEN
            SET v_risk_score = v_risk_score - 25;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('EXCESSIVE_DEBT_BURDEN: DTI ratio ', ROUND(v_max_dti_ratio, 1), '% exceeds safe lending limits'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Debt-to-income ratio exceeds 60% indicating over-leveraging and payment stress');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Reject due to excessive existing debt burden');
        ELSEIF v_max_dti_ratio > 50 THEN
            SET v_risk_score = v_risk_score - 15;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('HIGH_DEBT_BURDEN: DTI ratio ', ROUND(v_max_dti_ratio, 1), '% indicates elevated debt stress'));
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Consider reduced loan amount due to high existing debt');
        ELSEIF v_max_dti_ratio > 40 THEN
            SET v_risk_score = v_risk_score - 8;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('MODERATE_DEBT_LOAD: DTI ratio ', ROUND(v_max_dti_ratio, 1), '% within acceptable but elevated range'));
        END IF;
        
        -- 4. Missed Payments
        IF v_total_missed_payments > 6 THEN
            SET v_risk_score = v_risk_score - 20;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('FREQUENT_MISSED_PAYMENTS: ', v_total_missed_payments, ' missed payments show poor payment discipline'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'High number of missed payments indicates inconsistent payment behavior and financial stress');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Enhanced monitoring required due to poor payment history');
        ELSEIF v_total_missed_payments BETWEEN 3 AND 6 THEN
            SET v_risk_score = v_risk_score - 12;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('MODERATE_MISSED_PAYMENTS: ', v_total_missed_payments, ' missed payments indicate occasional payment issues'));
        ELSEIF v_total_missed_payments BETWEEN 1 AND 2 THEN
            SET v_risk_score = v_risk_score - 5;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('MINOR_PAYMENT_ISSUES: ', v_total_missed_payments, ' missed payment(s) - minimal concern'));
        END IF;
        
        -- 5. Late Payments
        IF v_total_late_payments > 10 THEN
            SET v_risk_score = v_risk_score - 15;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('CHRONIC_LATE_PAYMENTS: ', v_total_late_payments, ' late payments show poor payment timing'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Chronic late payment pattern indicates cash flow management issues');
        ELSEIF v_total_late_payments BETWEEN 5 AND 10 THEN
            SET v_risk_score = v_risk_score - 8;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('MODERATE_LATE_PAYMENTS: ', v_total_late_payments, ' late payments show occasional timing issues'));
        END IF;
        
        -- 6. Recent Payment Gaps
        IF v_days_since_last_payment > 90 AND v_active_loans > 0 THEN
            SET v_risk_score = v_risk_score - 18;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('RECENT_PAYMENT_FAILURE: No payments received in last ', v_days_since_last_payment, ' days'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Recent payment gaps suggest current financial difficulties');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Verify current financial status before proceeding');
        ELSEIF v_days_since_last_payment > 60 AND v_active_loans > 0 THEN
            SET v_risk_score = v_risk_score - 10;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('PAYMENT_DELAY: ', v_days_since_last_payment, ' days since last payment on active loans'));
        END IF;
        
        -- 7. Credit Utilization
        IF v_total_credit_limit > 0 AND (v_total_outstanding / v_total_credit_limit) > 0.9 THEN
            SET v_risk_score = v_risk_score - 12;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('HIGH_CREDIT_UTILIZATION: ', ROUND((v_total_outstanding / v_total_credit_limit) * 100, 1), 
                       '% of available credit utilized'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'High credit utilization indicates financial stress and limited repayment capacity');
        END IF;
        
        -- 8. Unsecured Loans
        IF v_unsecured_loans > v_secured_loans AND v_unsecured_loans > 2 THEN
            SET v_risk_score = v_risk_score - 8;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('HIGH_UNSECURED_EXPOSURE: ', v_unsecured_loans, ' unsecured loans indicate higher risk profile'));
        END IF;
        
        -- Positive factors (increase score)
        IF v_total_missed_payments = 0 AND v_total_late_payments <= 2 AND v_defaulted_loans = 0 THEN
            SET v_risk_score = LEAST(v_risk_score + 10, 100);
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Excellent payment history with minimal late payments and no defaults');
        END IF;
        
        IF v_closed_loans > 0 AND v_defaulted_loans = 0 THEN
            SET v_risk_score = LEAST(v_risk_score + 5, 100);
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT(v_closed_loans, ' successfully closed loan(s) demonstrate ability to complete loan obligations'));
        END IF;
        
        -- Determine final risk level (lower score = higher risk)
        IF v_risk_score >= 80 THEN
            SET v_overall_risk = 'EXCELLENT';
        ELSEIF v_risk_score >= 60 THEN
            SET v_overall_risk = 'LOW';
        ELSEIF v_risk_score >= 40 THEN
            SET v_overall_risk = 'MEDIUM';
        ELSE
            SET v_overall_risk = 'HIGH';
        END IF;
        
        -- Add loan portfolio summary
        SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
            CONCAT('Loan portfolio: ', v_total_loans, ' total (Active: ', v_active_loans, 
                   ', Closed: ', v_closed_loans, ', Defaulted: ', v_defaulted_loans, ')'));
        
        IF v_total_outstanding > 0 THEN
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT('Current outstanding: ₹', FORMAT(v_total_outstanding, 0), 
                       ' with average DTI ratio of ', ROUND(v_avg_dti_ratio, 1), '%'));
        END IF;
        
        -- Risk-specific recommendations
        IF v_overall_risk = 'HIGH' THEN
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'High credit risk - recommend rejection or require substantial collateral');
        ELSEIF v_overall_risk = 'MEDIUM' THEN
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Moderate risk - consider reduced amount with enhanced terms');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Require additional income verification and guarantor');
        ELSEIF v_overall_risk = 'LOW' THEN
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Acceptable credit risk - proceed with standard verification');
        ELSE
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Excellent credit profile - suitable for preferential terms');
        END IF;
        
        -- Return investigation result (description text unchanged)
        SELECT JSON_OBJECT(
            'dataFound', TRUE,
            'riskTags', v_risk_tags,
            'description', JSON_OBJECT(
                'overallRisk', v_overall_risk,
                'riskScore', v_risk_score,
                'creditSummary', CONCAT('Credit analysis reveals ', LOWER(v_overall_risk), ' risk with ', v_total_loans, ' loan(s) on record'),
                'keyFindings', v_key_findings,
                'recommendations', v_recommendations
            )
        ) AS investigation_result;
    END IF;
    
END//

DELIMITER ;
