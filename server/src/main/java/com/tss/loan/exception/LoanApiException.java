package com.tss.loan.exception;

import org.springframework.http.HttpStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;

@AllArgsConstructor
@RequiredArgsConstructor
@Data
@EqualsAndHashCode(callSuper=false)
public class LoanApiException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private HttpStatus status;
    private String message;
    
    // Constructor with just message (defaults to BAD_REQUEST)
    public LoanApiException(String message) {
        this.message = message;
        this.status = HttpStatus.BAD_REQUEST;
    }
}
