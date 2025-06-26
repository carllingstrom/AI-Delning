-- ===============================
--  Update Municipality Schema
--  for Rich GeoJSON Data Import
--  Run in Supabase SQL editor
-- ===============================

-- Add columns for rich municipality data from GeoJSON
ALTER TABLE municipalities 
ADD COLUMN IF NOT EXISTS kom_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS lan_code TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS geometry JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_municipalities_kom_id ON municipalities(kom_id);
CREATE INDEX IF NOT EXISTS idx_municipalities_lan_code ON municipalities(lan_code);
CREATE INDEX IF NOT EXISTS idx_municipalities_coordinates ON municipalities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_municipalities_geometry ON municipalities USING GIN(geometry);

-- Create view with all display-ready municipality data
DROP VIEW IF EXISTS municipality_display_data CASCADE;

CREATE VIEW municipality_display_data AS
SELECT 
  id,
  name AS municipality_name,
  kom_id,
  lan_code,
  latitude,
  longitude,
  geometry,
  created_at,
  updated_at,
  -- Add county name mapping based on län codes
  CASE lan_code
    WHEN '01' THEN 'Stockholm'
    WHEN '03' THEN 'Uppsala'
    WHEN '04' THEN 'Södermanland'
    WHEN '05' THEN 'Östergötland'
    WHEN '06' THEN 'Jönköping'
    WHEN '07' THEN 'Kronoberg'
    WHEN '08' THEN 'Kalmar'
    WHEN '09' THEN 'Gotland'
    WHEN '10' THEN 'Blekinge'
    WHEN '12' THEN 'Skåne'
    WHEN '13' THEN 'Halland'
    WHEN '14' THEN 'Västra Götaland'
    WHEN '17' THEN 'Värmland'
    WHEN '18' THEN 'Örebro'
    WHEN '19' THEN 'Västmanland'
    WHEN '20' THEN 'Dalarna'
    WHEN '21' THEN 'Gävleborg'
    WHEN '22' THEN 'Västernorrland'
    WHEN '23' THEN 'Jämtland'
    WHEN '24' THEN 'Västerbotten'
    WHEN '25' THEN 'Norrbotten'
    ELSE 'Unknown'
  END AS county_name
FROM municipalities
ORDER BY name;

-- Create view for project count by municipality (for map visualization)
DROP VIEW IF EXISTS municipality_project_counts CASCADE;

CREATE VIEW municipality_project_counts AS
SELECT 
  m.id,
  m.name,
  m.kom_id,
  m.lan_code,
  m.latitude,
  m.longitude,
  m.geometry,
  COUNT(pm.project_id) as project_count,
  -- Include county name for filtering
  CASE m.lan_code
    WHEN '01' THEN 'Stockholm'
    WHEN '03' THEN 'Uppsala'
    WHEN '04' THEN 'Södermanland'
    WHEN '05' THEN 'Östergötland'
    WHEN '06' THEN 'Jönköping'
    WHEN '07' THEN 'Kronoberg'
    WHEN '08' THEN 'Kalmar'
    WHEN '09' THEN 'Gotland'
    WHEN '10' THEN 'Blekinge'
    WHEN '12' THEN 'Skåne'
    WHEN '13' THEN 'Halland'
    WHEN '14' THEN 'Västra Götaland'
    WHEN '17' THEN 'Värmland'
    WHEN '18' THEN 'Örebro'
    WHEN '19' THEN 'Västmanland'
    WHEN '20' THEN 'Dalarna'
    WHEN '21' THEN 'Gävleborg'
    WHEN '22' THEN 'Västernorrland'
    WHEN '23' THEN 'Jämtland'
    WHEN '24' THEN 'Västerbotten'
    WHEN '25' THEN 'Norrbotten'
    ELSE 'Unknown'
  END AS county_name
FROM municipalities m
LEFT JOIN project_municipalities pm ON m.id = pm.municipality_id
GROUP BY m.id, m.name, m.kom_id, m.lan_code, m.latitude, m.longitude, m.geometry
ORDER BY project_count DESC, m.name;

-- Create helper function for geographic distance calculations
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL, 
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  -- Haversine formula for distance in kilometers
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * 
      cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * 
      sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to find municipalities within a certain distance
CREATE OR REPLACE FUNCTION find_nearby_municipalities(
  center_lat DECIMAL, 
  center_lon DECIMAL, 
  radius_km DECIMAL DEFAULT 50
) RETURNS TABLE (
  id INTEGER,
  name TEXT,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    calculate_distance(center_lat, center_lon, m.latitude, m.longitude) AS distance_km
  FROM municipalities m
  WHERE m.latitude IS NOT NULL 
    AND m.longitude IS NOT NULL
    AND calculate_distance(center_lat, center_lon, m.latitude, m.longitude) <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql; 