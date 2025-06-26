-- Create the project counts table
CREATE TABLE IF NOT EXISTS municipality_project_counts (
    name TEXT PRIMARY KEY REFERENCES municipalities(name),
    project_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create a function to create the table (used by the seeding script)
CREATE OR REPLACE FUNCTION create_project_counts_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS municipality_project_counts (
        name TEXT PRIMARY KEY REFERENCES municipalities(name),
        project_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
END;
$$; 