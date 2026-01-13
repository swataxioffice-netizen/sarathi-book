-- Create a unique index on the 'gstin' field within the 'settings' JSONB column
-- This ensures that no two users can register with the same GSTIN at the database level.
-- We use a partial index to allow multiple rows with empty or null GSTINs (users who haven't set it yet).

CREATE UNIQUE INDEX idx_profiles_settings_gstin 
ON profiles ((settings->>'gstin')) 
WHERE (settings->>'gstin' IS NOT NULL AND settings->>'gstin' <> '');
