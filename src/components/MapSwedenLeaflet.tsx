// /src/components/MapSwedenLeaflet.tsx
'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, CircleMarker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import * as turf from '@turf/turf';
import { forceSimulation, forceCollide, forceX, forceY } from 'd3-force';
import useProjectCounts from '@/components/useProjectCounts';
import { LatLngExpression } from 'leaflet';

interface Node {
  name: string;
  n: number;
  lat: number;
  lng: number;
  r: number;
  x: number;
  y: number;
  rDraw?: number;
  rScaled?: number;
}

interface Props {
  aiFilter:  Record<string, boolean>;
  valFilter: Record<string, boolean>;
  onSelectMunicipality?: (name: string) => void;
  onSelectIdeas?: (ideas:any[])=>void;
}

export default function MapSwedenLeaflet({ aiFilter, valFilter, onSelectMunicipality, onSelectIdeas }: Props) {
  const counts = useProjectCounts(aiFilter, valFilter);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [ideaCount, setIdeaCount] = useState(0);
  const [ideas, setIdeas] = useState<any[]>([]);
  const mapRef = useRef<any>(null);

  /* ladda GeoJSON när counts uppdateras */
  useEffect(() => {
    // Allow loading even with empty counts - we want to show all municipalities
    (async () => {
      const geo = await (await fetch('/data/sweden_municipalities.geojson')).json();
      const countValues = Object.values(counts);
      const max = countValues.length > 0 ? Math.max(...countValues) : 0;
      // Ensure max is at least 1 to avoid log calculation issues
      const maxForCalc = Math.max(max, 1);

      const arr: Node[] = geo.features.map((f: any) => {
        const p = f.properties;
        const name = p.kom_namn || p.name || p.NAMN || p.KN_NAMN || 'Okänd';
        const n = counts[name] ?? 0;
        const [lng, lat] = turf.centroid(f).geometry.coordinates;
        const r = 4 + 12 * Math.log2(1 + n) / Math.log2(1 + maxForCalc);
        return { name, n, lat, lng, r, x: 0, y: 0 };
      });
      setNodes(arr);
    })();
  }, [counts]);

  useEffect(() => {
    fetch('/api/ideas')
  .then(async r => {
    if (!r.ok) {
      const text = await r.text();
      console.error(`Ideas API error (${r.status}):`, text);
      throw new Error(`Ideas API failed: ${r.status} - ${text}`);
    }
    return r.json();
  })
  .then((d) => { setIdeas(d); setIdeaCount(d.length); })
  .catch(error => {
    console.error('Error loading ideas:', error);
    setIdeas([]);
    setIdeaCount(0);
  });
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Custom Zoom Controls */}
      <ZoomControls mapRef={mapRef} />
      <MapContainer
        center={[63, 15]}
        zoom={5}
        minZoom={5}
        maxZoom={8}
        style={{ width: '100%', height: '100%', background: '#121f2b' }}
        scrollWheelZoom
        attributionControl={false}
        zoomControl={false}
      >
        <SetMapRef mapRef={mapRef} />
        <ForceLayer nodes={nodes} onSelectMunicipality={onSelectMunicipality} />
        {ideaCount > 0 && (
          <CircleMarker
            center={[64, 32] as LatLngExpression}
            radius={6 + Math.log2(ideaCount + 1) * 4}
            pathOptions={{ color: '#7ED957', fillColor: '#7ED957', fillOpacity: 1, weight: 0 }}
            eventHandlers={{
              click: () => { onSelectIdeas?.(ideas); }
            }}
          >
            <Tooltip direction="left" className="leading-tight"><span>Idébank – {ideaCount} projekt</span></Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}

function ZoomControls({ mapRef }: { mapRef: any }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        aria-label="Zooma in"
        className="bg-white border border-gray-300 rounded-full shadow w-10 h-10 flex items-center justify-center hover:bg-gray-100 focus:outline-none"
        onClick={() => mapRef.current && mapRef.current.zoomIn()}
        type="button"
      >
        <svg className="w-6 h-6 text-[#004D66]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button
        aria-label="Zooma ut"
        className="bg-white border border-gray-300 rounded-full shadow w-10 h-10 flex items-center justify-center hover:bg-gray-100 focus:outline-none"
        onClick={() => mapRef.current && mapRef.current.zoomOut()}
        type="button"
      >
        <svg className="w-6 h-6 text-[#004D66]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
    </div>
  );
}

/* Force-layout som räknas om vid initial load + varje zoomend */
function ForceLayer({ nodes, onSelectMunicipality }: { nodes: Node[]; onSelectMunicipality?: (name: string) => void }) {
  const map = useMap();
  const [fixed, setFixed] = useState<Node[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  /* recompute vid init och zoomend */
  useMapEvents({ zoomend: recompute });
  useEffect(() => { if (nodes.length) recompute(); }, [nodes]);

  function recompute() {
    if (nodes.length === 0) return;
    const zoomFactor = Math.pow(2, map.getZoom() - 6);

    const pts = nodes.map((n) => ({
      ...n,
      ...map.latLngToLayerPoint([n.lat, n.lng]),
      rScaled: n.r * zoomFactor,
    }));

    forceSimulation(pts)
      .force('x', forceX<Node>((d) => d.x).strength(0.2))
      .force('y', forceY<Node>((d) => d.y).strength(0.2))
      .force('c', forceCollide<Node>((d) => (d.rScaled ?? 0) + 2 * zoomFactor))
      .stop()
      .tick(400);

    const stat = pts.map((n) => {
      const { Point } = require('leaflet');
      const ll = map.layerPointToLatLng(new Point(n.x, n.y));
      return { ...n, lat: ll.lat, lng: ll.lng, rDraw: n.rScaled };
    });
    setFixed(stat);
  }

  return (
    <>
      {fixed.map((n) => {
        const active = n.name === selected;
        const fill   = n.n ? '#fecb00' : '#A9A980';
        return (
          <CircleMarker
            key={n.name}
            center={[n.lat, n.lng]}
            radius={n.rDraw!}
            pathOptions={{
              color: active ? '#004D66' : fill,
              fillColor: active ? '#fecb00' : fill,
              weight: active ? 2 : 0,
              fillOpacity: 1,
            }}
            eventHandlers={{
              click: () => {
                setSelected(n.name);
                map.setView([n.lat, n.lng], 7, { animate: true });
                if (onSelectMunicipality) onSelectMunicipality(n.name);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -n.rDraw! - 5]} className="leading-tight">
              <div className="text-xs">
                <div className="font-semibold">{n.name}</div>
                <div>Antal initiativ: {n.n}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

function SetMapRef({ mapRef }: { mapRef: any }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}
