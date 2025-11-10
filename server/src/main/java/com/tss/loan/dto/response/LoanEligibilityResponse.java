package com.tss.loan.dto.response;

import com.tss.loan.entity.enums.EmploymentType;
import com.tss.loan.entity.enums.LoanType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanEligibilityResponse {
    private LoanType loanType;
    private List<EmploymentTypeEligibility> employmentTypes;
    private double minimumIncome;
    private double maxFOIR;
    private Map<String, Object> additionalCriteria;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmploymentTypeEligibility {
        private EmploymentType employmentType;
        private boolean eligible;
        private String reason;
        private Integer minimumDurationMonths;
    }
}
