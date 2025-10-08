package com.tss.loan.entity.integration;

import java.time.LocalDateTime;

import com.tss.loan.entity.enums.ApiEndpointType;
import com.tss.loan.entity.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "api_configurations", indexes = {
        @Index(name = "idx_api_config_type", columnList = "endpointType"),
        @Index(name = "idx_api_config_name", columnList = "configName"),
        @Index(name = "idx_api_config_active", columnList = "isActive")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ApiConfiguration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String configName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApiEndpointType endpointType;
    
    @Column(nullable = false, length = 500)
    private String baseUrl;
    
    @Column(nullable = false, length = 200)
    private String endpoint;
    
    @Column(nullable = false, length = 10)
    private String httpMethod; // GET, POST, PUT, DELETE
    
    @Column(columnDefinition = "TEXT")
    private String headers; // JSON format
    
    @Column(columnDefinition = "TEXT")
    private String authConfig; // JSON format for auth details
    
    @Column(nullable = false)
    private Integer timeoutMs = 30000;
    
    @Column(nullable = false)
    private Integer maxRetries = 3;
    
    @Column(nullable = false)
    private Integer retryDelayMs = 1000;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(columnDefinition = "TEXT")
    private String requestTemplate; // JSON template for request body
    
    @Column(columnDefinition = "TEXT")
    private String responseMapping; // JSON mapping configuration
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_id")
    private User updatedBy;
    
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
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public String getFullUrl() {
        return baseUrl + endpoint;
    }
}
