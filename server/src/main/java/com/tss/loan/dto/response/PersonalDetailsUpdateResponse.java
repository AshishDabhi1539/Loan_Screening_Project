package com.tss.loan.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalDetailsUpdateResponse {
    private UUID applicationId;
    private String message;
    private boolean isComplete;
    private String nextStep;
    private String nextStepUrl;
    private LocalDateTime updatedAt;
}
