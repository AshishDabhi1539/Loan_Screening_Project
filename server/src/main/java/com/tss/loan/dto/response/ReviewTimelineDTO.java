package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for compliance review timeline information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewTimelineDTO {
    private LocalDateTime flaggedDate;
    private LocalDateTime investigationStartDate;
    private LocalDateTime decisionDate;
    private Integer totalDurationDays;
    private Integer totalDurationHours;
}
