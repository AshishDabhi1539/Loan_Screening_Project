package com.tss.loan.dto.response;

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
public class ApplicantResubmissionRequirementsResponse {
    
    private UUID applicationId;
    private String applicationStatus;
    private Boolean hasResubmissionRequirements;
    private LocalDateTime resubmissionDeadline;
    private String additionalInstructions;
    private List<DocumentRequirement> documentRequirements;
    private LocalDateTime requestedAt;
    private String requestedByOfficer;
    private Integer totalDocumentsRequired;
    private Integer documentsAlreadyVerified;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentRequirement {
        private String documentType;
        private String documentTypeName;
        private String currentStatus; // VERIFIED, REJECTED, MISSING, PENDING
        private Boolean canReupload; // true if REJECTED or MISSING, false if VERIFIED
        private String rejectionReason;
        private String requiredAction;
        private String specificInstructions;
        private Boolean isRequired;
        private LocalDateTime lastUploadedAt;
        private String fileName;
        private Long currentDocumentId; // null if no document exists
    }
}
