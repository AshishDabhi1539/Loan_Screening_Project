package com.tss.loan.controller.applicant;

import com.tss.loan.dto.response.FOIRCalculationResponse;
import com.tss.loan.dto.response.LoanEligibilityResponse;
import com.tss.loan.entity.enums.EmploymentType;
import com.tss.loan.entity.enums.LoanType;
import com.tss.loan.service.LoanEligibilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applicant/eligibility")
@RequiredArgsConstructor
@Slf4j
public class LoanEligibilityController {
    
    private final LoanEligibilityService eligibilityService;
    
    /**
     * Get eligible employment types for a loan type
     */
    @GetMapping("/employment-types")
    public ResponseEntity<LoanEligibilityResponse> getEligibleEmploymentTypes(
            @RequestParam LoanType loanType) {
        
        log.info("Getting eligible employment types for loan type: {}", loanType);
        
        List<EmploymentType> eligibleTypes = eligibilityService.getEligibleEmploymentTypes(loanType);
        double minIncome = eligibilityService.getMinimumIncomeRequirement(loanType);
        
        // Build response with eligibility info for ALL employment types
        List<LoanEligibilityResponse.EmploymentTypeEligibility> employmentEligibility = new ArrayList<>();
        
        for (EmploymentType empType : EmploymentType.values()) {
            boolean eligible = eligibleTypes.contains(empType);
            String reason = eligibilityService.getEligibilityReason(loanType, empType);
            Integer minDuration = eligibilityService.getMinimumEmploymentDuration(loanType, empType);
            
            employmentEligibility.add(LoanEligibilityResponse.EmploymentTypeEligibility.builder()
                    .employmentType(empType)
                    .eligible(eligible)
                    .reason(reason)
                    .minimumDurationMonths(minDuration > 0 ? minDuration : null)
                    .build());
        }
        
        LoanEligibilityResponse response = LoanEligibilityResponse.builder()
                .loanType(loanType)
                .employmentTypes(employmentEligibility)
                .minimumIncome(minIncome)
                .maxFOIR(70.0)
                .additionalCriteria(eligibilityService.getLoanEligibilityCriteria(loanType))
                .build();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Calculate FOIR
     */
    @PostMapping("/foir/calculate")
    public ResponseEntity<FOIRCalculationResponse> calculateFOIR(
            @RequestParam double monthlyIncome,
            @RequestParam(defaultValue = "0") double existingObligations,
            @RequestParam double newEmi) {
        
        log.info("Calculating FOIR - Income: {}, Existing: {}, New EMI: {}", 
                monthlyIncome, existingObligations, newEmi);
        
        FOIRCalculationResponse response = FOIRCalculationResponse.calculate(
                monthlyIncome, existingObligations, newEmi);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Check employment eligibility for a specific loan type
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkEligibility(
            @RequestParam LoanType loanType,
            @RequestParam EmploymentType employmentType) {
        
        log.info("Checking eligibility for loan: {}, employment: {}", loanType, employmentType);
        
        boolean eligible = eligibilityService.isEmploymentTypeEligible(loanType, employmentType);
        String reason = eligibilityService.getEligibilityReason(loanType, employmentType);
        double minIncome = eligibilityService.getMinimumIncomeRequirement(loanType);
        int minDuration = eligibilityService.getMinimumEmploymentDuration(loanType, employmentType);
        
        return ResponseEntity.ok(Map.of(
                "eligible", eligible,
                "reason", reason,
                "minimumIncome", minIncome,
                "minimumEmploymentDuration", minDuration
        ));
    }
    
    /**
     * Get all eligibility criteria for a loan type
     */
    @GetMapping("/criteria")
    public ResponseEntity<Map<String, Object>> getLoanCriteria(@RequestParam LoanType loanType) {
        log.info("Getting eligibility criteria for loan type: {}", loanType);
        Map<String, Object> criteria = eligibilityService.getLoanEligibilityCriteria(loanType);
        return ResponseEntity.ok(criteria);
    }
}
