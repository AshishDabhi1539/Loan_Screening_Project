-- Add gender and date_of_birth columns to officer_personal_details
ALTER TABLE officer_personal_details
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE NULL;


