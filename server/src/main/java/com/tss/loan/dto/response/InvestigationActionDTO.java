package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for investigation action timeline entry
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestigationActionDTO {
    private String action;
    private LocalDateTime timestamp;
    private String description;
    private String performedBy;
}
