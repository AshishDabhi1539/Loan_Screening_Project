package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Composite response for officer profile including account/officer details
 * and personal details in a single payload.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficerProfileResponse {
    private OfficerDetailsResponse details;      // User + officer details
    private OfficerPersonalDetailsResponse personal; // Personal details
}


