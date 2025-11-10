-- Add profile_photo_url column to officer_personal_details
ALTER TABLE officer_personal_details
  ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500) NULL;

