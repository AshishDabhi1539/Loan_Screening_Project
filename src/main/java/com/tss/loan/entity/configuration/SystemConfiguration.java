package com.tss.loan.entity.configuration;

import java.time.LocalDateTime;

import com.tss.loan.entity.user.User;

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
@Table(name = "system_configuration", indexes = {
        @Index(name = "idx_config_key", columnList = "configKey", unique = true),
        @Index(name = "idx_config_category", columnList = "category"),
        @Index(name = "idx_config_active", columnList = "isActive")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class SystemConfiguration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String configKey;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String configValue;
    
    @Column(nullable = false, length = 50)
    private String category; // FRAUD_RULES, API_CONFIG, SCORING_WEIGHTS, THRESHOLDS
    
    @Column(nullable = false, length = 200)
    private String description;
    
    @Column(length = 50)
    private String dataType; // STRING, INTEGER, DECIMAL, BOOLEAN, JSON
    
    @Column(columnDefinition = "TEXT")
    private String validationRules;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false)
    private Boolean isEditable = true;
    
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
    
    public Integer getIntValue() {
        try {
            return Integer.parseInt(configValue);
        } catch (NumberFormatException e) {
            return null;
        }
    }
    
    public Double getDoubleValue() {
        try {
            return Double.parseDouble(configValue);
        } catch (NumberFormatException e) {
            return null;
        }
    }
    
    public Boolean getBooleanValue() {
        return Boolean.parseBoolean(configValue);
    }
}
