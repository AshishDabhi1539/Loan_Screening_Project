package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for document request information in compliance review
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRequestInfoDTO {
    private String documentType;
    private LocalDateTime requestedDate;
    private LocalDateTime receivedDate;
    private String status; // REQUESTED, RECEIVED, PENDING
    private String reason;
}
