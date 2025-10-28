package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileStatusResponse {
    private boolean hasPersonalDetails;
    private String message;
    private String nextAction;
    private String nextActionUrl;
}
