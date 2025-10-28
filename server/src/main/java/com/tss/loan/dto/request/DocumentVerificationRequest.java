package com.tss.loan.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVerificationRequest {
    
    @NotNull(message = "Document verifications are required")
    @Valid
    private List<DocumentVerificationItem> documentVerifications;
    
    @NotNull(message = "Identity verification result is required")
    private Boolean identityVerified;
    
    private String identityVerificationNotes;
    
    @NotNull(message = "Employment verification result is required")
    private Boolean employmentVerified;
    
    private String employmentVerificationNotes;
    
    @NotNull(message = "Income verification result is required")
    private Boolean incomeVerified;
    
    private String incomeVerificationNotes;
    
    @NotNull(message = "Bank account verification result is required")
    private Boolean bankAccountVerified;
    
    private String bankAccountVerificationNotes;
    
    @NotNull(message = "Address verification result is required")
    private Boolean addressVerified;
    
    @NotNull(message = "Overall verification status is required")
    private Boolean overallVerificationPassed;
    
    private String generalNotes;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentVerificationItem {
        
        @NotNull(message = "Document ID is required")
        private String documentId;
        
        @NotNull(message = "Verification status is required")
        private Boolean verified;
        
        private String verificationNotes;
        
        private String rejectionReason;
    }
}
