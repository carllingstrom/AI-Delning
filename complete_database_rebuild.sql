-- =============================================================================
-- KOMMUNKARTAN MVP - COMPLETE DATABASE REBUILD
-- =============================================================================
-- This script wipes and rebuilds the entire database with an optimized structure
-- Run this directly in your Supabase SQL Editor

-- =====================================
-- 1. DROP EXISTING TABLES (Clean Slate)
-- =====================================

DROP TABLE IF EXISTS project_municipalities CASCADE;
DROP TABLE IF EXISTS project_areas CASCADE;
DROP TABLE IF EXISTS project_value_dimensions CASCADE;
DROP TABLE IF EXISTS municipality_project_counts CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS municipalities CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS value_dimensions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_project_counts_table() CASCADE;
DROP FUNCTION IF EXISTS update_municipality_project_counts() CASCADE;

-- =====================================
-- 2. CREATE LOOKUP TABLES (Normalized)
-- =====================================

-- Areas (normalized for consistent filtering and reporting)
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Value Dimensions (normalized for analytics)
CREATE TABLE value_dimensions (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Municipalities (enhanced structure)
CREATE TABLE municipalities (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    county TEXT,
    region TEXT,
    population INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- 3. MAIN PROJECTS TABLE
-- =====================================

CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core Overview Data (structured for querying/filtering)
    title TEXT NOT NULL,
    intro TEXT,
    problem TEXT,
    opportunity TEXT,
    responsible TEXT,
    phase TEXT NOT NULL DEFAULT 'idea' CHECK (phase IN ('idea', 'pilot', 'implemented')),
    
    -- Structured Data for Analytics
    areas TEXT[] DEFAULT '{}', -- For quick queries, also in junction table
    value_dimensions TEXT[] DEFAULT '{}', -- For quick queries, also in junction table
    
    -- JSON Storage for Detailed Form Data (flexible, less critical for queries)
    overview_details JSONB DEFAULT '{}', -- Extended overview info
    cost_data JSONB DEFAULT '{}', -- Cost entries, reflections, ROI calculations
    effects_data JSONB DEFAULT '{}', -- Effects measurements, qualitative/quantitative data
    technical_data JSONB DEFAULT '{}', -- Data sources, systems, AI methods, integrations
    leadership_data JSONB DEFAULT '{}', -- Organization, roles, change management
    legal_data JSONB DEFAULT '{}', -- Legal compliance, security, GDPR
    
    -- Metadata
    created_by UUID, -- For future user system
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search and Display
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('swedish', coalesce(title, '') || ' ' || coalesce(intro, '') || ' ' || coalesce(problem, '') || ' ' || coalesce(opportunity, ''))
    ) STORED
);

-- =====================================
-- 4. JUNCTION TABLES (Many-to-Many)
-- =====================================

-- Project-Municipality relationships (for map functionality)
CREATE TABLE project_municipalities (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    municipality_id INTEGER NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, municipality_id)
);

-- Project-Area relationships (for filtering and analytics)
CREATE TABLE project_areas (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, area_id)
);

-- Project-Value Dimension relationships (for analytics)
CREATE TABLE project_value_dimensions (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    value_dimension_id INTEGER NOT NULL REFERENCES value_dimensions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, value_dimension_id)
);

-- Municipality project counts (for map visualization)
CREATE TABLE municipality_project_counts (
    id SERIAL PRIMARY KEY,
    municipality_id INTEGER NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
    total_projects INTEGER DEFAULT 0,
    idea_projects INTEGER DEFAULT 0,
    pilot_projects INTEGER DEFAULT 0,
    implemented_projects INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(municipality_id)
);

-- =====================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================

-- Search indexes
CREATE INDEX idx_projects_search ON projects USING gin(search_vector);
CREATE INDEX idx_projects_phase ON projects(phase);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Junction table indexes
CREATE INDEX idx_project_municipalities_project ON project_municipalities(project_id);
CREATE INDEX idx_project_municipalities_municipality ON project_municipalities(municipality_id);
CREATE INDEX idx_project_areas_project ON project_areas(project_id);
CREATE INDEX idx_project_areas_area ON project_areas(area_id);
CREATE INDEX idx_project_value_dimensions_project ON project_value_dimensions(project_id);
CREATE INDEX idx_project_value_dimensions_dimension ON project_value_dimensions(value_dimension_id);

-- JSONB indexes for common queries
CREATE INDEX idx_projects_cost_data ON projects USING gin(cost_data);
CREATE INDEX idx_projects_effects_data ON projects USING gin(effects_data);
CREATE INDEX idx_projects_technical_data ON projects USING gin(technical_data);

-- =====================================
-- 6. POPULATE LOOKUP TABLES
-- =====================================

-- Insert Areas
INSERT INTO areas (name, description) VALUES
('Intern administration', 'Interna administrativa processer'),
('Ledning och styrning', 'Ledningsfunktioner och organisationsstyrning'),
('Medborgarservice & kommunikation', 'Medborgarriktade tjänster och kommunikation'),
('Utbildning och skola', 'Utbildningsverksamhet och skolfrågor'),
('Socialtjänst', 'Sociala tjänster och stöd'),
('Äldre- & funktionsstöd', 'Vård och stöd för äldre och funktionshindrade'),
('Primärvård & e-hälsa', 'Hälso- och sjukvård, digitala hälsolösningar'),
('Kultur & fritid', 'Kultur, fritid och rekreation'),
('Miljö & klimat', 'Miljöfrågor och klimatarbete'),
('Transport & infrastruktur', 'Transport och infrastrukturutveckling'),
('Samhällsbyggnad & stadsplanering', 'Fysisk planering och samhällsutveckling'),
('Säkerhet & krisberedskap', 'Säkerhet och krisberedskap'),
('Tvärfunktionellt', 'Områdesövergripande projekt');

-- Insert Value Dimensions
INSERT INTO value_dimensions (name, description) VALUES
('Tidsbesparing', 'Projekt som sparar tid i processer'),
('Kostnadsbesparing', 'Projekt som minskar kostnader'),
('Kvalitet / noggrannhet', 'Förbättring av kvalitet och noggrannhet'),
('Innovation (nya tjänster)', 'Utveckling av nya tjänster och innovationer'),
('Medborgarnytta, upplevelse & service', 'Förbättrad medborgarservice och upplevelse'),
('Kompetens & lärande', 'Kompetensutveckling och lärande'),
('Riskreduktion & säkerhet', 'Minskning av risker och förbättrad säkerhet'),
('Ökade intäkter', 'Projekt som genererar ökade intäkter'),
('Etik, hållbarhet & ansvarsfull AI', 'Etiska och hållbara AI-lösningar'),
('Annat', 'Andra värdeskapande dimensioner');

-- =====================================
-- 7. FUNCTIONS AND TRIGGERS
-- =====================================

-- Function to update municipality project counts
CREATE OR REPLACE FUNCTION update_municipality_project_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Handle INSERT or UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update counts for all affected municipalities
        INSERT INTO municipality_project_counts (municipality_id, total_projects, idea_projects, pilot_projects, implemented_projects)
        SELECT 
            pm.municipality_id,
            COUNT(*) as total_projects,
            COUNT(*) FILTER (WHERE p.phase = 'idea') as idea_projects,
            COUNT(*) FILTER (WHERE p.phase = 'pilot') as pilot_projects,
            COUNT(*) FILTER (WHERE p.phase = 'implemented') as implemented_projects
        FROM project_municipalities pm
        JOIN projects p ON pm.project_id = p.id
        WHERE pm.municipality_id IN (
            SELECT municipality_id FROM project_municipalities WHERE project_id = NEW.project_id
        )
        GROUP BY pm.municipality_id
        ON CONFLICT (municipality_id) 
        DO UPDATE SET
            total_projects = EXCLUDED.total_projects,
            idea_projects = EXCLUDED.idea_projects,
            pilot_projects = EXCLUDED.pilot_projects,
            implemented_projects = EXCLUDED.implemented_projects,
            updated_at = NOW();
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        -- Update counts for affected municipality
        INSERT INTO municipality_project_counts (municipality_id, total_projects, idea_projects, pilot_projects, implemented_projects)
        SELECT 
            pm.municipality_id,
            COUNT(*) as total_projects,
            COUNT(*) FILTER (WHERE p.phase = 'idea') as idea_projects,
            COUNT(*) FILTER (WHERE p.phase = 'pilot') as pilot_projects,
            COUNT(*) FILTER (WHERE p.phase = 'implemented') as implemented_projects
        FROM project_municipalities pm
        JOIN projects p ON pm.project_id = p.id
        WHERE pm.municipality_id = OLD.municipality_id
        GROUP BY pm.municipality_id
        ON CONFLICT (municipality_id) 
        DO UPDATE SET
            total_projects = EXCLUDED.total_projects,
            idea_projects = EXCLUDED.idea_projects,
            pilot_projects = EXCLUDED.pilot_projects,
            implemented_projects = EXCLUDED.implemented_projects,
            updated_at = NOW();
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Trigger to automatically update project counts
CREATE TRIGGER trigger_update_municipality_project_counts
    AFTER INSERT OR UPDATE OR DELETE ON project_municipalities
    FOR EACH ROW
    EXECUTE FUNCTION update_municipality_project_counts();

-- Function to update project updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for projects updated_at
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for municipalities updated_at
CREATE TRIGGER trigger_municipalities_updated_at
    BEFORE UPDATE ON municipalities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================

-- Enable RLS (can be configured later for user access)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_value_dimensions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (configure policies later)
CREATE POLICY "Allow all for now" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON project_municipalities FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON project_areas FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON project_value_dimensions FOR ALL USING (true);

-- =====================================
-- 9. GRANT PERMISSIONS
-- =====================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================
-- SUMMARY
-- =====================================
-- This structure provides:
-- 1. ✅ Normalized lookup tables for areas and value dimensions
-- 2. ✅ Flexible JSON storage for detailed form responses
-- 3. ✅ Junction tables for many-to-many relationships
-- 4. ✅ Automatic project counting for map visualization
-- 5. ✅ Full-text search capabilities
-- 6. ✅ Optimized indexes for performance
-- 7. ✅ Extensible structure for future features
-- 8. ✅ Maintains existing API compatibility 