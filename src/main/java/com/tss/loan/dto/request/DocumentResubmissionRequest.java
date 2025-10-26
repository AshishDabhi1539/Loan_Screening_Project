package com.tss.loan.dto.request;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResubmissionRequest {
    
    @NotEmpty(message = "At least one rejected document must be specified")
    @Valid
    private List<RejectedDocumentItem> rejectedDocuments;
    
    @NotNull(message = "Resubmission deadline is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime resubmissionDeadline;
    
    private String additionalInstructions;
    
    private String officerNotes;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RejectedDocumentItem {
        
        @NotNull(message = "Document type is required")
        private String documentType;
        
        @NotNull(message = "Rejection reason is required")
        private String rejectionReason;
        
        @NotNull(message = "Required action is required")
        private String requiredAction;
        
        private String specificInstructions;
        
        private Boolean isRequired;
    }
}
