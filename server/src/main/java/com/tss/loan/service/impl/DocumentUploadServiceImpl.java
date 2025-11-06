package com.tss.loan.service.impl;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.loan.LoanDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import com.tss.loan.entity.enums.DocumentType;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.repository.LoanDocumentRepository;
import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.DocumentUploadService;
import com.tss.loan.service.NotificationService;
import com.tss.loan.dto.response.DocumentUploadResponse;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class DocumentUploadServiceImpl implements DocumentUploadService {

    private final WebClient webClient;
    private final LoanApplicationRepository loanApplicationRepository;
    private final LoanDocumentRepository documentRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    
    @Value("${supabase.url}")
    private String supabaseUrl;
    
    @Value("${supabase.service.key}")
    private String serviceKey;
    
    @Value("${supabase.bucket.name}")
    private String bucketName;
    
    public DocumentUploadServiceImpl(WebClient webClient, 
                                   LoanApplicationRepository loanApplicationRepository,
                                   LoanDocumentRepository documentRepository,
                                   AuditLogService auditLogService,
                                   NotificationService notificationService) {
        this.webClient = webClient;
        this.loanApplicationRepository = loanApplicationRepository;
        this.documentRepository = documentRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }
    
    // Allowed file types for different document types
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif"
    );
    
    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList(
        "application/pdf", "image/jpeg", "image/jpg", "image/png"
    );
    
    // Maximum file size: 5MB
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    @Override
    public LoanDocument uploadDocument(MultipartFile file, DocumentType documentType,
                                       UUID loanApplicationId, User uploadedBy) throws IOException {
        
        log.info("Uploading document: {} for loan application: {}", file.getOriginalFilename(), loanApplicationId);
        
        // Validate document
        if (!validateDocument(file, documentType)) {
            throw new LoanApiException("Invalid document type or size");
        }
        
        try {
            // Create unique filename
            String originalFileName = file.getOriginalFilename();
            String fileExtension = originalFileName != null && originalFileName.contains(".") 
                ? originalFileName.substring(originalFileName.lastIndexOf(".")) : "";
            String uniqueFileName = generatePublicId(documentType, uploadedBy.getId()) + fileExtension;
            
            // Upload to Supabase Storage with retry logic
            String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + uniqueFileName;
            
            try {
                webClient.post()
                    .uri(uploadUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceKey)
                    .header(HttpHeaders.CONTENT_TYPE, file.getContentType())
                    .body(BodyInserters.fromResource(new ByteArrayResource(file.getBytes())))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(java.time.Duration.ofSeconds(30)) // 30 second timeout
                    .retry(2) // Retry 2 times on failure
                    .block();
                    
                log.info("File uploaded to Supabase successfully: {}", uniqueFileName);
            } catch (Exception e) {
                log.error("Supabase upload failed after retries: {}", e.getMessage());
                throw new IOException("Failed to upload file to cloud storage. Please check your internet connection and try again.");
            }
            
            // Generate public URL
            String fileUrl = supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + uniqueFileName;
            
            // Get the loan application
            LoanApplication loanApplication = loanApplicationRepository.findById(loanApplicationId)
                .orElseThrow(() -> new LoanApiException("Loan application not found"));
            
            // Check if document can be uploaded (prevent overwriting verified documents)
            validateDocumentUpload(loanApplicationId, documentType, uploadedBy);
            
            // Create document entity
            LoanDocument document = new LoanDocument();
            document.setLoanApplication(loanApplication);
            document.setDocumentType(documentType);
            document.setFileName(file.getOriginalFilename());
            document.setFilePath(fileUrl);
            document.setPublicId(uniqueFileName);
            document.setFileType(file.getContentType());
            document.setFileSize(file.getSize());
            document.setUploadedBy(uploadedBy);
            document.setVerificationStatus(com.tss.loan.entity.enums.VerificationStatus.PENDING);
            
            // Tag as compliance-only if application is in PENDING_COMPLIANCE_DOCS status
            if (loanApplication.getStatus() == com.tss.loan.entity.enums.ApplicationStatus.PENDING_COMPLIANCE_DOCS) {
                document.setVerificationNotes("[COMPLIANCE_ONLY] Document requested by compliance officer");
            }
            
            // Save to database
            LoanDocument savedDocument = documentRepository.save(document);
            
            // If this is a compliance document upload, update application status if needed
            if (loanApplication.getStatus() == com.tss.loan.entity.enums.ApplicationStatus.PENDING_COMPLIANCE_DOCS) {
                // Status will remain PENDING_COMPLIANCE_DOCS until compliance officer reviews
                // This ensures alert stays until documents are reviewed
                loanApplication.setUpdatedAt(java.time.LocalDateTime.now());
                loanApplicationRepository.save(loanApplication);
            }
            
            // Audit log
            auditLogService.logAction(uploadedBy, "DOCUMENT_UPLOADED", "LoanDocument", null,
                "Document uploaded: " + documentType + " for loan application: " + loanApplicationId);
            
            // Send notification
            try {
                notificationService.createNotification(
                    uploadedBy,
                    NotificationType.IN_APP,
                    "Document Uploaded Successfully",
                    "Your " + documentType + " document has been uploaded successfully and is pending verification."
                );
            } catch (Exception e) {
                log.error("Failed to create notification", e);
            }
            
            log.info("Document uploaded successfully: {} | URL: {}", 
                savedDocument.getFileName(), savedDocument.getFilePath());
            
            return savedDocument;
            
        } catch (LoanApiException e) {
            // Re-throw business logic exceptions without wrapping
            log.error("Failed to upload document: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            // Only wrap technical exceptions in IOException
            log.error("Failed to upload document: {}", e.getMessage());
            throw new IOException("Failed to upload document: " + e.getMessage());
        }
    }

    @Override
    public List<LoanDocument> uploadMultipleDocuments(List<MultipartFile> files, 
                                                    List<DocumentType> documentTypes,
                                                    UUID loanApplicationId, User uploadedBy) throws IOException {
        
        if (files.size() != documentTypes.size()) {
            throw new LoanApiException("Number of files must match number of document types");
        }
        
        List<LoanDocument> uploadedDocuments = new ArrayList<>();
        StringBuilder errorMessages = new StringBuilder();
        
        for (int i = 0; i < files.size(); i++) {
            try {
                LoanDocument document = uploadDocument(files.get(i), documentTypes.get(i), 
                                                     loanApplicationId, uploadedBy);
                uploadedDocuments.add(document);
            } catch (LoanApiException e) {
                // For business logic errors (like verified document protection), throw immediately
                log.error("Failed to upload document {}: {}", i, e.getMessage());
                throw e; // Re-throw to provide proper error response
            } catch (Exception e) {
                log.error("Failed to upload document {}: {}", i, e.getMessage());
                if (errorMessages.length() > 0) {
                    errorMessages.append("; ");
                }
                errorMessages.append(String.format("Document %d (%s): %s", 
                    i + 1, documentTypes.get(i), e.getMessage()));
            }
        }
        
        // If there were any technical errors (not business logic errors), throw with details
        if (errorMessages.length() > 0 && uploadedDocuments.isEmpty()) {
            throw new IOException("Failed to upload documents: " + errorMessages.toString());
        }
        
        return uploadedDocuments;
    }

    @Override
    public boolean deleteDocument(Long documentId, User user) throws IOException {
        log.info("Deleting document: {}", documentId);
        
        LoanDocument document = documentRepository.findById(documentId)
            .orElseThrow(() -> new LoanApiException("Document not found"));
        
        try {
            // Delete from Supabase Storage if publicId exists
            if (document.getPublicId() != null && !document.getPublicId().isEmpty()) {
                String deleteUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + document.getPublicId();
                
                webClient.delete()
                    .uri(deleteUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
                    
                log.info("File deleted from Supabase: {}", document.getPublicId());
            }
            
            // Delete from database
            documentRepository.delete(document);
            
            // Audit log
            auditLogService.logAction(user, "DOCUMENT_DELETED", "LoanDocument", null,
                "Document deleted: " + document.getDocumentType() + " - " + document.getFileName());
            
            log.info("Document deleted successfully: {}", document.getFileName());
            return true;
            
        } catch (Exception e) {
            log.error("Failed to delete document: {}", e.getMessage());
            throw new IOException("Failed to delete document: " + e.getMessage());
        }
    }

    @Override
    public LoanDocument getDocumentById(Long documentId) {
        return documentRepository.findById(documentId)
            .orElseThrow(() -> new LoanApiException("Document not found with ID: " + documentId));
    }

    @Override
    public List<LoanDocument> getDocumentsByLoanApplication(UUID loanApplicationId) {
        return documentRepository.findByLoanApplicationIdOrderByUploadedAtDesc(loanApplicationId);
    }

    @Override
    public String getDocumentUrl(Long documentId) {
        LoanDocument document = getDocumentById(documentId);
        return document.getFilePath();
    }

    @Override
    public boolean validateDocument(MultipartFile file, DocumentType documentType) {
        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            log.warn("File size exceeds limit: {} bytes", file.getSize());
            return false;
        }
        
        // Check file type based on document type
        String contentType = file.getContentType();
        
        // Handle null content type
        if (contentType == null) {
            log.warn("File content type is null for file: {}", file.getOriginalFilename());
            return false;
        }
        
        switch (documentType) {
            case AADHAAR_CARD:
            case PAN_CARD:
            case PASSPORT:
            case DRIVING_LICENSE:
            case VOTER_ID:
                return ALLOWED_IMAGE_TYPES.contains(contentType) || 
                       contentType.equals("application/pdf");
                
            case SALARY_SLIP:
            case BANK_STATEMENT:
            case ITR_FORM:
            case FORM_16:
            case EMPLOYMENT_CERTIFICATE:
            case BUSINESS_REGISTRATION:
            case GST_CERTIFICATE:
            case FINANCIAL_STATEMENT:
                return ALLOWED_DOCUMENT_TYPES.contains(contentType);
                
            default:
                return ALLOWED_DOCUMENT_TYPES.contains(contentType);
        }
    }
    
    /**
     * Generate unique public ID for Supabase Storage
     */
    private String generatePublicId(DocumentType documentType, UUID userId) {
        return String.format("%s_%s_%d", 
            documentType.toString().toLowerCase(),
            userId.toString().substring(0, 8),
            System.currentTimeMillis()
        );
    }
    
    @Override
    public DocumentUploadResponse uploadDocumentWithResponse(MultipartFile file, DocumentType documentType, 
                                                           UUID loanApplicationId, User uploadedBy) throws IOException {
        
        // Upload the document first
        LoanDocument document = uploadDocument(file, documentType, loanApplicationId, uploadedBy);
        
        // Get current document count for this application
        List<LoanDocument> existingDocuments = documentRepository.findByLoanApplicationId(loanApplicationId);
        int totalUploaded = existingDocuments.size();
        
        // Define required document types
        List<DocumentType> requiredTypes = Arrays.asList(
            DocumentType.PAN_CARD,
            DocumentType.AADHAAR_CARD,
            DocumentType.SALARY_SLIP,
            DocumentType.BANK_STATEMENT,
            DocumentType.EMPLOYMENT_CERTIFICATE
        );
        int requiredCount = requiredTypes.size();
        
        // Check if all required documents are uploaded
        boolean canSubmit = existingDocuments.stream()
            .map(LoanDocument::getDocumentType)
            .collect(java.util.stream.Collectors.toSet())
            .containsAll(requiredTypes);
        
        // Build response
        DocumentUploadResponse.DocumentUploadResponseBuilder responseBuilder = DocumentUploadResponse.builder()
            .documentId(document.getId())
            .applicationId(loanApplicationId)
            .documentType(documentType.toString())
            .fileName(document.getFileName())
            .uploadedAt(document.getUploadedAt())
            .totalDocumentsUploaded(totalUploaded)
            .requiredDocumentsCount(requiredCount)
            .canSubmitApplication(canSubmit);
        
        if (canSubmit) {
            responseBuilder
                .message("✅ All required documents uploaded! Ready to submit application.")
                .nextStep("Review & Submit Application")
                .nextStepUrl("/applicant/application-summary?applicationId=" + loanApplicationId);
        } else {
            responseBuilder
                .message("✅ Document uploaded successfully!")
                .nextStep("Upload More Documents")
                .nextStepUrl("/applicant/document-upload?applicationId=" + loanApplicationId);
        }
        
        return responseBuilder.build();
    }
    
    /**
     * Validate if a document can be uploaded (prevent overwriting verified documents)
     */
    private void validateDocumentUpload(UUID loanApplicationId, DocumentType documentType, User uploadedBy) {
        // Find existing documents of this type for the application
        List<LoanDocument> existingDocs = documentRepository.findByLoanApplicationId(loanApplicationId)
            .stream()
            .filter(doc -> doc.getDocumentType() == documentType)
            .collect(Collectors.toList());
        
        // Check if any existing document is verified
        boolean hasVerifiedDocument = existingDocs.stream()
            .anyMatch(doc -> doc.getVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.VERIFIED);
        
        if (hasVerifiedDocument) {
            throw new LoanApiException(
                org.springframework.http.HttpStatus.CONFLICT,
                String.format(
                    "Cannot upload %s document. A verified document of this type already exists. " +
                    "Verified documents cannot be replaced. Please contact support if you need to update a verified document.",
                    documentType.toString().replace("_", " ")
                )
            );
        }
        
        // Additional validation: Check if user owns the application
        LoanApplication application = loanApplicationRepository.findById(loanApplicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        if (!application.getApplicant().getId().equals(uploadedBy.getId())) {
            throw new LoanApiException("You can only upload documents to your own applications");
        }
        
        log.info("Document upload validation passed for {} document type {} by user {}", 
            loanApplicationId, documentType, uploadedBy.getEmail());
    }
}
