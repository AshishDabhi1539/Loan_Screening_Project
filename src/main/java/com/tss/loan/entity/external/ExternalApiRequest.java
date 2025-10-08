package com.tss.loan.entity.external;

import java.time.LocalDateTime;

import com.tss.loan.entity.loan.LoanApplication;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "external_api_requests", indexes = {
        @Index(name = "idx_ext_api_application", columnList = "loan_application_id"),
        @Index(name = "idx_ext_api_endpoint", columnList = "endpoint"),
        @Index(name = "idx_ext_api_status", columnList = "status"),
        @Index(name = "idx_ext_api_requested", columnList = "requestedAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ExternalApiRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;
    
    @Column(nullable = false, length = 200)
    private String endpoint;
    
    @Column(nullable = false, length = 10)
    private String method; // GET, POST, PUT, DELETE
    
    @Column(columnDefinition = "TEXT")
    private String requestPayload;
    
    @Column(columnDefinition = "TEXT")
    private String responsePayload;
    
    @Column(nullable = false, length = 50)
    private String status; // PENDING, SUCCESS, FAILED, TIMEOUT, RETRY
    
    private Integer httpStatusCode;
    
    @Column(columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(nullable = false)
    private Integer retryCount = 0;
    
    @Column(nullable = false)
    private Integer maxRetries = 3;
    
    @Column(nullable = false)
    private LocalDateTime requestedAt;
    
    private LocalDateTime completedAt;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Version
    private Long version;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public boolean canRetry() {
        return retryCount < maxRetries && "FAILED".equals(status);
    }
    
    public void incrementRetry() {
        this.retryCount++;
    }
}
