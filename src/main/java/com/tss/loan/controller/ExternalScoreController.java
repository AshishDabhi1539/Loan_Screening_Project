package com.tss.loan.controller;

import com.tss.loan.dto.request.ExternalScoreRequest;
import com.tss.loan.dto.response.ExternalScoreResponse;
import com.tss.loan.service.ExternalScoreService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * External Score Controller
 * Handles credit score and risk assessment calculations using external data
 */
@RestController
@RequestMapping("/api/external-scores")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "External Score Management", description = "APIs for external credit score and risk assessment")
public class ExternalScoreController {

    private final ExternalScoreService externalScoreService;

    /**
     * Calculate credit score and risk assessment using external data
     */
    @PostMapping("/calculate")
    @Operation(
        summary = "Calculate External Credit Score and Risk Assessment",
        description = "Calculates credit score and risk assessment using external banking, loan, and fraud data with identity validation"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Score calculation completed successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
        @ApiResponse(responseCode = "403", description = "Access denied - insufficient permissions"),
        @ApiResponse(responseCode = "500", description = "Internal server error during calculation")
    })
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER', 'COMPLIANCE_OFFICER')")
    public ResponseEntity<ExternalScoreResponse> calculateExternalScores(
            @Parameter(description = "External score calculation request with Aadhaar and PAN", required = true)
            @Valid @RequestBody ExternalScoreRequest request) {
        
        log.info("Received external score calculation request for Aadhaar: {} and PAN: {}", 
                 request.getAadhaarNumber(), request.getPanNumber());
        
        try {
            ExternalScoreResponse response = externalScoreService.calculateScores(request);
            
            // Log different response scenarios
            if ("INVALID".equals(response.getRiskType())) {
                log.warn("Identity mismatch detected in score calculation for Aadhaar: {} and PAN: {}", 
                         request.getAadhaarNumber(), request.getPanNumber());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            } else if ("ERROR".equals(response.getRiskType())) {
                log.error("System error occurred during score calculation for Aadhaar: {} and PAN: {}", 
                          request.getAadhaarNumber(), request.getPanNumber());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            } else if ("UNKNOWN".equals(response.getRiskType())) {
                log.info("No external data found for Aadhaar: {} and PAN: {}", 
                         request.getAadhaarNumber(), request.getPanNumber());
                return ResponseEntity.ok(response);
            } else {
                log.info("External score calculation completed successfully. Credit Score: {}, Risk Score: {}, Numeric Risk: {}", 
                         response.getCreditScore(), response.getRiskType(), response.getRiskScoreNumeric());
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            log.error("Unexpected error during external score calculation for Aadhaar: {} and PAN: {}", 
                      request.getAadhaarNumber(), request.getPanNumber(), e);
            
            // Return error response
            ExternalScoreResponse errorResponse = ExternalScoreResponse.builder()
                    .creditScore(null)
                    .riskType("ERROR")
                    .riskScoreNumeric(100)
                    .redAlertFlag(true)
                    .riskFactors("Unexpected system error: " + e.getMessage())
                    .creditScoreReason("Unable to calculate due to system error")
                    .build();
                    
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get calculation summary for monitoring
     */
    @GetMapping("/summary/{aadhaar}/{pan}")
    @Operation(
        summary = "Get Score Calculation Summary",
        description = "Retrieves a quick summary of the latest score calculation for given identifiers"
    )
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER', 'COMPLIANCE_OFFICER')")
    public ResponseEntity<ExternalScoreResponse> getScoreSummary(
            @Parameter(description = "Aadhaar number", required = true)
            @PathVariable String aadhaar,
            @Parameter(description = "PAN number", required = true)
            @PathVariable String pan) {
        
        log.info("Received score summary request for Aadhaar: {} and PAN: {}", aadhaar, pan);
        
        ExternalScoreRequest request = new ExternalScoreRequest();
        request.setAadhaarNumber(aadhaar);
        request.setPanNumber(pan);
        
        ExternalScoreResponse response = externalScoreService.calculateScores(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Health check endpoint for external score service
     */
    @GetMapping("/health")
    @Operation(
        summary = "External Score Service Health Check",
        description = "Checks if the external score calculation service is operational"
    )
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("External Score Service is operational");
    }
}
