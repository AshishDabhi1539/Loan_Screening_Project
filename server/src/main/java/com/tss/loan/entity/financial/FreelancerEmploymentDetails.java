package com.tss.loan.entity.financial;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Freelancer Employment Details
 * For independent contractors and consultants
 */
@Entity
@Table(name = "freelancer_employment_details", indexes = {
        @Index(name = "idx_free_emp_profile", columnList = "financial_profile_id", unique = true),
        @Index(name = "idx_free_emp_type", columnList = "freelanceType")
})
@NoArgsConstructor
@AllArgsConstructor
@Data
public class FreelancerEmploymentDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_profile_id", nullable = false, unique = true)
    private ApplicantFinancialProfile financialProfile;
    
    @Column(nullable = false, length = 150)
    private String freelanceType; // Web Development, Content Writing, Graphic Design, etc.
    
    @Column(nullable = false)
    private LocalDate freelanceSince; // Start date of freelancing
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String primaryClients; // Top 3-5 client names
    
    @Column(precision = 12, scale = 2)
    private BigDecimal averageMonthlyIncome; // Last 6 months average income
    
    @Column(length = 255)
    private String portfolioUrl; // Website, GitHub, Behance, LinkedIn
    
    @Column(length = 200)
    private String freelancePlatform; // Upwork, Fiverr, Freelancer.com (if applicable)
    
    @Column(columnDefinition = "TEXT")
    private String skillSet; // Key professional skills
    
    @Column(columnDefinition = "TEXT")
    private String projectTypes; // Types of projects handled
    
    @Column
    private Integer activeClientsCount; // Number of active clients
    
    @Column(columnDefinition = "TEXT")
    private String paymentMethods; // How clients pay (bank transfer, PayPal, etc.)
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Calculate years of freelancing experience
     */
    public Integer getFreelanceExperienceInYears() {
        if (freelanceSince == null) return 0;
        return (int) java.time.temporal.ChronoUnit.YEARS.between(freelanceSince, LocalDate.now());
    }
}
