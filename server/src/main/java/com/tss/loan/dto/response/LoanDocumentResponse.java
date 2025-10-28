package com.tss.loan.dto.response;

import com.tss.loan.entity.enums.DocumentType;
import com.tss.loan.entity.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for LoanDocument to prevent circular reference issues
 * NO entity relationships - only IDs and primitive data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanDocumentResponse {
    
    private Long id;
    private UUID applicationId;
    private DocumentType documentType;
    private String fileName;
    private String filePath;
    private String publicId;
    private String fileType;
    private Long fileSize;
    private VerificationStatus verificationStatus;
    private String verificationNotes;
    private LocalDateTime verifiedAt;
    private LocalDateTime uploadedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Uploaded by info (NO User entity - just IDs and basic info)
    private UUID uploadedById;
    private String uploadedByEmail;
    
    // Application summary (NO LoanApplication entity - just basic info)
    private String applicantName;
    private String applicantEmail;
}
