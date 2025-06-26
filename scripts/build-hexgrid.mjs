// Kör: node scripts/build-hexgrid.mjs
import fs from 'fs';
import * as turf from '@turf/turf';

const SRC  = 'public/data/sweden_municipalities.geojson';
const OUT  = 'public/data/sweden-hexgrid.json';
const CELL = 0.45;                    // ~45 km per hex – justera vid behov

// 1. Läs in kommun-GeoJSON
const mun = JSON.parse(fs.readFileSync(SRC));

// 2. Skapa hex-grid över Sveriges bbox
const bbox = turf.bbox(mun);
const grid = turf.hexGrid(bbox, CELL, { units: 'degrees' });
console.log(mun.type);

// 3. Behåll bara hexagoner som skär någon kommun
const kept = grid.features.filter(
  hex => !mun.features.every(f => turf.booleanDisjoint(hex, f))
);
const hexFC = { type: 'FeatureCollection', features: kept };

// 4. Beräkna kommuncentroider
const centroids = mun.features.map(f => ({
  name: f.properties.name,
  p: turf.centroid(f).geometry.coordinates, // [lng, lat]
}));

// 5. Tilldela närmaste kommunnamn till varje hex
hexFC.features.forEach(hex => {
  const hc = turf.centroid(hex).geometry.coordinates;
  let best = 'N/A', min = Infinity;
  centroids.forEach(({ name, p }) => {
    const d = turf.distance(hc, p);
    if (d < min) { min = d; best = name; }
  });
  hex.properties.name = best;
});

// 6. Skriv ut
fs.writeFileSync(OUT, JSON.stringify(hexFC));
console.log('✅  Hex-grid skapad:', OUT);
