package com.tss.loan.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalDetailsCreateResponse {
    private String message;
    private boolean canApplyForLoan;
    private String nextAction;
    private String nextActionUrl;
    private LocalDateTime updatedAt;
}
