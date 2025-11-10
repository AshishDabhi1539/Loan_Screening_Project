package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FOIRCalculationResponse {
    private double monthlyIncome;
    private double existingObligations;
    private double newEmi;
    private double totalObligations;
    private double disposableIncome;
    private double foirPercentage;
    private boolean acceptable;
    private String status; // "EXCELLENT", "GOOD", "ACCEPTABLE", "HIGH_RISK"
    private String message;
    
    public static FOIRCalculationResponse calculate(double monthlyIncome, double existingObligations, double newEmi) {
        double totalObligations = existingObligations + newEmi;
        double disposableIncome = monthlyIncome - totalObligations;
        double foirPercentage = monthlyIncome > 0 ? (totalObligations / monthlyIncome) * 100 : 100;
        boolean acceptable = foirPercentage <= 70;
        
        String status;
        String message;
        
        if (foirPercentage <= 40) {
            status = "EXCELLENT";
            message = "Excellent financial health. Strong repayment capacity.";
        } else if (foirPercentage <= 55) {
            status = "GOOD";
            message = "Good financial health. Comfortable repayment capacity.";
        } else if (foirPercentage <= 70) {
            status = "ACCEPTABLE";
            message = "Acceptable FOIR. You meet the eligibility criteria.";
        } else {
            status = "HIGH_RISK";
            message = "FOIR exceeds recommended limit. Consider reducing loan amount or existing obligations.";
        }
        
        return FOIRCalculationResponse.builder()
                .monthlyIncome(monthlyIncome)
                .existingObligations(existingObligations)
                .newEmi(newEmi)
                .totalObligations(totalObligations)
                .disposableIncome(disposableIncome)
                .foirPercentage(Math.round(foirPercentage * 100.0) / 100.0)
                .acceptable(acceptable)
                .status(status)
                .message(message)
                .build();
    }
}
