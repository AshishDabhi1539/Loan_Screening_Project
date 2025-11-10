package com.tss.loan.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for Freelancer Employment Details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FreelancerEmploymentDetailsRequest {
    
    @NotBlank(message = "Freelance type is required")
    @Size(max = 150, message = "Freelance type must not exceed 150 characters")
    private String freelanceType;
    
    @NotNull(message = "Freelancing start date is required")
    private LocalDate freelanceSince;
    
    @NotBlank(message = "Primary clients are required")
    private String primaryClients;
    
    private BigDecimal averageMonthlyIncome;
    
    @Size(max = 255, message = "Portfolio URL must not exceed 255 characters")
    private String portfolioUrl;
    
    @Size(max = 200, message = "Freelance platform must not exceed 200 characters")
    private String freelancePlatform;
    
    private String skillSet;
    
    private String projectTypes;
    
    private Integer activeClientsCount;
    
    private String paymentMethods;
}
