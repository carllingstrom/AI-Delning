-- Add a JSONB column to store extended questionnaire answers
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS details JSONB; 