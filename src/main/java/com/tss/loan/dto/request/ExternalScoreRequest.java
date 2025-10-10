package com.tss.loan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * External Score Request DTO
 * Used for requesting credit and risk scores from external database
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExternalScoreRequest {
    
    /**
     * Aadhaar number (12 digits)
     */
    @NotBlank(message = "Aadhaar number is required")
    @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar number must be exactly 12 digits")
    @Size(min = 12, max = 12, message = "Aadhaar number must be exactly 12 digits")
    private String aadhaarNumber;
    
    /**
     * PAN number (10 characters - 5 letters, 4 digits, 1 letter)
     */
    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "PAN number must be in format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)")
    @Size(min = 10, max = 10, message = "PAN number must be exactly 10 characters")
    private String panNumber;
}
