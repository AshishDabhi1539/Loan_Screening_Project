package com.tss.loan.controller.applicant;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.tss.loan.entity.loan.LoanDocument;
import com.tss.loan.entity.enums.DocumentType;
import com.tss.loan.entity.user.User;
import com.tss.loan.dto.response.LoanDocumentResponse;
import com.tss.loan.mapper.LoanDocumentMapper;
import com.tss.loan.service.DocumentUploadService;
import com.tss.loan.service.UserService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/documents")
@PreAuthorize("hasRole('APPLICANT')")
@Slf4j
public class DocumentController {
    
    @Autowired
    private DocumentUploadService documentUploadService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private LoanDocumentMapper loanDocumentMapper;
    
    /**
     * Upload multiple documents
     */
    @PostMapping("/upload-multiple")
    public ResponseEntity<List<LoanDocumentResponse>> uploadMultipleDocuments(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("documentTypes") List<DocumentType> documentTypes,
            @RequestParam("loanApplicationId") UUID loanApplicationId,
            Authentication authentication) throws IOException {
        
        log.info("Uploading {} documents for application: {}", files.size(), loanApplicationId);
        
        User user = getCurrentUser(authentication);
        List<LoanDocument> documents = documentUploadService.uploadMultipleDocuments(
            files, documentTypes, loanApplicationId, user);
        List<LoanDocumentResponse> documentResponses = loanDocumentMapper.toResponseList(documents);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(documentResponses);
    }
    
    /**
     * Get document by ID
     */
    @GetMapping("/{documentId}")
    public ResponseEntity<LoanDocumentResponse> getDocument(@PathVariable UUID documentId) {
        log.info("Fetching document: {}", documentId);
        
        LoanDocument document = documentUploadService.getDocumentById(documentId);
        LoanDocumentResponse documentResponse = loanDocumentMapper.toResponse(document);
        return ResponseEntity.ok(documentResponse);
    }
    
    /**
     * Get document URL for viewing/downloading
     */
    @GetMapping("/{documentId}/url")
    public ResponseEntity<String> getDocumentUrl(@PathVariable UUID documentId) {
        log.info("Fetching URL for document: {}", documentId);
        
        String url = documentUploadService.getDocumentUrl(documentId);
        return ResponseEntity.ok(url);
    }
    
    /**
     * Delete document
     */
    @DeleteMapping("/{documentId}")
    public ResponseEntity<String> deleteDocument(
            @PathVariable UUID documentId,
            Authentication authentication) throws IOException {
        
        log.info("Deleting document: {}", documentId);
        
        User user = getCurrentUser(authentication);
        boolean deleted = documentUploadService.deleteDocument(documentId, user);
        
        if (deleted) {
            return ResponseEntity.ok("Document deleted successfully");
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to delete document");
        }
    }
    
    /**
     * Get all supported document types
     */
    @GetMapping("/types")
    public ResponseEntity<DocumentType[]> getSupportedDocumentTypes() {
        return ResponseEntity.ok(DocumentType.values());
    }
    
    private User getCurrentUser(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return userService.findByEmail(userDetails.getUsername());
    }
}
