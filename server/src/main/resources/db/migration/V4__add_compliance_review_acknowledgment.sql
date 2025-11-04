-- Add compliance review acknowledgment fields to loan_applications table
-- These fields track when loan officer reviews compliance findings

ALTER TABLE loan_applications 
ADD COLUMN compliance_review_acknowledged_at DATETIME NULL COMMENT 'Timestamp when loan officer acknowledged compliance review',
ADD COLUMN compliance_review_acknowledged_by BINARY(16) NULL COMMENT 'User ID of loan officer who acknowledged',
ADD COLUMN compliance_review_loan_officer_notes TEXT NULL COMMENT 'Notes from loan officer after reviewing compliance findings';

-- Add foreign key constraint for acknowledged_by
ALTER TABLE loan_applications
ADD CONSTRAINT fk_compliance_review_acknowledged_by 
FOREIGN KEY (compliance_review_acknowledged_by) REFERENCES users(id);

-- Add index for faster queries
CREATE INDEX idx_compliance_review_acknowledged ON loan_applications(compliance_review_acknowledged_at);
