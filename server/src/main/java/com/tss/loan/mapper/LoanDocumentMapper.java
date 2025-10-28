package com.tss.loan.mapper;

import com.tss.loan.dto.response.LoanDocumentResponse;
import com.tss.loan.entity.loan.LoanDocument;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for LoanDocument entity to LoanDocumentResponse DTO
 * BREAKS CIRCULAR REFERENCES by using IDs instead of full entities
 */
@Component
public class LoanDocumentMapper {

    /**
     * Convert LoanDocument entity to LoanDocumentResponse DTO
     * NO circular references - uses IDs and basic data only
     */
    public LoanDocumentResponse toResponse(LoanDocument document) {
        if (document == null) {
            return null;
        }

        return LoanDocumentResponse.builder()
                .id(document.getId())
                .applicationId(document.getLoanApplication().getId()) // ID only, not full entity
                .documentType(document.getDocumentType())
                .fileName(document.getFileName())
                .filePath(document.getFilePath())
                .publicId(document.getPublicId())
                .fileType(document.getFileType())
                .fileSize(document.getFileSize())
                .verificationStatus(document.getVerificationStatus())
                .verificationNotes(document.getVerificationNotes())
                .verifiedAt(document.getVerifiedAt())
                .uploadedAt(document.getUploadedAt())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                
                // Uploaded by info (ID and email only, not full User entity)
                .uploadedById(document.getUploadedBy().getId())
                .uploadedByEmail(document.getUploadedBy().getEmail())
                
                // Application summary (basic info only, not full LoanApplication entity)
                .applicantName(document.getLoanApplication().getApplicantName())
                .applicantEmail(document.getLoanApplication().getApplicantEmail())
                .build();
    }

    /**
     * Convert list of LoanDocument entities to list of LoanDocumentResponse DTOs
     */
    public List<LoanDocumentResponse> toResponseList(List<LoanDocument> documents) {
        if (documents == null) {
            return null;
        }
        
        return documents.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
