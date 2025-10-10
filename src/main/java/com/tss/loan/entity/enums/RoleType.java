package com.tss.loan.entity.enums;

public enum RoleType {
    ADMIN,              // Single super admin - creates officers
    LOAN_OFFICER,       // Created by admin - processes applications  
    SENIOR_LOAN_OFFICER, // Senior officer for high-value loans
    COMPLIANCE_OFFICER, // Created by admin - handles flagged cases
    APPLICANT           // Default role for public registration
}
