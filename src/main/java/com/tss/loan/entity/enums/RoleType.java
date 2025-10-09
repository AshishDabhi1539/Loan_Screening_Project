package com.tss.loan.entity.enums;

public enum RoleType {
    ADMIN,              // Single super admin - creates officers
    LOAN_OFFICER,       // Created by admin - processes applications  
    COMPLIANCE_OFFICER, // Created by admin - handles flagged cases
    APPLICANT           // Default role for public registration
}
