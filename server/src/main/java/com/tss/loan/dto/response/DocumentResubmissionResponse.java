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
public class DocumentResubmissionResponse {
    
    private UUID applicationId;
    private String applicationStatus;
    private List<RejectedDocumentInfo> rejectedDocuments;
    private LocalDateTime resubmissionDeadline;
    private String additionalInstructions;
    private Boolean notificationSent;
    private String message;
    private LocalDateTime requestedAt;
    private String requestedByOfficer;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RejectedDocumentInfo {
        private String documentType;
        private String rejectionReason;
        private String requiredAction;
        private String specificInstructions;
        private Boolean isRequired;
    }
}
