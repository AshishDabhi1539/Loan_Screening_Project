package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Compliance Officer information in review summary
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceOfficerInfoDTO {
    private String name;
    private String email;
    private String photo;
    private String role;
}
