-- Create compliance_investigations table to store investigation results
CREATE TABLE IF NOT EXISTS compliance_investigations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loan_application_id BINARY(16) NOT NULL,
    investigated_by_id BINARY(16) NOT NULL,
    investigation_id VARCHAR(100),
    investigation_data LONGTEXT NOT NULL,
    investigation_date DATETIME(6),
    investigated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    
    CONSTRAINT fk_compliance_inv_application 
        FOREIGN KEY (loan_application_id) 
        REFERENCES loan_applications(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_compliance_inv_officer 
        FOREIGN KEY (investigated_by_id) 
        REFERENCES users(id) 
        ON DELETE RESTRICT,
    
    INDEX idx_compliance_inv_application (loan_application_id),
    INDEX idx_compliance_inv_officer (investigated_by_id),
    INDEX idx_compliance_inv_date (investigated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

