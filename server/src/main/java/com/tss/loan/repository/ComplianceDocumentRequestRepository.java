package com.tss.loan.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.compliance.ComplianceDocumentRequest;

@Repository
public interface ComplianceDocumentRequestRepository extends JpaRepository<ComplianceDocumentRequest, Long> {
    
    /**
     * Find all requests for a specific application
     */
    List<ComplianceDocumentRequest> findByLoanApplicationIdOrderByRequestedAtDesc(UUID applicationId);
    
    /**
     * Find pending requests for a specific application
     */
    @Query("SELECT cdr FROM ComplianceDocumentRequest cdr WHERE cdr.loanApplication.id = :applicationId AND cdr.status = 'PENDING' ORDER BY cdr.requestedAt DESC")
    List<ComplianceDocumentRequest> findPendingRequestsByApplicationId(@Param("applicationId") UUID applicationId);
    
    /**
     * Find the most recent pending request for an application (returns first from ordered list)
     */
    default Optional<ComplianceDocumentRequest> findMostRecentPendingRequest(UUID applicationId) {
        List<ComplianceDocumentRequest> requests = findPendingRequestsByApplicationId(applicationId);
        return requests.isEmpty() ? Optional.empty() : Optional.of(requests.get(0));
    }
    
    /**
     * Find all requests by status
     */
    List<ComplianceDocumentRequest> findByStatusOrderByRequestedAtDesc(String status);
    
    /**
     * Find requests by compliance officer
     */
    List<ComplianceDocumentRequest> findByRequestedByIdOrderByRequestedAtDesc(UUID officerId);
    
    /**
     * Native query to explicitly fetch the required_document_types JSON column
     * This ensures the JSON column is properly loaded from the database
     * Uses COALESCE to check both column names (in case duplicate exists during migration)
     */
    @Query(value = "SELECT COALESCE(required_document_types, requiredDocumentTypes) FROM compliance_document_requests WHERE id = :requestId", nativeQuery = true)
    String getRequiredDocumentTypesById(@Param("requestId") Long requestId);
}

