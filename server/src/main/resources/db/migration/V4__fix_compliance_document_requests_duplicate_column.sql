-- =====================================================
-- Fix Duplicate Column in compliance_document_requests
-- Version: 4.0
-- Purpose: Migrate data from duplicate column and remove it
-- 
-- Why duplicate exists:
-- When spring.jpa.hibernate.ddl-auto=update was used, Hibernate created
-- a column using the Java field name (requiredDocumentTypes) before the
-- explicit @Column(name = "required_document_types") mapping was added.
-- 
-- This migration will:
-- 1. Copy data from requiredDocumentTypes (camelCase) to required_document_types (snake_case)
-- 2. Drop the duplicate requiredDocumentTypes column
-- 
-- Note: If the duplicate column doesn't exist, this migration will fail on the
-- UPDATE statement. You can manually comment out the UPDATE if needed.
-- =====================================================

-- Step 1: Migrate data from duplicate column to correct column
-- Copy data from requiredDocumentTypes to required_document_types where the correct column is empty
-- This will fail if the column doesn't exist - that's okay, it means the issue is already fixed
UPDATE `compliance_document_requests` 
SET `required_document_types` = `requiredDocumentTypes`
WHERE (`required_document_types` IS NULL OR `required_document_types` = '')
  AND `requiredDocumentTypes` IS NOT NULL
  AND `requiredDocumentTypes` != '';

-- Step 2: Drop the duplicate column
-- This will fail if the column doesn't exist - that's okay, it means the issue is already fixed
ALTER TABLE `compliance_document_requests` DROP COLUMN `requiredDocumentTypes`;

