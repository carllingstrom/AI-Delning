-- Add status column to projects (implementation | pilot | idea)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS status text DEFAULT 'implementation'; 