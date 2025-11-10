package com.tss.loan.entity.enums;

/**
 * Enum representing real-world banking designations/positions
 */
public enum Designation {
    // Loan Officer Designations
    JUNIOR_LOAN_OFFICER("Junior Loan Officer", "JLO", "Entry-level loan processing officer"),
    LOAN_OFFICER("Loan Officer", "LO", "Standard loan processing and assessment officer"),
    SENIOR_LOAN_OFFICER("Senior Loan Officer", "SLO", "Experienced loan officer with higher authority"),
    PRINCIPAL_LOAN_OFFICER("Principal Loan Officer", "PLO", "Senior-most loan officer"),
    
    // Compliance Officer Designations
    COMPLIANCE_ANALYST("Compliance Analyst", "CA", "Entry-level compliance review analyst"),
    COMPLIANCE_OFFICER("Compliance Officer", "CO", "Standard compliance review officer"),
    SENIOR_COMPLIANCE_OFFICER("Senior Compliance Officer", "SCO", "Senior compliance officer with investigation authority"),
    COMPLIANCE_MANAGER("Compliance Manager", "CM", "Manager overseeing compliance operations"),
    
    // Risk Management Designations
    RISK_ANALYST("Risk Analyst", "RA", "Risk assessment and analysis specialist"),
    RISK_OFFICER("Risk Officer", "RO", "Risk management officer"),
    SENIOR_RISK_OFFICER("Senior Risk Officer", "SRO", "Senior risk management officer"),
    RISK_MANAGER("Risk Manager", "RM", "Risk management department manager"),
    
    // Underwriting Designations
    UNDERWRITER("Underwriter", "UW", "Loan underwriting specialist"),
    SENIOR_UNDERWRITER("Senior Underwriter", "SUW", "Senior underwriting officer"),
    PRINCIPAL_UNDERWRITER("Principal Underwriter", "PUW", "Principal underwriting officer"),
    
    // Management Designations
    TEAM_LEAD("Team Lead", "TL", "Team leader for loan processing teams"),
    ASSISTANT_MANAGER("Assistant Manager", "AM", "Assistant manager for loan operations"),
    MANAGER("Manager", "MGR", "Department manager"),
    SENIOR_MANAGER("Senior Manager", "SM", "Senior department manager"),
    DEPUTY_GENERAL_MANAGER("Deputy General Manager", "DGM", "Deputy general manager"),
    GENERAL_MANAGER("General Manager", "GM", "General manager"),
    
    // Specialized Roles
    FRAUD_INVESTIGATOR("Fraud Investigator", "FI", "Specialized fraud detection officer"),
    CREDIT_ANALYST("Credit Analyst", "CRA", "Credit assessment specialist"),
    OPERATIONS_OFFICER("Operations Officer", "OO", "Loan operations officer"),
    QUALITY_ANALYST("Quality Analyst", "QA", "Quality assurance analyst"),
    AUDIT_OFFICER("Audit Officer", "AO", "Internal audit officer"),
    
    // Administrative
    ADMINISTRATOR("Administrator", "ADM", "System administrator"),
    SUPER_ADMIN("Super Administrator", "SADM", "Super administrator with full access");
    
    private final String displayName;
    private final String code;
    private final String description;
    
    Designation(String displayName, String code, String description) {
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
     * Get designation from display name (case insensitive)
     */
    public static Designation fromDisplayName(String displayName) {
        if (displayName == null || displayName.trim().isEmpty()) {
            return LOAN_OFFICER; // Default
        }
        
        String name = displayName.toUpperCase().trim();
        for (Designation designation : values()) {
            if (designation.displayName.toUpperCase().equals(name) || 
                designation.name().equals(name.replace(" ", "_"))) {
                return designation;
            }
        }
        return LOAN_OFFICER; // Default fallback
    }
    
    /**
     * Get appropriate designation based on role type
     */
    public static Designation getDefaultForRole(com.tss.loan.entity.enums.RoleType role) {
        switch (role) {
            case LOAN_OFFICER:
                return LOAN_OFFICER;
            case SENIOR_LOAN_OFFICER:
                return SENIOR_LOAN_OFFICER;
            case COMPLIANCE_OFFICER:
                return COMPLIANCE_OFFICER;
            case SENIOR_COMPLIANCE_OFFICER:
                return SENIOR_COMPLIANCE_OFFICER;
            case ADMIN:
                return ADMINISTRATOR;
            default:
                return LOAN_OFFICER;
        }
    }
}
