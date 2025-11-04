-- =====================================================
-- Compliance Document Requests - Database Migration
-- Version: 3.0
-- Purpose: Add table to store compliance officer document requests
-- =====================================================

CREATE TABLE `compliance_document_requests` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `loan_application_id` BINARY(16) NOT NULL,
    `requested_by_id` BINARY(16) NOT NULL,
    `required_document_types` JSON NOT NULL COMMENT 'Array of document type strings',
    `request_reason` TEXT NOT NULL,
    `additional_instructions` TEXT,
    `deadline_days` INT NOT NULL,
    `priority_level` VARCHAR(20),
    `is_mandatory` BOOLEAN NOT NULL DEFAULT TRUE,
    `compliance_category` VARCHAR(50),
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, RECEIVED, FULFILLED, EXPIRED',
    `requested_at` DATETIME(6) NOT NULL,
    `fulfilled_at` DATETIME(6),
    `updated_at` DATETIME(6) NOT NULL,
    `version` BIGINT DEFAULT NULL,
    
    PRIMARY KEY (`id`),
    
    -- Foreign key constraints
    CONSTRAINT `fk_compliance_req_application` 
        FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_compliance_req_officer` 
        FOREIGN KEY (`requested_by_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX `idx_compliance_req_application` (`loan_application_id`),
    INDEX `idx_compliance_req_status` (`status`),
    INDEX `idx_compliance_req_officer` (`requested_by_id`),
    INDEX `idx_compliance_req_created` (`requested_at`),
    INDEX `idx_compliance_req_composite` (`loan_application_id`, `status`)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Add comment to table
ALTER TABLE `compliance_document_requests` 
    COMMENT = 'Stores compliance officer document requests for applicants';

