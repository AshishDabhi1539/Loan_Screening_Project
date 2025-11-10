package com.tss.loan.entity.financial;

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
 * Professional Employment Details
 * For Doctors, Lawyers, CAs, Architects, Engineers, Consultants
 */
@Entity
@Table(name = "professional_employment_details", indexes = {
        @Index(name = "idx_prof_emp_profile", columnList = "financial_profile_id", unique = true),
        @Index(name = "idx_prof_emp_type", columnList = "professionType")
})
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ProfessionalEmploymentDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_profile_id", nullable = false, unique = true)
    private ApplicantFinancialProfile financialProfile;
    
    @Column(nullable = false, length = 50)
    private String professionType; // DOCTOR, LAWYER, CHARTERED_ACCOUNTANT, ARCHITECT, ENGINEER, CONSULTANT, OTHER
    
    @Column(nullable = false, length = 100)
    private String registrationNumber; // License/Registration number
    
    @Column(nullable = false, length = 200)
    private String registrationAuthority; // e.g., Medical Council of India, Bar Council
    
    @Column(nullable = false, length = 150)
    private String professionalQualification; // MBBS, LLB, CA, B.Arch, B.Tech, etc.
    
    @Column(length = 200)
    private String university; // Educational institution
    
    @Column
    private Integer yearOfQualification; // Year of obtaining degree
    
    @Column(length = 200)
    private String practiceArea; // Specialization (e.g., Cardiology, Corporate Law)
    
    @Column(length = 150)
    private String clinicOrFirmName; // Practice/Clinic/Firm name (if applicable)
    
    @Column(length = 200)
    private String clinicOrFirmAddress; // Practice address
    
    @Column(columnDefinition = "TEXT")
    private String additionalCertifications; // Additional qualifications
    
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
}
