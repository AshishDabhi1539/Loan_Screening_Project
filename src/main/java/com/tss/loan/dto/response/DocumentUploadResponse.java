package com.tss.loan.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadResponse {
    private Long documentId;
    private UUID applicationId;
    private String documentType;
    private String fileName;
    private String message;
    private boolean canSubmitApplication;
    private String nextStep;
    private String nextStepUrl;
    private LocalDateTime uploadedAt;
    private int totalDocumentsUploaded;
    private int requiredDocumentsCount;
}
