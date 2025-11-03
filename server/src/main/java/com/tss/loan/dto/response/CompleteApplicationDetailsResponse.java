package com.tss.loan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteApplicationDetailsResponse {
    
    // Application Basic Info
    private ApplicationInfo applicationInfo;
    
    // Applicant Identity Details
    private ApplicantIdentity applicantIdentity;
    
    // Employment & Income Details
    private EmploymentDetails employmentDetails;
    
    // Document Information
    private List<DocumentInfo> documents;
    
    // Financial Assessment
    private FinancialAssessment financialAssessment;
    
    // Verification Status Summary
    private VerificationSummary verificationSummary;
    
    // External Verification Results
    private ExternalVerification externalVerification;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationInfo {
        private UUID id;
        private String status;
        private BigDecimal loanAmount;
        private Integer tenureMonths;
        private String purpose;
        private String loanType;
        private LocalDateTime submittedAt;
        private LocalDateTime assignedAt;
        private String assignedOfficerName;
        private String priority;
        private Integer daysInReview;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicantIdentity {
        private PersonalDetails personalDetails;
        private ContactInfo contactInfo;
        private VerificationStatus verificationStatus;
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class PersonalDetails {
            private String firstName;
            private String lastName;
            private String middleName;
            private String fullName;
            private String panNumber;
            private String aadhaarNumber;
            private String dateOfBirth;
            private String gender;
            private String maritalStatus;
            private AddressInfo addresses;
        }
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class AddressInfo {
            private String permanentAddress;
            private String currentAddress;
            private String city;
            private String state;
            private String pincode;
        }
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class ContactInfo {
            private String phone;
            private String email;
            private String alternatePhone;
        }
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class VerificationStatus {
            private Boolean identityVerified;
            private Boolean addressVerified;
            private Boolean phoneVerified;
            private Boolean emailVerified;
            private String identityVerificationNotes;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmploymentDetails {
        private String companyName;
        private String designation;
        private String workExperience;
        private String employmentType;
        private BigDecimal monthlyIncome;
        private BigDecimal annualIncome;
        private CompanyContact companyContact;
        private BankDetails bankDetails;
        private EmploymentVerificationStatus verificationStatus;
        
        // Financial Obligations
        private BigDecimal existingLoanEmi;
        private BigDecimal creditCardOutstanding;
        private BigDecimal monthlyExpenses;
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class CompanyContact {
            private String companyPhone;
            private String companyEmail;
            private String hrPhone;
            private String hrEmail;
            private String managerName;
            private String managerPhone;
            private String companyAddress;
        }
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class BankDetails {
            private String bankName;
            private String accountNumber;
            private String ifscCode;
            private String accountType;
            private String branchName;
        }
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class EmploymentVerificationStatus {
            private Boolean employmentVerified;
            private Boolean incomeVerified;
            private Boolean bankAccountVerified;
            private String employmentVerificationNotes;
            private String incomeVerificationNotes;
            private LocalDateTime lastVerificationDate;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentInfo {
        private Long documentId;
        private String documentType;
        private String fileName;
        private String fileUrl;
        private LocalDateTime uploadDate;
        private String verificationStatus;
        private String verificationNotes;
        private String rejectionReason;
        private Boolean isRequired;
        private Boolean isResubmitted;
        private LocalDateTime verifiedAt;
        private String verifiedByName;
        private Long fileSizeBytes;
        private String fileType;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialAssessment {
        private LoanDetails loanDetails;
        private List<ExistingLoan> existingLoans;
        private CalculatedRatios calculatedRatios;
        private RiskAssessment riskAssessment;
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class LoanDetails {
            private BigDecimal requestedAmount;
            private Integer tenureMonths;
            private String purpose;
            private BigDecimal estimatedEmi;
            private BigDecimal estimatedInterestRate;
        }
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class ExistingLoan {
            private String loanType;
            private BigDecimal emiAmount;
            private BigDecimal outstandingAmount;
            private String bankName;
            private Integer remainingTenure;
        }
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class CalculatedRatios {
            private Double emiToIncomeRatio;
            private Double debtToIncomeRatio;
            private Double loanToIncomeRatio;
            private String affordabilityStatus;
            private String recommendation;
        }
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class RiskAssessment {
            private String riskLevel;
            private Integer riskScore;
            private Integer fraudScore;
            private List<String> riskFactors;
            private String overallAssessment;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerificationSummary {
        private Boolean identityVerificationComplete;
        private Boolean documentVerificationComplete;
        private Boolean employmentVerificationComplete;
        private Boolean financialVerificationComplete;
        private Boolean externalVerificationComplete;
        private Integer overallCompletionPercentage;
        private String currentStage;
        private String nextAction;
        private List<String> pendingItems;
        private List<String> rejectedItems;
        private Boolean readyForExternalVerification;
        private Boolean readyForDecision;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExternalVerification {
        // Credit Scoring Results
        private Integer creditScore;
        private String creditScoreReason;
        private String riskLevel;             // LOW, MEDIUM, HIGH, INVALID, UNKNOWN
        private Integer riskScoreNumeric;     // 0-100 numeric risk score
        private String riskFactors;           // Detailed risk factors explanation
        private Boolean redAlertFlag;         // Critical risk indicator
        
        // Financial Metrics
        private BigDecimal totalOutstanding;      // Total outstanding loan amount
        private Integer activeLoansCount;         // Number of active loans
        private Integer totalMissedPayments;      // Total missed payments
        private Boolean hasDefaults;              // Loan default history flag
        private Integer activeFraudCases;         // Active fraud cases count
        
        // Data Availability
        private Boolean dataFound;                // Whether external data was found
        
        // Metadata
        private String recommendedAction;         // Recommended action based on scoring
        private LocalDateTime verifiedAt;
    }
}
