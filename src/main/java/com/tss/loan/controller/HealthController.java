package com.tss.loan.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.loan.dto.response.ApiResponse;

@RestController
@RequestMapping("/api/public")
public class HealthController {
    
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("timestamp", LocalDateTime.now());
        healthData.put("service", "Loan Screening App");
        healthData.put("version", "1.0.0");
        
        return ResponseEntity.ok(ApiResponse.success("Service is healthy", healthData));
    }
    
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> info() {
        Map<String, Object> info = new HashMap<>();
        info.put("application", "Loan Screening & Fraud Detection System");
        info.put("version", "1.0.0");
        info.put("description", "Comprehensive loan applicant screening system with fraud detection");
        info.put("features", new String[]{
            "User Registration & Authentication",
            "Email OTP Verification", 
            "Role-based Access Control",
            "JWT Security",
            "Audit Logging",
            "Email Notifications"
        });
        
        return ResponseEntity.ok(ApiResponse.success("Application information", info));
    }
}
