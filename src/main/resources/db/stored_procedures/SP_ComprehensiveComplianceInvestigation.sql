-- =====================================================
-- COMPREHENSIVE COMPLIANCE INVESTIGATION - SIMPLIFIED VERSION
-- =====================================================
-- Purpose: Complete compliance investigation with embedded logic (no sub-procedure calls)
-- Tables: bank_details, fraud_records, loan_history
-- Usage: CALL SP_ComprehensiveComplianceInvestigation('123456789012', 'ABCDE1234F');

DELIMITER //

DROP PROCEDURE IF EXISTS SP_ComprehensiveComplianceInvestigation//

CREATE PROCEDURE SP_ComprehensiveComplianceInvestigation(
    IN p_aadhaar VARCHAR(12),
    IN p_pan VARCHAR(10)
)
BEGIN
    DECLARE v_investigation_id VARCHAR(50);
    DECLARE v_overall_risk_level VARCHAR(20) DEFAULT 'LOW';
    DECLARE v_overall_risk_score INT DEFAULT 0;
    DECLARE v_compliance_decision VARCHAR(30) DEFAULT 'PROCEED';
    DECLARE v_confidence_level INT DEFAULT 95;
    
    -- Individual risk scores and levels
    DECLARE v_banking_risk_score INT DEFAULT 0;
    DECLARE v_fraud_risk_score INT DEFAULT 0;
    DECLARE v_loan_risk_score INT DEFAULT 0;
    DECLARE v_banking_risk_level VARCHAR(20) DEFAULT 'LOW';
    DECLARE v_fraud_risk_level VARCHAR(20) DEFAULT 'CLEAN';
    DECLARE v_loan_risk_level VARCHAR(20) DEFAULT 'LOW';
    
    -- Banking analysis variables
    DECLARE v_bank_data_found BOOLEAN DEFAULT FALSE;
    DECLARE v_total_bounces INT DEFAULT 0;
    DECLARE v_overdraft_accounts INT DEFAULT 0;
    DECLARE v_max_credit_usage DECIMAL(5,2) DEFAULT 0;
    DECLARE v_avg_balance DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_income DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_expenses DECIMAL(15,2) DEFAULT 0;
    
    -- Fraud analysis variables
    DECLARE v_fraud_data_found BOOLEAN DEFAULT FALSE;
    DECLARE v_total_fraud_cases INT DEFAULT 0;
    DECLARE v_active_fraud_cases INT DEFAULT 0;
    DECLARE v_high_severity_cases INT DEFAULT 0;
    DECLARE v_rbi_cases INT DEFAULT 0;
    DECLARE v_financial_fraud_cases INT DEFAULT 0;
    
    -- Loan analysis variables
    DECLARE v_loan_data_found BOOLEAN DEFAULT FALSE;
    DECLARE v_total_loans INT DEFAULT 0;
    DECLARE v_defaulted_loans INT DEFAULT 0;
    DECLARE v_total_missed_payments INT DEFAULT 0;
    DECLARE v_max_dti_ratio DECIMAL(5,2) DEFAULT 0;
    DECLARE v_days_since_last_payment INT DEFAULT 0;
    
    -- Response JSON objects
    DECLARE v_banking_tags JSON DEFAULT JSON_ARRAY();
    DECLARE v_fraud_tags JSON DEFAULT JSON_ARRAY();
    DECLARE v_loan_tags JSON DEFAULT JSON_ARRAY();
    DECLARE v_critical_issues JSON DEFAULT JSON_ARRAY();
    DECLARE v_risk_factors JSON DEFAULT JSON_ARRAY();
    DECLARE v_final_recommendations JSON DEFAULT JSON_ARRAY();
    
    -- Generate unique investigation ID
    SET v_investigation_id = CONCAT('INV-', DATE_FORMAT(NOW(), '%Y%m%d-%H%i%s'));
    
    -- =====================================================
    -- 1. BANKING PROFILE ANALYSIS
    -- =====================================================

    SELECT COUNT(*) INTO v_bank_data_found FROM bank_details 
    WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;

    IF v_bank_data_found > 0 THEN
        SELECT 
            COALESCE(SUM(cheque_bounce_count), 0),
            SUM(CASE WHEN overdraft_used = 1 THEN 1 ELSE 0 END),
            COALESCE(MAX(credit_card_usage_ratio), 0),
            COALESCE(AVG(average_monthly_balance), 0),
            COALESCE(SUM(monthly_income), 0),
            COALESCE(SUM(monthly_expense), 0)
        INTO v_total_bounces, v_overdraft_accounts, v_max_credit_usage,
            v_avg_balance, v_total_income, v_total_expenses
        FROM bank_details 
        WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
        
        -- Banking risk scoring (starts at 100, deductions for issues)
        SET v_banking_risk_score = 100;
        
        IF v_total_bounces > 5 THEN
            SET v_banking_risk_score = v_banking_risk_score - 30;
            SET v_banking_tags = JSON_ARRAY_APPEND(v_banking_tags, '$', 
                CONCAT('FREQUENT_BOUNCES: ', v_total_bounces, ' cheque bounces indicate poor cash flow'));
        ELSEIF v_total_bounces BETWEEN 3 AND 5 THEN
            SET v_banking_risk_score = v_banking_risk_score - 20;
            SET v_banking_tags = JSON_ARRAY_APPEND(v_banking_tags, '$', 
                CONCAT('MODERATE_BOUNCES: ', v_total_bounces, ' cheque bounces show payment issues'));
        END IF;
        
        IF v_overdraft_accounts > 0 THEN
            SET v_banking_risk_score = v_banking_risk_score - 15;
            SET v_banking_tags = JSON_ARRAY_APPEND(v_banking_tags, '$', 
                'OVERDRAFT_DEPENDENCY: Overdraft usage indicates liquidity shortfalls');
        END IF;
        
        IF v_max_credit_usage > 80 THEN
            SET v_banking_risk_score = v_banking_risk_score - 20;
            SET v_banking_tags = JSON_ARRAY_APPEND(v_banking_tags, '$', 
                CONCAT('HIGH_CREDIT_UTILIZATION: ', ROUND(v_max_credit_usage, 1), '% credit usage'));
        END IF;
        
        IF v_total_income > 0 AND v_total_expenses > v_total_income THEN
            SET v_banking_risk_score = v_banking_risk_score - 25;
            SET v_banking_tags = JSON_ARRAY_APPEND(v_banking_tags, '$', 
                'EXPENSE_EXCEEDS_INCOME: Negative cash flow detected');
        END IF;
        
        -- Determine banking risk level
        IF v_banking_risk_score >= 80 THEN
            SET v_banking_risk_level = 'LOW';
        ELSEIF v_banking_risk_score >= 60 THEN
            SET v_banking_risk_level = 'MEDIUM';
        ELSE
            SET v_banking_risk_level = 'HIGH';
        END IF;
    ELSE
        -- No banking data found
        SET v_banking_risk_score = 25;
        SET v_banking_risk_level = 'HIGH';
        SET v_banking_tags = JSON_ARRAY_APPEND(v_banking_tags, '$', 
            'NO_BANKING_DATA: No banking history found for verification');
    END IF;

    -- =====================================================
    -- 2. FRAUD HISTORY ANALYSIS
    -- =====================================================
    
    SELECT COUNT(*) INTO v_fraud_data_found FROM fraud_records 
    WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
    
    IF v_fraud_data_found > 0 THEN
        SELECT 
            COUNT(*),
            SUM(CASE WHEN resolved_flag = 0 THEN 1 ELSE 0 END),
            SUM(CASE WHEN severity_level = 'HIGH' THEN 1 ELSE 0 END),
            SUM(CASE WHEN source_authority = 'RBI' THEN 1 ELSE 0 END),
            SUM(CASE WHEN fraud_type LIKE '%FINANCIAL%' OR fraud_type LIKE '%LOAN%' THEN 1 ELSE 0 END)
        INTO v_total_fraud_cases, v_active_fraud_cases, v_high_severity_cases,
             v_rbi_cases, v_financial_fraud_cases
        FROM fraud_records 
        WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
        
        -- Fraud risk scoring
        SET v_fraud_risk_score = 0;
        
        IF v_active_fraud_cases > 0 AND v_high_severity_cases > 0 THEN
            SET v_fraud_risk_score = v_fraud_risk_score + 60;
            SET v_fraud_risk_level = 'CRITICAL';
            SET v_fraud_tags = JSON_ARRAY_APPEND(v_fraud_tags, '$', 
                'ACTIVE_HIGH_SEVERITY_FRAUD: Critical fraud case under investigation');
        END IF;
        
        IF v_rbi_cases > 0 THEN
            SET v_fraud_risk_score = v_fraud_risk_score + 40;
            IF v_fraud_risk_level != 'CRITICAL' THEN SET v_fraud_risk_level = 'HIGH'; END IF;
            SET v_fraud_tags = JSON_ARRAY_APPEND(v_fraud_tags, '$', 
                'RBI_REPORTED_CASE: Case reported by Reserve Bank of India');
        END IF;
        
        IF v_financial_fraud_cases > 0 THEN
            SET v_fraud_risk_score = v_fraud_risk_score + 35;
            IF v_fraud_risk_level NOT IN ('CRITICAL', 'HIGH') THEN SET v_fraud_risk_level = 'HIGH'; END IF;
            SET v_fraud_tags = JSON_ARRAY_APPEND(v_fraud_tags, '$', 
                'FINANCIAL_FRAUD_HISTORY: Previous financial fraud detected');
        END IF;
        
        IF v_total_fraud_cases > 1 THEN
            SET v_fraud_risk_score = v_fraud_risk_score + 20;
            SET v_fraud_tags = JSON_ARRAY_APPEND(v_fraud_tags, '$', 
                'MULTIPLE_FRAUD_INCIDENTS: Pattern of fraudulent behavior');
        END IF;
        
        -- Determine final fraud risk level
        IF v_fraud_risk_score >= 60 THEN
            SET v_fraud_risk_level = 'CRITICAL';
        ELSEIF v_fraud_risk_score >= 40 THEN
            SET v_fraud_risk_level = 'HIGH';
        ELSEIF v_fraud_risk_score >= 20 THEN
            SET v_fraud_risk_level = 'MEDIUM';
        ELSEIF v_fraud_risk_score > 0 THEN
            SET v_fraud_risk_level = 'LOW';
        ELSE
            SET v_fraud_risk_level = 'CLEAN';
        END IF;
    ELSE
        SET v_fraud_risk_score = 0;
        SET v_fraud_risk_level = 'CLEAN';
        SET v_fraud_tags = JSON_ARRAY_APPEND(v_fraud_tags, '$', 
            'CLEAN_RECORD: No fraud cases found in regulatory databases');
    END IF;
    
    -- =====================================================
    -- 3. LOAN HISTORY ANALYSIS
    -- =====================================================
    
    SELECT COUNT(*) INTO v_loan_data_found FROM loan_history 
    WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
    
    IF v_loan_data_found > 0 THEN
        SELECT 
            COUNT(*),
            SUM(CASE WHEN default_flag = 1 OR loan_status = 'Defaulted' THEN 1 ELSE 0 END),
            SUM(missed_payments),
            COALESCE(MAX(dti_ratio), 0),
            COALESCE(MIN(DATEDIFF(NOW(), last_payment_date)), 0)
        INTO v_total_loans, v_defaulted_loans, v_total_missed_payments,
             v_max_dti_ratio, v_days_since_last_payment
        FROM loan_history 
        WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
        
        -- Loan risk scoring
        SET v_loan_risk_score = 0;
        
        IF v_defaulted_loans > 0 THEN
            SET v_loan_risk_score = v_loan_risk_score + 50;
            SET v_loan_risk_level = 'HIGH';
            SET v_loan_tags = JSON_ARRAY_APPEND(v_loan_tags, '$', 
                'LOAN_DEFAULT_HISTORY: Previous loan defaults detected');
        END IF;
        
        IF v_max_dti_ratio > 60 THEN
            SET v_loan_risk_score = v_loan_risk_score + 25;
            SET v_loan_risk_level = 'HIGH';
            SET v_loan_tags = JSON_ARRAY_APPEND(v_loan_tags, '$', 
                CONCAT('EXCESSIVE_DEBT_BURDEN: DTI ratio ', ROUND(v_max_dti_ratio, 1), '%'));
        ELSEIF v_max_dti_ratio > 50 THEN
            SET v_loan_risk_score = v_loan_risk_score + 15;
            IF v_loan_risk_level = 'LOW' THEN SET v_loan_risk_level = 'MEDIUM'; END IF;
            SET v_loan_tags = JSON_ARRAY_APPEND(v_loan_tags, '$', 
                CONCAT('HIGH_DEBT_BURDEN: DTI ratio ', ROUND(v_max_dti_ratio, 1), '%'));
        END IF;
        
        IF v_total_missed_payments > 6 THEN
            SET v_loan_risk_score = v_loan_risk_score + 20;
            IF v_loan_risk_level = 'LOW' THEN SET v_loan_risk_level = 'MEDIUM'; END IF;
            SET v_loan_tags = JSON_ARRAY_APPEND(v_loan_tags, '$', 
                'FREQUENT_MISSED_PAYMENTS: Poor payment discipline detected');
        END IF;
        
        IF v_days_since_last_payment > 90 THEN
            SET v_loan_risk_score = v_loan_risk_score + 18;
            SET v_loan_tags = JSON_ARRAY_APPEND(v_loan_tags, '$', 
                'RECENT_PAYMENT_FAILURE: No recent payments detected');
        END IF;
        
        -- Determine loan risk level
        IF v_loan_risk_score >= 40 THEN
            SET v_loan_risk_level = 'HIGH';
        ELSEIF v_loan_risk_score >= 20 THEN
            SET v_loan_risk_level = 'MEDIUM';
        ELSEIF v_loan_risk_score > 0 THEN
            SET v_loan_risk_level = 'LOW';
        ELSE
            SET v_loan_risk_level = 'EXCELLENT';
        END IF;
    ELSE
        SET v_loan_risk_score = 75;
        SET v_loan_risk_level = 'HIGH';
        SET v_loan_tags = JSON_ARRAY_APPEND(v_loan_tags, '$', 
            'NO_CREDIT_HISTORY: First-time borrower with no loan history');
    END IF;
    
    -- =====================================================
    -- 4. OVERALL RISK ASSESSMENT
    -- =====================================================
    
    -- Weighted risk score calculation
    SET v_overall_risk_score = ROUND(
        (v_fraud_risk_score * 0.5) + 
        (v_loan_risk_score * 0.35) + 
        (v_banking_risk_score * 0.15)
    );
    
    -- Determine overall risk level with fraud override logic
    IF v_fraud_risk_level = 'CRITICAL' THEN
        SET v_overall_risk_level = 'CRITICAL';
        SET v_compliance_decision = 'IMMEDIATE_REJECTION';
        SET v_critical_issues = JSON_ARRAY_APPEND(v_critical_issues, '$', 
            'Active critical fraud case requires immediate rejection');
    ELSEIF v_fraud_risk_level = 'HIGH' OR v_loan_risk_level = 'HIGH' OR v_banking_risk_level = 'HIGH' THEN
        SET v_overall_risk_level = 'HIGH';
        SET v_compliance_decision = 'REJECT_OR_ENHANCED_CONDITIONS';
    ELSEIF v_fraud_risk_level = 'MEDIUM' OR v_loan_risk_level = 'MEDIUM' OR v_banking_risk_level = 'MEDIUM' THEN
        SET v_overall_risk_level = 'MEDIUM';
        SET v_compliance_decision = 'CONDITIONAL_APPROVAL';
    ELSE
        SET v_overall_risk_level = 'LOW';
        SET v_compliance_decision = 'PROCEED_STANDARD';
    END IF;
    
    -- Build risk factors
    IF v_fraud_risk_score > 0 THEN
        SET v_risk_factors = JSON_ARRAY_APPEND(v_risk_factors, '$', 'Fraud database findings');
    END IF;
    IF v_loan_risk_score > 20 THEN
        SET v_risk_factors = JSON_ARRAY_APPEND(v_risk_factors, '$', 'Poor credit performance history');
    END IF;
    IF v_banking_risk_score > 20 THEN
        SET v_risk_factors = JSON_ARRAY_APPEND(v_risk_factors, '$', 'Concerning banking behavior patterns');
    END IF;
    
    -- Build recommendations
    CASE v_compliance_decision
        WHEN 'IMMEDIATE_REJECTION' THEN
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 
                'Immediately reject application due to critical fraud risk');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 
                'Consider permanent blacklisting and regulatory reporting');
        WHEN 'REJECT_OR_ENHANCED_CONDITIONS' THEN
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 
                'Recommend rejection due to high combined risk factors');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 
                'If proceeding, require substantial collateral and guarantor');
        WHEN 'CONDITIONAL_APPROVAL' THEN
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 
                'Conditional approval with enhanced verification required');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 
                'Require additional documentation and income verification');
        ELSE
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 
                'Proceed with standard verification and processing');
    END CASE;
    
    -- Return comprehensive investigation result
    SELECT JSON_OBJECT(
        'investigationId', v_investigation_id,
        'investigationDate', NOW(),
        'applicantProfile', JSON_OBJECT(
            'aadhaarNumber', p_aadhaar,
            'panNumber', p_pan,
            'dataAvailability', JSON_OBJECT(
                'bankingData', v_bank_data_found > 0,
                'fraudData', TRUE,
                'loanData', v_loan_data_found > 0
            )
        ),
        'overallAssessment', JSON_OBJECT(
            'finalRiskLevel', v_overall_risk_level,
            'overallRiskScore', v_overall_risk_score,
            'complianceDecision', v_compliance_decision,
            'confidence', v_confidence_level
        ),
        'bank_details', JSON_OBJECT(
            'riskTags', v_banking_tags,
            'riskLevel', v_banking_risk_level,
            'riskScore', v_banking_risk_score
        ),
        'fraud_records', JSON_OBJECT(
            'riskTags', v_fraud_tags,
            'riskLevel', v_fraud_risk_level,
            'riskScore', v_fraud_risk_score
        ),
        'loan_history', JSON_OBJECT(
            'riskTags', v_loan_tags,
            'riskLevel', v_loan_risk_level,
            'riskScore', v_loan_risk_score
        ),
        'consolidatedFindings', JSON_OBJECT(
            'criticalIssues', v_critical_issues,
            'riskFactors', v_risk_factors,
            'complianceRecommendation', JSON_OBJECT(
                'action', v_compliance_decision,
                'reasoning', CASE v_compliance_decision
                    WHEN 'IMMEDIATE_REJECTION' THEN 'Critical fraud risk makes approval impossible'
                    WHEN 'REJECT_OR_ENHANCED_CONDITIONS' THEN 'High combined risk factors exceed acceptable limits'
                    WHEN 'CONDITIONAL_APPROVAL' THEN 'Moderate risk factors require enhanced conditions'
                    ELSE 'Risk profile within acceptable parameters'
                END,
                'regulatoryImplications', CASE 
                    WHEN v_fraud_risk_level = 'CRITICAL' THEN 'Proceeding may violate RBI lending guidelines'
                    WHEN v_overall_risk_level = 'HIGH' THEN 'High risk lending requires enhanced due diligence'
                    ELSE 'No specific regulatory concerns identified'
                END
            ),
            'recommendations', v_final_recommendations
        )
    ) AS comprehensive_investigation_result;
    
END//

DELIMITER ;
