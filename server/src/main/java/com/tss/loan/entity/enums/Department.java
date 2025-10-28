package com.tss.loan.entity.enums;

/**
 * Enum representing real-world banking departments
 */
public enum Department {
    CREDIT_RISK("Credit Risk", "CR", "Assesses and manages credit risk for loan applications"),
    FRAUD_PREVENTION("Fraud Prevention", "FR", "Detects and prevents fraudulent loan applications"),
    RETAIL_BANKING("Retail Banking", "RB", "Handles individual customer loan applications"),
    CORPORATE_BANKING("Corporate Banking", "CB", "Manages business and corporate loan applications"),
    OPERATIONS("Operations", "OP", "Handles operational aspects of loan processing"),
    COMPLIANCE("Compliance", "CM", "Ensures regulatory compliance and policy adherence"),
    RISK_MANAGEMENT("Risk Management", "RM", "Overall risk assessment and management"),
    AUDIT("Audit", "AU", "Internal audit and quality assurance"),
    LEGAL("Legal", "LG", "Legal review and documentation"),
    TECHNOLOGY("Technology", "IT", "IT support and system administration"),
    UNDERWRITING("Underwriting", "UW", "Loan underwriting and assessment"),
    COLLECTIONS("Collections", "CL", "Loan recovery and collections"),
    CUSTOMER_SERVICE("Customer Service", "CS", "Customer support and service"),
    BRANCH_OPERATIONS("Branch Operations", "BO", "Branch-level loan operations"),
    GENERAL("General", "GEN", "General department for unspecified roles");
    
    private final String displayName;
    private final String code;
    private final String description;
    
    Department(String displayName, String code, String description) {
        this.displayName = displayName;
        this.code = code;
        this.description = description;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * Get department from display name (case insensitive)
     */
    public static Department fromDisplayName(String displayName) {
        if (displayName == null || displayName.trim().isEmpty()) {
            return GENERAL;
        }
        
        String name = displayName.toUpperCase().trim();
        for (Department dept : values()) {
            if (dept.displayName.toUpperCase().equals(name) || 
                dept.name().equals(name.replace(" ", "_"))) {
                return dept;
            }
        }
        return GENERAL;
    }
}
