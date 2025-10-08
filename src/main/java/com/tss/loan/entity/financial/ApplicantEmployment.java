package com.tss.loan.entity.financial;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.tss.loan.entity.enums.EmploymentType;
import com.tss.loan.entity.enums.VerificationStatus;
import com.tss.loan.entity.loan.LoanApplication;

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
@Table(name = "applicant_employment", indexes = {
        @Index(name = "idx_emp_application", columnList = "loan_application_id"),
        @Index(name = "idx_emp_type", columnList = "employmentType"),
        @Index(name = "idx_emp_status", columnList = "verificationStatus"),
        @Index(name = "idx_emp_created", columnList = "createdAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ApplicantEmployment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;
    
    @Column(nullable = false, length = 200)
    private String employerName;
    
    @Column(nullable = false, length = 100)
    private String designation;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmploymentType employmentType;
    
    @Column(nullable = false)
    private LocalDate startDate;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal monthlyIncome;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal annualIncome;
    
    @Column(length = 200)
    private String workAddress;
    
    @Column(length = 100)
    private String workCity;
    
    @Column(length = 100)
    private String workState;
    
    @Column(length = 15)
    private String workPhone;
    
    @Column(length = 150)
    private String workEmail;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;
    
    @Column(columnDefinition = "TEXT")
    private String verificationNotes;
    
    private LocalDateTime verifiedAt;
    
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
    
    public Integer getExperienceInMonths() {
        return (int) java.time.temporal.ChronoUnit.MONTHS.between(startDate, LocalDate.now());
    }
    
    public Integer getExperienceInYears() {
        return getExperienceInMonths() / 12;
    }
}
