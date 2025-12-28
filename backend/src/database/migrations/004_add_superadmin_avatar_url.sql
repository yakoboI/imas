-- Add avatar_url column to superadmins table
ALTER TABLE superadmins 
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

