-- =====================================================
-- COMPREHENSIVE COMPLIANCE INVESTIGATION - MASTER PROCEDURE
-- =====================================================
-- Purpose: Complete compliance investigation combining banking, fraud, and loan history analysis
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
    
    -- Individual investigation results
    DECLARE v_banking_result JSON;
    DECLARE v_fraud_result JSON;
    DECLARE v_loan_result JSON;
    
    -- Risk scores from individual investigations
    DECLARE v_banking_risk_score INT DEFAULT 0;
    DECLARE v_fraud_risk_score INT DEFAULT 0;
    DECLARE v_loan_risk_score INT DEFAULT 0;
    
    -- Risk levels from individual investigations
    DECLARE v_banking_risk_level VARCHAR(20) DEFAULT 'LOW';
    DECLARE v_fraud_risk_level VARCHAR(20) DEFAULT 'CLEAN';
    DECLARE v_loan_risk_level VARCHAR(20) DEFAULT 'LOW';
    
    -- Consolidated findings
    DECLARE v_critical_issues JSON DEFAULT JSON_ARRAY();
    DECLARE v_risk_factors JSON DEFAULT JSON_ARRAY();
    DECLARE v_final_recommendations JSON DEFAULT JSON_ARRAY();
    
    -- Generate unique investigation ID
    SET v_investigation_id = CONCAT('INV-', DATE_FORMAT(NOW(), '%Y%m%d-%H%i%s'));
    
    -- Execute individual investigations
    
    -- 1. Banking Profile Investigation
    CALL SP_InvestigateBankingProfile(p_aadhaar, p_pan);
    SELECT investigation_result INTO v_banking_result FROM (
        CALL SP_InvestigateBankingProfile(p_aadhaar, p_pan)
    ) AS banking_temp;
    
    -- Extract banking risk data
    SET v_banking_risk_score = JSON_UNQUOTE(JSON_EXTRACT(v_banking_result, '$.description.riskScore'));
    SET v_banking_risk_level = JSON_UNQUOTE(JSON_EXTRACT(v_banking_result, '$.description.overallRisk'));
    
    -- 2. Fraud History Investigation  
    CALL SP_InvestigateFraudHistory(p_aadhaar, p_pan);
    SELECT investigation_result INTO v_fraud_result FROM (
        CALL SP_InvestigateFraudHistory(p_aadhaar, p_pan)
    ) AS fraud_temp;
    
    -- Extract fraud risk data
    SET v_fraud_risk_score = JSON_UNQUOTE(JSON_EXTRACT(v_fraud_result, '$.description.riskScore'));
    SET v_fraud_risk_level = JSON_UNQUOTE(JSON_EXTRACT(v_fraud_result, '$.description.overallRisk'));
    
    -- 3. Loan History Investigation
    CALL SP_InvestigateLoanHistory(p_aadhaar, p_pan);
    SELECT investigation_result INTO v_loan_result FROM (
        CALL SP_InvestigateLoanHistory(p_aadhaar, p_pan)
    ) AS loan_temp;
    
    -- Extract loan risk data
    SET v_loan_risk_score = JSON_UNQUOTE(JSON_EXTRACT(v_loan_result, '$.description.riskScore'));
    SET v_loan_risk_level = JSON_UNQUOTE(JSON_EXTRACT(v_loan_result, '$.description.overallRisk'));
    
    -- Calculate Overall Risk Assessment
    
    -- Weighted risk score calculation
    -- Fraud: 50% weight (highest priority)
    -- Loan History: 35% weight  
    -- Banking: 15% weight
    SET v_overall_risk_score = ROUND(
        (v_fraud_risk_score * 0.5) + 
        (v_loan_risk_score * 0.35) + 
        (v_banking_risk_score * 0.15)
    );
    
    -- Determine overall risk level with fraud override logic
    IF v_fraud_risk_level = 'CRITICAL' THEN
        SET v_overall_risk_level = 'CRITICAL';
        SET v_compliance_decision = 'IMMEDIATE_REJECTION';
        SET v_critical_issues = JSON_ARRAY_APPEND(v_critical_issues, '$', 'Active critical fraud case requires immediate rejection');
    ELSEIF v_fraud_risk_level = 'HIGH' OR v_loan_risk_level = 'HIGH' OR v_banking_risk_level = 'HIGH' THEN
        SET v_overall_risk_level = 'HIGH';
        SET v_compliance_decision = 'REJECT_OR_ENHANCED_CONDITIONS';
    ELSEIF v_fraud_risk_level = 'MEDIUM' OR v_loan_risk_level = 'MEDIUM' OR v_banking_risk_level = 'MEDIUM' THEN
        SET v_overall_risk_level = 'MEDIUM';
        SET v_compliance_decision = 'CONDITIONAL_APPROVAL';
    ELSEIF v_fraud_risk_level = 'CLEAN' AND v_loan_risk_level IN ('LOW', 'EXCELLENT') AND v_banking_risk_level = 'LOW' THEN
        SET v_overall_risk_level = 'LOW';
        SET v_compliance_decision = 'PROCEED_STANDARD';
    ELSE
        SET v_overall_risk_level = 'MEDIUM';
        SET v_compliance_decision = 'ENHANCED_VERIFICATION';
    END IF;
    
    -- Build critical issues array
    IF v_fraud_risk_level IN ('CRITICAL', 'HIGH') THEN
        SET v_critical_issues = JSON_ARRAY_APPEND(v_critical_issues, '$', 'Fraud history poses significant regulatory and reputational risk');
    END IF;
    
    IF v_loan_risk_level = 'HIGH' THEN
        SET v_critical_issues = JSON_ARRAY_APPEND(v_critical_issues, '$', 'Poor credit history with defaults or excessive debt burden');
    END IF;
    
    IF v_banking_risk_level = 'HIGH' THEN
        SET v_critical_issues = JSON_ARRAY_APPEND(v_critical_issues, '$', 'Banking behavior indicates financial stress and payment difficulties');
    END IF;
    
    -- Build risk factors array
    IF v_fraud_risk_score > 0 THEN
        SET v_risk_factors = JSON_ARRAY_APPEND(v_risk_factors, '$', 'Fraud database findings');
    END IF;
    
    IF v_loan_risk_score > 20 THEN
        SET v_risk_factors = JSON_ARRAY_APPEND(v_risk_factors, '$', 'Poor credit performance history');
    END IF;
    
    IF v_banking_risk_score > 20 THEN
        SET v_risk_factors = JSON_ARRAY_APPEND(v_risk_factors, '$', 'Concerning banking behavior patterns');
    END IF;
    
    IF v_loan_risk_level = 'NO_HISTORY' THEN
        SET v_risk_factors = JSON_ARRAY_APPEND(v_risk_factors, '$', 'First-time borrower with no credit history');
    END IF;
    
    -- Build final recommendations
    CASE v_compliance_decision
        WHEN 'IMMEDIATE_REJECTION' THEN
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Immediately reject application due to critical fraud risk');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Consider permanent blacklisting and regulatory reporting');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Escalate to senior compliance for regulatory review');
        WHEN 'REJECT_OR_ENHANCED_CONDITIONS' THEN
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Recommend rejection due to high combined risk factors');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'If proceeding, require substantial collateral and guarantor');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Enhanced monitoring and reduced loan amount mandatory');
        WHEN 'CONDITIONAL_APPROVAL' THEN
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Conditional approval with enhanced verification required');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Require additional documentation and income verification');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Consider higher interest rate to compensate for elevated risk');
        WHEN 'ENHANCED_VERIFICATION' THEN
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Proceed with enhanced verification and documentation');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Additional income and employment verification recommended');
        ELSE
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Proceed with standard verification and processing');
            SET v_final_recommendations = JSON_ARRAY_APPEND(v_final_recommendations, '$', 'Suitable for standard loan terms and conditions');
    END CASE;
    
    -- Adjust confidence level based on data availability
    IF JSON_UNQUOTE(JSON_EXTRACT(v_banking_result, '$.dataFound')) = 'false' THEN
        SET v_confidence_level = v_confidence_level - 15;
    END IF;
    
    IF v_fraud_risk_level = 'CLEAN' THEN
        SET v_confidence_level = v_confidence_level + 5;
    END IF;
    
    -- Return comprehensive investigation result
    SELECT JSON_OBJECT(
        'investigationId', v_investigation_id,
        'investigationDate', NOW(),
        'applicantProfile', JSON_OBJECT(
            'aadhaarNumber', p_aadhaar,
            'panNumber', p_pan,
            'dataAvailability', JSON_OBJECT(
                'bankingData', JSON_UNQUOTE(JSON_EXTRACT(v_banking_result, '$.dataFound')),
                'fraudData', TRUE,
                'loanData', CASE WHEN v_loan_risk_level = 'NO_HISTORY' THEN FALSE ELSE TRUE END
            )
        ),
        'overallAssessment', JSON_OBJECT(
            'finalRiskLevel', v_overall_risk_level,
            'overallRiskScore', v_overall_risk_score,
            'complianceDecision', v_compliance_decision,
            'confidence', v_confidence_level
        ),
        'bank_details', JSON_OBJECT(
            'riskTags', JSON_EXTRACT(v_banking_result, '$.riskTags'),
            'riskLevel', v_banking_risk_level,
            'riskScore', v_banking_risk_score
        ),
        'fraud_records', JSON_OBJECT(
            'riskTags', JSON_EXTRACT(v_fraud_result, '$.riskTags'),
            'riskLevel', v_fraud_risk_level,
            'riskScore', v_fraud_risk_score
        ),
        'loan_history', JSON_OBJECT(
            'riskTags', JSON_EXTRACT(v_loan_result, '$.riskTags'),
            'riskLevel', v_loan_risk_level,
            'riskScore', v_loan_risk_score
        ),
        'consolidatedFindings', JSON_OBJECT(
            'criticalIssues', v_critical_issues,
            'riskFactors', v_risk_factors,
            'complianceRecommendation', JSON_OBJECT(
                'action', v_compliance_decision,
                'reasoning', CASE v_compliance_decision
                    WHEN 'IMMEDIATE_REJECTION' THEN 'Critical fraud risk makes approval impossible under regulatory guidelines'
                    WHEN 'REJECT_OR_ENHANCED_CONDITIONS' THEN 'High combined risk factors exceed acceptable lending thresholds'
                    WHEN 'CONDITIONAL_APPROVAL' THEN 'Moderate risk factors require enhanced conditions and monitoring'
                    WHEN 'ENHANCED_VERIFICATION' THEN 'Some risk factors present but manageable with additional verification'
                    ELSE 'Risk profile within acceptable parameters for standard processing'
                END,
                'alternativeActions', CASE v_compliance_decision
                    WHEN 'REJECT_OR_ENHANCED_CONDITIONS' THEN JSON_ARRAY('Require 150% collateral coverage', 'Mandate guarantor with clean credit history', 'Reduce loan amount by 50%')
                    WHEN 'CONDITIONAL_APPROVAL' THEN JSON_ARRAY('Additional income documentation', 'Employment verification call', 'Higher interest rate (+2%)')
                    ELSE JSON_ARRAY()
                END,
                'regulatoryImplications', CASE 
                    WHEN v_fraud_risk_level = 'CRITICAL' THEN 'Proceeding may violate RBI lending guidelines and require regulatory reporting'
                    WHEN v_overall_risk_level = 'HIGH' THEN 'High risk lending requires enhanced due diligence documentation'
                    ELSE 'No specific regulatory concerns identified'
                END
            ),
            'recommendations', v_final_recommendations
        )
    ) AS comprehensive_investigation_result;
    
END//

DELIMITER ;
