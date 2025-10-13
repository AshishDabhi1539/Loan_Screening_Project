-- =====================================================
-- COMPLIANCE INVESTIGATION: FRAUD HISTORY ANALYSIS
-- =====================================================
-- Purpose: Analyze fraud records and security risks for compliance officers
-- Table: fraud_records
-- Usage: CALL SP_InvestigateFraudHistory('123456789012', 'ABCDE1234F');

DELIMITER //

DROP PROCEDURE IF EXISTS SP_InvestigateFraudHistory//

CREATE PROCEDURE SP_InvestigateFraudHistory(
    IN p_aadhaar VARCHAR(12),
    IN p_pan VARCHAR(10)
)
BEGIN
    DECLARE v_total_cases INT DEFAULT 0;
    DECLARE v_risk_score INT DEFAULT 0;
    DECLARE v_overall_risk VARCHAR(20) DEFAULT 'CLEAN';
    DECLARE v_risk_tags JSON DEFAULT JSON_ARRAY();
    DECLARE v_key_findings JSON DEFAULT JSON_ARRAY();
    DECLARE v_recommendations JSON DEFAULT JSON_ARRAY();
    
    -- Fraud metrics
    DECLARE v_active_cases INT DEFAULT 0;
    DECLARE v_resolved_cases INT DEFAULT 0;
    DECLARE v_high_severity_cases INT DEFAULT 0;
    DECLARE v_medium_severity_cases INT DEFAULT 0;
    DECLARE v_low_severity_cases INT DEFAULT 0;
    DECLARE v_financial_fraud_cases INT DEFAULT 0;
    DECLARE v_identity_fraud_cases INT DEFAULT 0;
    DECLARE v_rbi_cases INT DEFAULT 0;
    DECLARE v_recent_cases INT DEFAULT 0;
    DECLARE v_oldest_case_days INT DEFAULT 0;
    DECLARE v_latest_case_days INT DEFAULT 0;
    
    -- Check if fraud data exists
    SELECT COUNT(*) INTO v_total_cases
    FROM fraud_records 
    WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
    
    IF v_total_cases = 0 THEN
        -- No fraud records found - Clean profile
        SELECT JSON_OBJECT(
            'dataFound', TRUE,
            'riskTags', JSON_ARRAY('CLEAN_RECORD: No fraud cases found in regulatory databases'),
            'description', JSON_OBJECT(
                'overallRisk', 'CLEAN',
                'riskScore', 0,
                'fraudSummary', 'Clean regulatory record with no fraud history',
                'keyFindings', JSON_ARRAY(
                    'No fraud cases reported across all regulatory databases',
                    'Clean identity verification with no security concerns',
                    'No adverse regulatory actions or investigations'
                ),
                'recommendations', JSON_ARRAY(
                    'Proceed with standard verification process',
                    'No additional fraud-related checks required'
                )
            )
        ) AS investigation_result;
    ELSE
        -- Analyze fraud data
        SELECT 
            COUNT(*) as total_cases,
            SUM(CASE WHEN resolved_flag = 0 THEN 1 ELSE 0 END) as active_cases,
            SUM(CASE WHEN resolved_flag = 1 THEN 1 ELSE 0 END) as resolved_cases,
            SUM(CASE WHEN severity_level = 'HIGH' THEN 1 ELSE 0 END) as high_severity_cases,
            SUM(CASE WHEN severity_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_severity_cases,
            SUM(CASE WHEN severity_level = 'LOW' THEN 1 ELSE 0 END) as low_severity_cases,
            SUM(CASE WHEN fraud_type LIKE '%FINANCIAL%' OR fraud_type LIKE '%LOAN%' OR fraud_type LIKE '%CREDIT%' OR fraud_type LIKE '%BANK%' THEN 1 ELSE 0 END) as financial_fraud_cases,
            SUM(CASE WHEN fraud_type LIKE '%IDENTITY%' OR fraud_type LIKE '%DOCUMENT%' OR fraud_type LIKE '%FORGERY%' THEN 1 ELSE 0 END) as identity_fraud_cases,
            SUM(CASE WHEN source_authority = 'RBI' THEN 1 ELSE 0 END) as rbi_cases,
            SUM(CASE WHEN reported_date > DATE_SUB(NOW(), INTERVAL 2 YEAR) THEN 1 ELSE 0 END) as recent_cases,
            COALESCE(MAX(DATEDIFF(NOW(), reported_date)), 0) as oldest_case_days,
            COALESCE(MIN(DATEDIFF(NOW(), reported_date)), 0) as latest_case_days
        INTO v_total_cases, v_active_cases, v_resolved_cases, v_high_severity_cases, 
             v_medium_severity_cases, v_low_severity_cases, v_financial_fraud_cases,
             v_identity_fraud_cases, v_rbi_cases, v_recent_cases, v_oldest_case_days, v_latest_case_days
        FROM fraud_records 
        WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
        
        -- Calculate risk score (start with 0, add for risk factors)
        SET v_risk_score = 0;
        
        -- Risk Assessment Logic
        
        -- 1. Active High Severity Cases (Critical Risk)
        IF v_active_cases > 0 AND v_high_severity_cases > 0 THEN
            SET v_risk_score = v_risk_score + 60;
            SET v_overall_risk = 'CRITICAL';
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('ACTIVE_HIGH_SEVERITY_FRAUD: ', v_active_cases, ' active high-severity case(s) under investigation'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT('Active high-severity fraud investigation poses immediate regulatory and reputational risk'));
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'IMMEDIATE REJECTION recommended due to active high-severity fraud case');
        END IF;
        
        -- 2. RBI Cases Analysis
        IF v_rbi_cases > 0 THEN
            SET v_risk_score = v_risk_score + 40;
            IF v_overall_risk != 'CRITICAL' THEN SET v_overall_risk = 'HIGH'; END IF;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('RBI_REPORTED_CASE: ', v_rbi_cases, ' case(s) reported by Reserve Bank of India'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'RBI involvement indicates serious regulatory concerns requiring immediate attention');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Escalate to senior compliance officer for RBI case review');
        END IF;
        
        -- 3. Financial Fraud History
        IF v_financial_fraud_cases > 0 THEN
            SET v_risk_score = v_risk_score + 35;
            IF v_overall_risk NOT IN ('CRITICAL', 'HIGH') THEN SET v_overall_risk = 'HIGH'; END IF;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('FINANCIAL_FRAUD_HISTORY: ', v_financial_fraud_cases, ' financial fraud case(s) directly relevant to lending'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Previous financial fraud indicates high risk for loan-related misconduct');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Enhanced due diligence required for all financial documents');
        END IF;
        
        -- 4. Identity Fraud Analysis
        IF v_identity_fraud_cases > 0 THEN
            SET v_risk_score = v_risk_score + 25;
            IF v_overall_risk NOT IN ('CRITICAL', 'HIGH') THEN SET v_overall_risk = 'MEDIUM'; END IF;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('IDENTITY_FRAUD_HISTORY: ', v_identity_fraud_cases, ' identity/document fraud case(s) raise authenticity concerns'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Identity fraud history requires enhanced document verification and authenticity checks');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Verify all identity documents through independent sources');
        END IF;
        
        -- 5. Multiple Fraud Incidents
        IF v_total_cases > 1 THEN
            SET v_risk_score = v_risk_score + 20;
            IF v_overall_risk NOT IN ('CRITICAL', 'HIGH') THEN SET v_overall_risk = 'MEDIUM'; END IF;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('MULTIPLE_FRAUD_INCIDENTS: ', v_total_cases, ' separate fraud cases indicate pattern of misconduct'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Multiple fraud incidents suggest systematic fraudulent behavior rather than isolated incident');
        END IF;
        
        -- 6. Recent Cases Analysis
        IF v_recent_cases > 0 THEN
            SET v_risk_score = v_risk_score + 15;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('RECENT_FRAUD_ACTIVITY: ', v_recent_cases, ' case(s) reported within last 2 years'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT('Recent fraud activity (', v_latest_case_days, ' days ago) indicates ongoing risk'));
        END IF;
        
        -- 7. Active Cases (Any Severity)
        IF v_active_cases > 0 AND v_high_severity_cases = 0 THEN
            SET v_risk_score = v_risk_score + 30;
            IF v_overall_risk NOT IN ('CRITICAL', 'HIGH') THEN SET v_overall_risk = 'HIGH'; END IF;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('ACTIVE_INVESTIGATION: ', v_active_cases, ' unresolved case(s) under investigation'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT('Active investigation ongoing for ', v_latest_case_days, ' days without resolution'));
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Monitor case resolution before proceeding with loan approval');
        END IF;
        
        -- 8. Resolved High Severity Cases
        IF v_resolved_cases > 0 AND v_high_severity_cases > 0 AND v_active_cases = 0 THEN
            SET v_risk_score = v_risk_score + 25;
            IF v_overall_risk NOT IN ('CRITICAL', 'HIGH') THEN SET v_overall_risk = 'MEDIUM'; END IF;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                'RESOLVED_HIGH_SEVERITY: Previous high-severity case resolved but history remains concerning');
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'While resolved, previous high-severity fraud indicates elevated risk profile');
        END IF;
        
        -- Determine final risk level based on score
        IF v_risk_score >= 60 THEN
            SET v_overall_risk = 'CRITICAL';
        ELSEIF v_risk_score >= 40 THEN
            SET v_overall_risk = 'HIGH';
        ELSEIF v_risk_score >= 20 THEN
            SET v_overall_risk = 'MEDIUM';
        ELSEIF v_risk_score > 0 THEN
            SET v_overall_risk = 'LOW';
        END IF;
        
        -- Add case summary to findings
        SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
            CONCAT('Total fraud cases: ', v_total_cases, ' (Active: ', v_active_cases, ', Resolved: ', v_resolved_cases, ')'));
        
        IF v_oldest_case_days > 0 THEN
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT('Fraud history spans ', ROUND(v_oldest_case_days/365, 1), ' years with most recent case ', v_latest_case_days, ' days ago'));
        END IF;
        
        -- Add risk-specific recommendations
        IF v_overall_risk = 'CRITICAL' THEN
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Application should be immediately rejected due to critical fraud risk');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Consider permanent blacklisting and regulatory reporting');
        ELSEIF v_overall_risk = 'HIGH' THEN
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Proceed only with extensive additional verification and senior approval');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Require additional collateral and guarantor due to fraud history');
        ELSEIF v_overall_risk = 'MEDIUM' THEN
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Enhanced verification required with additional documentation');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Consider higher interest rate to compensate for elevated risk');
        ELSE
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Standard processing acceptable with routine fraud monitoring');
        END IF;
        
        -- Return investigation result
        SELECT JSON_OBJECT(
            'dataFound', TRUE,
            'riskTags', v_risk_tags,
            'description', JSON_OBJECT(
                'overallRisk', v_overall_risk,
                'riskScore', v_risk_score,
                'fraudSummary', CONCAT('Fraud analysis reveals ', LOWER(v_overall_risk), ' risk with ', v_total_cases, ' case(s) on record'),
                'keyFindings', v_key_findings,
                'recommendations', v_recommendations
            )
        ) AS investigation_result;
    END IF;
    
END//

DELIMITER ;
