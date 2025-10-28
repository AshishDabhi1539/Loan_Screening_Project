package com.tss.loan.dto.response;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficerCreationResponse {
    private UUID officerId;
    private String email;
    private String role;
    private String message;
}
