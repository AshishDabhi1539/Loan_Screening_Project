package com.tss.loan.service;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import com.tss.loan.entity.loan.LoanDocument;
import com.tss.loan.entity.enums.DocumentType;
import com.tss.loan.entity.user.User;
import com.tss.loan.dto.response.DocumentUploadResponse;

public interface DocumentUploadService {
    
    /**
     * Upload a single document for loan application
     */
    LoanDocument uploadDocument(MultipartFile file, DocumentType documentType, 
                               UUID loanApplicationId, User uploadedBy) throws IOException;
    
    /**
     * Upload multiple documents for loan application
     */
    List<LoanDocument> uploadMultipleDocuments(List<MultipartFile> files, 
                                              List<DocumentType> documentTypes,
                                              UUID loanApplicationId, User uploadedBy) throws IOException;
    
    /**
     * Delete a document by ID
     */
    boolean deleteDocument(UUID documentId, User user) throws IOException;
    
    /**
     * Get document by ID
     */
    LoanDocument getDocumentById(UUID documentId);
    
    /**
     * Get all documents for a loan application
     */
    List<LoanDocument> getDocumentsByLoanApplication(UUID loanApplicationId);
    
    /**
     * Get document URL for viewing/downloading
     */
    String getDocumentUrl(UUID documentId);
    
    /**
     * Validate document type and size
     */
    boolean validateDocument(MultipartFile file, DocumentType documentType);
    
    /**
     * Upload document with detailed response including progress tracking
     */
    DocumentUploadResponse uploadDocumentWithResponse(MultipartFile file, DocumentType documentType, 
                                                     UUID loanApplicationId, User uploadedBy) throws IOException;
}
