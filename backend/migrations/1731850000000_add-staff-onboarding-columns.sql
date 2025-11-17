-- Migration: Add staff onboarding columns to user_verification table
-- Date: 2025-11-17

-- Add user_id column (nullable for backward compatibility)
ALTER TABLE user_verification 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Add verification_code column (rename from 'code' for clarity)
ALTER TABLE user_verification 
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10);

-- Add verified_at column
ALTER TABLE user_verification 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Add reset_token column for password setup
ALTER TABLE user_verification 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);

-- Add reset_token_expires_at column
ALTER TABLE user_verification 
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;

-- Add verification_type column (rename from 'type' for clarity)
ALTER TABLE user_verification 
ADD COLUMN IF NOT EXISTS verification_type VARCHAR(50);

-- Add unique constraint on user_id (one verification record per user)
ALTER TABLE user_verification 
ADD CONSTRAINT user_verification_user_id_unique UNIQUE (user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS user_verification_user_id_idx ON user_verification(user_id);

-- Create index on reset_token for faster lookups
CREATE INDEX IF NOT EXISTS user_verification_reset_token_idx ON user_verification(reset_token);

-- Copy data from old columns to new columns (if they exist)
UPDATE user_verification 
SET verification_code = code 
WHERE verification_code IS NULL AND code IS NOT NULL;

UPDATE user_verification 
SET verification_type = type 
WHERE verification_type IS NULL AND type IS NOT NULL;

-- Add comment
COMMENT ON TABLE user_verification IS 'Stores email verification codes, OTPs, and password reset tokens for user onboarding and password recovery';
