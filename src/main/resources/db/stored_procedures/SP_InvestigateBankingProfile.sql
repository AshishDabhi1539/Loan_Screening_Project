-- =====================================================
-- COMPLIANCE INVESTIGATION: BANKING PROFILE ANALYSIS
-- =====================================================
-- Purpose: Analyze banking behavior and financial stability for compliance officers
-- Table: bank_details
-- Usage: CALL SP_InvestigateBankingProfile('123456789012', 'ABCDE1234F');

DELIMITER //

DROP PROCEDURE IF EXISTS SP_InvestigateBankingProfile//

CREATE PROCEDURE SP_InvestigateBankingProfile(
    IN p_aadhaar VARCHAR(12),
    IN p_pan VARCHAR(10)
)
BEGIN
    DECLARE v_total_accounts INT DEFAULT 0;
    DECLARE v_risk_score INT DEFAULT 100;
    DECLARE v_overall_risk VARCHAR(20) DEFAULT 'LOW';
    DECLARE v_risk_tags JSON DEFAULT JSON_ARRAY();
    DECLARE v_key_findings JSON DEFAULT JSON_ARRAY();
    DECLARE v_recommendations JSON DEFAULT JSON_ARRAY();
    
    -- Banking metrics
    DECLARE v_total_bounces INT DEFAULT 0;
    DECLARE v_overdraft_accounts INT DEFAULT 0;
    DECLARE v_salary_accounts INT DEFAULT 0;
    DECLARE v_avg_balance DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_income DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_expenses DECIMAL(15,2) DEFAULT 0;
    DECLARE v_max_credit_usage DECIMAL(5,2) DEFAULT 0;
    DECLARE v_avg_account_age DECIMAL(5,2) DEFAULT 0;
    
    -- Check if data exists
    SELECT COUNT(*) INTO v_total_accounts
    FROM bank_details 
    WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
    
    IF v_total_accounts = 0 THEN
        -- No banking data found
        SELECT JSON_OBJECT(
            'dataFound', FALSE,
            'riskTags', JSON_ARRAY('NO_BANKING_DATA: No banking history found for verification'),
            'description', JSON_OBJECT(
                'overallRisk', 'HIGH',
                'riskScore', 75,
                'accountSummary', 'No banking data available for assessment',
                'keyFindings', JSON_ARRAY('No banking relationship established', 'Unable to verify financial behavior'),
                'recommendations', JSON_ARRAY('Request bank statements', 'Verify income through alternative sources', 'Consider higher risk premium')
            )
        ) AS investigation_result;
    ELSE
        -- Analyze banking data
        SELECT 
            COUNT(*) as total_accounts,
            COALESCE(SUM(cheque_bounce_count), 0) as total_bounces,
            SUM(CASE WHEN overdraft_used = 1 THEN 1 ELSE 0 END) as overdraft_accounts,
            SUM(CASE WHEN salary_account_flag = 1 THEN 1 ELSE 0 END) as salary_accounts,
            COALESCE(AVG(average_monthly_balance), 0) as avg_balance,
            COALESCE(SUM(monthly_income), 0) as total_income,
            COALESCE(SUM(monthly_expense), 0) as total_expenses,
            COALESCE(MAX(credit_card_usage_ratio), 0) as max_credit_usage,
            COALESCE(AVG(account_age_years), 0) as avg_account_age
        INTO v_total_accounts, v_total_bounces, v_overdraft_accounts, v_salary_accounts,
             v_avg_balance, v_total_income, v_total_expenses, v_max_credit_usage, v_avg_account_age
        FROM bank_details 
        WHERE aadhaar_number = p_aadhaar OR pan_number = p_pan;
        
        -- Calculate risk score (start with 100, deduct for risk factors)
        SET v_risk_score = 100;
        
        -- Risk Assessment Logic
        
        -- 1. Cheque Bounce Analysis
        IF v_total_bounces > 5 THEN
            SET v_risk_score = v_risk_score - 30;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('FREQUENT_BOUNCES: ', v_total_bounces, ' cheque bounces indicate poor cash flow management'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT(v_total_bounces, ' cheque bounces suggest chronic payment difficulties and financial stress'));
        ELSEIF v_total_bounces BETWEEN 3 AND 5 THEN
            SET v_risk_score = v_risk_score - 20;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('MODERATE_BOUNCES: ', v_total_bounces, ' cheque bounces show occasional payment issues'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT(v_total_bounces, ' cheque bounces indicate occasional cash flow problems'));
        ELSEIF v_total_bounces BETWEEN 1 AND 2 THEN
            SET v_risk_score = v_risk_score - 10;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('MINOR_BOUNCES: ', v_total_bounces, ' cheque bounce(s) - minimal payment issues'));
        ELSE
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Clean cheque payment history with zero bounces indicates good payment discipline');
        END IF;
        
        -- 2. Overdraft Usage Analysis
        IF v_overdraft_accounts > 0 THEN
            SET v_risk_score = v_risk_score - 15;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('OVERDRAFT_DEPENDENCY: ', v_overdraft_accounts, ' account(s) using overdraft facility'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Overdraft usage indicates frequent liquidity shortfalls and poor cash flow planning');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Verify income stability and cash flow management');
        END IF;
        
        -- 3. Credit Card Utilization Analysis
        IF v_max_credit_usage > 80 THEN
            SET v_risk_score = v_risk_score - 20;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('HIGH_CREDIT_UTILIZATION: ', ROUND(v_max_credit_usage, 1), '% credit card usage indicates over-reliance on credit'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'High credit utilization suggests financial stress and potential difficulty managing additional debt');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Consider reduced loan amount due to existing credit burden');
        ELSEIF v_max_credit_usage BETWEEN 60 AND 80 THEN
            SET v_risk_score = v_risk_score - 10;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('MODERATE_CREDIT_USAGE: ', ROUND(v_max_credit_usage, 1), '% credit utilization shows moderate credit dependency'));
        END IF;
        
        -- 4. Income vs Expense Analysis
        IF v_total_income > 0 AND v_total_expenses > v_total_income THEN
            SET v_risk_score = v_risk_score - 25;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('EXPENSE_EXCEEDS_INCOME: Monthly expenses ₹', FORMAT(v_total_expenses, 0), 
                       ' exceed income ₹', FORMAT(v_total_income, 0)));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Negative cash flow indicates unsustainable financial position');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Reject application due to insufficient income to support additional EMI');
        ELSEIF v_total_income > 0 AND (v_total_expenses / v_total_income) > 0.8 THEN
            SET v_risk_score = v_risk_score - 15;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                'HIGH_EXPENSE_RATIO: Expenses consume >80% of income leaving minimal surplus');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Consider lower loan amount to maintain comfortable EMI ratio');
        END IF;
        
        -- 5. Balance Management Analysis
        IF v_total_income > 0 AND v_avg_balance < (v_total_income * 0.1) THEN
            SET v_risk_score = v_risk_score - 15;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('LOW_BALANCE_RATIO: Average balance ₹', FORMAT(v_avg_balance, 0), 
                       ' is only ', ROUND((v_avg_balance / v_total_income) * 100, 1), '% of monthly income'));
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Low balance ratio indicates poor savings discipline and financial planning');
        END IF;
        
        -- 6. Salary Account Analysis
        IF v_salary_accounts = 0 THEN
            SET v_risk_score = v_risk_score - 10;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                'NO_SALARY_ACCOUNT: No designated salary account found for income verification');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Verify employment and income through alternative documentation');
        ELSE
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT(v_salary_accounts, ' salary account(s) provide verified income source'));
        END IF;
        
        -- 7. Account Age Analysis
        IF v_avg_account_age < 1 THEN
            SET v_risk_score = v_risk_score - 15;
            SET v_risk_tags = JSON_ARRAY_APPEND(v_risk_tags, '$', 
                CONCAT('NEW_BANKING_RELATIONSHIP: Average account age ', ROUND(v_avg_account_age, 1), 
                       ' years indicates limited banking history'));
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Enhanced verification required due to limited banking track record');
        ELSEIF v_avg_account_age > 5 THEN
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                CONCAT('Established banking relationship with ', ROUND(v_avg_account_age, 1), 
                       ' years average account age demonstrates stability'));
        END IF;
        
        -- Determine overall risk level (reversed logic)
        IF v_risk_score >= 80 THEN
            SET v_overall_risk = 'HIGH';
        ELSEIF v_risk_score >= 60 THEN
            SET v_overall_risk = 'MEDIUM';
        ELSE
            SET v_overall_risk = 'LOW';
        END IF;

        -- Add positive findings if low risk
        IF v_risk_score < 60 THEN
            SET v_key_findings = JSON_ARRAY_APPEND(v_key_findings, '$',
                'Strong banking profile with good financial discipline and payment history');
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Suitable for standard loan terms and processing');
        ELSEIF v_overall_risk = 'HIGH' THEN
            SET v_recommendations = JSON_ARRAY_APPEND(v_recommendations, '$',
                'Consider rejection or require additional collateral/guarantor');
        END IF;

        
        -- Return investigation result
        SELECT JSON_OBJECT(
            'dataFound', TRUE,
            'riskTags', v_risk_tags,
            'description', JSON_OBJECT(
                'overallRisk', v_overall_risk,
                'riskScore', v_risk_score,
                'accountSummary', CONCAT('Analysis of ', v_total_accounts, ' bank account(s) reveals ', 
                                       LOWER(v_overall_risk), ' risk profile'),
                'keyFindings', v_key_findings,
                'recommendations', v_recommendations
            )
        ) AS investigation_result;
    END IF;
    
END//

DELIMITER ;
