-- Add metadata column to user_verification table for storing staff creation data
-- This allows us to store pending staff information during OTP verification

ALTER TABLE user_verification 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add unique constraint for ON CONFLICT clause
ALTER TABLE user_verification 
ADD CONSTRAINT user_verification_email_type_unique UNIQUE (email, type);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_verification_email_type 
ON user_verification(email, type);

-- Comment
COMMENT ON COLUMN user_verification.metadata IS 'Stores additional data like pending staff information during verification';
