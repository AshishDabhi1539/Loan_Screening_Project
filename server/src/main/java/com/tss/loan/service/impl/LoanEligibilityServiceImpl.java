package com.tss.loan.service.impl;

import com.tss.loan.entity.enums.EmploymentType;
import com.tss.loan.entity.enums.LoanType;
import com.tss.loan.service.LoanEligibilityService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Implementation of loan eligibility service
 * Based on real-world banking requirements from major banks
 */
@Service
@Slf4j
public class LoanEligibilityServiceImpl implements LoanEligibilityService {
    
    // Maximum acceptable FOIR (Fixed Obligation to Income Ratio)
    private static final double MAX_FOIR_PERCENTAGE = 70.0;
    
    // Loan Type → Employment Type Eligibility Matrix
    private static final Map<LoanType, List<EmploymentType>> ELIGIBILITY_MATRIX = new HashMap<>();
    
    // Minimum Income Requirements (in INR)
    private static final Map<LoanType, Double> MIN_INCOME_REQUIREMENTS = new HashMap<>();
    
    // Minimum Employment Duration (in months)
    private static final Map<LoanType, Map<EmploymentType, Integer>> MIN_EMPLOYMENT_DURATION = new HashMap<>();
    
    static {
        initializeEligibilityMatrix();
        initializeIncomeRequirements();
        initializeEmploymentDuration();
    }
    
    private static void initializeEligibilityMatrix() {
        // PERSONAL_LOAN - Most employment types eligible
        ELIGIBILITY_MATRIX.put(LoanType.PERSONAL_LOAN, Arrays.asList(
            EmploymentType.SALARIED,
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.PROFESSIONAL,
            EmploymentType.FREELANCER
        ));
        
        // SALARY_ADVANCE - Only salaried employees
        ELIGIBILITY_MATRIX.put(LoanType.SALARY_ADVANCE, Arrays.asList(
            EmploymentType.SALARIED
        ));
        
        // HOME_LOAN - Stable income required
        ELIGIBILITY_MATRIX.put(LoanType.HOME_LOAN, Arrays.asList(
            EmploymentType.SALARIED,
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.PROFESSIONAL
        ));
        
        // PROPERTY_LOAN - Similar to home loan
        ELIGIBILITY_MATRIX.put(LoanType.PROPERTY_LOAN, Arrays.asList(
            EmploymentType.SALARIED,
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.PROFESSIONAL
        ));
        
        // LOAN_AGAINST_PROPERTY - More flexible
        ELIGIBILITY_MATRIX.put(LoanType.LOAN_AGAINST_PROPERTY, Arrays.asList(
            EmploymentType.SALARIED,
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.PROFESSIONAL,
            EmploymentType.RETIRED
        ));
        
        // CAR_LOAN - Standard employment types
        ELIGIBILITY_MATRIX.put(LoanType.CAR_LOAN, Arrays.asList(
            EmploymentType.SALARIED,
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.PROFESSIONAL
        ));
        
        // TWO_WHEELER_LOAN - Less strict
        ELIGIBILITY_MATRIX.put(LoanType.TWO_WHEELER_LOAN, Arrays.asList(
            EmploymentType.SALARIED,
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.PROFESSIONAL,
            EmploymentType.FREELANCER,
            EmploymentType.STUDENT  // With co-applicant
        ));
        
        // COMMERCIAL_VEHICLE_LOAN - Business oriented
        ELIGIBILITY_MATRIX.put(LoanType.COMMERCIAL_VEHICLE_LOAN, Arrays.asList(
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.BUSINESS_OWNER
        ));
        
        // BUSINESS_LOAN - Business owners only
        ELIGIBILITY_MATRIX.put(LoanType.BUSINESS_LOAN, Arrays.asList(
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.PROFESSIONAL
        ));
        
        // WORKING_CAPITAL_LOAN - Business owners only
        ELIGIBILITY_MATRIX.put(LoanType.WORKING_CAPITAL_LOAN, Arrays.asList(
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.SELF_EMPLOYED
        ));
        
        // EQUIPMENT_FINANCE - Business oriented
        ELIGIBILITY_MATRIX.put(LoanType.EQUIPMENT_FINANCE, Arrays.asList(
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.PROFESSIONAL
        ));
        
        // CROP_LOAN - Farmers (self-employed)
        ELIGIBILITY_MATRIX.put(LoanType.CROP_LOAN, Arrays.asList(
            EmploymentType.SELF_EMPLOYED
        ));
        
        // FARM_EQUIPMENT_LOAN - Farmers
        ELIGIBILITY_MATRIX.put(LoanType.FARM_EQUIPMENT_LOAN, Arrays.asList(
            EmploymentType.SELF_EMPLOYED
        ));
        
        // EDUCATION_LOAN - Students with co-applicant
        ELIGIBILITY_MATRIX.put(LoanType.EDUCATION_LOAN, Arrays.asList(
            EmploymentType.STUDENT
        ));
        
        // PROFESSIONAL_COURSE_LOAN - Students/Professionals
        ELIGIBILITY_MATRIX.put(LoanType.PROFESSIONAL_COURSE_LOAN, Arrays.asList(
            EmploymentType.STUDENT,
            EmploymentType.PROFESSIONAL,
            EmploymentType.SALARIED
        ));
        
        // GOLD_LOAN - Most flexible, all types
        ELIGIBILITY_MATRIX.put(LoanType.GOLD_LOAN, Arrays.asList(
            EmploymentType.SALARIED,
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.PROFESSIONAL,
            EmploymentType.FREELANCER,
            EmploymentType.RETIRED,
            EmploymentType.UNEMPLOYED,
            EmploymentType.STUDENT
        ));
        
        // CREDIT_CARD - Employed individuals
        ELIGIBILITY_MATRIX.put(LoanType.CREDIT_CARD, Arrays.asList(
            EmploymentType.SALARIED,
            EmploymentType.SELF_EMPLOYED,
            EmploymentType.BUSINESS_OWNER,
            EmploymentType.PROFESSIONAL
        ));
        
        // OVERDRAFT_FACILITY - Salaried with salary account
        ELIGIBILITY_MATRIX.put(LoanType.OVERDRAFT_FACILITY, Arrays.asList(
            EmploymentType.SALARIED,
            EmploymentType.BUSINESS_OWNER
        ));
    }
    
    private static void initializeIncomeRequirements() {
        MIN_INCOME_REQUIREMENTS.put(LoanType.PERSONAL_LOAN, 25000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.SALARY_ADVANCE, 20000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.HOME_LOAN, 40000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.PROPERTY_LOAN, 40000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.LOAN_AGAINST_PROPERTY, 30000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.CAR_LOAN, 30000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.TWO_WHEELER_LOAN, 15000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.COMMERCIAL_VEHICLE_LOAN, 40000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.BUSINESS_LOAN, 50000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.WORKING_CAPITAL_LOAN, 60000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.EQUIPMENT_FINANCE, 40000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.CROP_LOAN, 20000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.FARM_EQUIPMENT_LOAN, 25000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.EDUCATION_LOAN, 30000.0); // Guardian
        MIN_INCOME_REQUIREMENTS.put(LoanType.PROFESSIONAL_COURSE_LOAN, 25000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.GOLD_LOAN, 0.0); // No minimum
        MIN_INCOME_REQUIREMENTS.put(LoanType.CREDIT_CARD, 25000.0);
        MIN_INCOME_REQUIREMENTS.put(LoanType.OVERDRAFT_FACILITY, 30000.0);
    }
    
    private static void initializeEmploymentDuration() {
        // Personal Loan
        Map<EmploymentType, Integer> personalLoan = new HashMap<>();
        personalLoan.put(EmploymentType.SALARIED, 12); // 1 year
        personalLoan.put(EmploymentType.SELF_EMPLOYED, 24); // 2 years
        personalLoan.put(EmploymentType.BUSINESS_OWNER, 24);
        personalLoan.put(EmploymentType.PROFESSIONAL, 24);
        personalLoan.put(EmploymentType.FREELANCER, 18);
        MIN_EMPLOYMENT_DURATION.put(LoanType.PERSONAL_LOAN, personalLoan);
        
        // Home Loan
        Map<EmploymentType, Integer> homeLoan = new HashMap<>();
        homeLoan.put(EmploymentType.SALARIED, 24); // 2 years
        homeLoan.put(EmploymentType.SELF_EMPLOYED, 36); // 3 years
        homeLoan.put(EmploymentType.BUSINESS_OWNER, 36);
        homeLoan.put(EmploymentType.PROFESSIONAL, 36);
        MIN_EMPLOYMENT_DURATION.put(LoanType.HOME_LOAN, homeLoan);
        
        // Business Loan
        Map<EmploymentType, Integer> businessLoan = new HashMap<>();
        businessLoan.put(EmploymentType.SELF_EMPLOYED, 24); // 2 years
        businessLoan.put(EmploymentType.BUSINESS_OWNER, 24);
        businessLoan.put(EmploymentType.PROFESSIONAL, 24);
        MIN_EMPLOYMENT_DURATION.put(LoanType.BUSINESS_LOAN, businessLoan);
        
        // Education Loan - N/A (co-applicant employment checked)
        MIN_EMPLOYMENT_DURATION.put(LoanType.EDUCATION_LOAN, new HashMap<>());
        
        // Gold Loan - N/A (no employment duration required)
        MIN_EMPLOYMENT_DURATION.put(LoanType.GOLD_LOAN, new HashMap<>());
    }
    
    @Override
    public List<EmploymentType> getEligibleEmploymentTypes(LoanType loanType) {
        List<EmploymentType> eligible = ELIGIBILITY_MATRIX.get(loanType);
        if (eligible == null) {
            log.warn("No eligibility matrix found for loan type: {}, returning all types", loanType);
            return Arrays.asList(EmploymentType.values());
        }
        return eligible;
    }
    
    @Override
    public boolean isEmploymentTypeEligible(LoanType loanType, EmploymentType employmentType) {
        List<EmploymentType> eligible = getEligibleEmploymentTypes(loanType);
        return eligible.contains(employmentType);
    }
    
    @Override
    public double getMinimumIncomeRequirement(LoanType loanType) {
        return MIN_INCOME_REQUIREMENTS.getOrDefault(loanType, 25000.0);
    }
    
    @Override
    public int getMinimumEmploymentDuration(LoanType loanType, EmploymentType employmentType) {
        Map<EmploymentType, Integer> durations = MIN_EMPLOYMENT_DURATION.get(loanType);
        if (durations == null) {
            return 0;
        }
        return durations.getOrDefault(employmentType, 0);
    }
    
    @Override
    public double calculateFOIR(double monthlyIncome, double existingObligations, double newEmi) {
        if (monthlyIncome <= 0) {
            return 100.0; // Cannot calculate, assume worst case
        }
        double totalObligations = existingObligations + newEmi;
        return (totalObligations / monthlyIncome) * 100.0;
    }
    
    @Override
    public boolean isFOIRAcceptable(double foir) {
        return foir <= MAX_FOIR_PERCENTAGE;
    }
    
    @Override
    public String getEligibilityReason(LoanType loanType, EmploymentType employmentType) {
        boolean eligible = isEmploymentTypeEligible(loanType, employmentType);
        
        if (eligible) {
            return getEligibleReason(loanType, employmentType);
        } else {
            return getIneligibleReason(loanType, employmentType);
        }
    }
    
    private String getEligibleReason(LoanType loanType, EmploymentType employmentType) {
        switch (loanType) {
            case EDUCATION_LOAN:
                return "Eligible with mandatory co-applicant (parent/guardian)";
            case GOLD_LOAN:
                return "Eligible - No income verification required";
            case TWO_WHEELER_LOAN:
                if (employmentType == EmploymentType.STUDENT) {
                    return "Eligible with co-applicant";
                }
                return "Eligible - Standard verification";
            case BUSINESS_LOAN:
            case WORKING_CAPITAL_LOAN:
                return "Eligible - Business financials required";
            default:
                return "Eligible for this loan type";
        }
    }
    
    private String getIneligibleReason(LoanType loanType, EmploymentType employmentType) {
        switch (loanType) {
            case SALARY_ADVANCE:
                return "Only available for salaried employees";
            case BUSINESS_LOAN:
            case WORKING_CAPITAL_LOAN:
                return "Only available for business owners and self-employed";
            case EDUCATION_LOAN:
                return "Only available for students (with co-applicant)";
            case CROP_LOAN:
            case FARM_EQUIPMENT_LOAN:
                return "Only available for farmers and agricultural workers";
            case COMMERCIAL_VEHICLE_LOAN:
                return "Only available for business purposes";
            default:
                if (employmentType == EmploymentType.UNEMPLOYED) {
                    return "Not eligible - Requires stable income source";
                } else if (employmentType == EmploymentType.STUDENT) {
                    return "Not eligible - Requires co-applicant or choose student-specific loans";
                }
                return "Not eligible for this loan type";
        }
    }
    
    @Override
    public Map<String, Object> getLoanEligibilityCriteria(LoanType loanType) {
        Map<String, Object> criteria = new HashMap<>();
        criteria.put("loanType", loanType);
        criteria.put("eligibleEmploymentTypes", getEligibleEmploymentTypes(loanType));
        criteria.put("minimumIncome", getMinimumIncomeRequirement(loanType));
        criteria.put("maxFOIR", MAX_FOIR_PERCENTAGE);
        
        // Add employment duration for each eligible type
        Map<EmploymentType, Integer> durations = new HashMap<>();
        for (EmploymentType empType : getEligibleEmploymentTypes(loanType)) {
            int duration = getMinimumEmploymentDuration(loanType, empType);
            if (duration > 0) {
                durations.put(empType, duration);
            }
        }
        if (!durations.isEmpty()) {
            criteria.put("minimumEmploymentDuration", durations);
        }
        
        return criteria;
    }
}
