package com.tss.loan.entity.officer;

import java.time.LocalDate;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing officer personal details for proper name display and basic information
 * Temporary minimal implementation for officer name resolution
 */
@Entity
@Table(name = "officer_personal_details", indexes = {
    @Index(name = "idx_officer_user_id", columnList = "user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfficerPersonalDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * One-to-one relationship with User entity
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    /**
     * Officer's first name - required for display
     */
    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name cannot exceed 50 characters")
    @Column(nullable = false, length = 50)
    private String firstName;
    
    /**
     * Officer's last name - required for display
     */
    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    @Column(nullable = false, length = 50)
    private String lastName;
    
    /**
     * Officer's middle name - optional
     */
    @Size(max = 50, message = "Middle name cannot exceed 50 characters")
    @Column(length = 50)
    private String middleName;
    
    /**
     * Officer's employee ID - for internal reference
     */
    @Size(max = 20, message = "Employee ID cannot exceed 20 characters")
    @Column(length = 20, unique = true)
    private String employeeId;
    
    /**
     * Officer's department/division
     */
    @Size(max = 100, message = "Department cannot exceed 100 characters")
    @Column(length = 100)
    private String department;
    
    /**
     * Officer's designation/title
     */
    @Size(max = 100, message = "Designation cannot exceed 100 characters")
    @Column(length = 100)
    private String designation;
    
    /**
     * Officer's contact phone number
     */
    @Size(max = 15, message = "Phone number cannot exceed 15 characters")
    @Column(length = 15)
    private String phoneNumber;
    
    /**
     * Officer's work location/branch
     */
    @Size(max = 200, message = "Work location cannot exceed 200 characters")
    @Column(length = 200)
    private String workLocation;
    
    /**
     * Officer's gender (stored as string for simplicity)
     */
    @Size(max = 20)
    @Column(length = 20)
    private String gender;
    
    /**
     * Officer's date of birth
     */
    private LocalDate dateOfBirth;
    
    /**
     * Officer's profile photo URL (stored in Supabase Storage)
     */
    @Size(max = 500, message = "Profile photo URL cannot exceed 500 characters")
    @Column(length = 500)
    private String profilePhotoUrl;
    
    /**
     * Timestamp when record was created
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when record was last updated
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * Get full name of the officer
     * @return formatted full name
     */
    public String getFullName() {
        StringBuilder name = new StringBuilder();
        
        if (firstName != null && !firstName.trim().isEmpty()) {
            name.append(firstName.trim());
        }
        
        if (middleName != null && !middleName.trim().isEmpty()) {
            if (name.length() > 0) name.append(" ");
            name.append(middleName.trim());
        }
        
        if (lastName != null && !lastName.trim().isEmpty()) {
            if (name.length() > 0) name.append(" ");
            name.append(lastName.trim());
        }
        
        return name.length() > 0 ? name.toString() : "Unknown Officer";
    }
    
    /**
     * Get display name with designation
     * @return formatted display name with title
     */
    public String getDisplayNameWithTitle() {
        String fullName = getFullName();
        if (designation != null && !designation.trim().isEmpty()) {
            return designation.trim() + " " + fullName;
        }
        return fullName;
    }
    
    /**
     * Get short display name (first name + last name initial)
     * @return short formatted name
     */
    public String getShortDisplayName() {
        StringBuilder shortName = new StringBuilder();
        
        if (firstName != null && !firstName.trim().isEmpty()) {
            shortName.append(firstName.trim());
        }
        
        if (lastName != null && !lastName.trim().isEmpty()) {
            if (shortName.length() > 0) shortName.append(" ");
            shortName.append(lastName.trim().charAt(0)).append(".");
        }
        
        return shortName.length() > 0 ? shortName.toString() : "Officer";
    }
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
