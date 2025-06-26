'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AddProjectFab from '@/components/AddProjectFab';
import Header from '@/components/Header';
import { Trash2, X } from 'lucide-react';

const MapSweden = dynamic(() => import('@/components/MapSwedenLeaflet'), { ssr: false });

/* Områden och värdedimensioner */
export const AREAS = [
  'Administration',
  'Kultur och fritid',
  'Ledning och styrning',
  'Medborgarservice och kommunikation',
  'Miljö och hållbarhet',
  'Samhällsbyggnad och stadsbyggnad',
  'Socialtjänst och hälsa/vård och omsorg',
  'Säkerhet och krisberedskap',
  'Utbildning och skola',
  'Intern administration',
] as const;

export const VALUE_DIMENSIONS = [
  'Effektivisering',
  'Kostnadsbesparing',
  'Kvalitet / noggrannhet',
  'Medborgarnytta',
  'Innovation',
  'Tidsbesparing',
] as const;

type ProjectRow = {
  id: string;
  title: string;
  intro?: string;
  phase: string;
  areas: string[];
  value_dimensions: string[];
  created_at?: string;
  updated_at?: string;
};

export default function MapPage() {
  const [municipalities, setMunicipalities] = useState<{ id: number; name: string }[]>([]);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<number | null>(null);
  const [selectedMunicipalityName, setSelectedMunicipalityName] = useState<string | null>(null);
  const [tab, setTab] = useState<'areas' | 'value'>('areas');
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [areaCounts, setAreaCounts] = useState<number[]>(Array(AREAS.length).fill(0));
  const [valueCounts, setValueCounts] = useState<number[]>(Array(VALUE_DIMENSIONS.length).fill(0));
  const [aiFilter, setAiFilter] = useState<Record<string, boolean>>({});
  const [valFilter, setValFilter] = useState<Record<string, boolean>>({});
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [ideaProjects, setIdeaProjects] = useState<any[] | null>(null);

  const handleMapMunicipalitySelect = (name: string) => {
    const found = municipalities.find((m) => m.name === name);
    if (found) setSelectedMunicipalityId(found.id);
  };

  const handleIdeasSelect = (list: any[]) => {
    setIdeaProjects(list);
    setSelectedMunicipalityId(null);
  };

  const recalcCounts = useCallback((projList: ProjectRow[]) => {
    const areas = Array(AREAS.length).fill(0);
    const values = Array(VALUE_DIMENSIONS.length).fill(0);
    projList.forEach((p) => {
      // Count each area mentioned in the project
      p.areas?.forEach(area => {
        const areaIdx = AREAS.indexOf(area as any);
        if (areaIdx !== -1) areas[areaIdx]++;
      });
      // Count each value dimension mentioned in the project
      p.value_dimensions?.forEach(dim => {
        const dimIdx = VALUE_DIMENSIONS.indexOf(dim as any);
        if (dimIdx !== -1) values[dimIdx]++;
      });
    });
    setAreaCounts(areas);
    setValueCounts(values);
  }, []);

  useEffect(() => {
    fetch('/api/municipalities')
      .then((r) => r.json())
      .then((data) => {
        // Ensure data is an array before setting municipalities
        if (Array.isArray(data)) {
          setMunicipalities(data);
        } else {
          console.error('Municipalities API returned non-array:', data);
          setMunicipalities([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching municipalities:', error);
        setMunicipalities([]);
      });
  }, []);

  useEffect(() => {
    if (!selectedMunicipalityId) {
      setProjects([]);
      recalcCounts([]);
      setSelectedMunicipalityName(null);
      return;
    }
    fetch(`/api/projects?municipality_id=${selectedMunicipalityId}`)
      .then((r) => r.json())
      .then((data: ProjectRow[]) => {
        const projectsData = Array.isArray(data) ? data : [];
        setProjects(projectsData);
        recalcCounts(projectsData);
      })
      .catch((error) => {
        console.error('Error fetching projects:', error);
        setProjects([]);
        recalcCounts([]);
      });
    const found = municipalities.find((m) => m.id === selectedMunicipalityId);
    setSelectedMunicipalityName(found ? found.name : null);
  }, [selectedMunicipalityId, municipalities, recalcCounts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Ta bort projektet?')) return;
    const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { alert('Kunde inte ta bort projektet'); return; }
    
    // If we're viewing municipality projects, update the projects list
    if (selectedMunicipalityId) {
      const newList = projects.filter((p) => p.id !== id);
      setProjects(newList); 
      recalcCounts(newList);
    }
    
    // If we're viewing ideas, refresh the idea list
    if (ideaProjects) {
      const newIdeas = ideaProjects.filter((p) => p.id !== id);
      setIdeaProjects(newIdeas);
    }
    
    // If the deleted project was selected, close the details panel
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  const bar = (count: number) => (
    <div className="flex-1 mx-2">
      <div className="h-2 bg-[#F9E9A0] relative">
        {count > 0 && <div className="absolute left-0 top-0 h-2 bg-[#FECB00]" style={{ width: `${Math.min(100, count * 30)}%` }} />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="w-96 bg-[#F9F8F3] p-6 flex flex-col shadow-lg">
          <div className="mb-4 space-y-2">
            <select className="w-full px-4 py-2 border border-gray-300 bg-white text-[#004D66]" value={selectedMunicipalityId || ''} onChange={(e)=>setSelectedMunicipalityId(e.target.value?Number(e.target.value):null)}>
              <option value="">Välj kommun</option>
              {municipalities.map(m=>(<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
            <button 
              onClick={() => {
                fetch('/api/ideas').then(r => r.json()).then(handleIdeasSelect);
                setSelectedMunicipalityId(null);
              }}
              className="w-full px-4 py-2 bg-[#7ED957] text-white font-medium rounded hover:bg-green-600 transition-colors"
            >
              🔬 Visa Idébank
            </button>
          </div>
          {ideaProjects && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-[#004D66]">🔬 Idébank</h2>
                <button className="text-sm underline text-[#004D66] hover:text-[#FECB00]" onClick={()=>setIdeaProjects(null)}>Tillbaka</button>
              </div>
              <div className="text-xs text-gray-600 mb-3">
                {ideaProjects.length} idéer från kommuner över hela Sverige
              </div>
              <ul className="space-y-3 text-xs max-h-[65vh] overflow-y-auto pr-2">
                {ideaProjects.map((p:any)=>(
                  <li key={p.id} className="border border-gray-200 rounded p-3 bg-white hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-[#004D66] text-sm">{p.title}</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDelete(p.id)} 
                          title="Ta bort idé" 
                          className="text-[#004D66] hover:text-red-600"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button 
                          onClick={() => setSelectedProject(p)}
                          className="text-blue-600 underline hover:text-[#FECB00]"
                        >
                          Detaljer
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2 line-clamp-2">{p.intro}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.areas?.slice(0, 2).map((area: string, i: number) => (
                        <span key={i} className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {area}
                        </span>
                      ))}
                      {p.value_dimensions?.slice(0, 1).map((dim: string, i: number) => (
                        <span key={i} className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          {dim}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>📍 {p.municipality}</span>
                      <span>💡 Idé</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!ideaProjects && selectedMunicipalityId && (
            <div className="flex-1 overflow-y-auto">
              <h2 className="text-lg font-bold text-[#004D66] mb-2">{selectedMunicipalityName}</h2>
              <div className="flex gap-2 mb-4 border-b border-gray-200 text-sm font-semibold">
                <button className={`${tab==='areas'?'border-b-2 border-[#FECB00] text-[#004D66]':'text-gray-400'}`} onClick={()=>setTab('areas')}>Områden</button>
                <button className={`${tab==='value'?'border-b-2 border-[#FECB00] text-[#004D66]':'text-gray-400'}`} onClick={()=>setTab('value')}>Värdeskapande</button>
              </div>
              {tab==='areas' && (
                <ul className="space-y-2 text-xs">
                  {AREAS.map((area, i) => (
                    <li key={area} className="flex items-center justify-between">
                      <span className="text-[#004D66]">{area}</span>
                      {bar(areaCounts[i])}
                      <span className="font-bold">{areaCounts[i]}</span>
                    </li>
                  ))}
                </ul>)}
              {tab==='value' && (
                <ul className="space-y-2 text-xs">
                  {VALUE_DIMENSIONS.map((dimension, i) => (
                    <li key={dimension} className="flex items-center justify-between">
                      <span className="text-[#004D66]">{dimension}</span>
                      {bar(valueCounts[i])}
                      <span className="font-bold">{valueCounts[i]}</span>
                    </li>
                  ))}
                </ul>)}
              {tab==='areas' && (
                <div className="mt-4 text-xs">
                  <h3 className="font-semibold mb-2 text-[#004D66]">Projekt</h3>
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {projects.map(proj => (
                      <li key={proj.id} className="border-b border-gray-200 py-2 flex items-start gap-2">
                        <button onClick={() => handleDelete(proj.id)} title="Ta bort" className="text-[#004D66] hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                        <div className="flex-1">
                          <div className="font-bold text-[#004D66]">{proj.title}</div>
                          {proj.areas && proj.areas.length > 0 && (
                            <div className="text-[#004D66] text-xs">Områden: {proj.areas.join(', ')}</div>
                          )}
                          {proj.value_dimensions && proj.value_dimensions.length > 0 && (
                            <div className="text-[#004D66] text-xs">Värde: {proj.value_dimensions.join(', ')}</div>
                          )}
                          <div className="text-xs">
                            <span className={`px-1 py-0.5 rounded text-white ${
                              proj.phase === 'idea' ? 'bg-blue-500' :
                              proj.phase === 'pilot' ? 'bg-yellow-500' :
                              proj.phase === 'implemented' ? 'bg-green-500' : 'bg-gray-500'
                            }`}>
                              {proj.phase === 'idea' ? 'Idé' : 
                               proj.phase === 'pilot' ? 'Pilot' :
                               proj.phase === 'implemented' ? 'Implementerad' : proj.phase}
                            </span>
                          </div>
                          <button onClick={() => setSelectedProject(proj)} className="underline text-[#004D66] text-xs hover:text-[#FECB00]">Visa detaljer</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>) }
            </div>
          )}
        </aside>

        {selectedProject && (
          <section className="w-96 bg-white p-6 overflow-y-auto shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-[#004D66]">{selectedProject.title}</h3>
              <button onClick={() => setSelectedProject(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="text-sm space-y-3 text-gray-800">
              {selectedProject.intro && (
                <p><span className="font-semibold text-[#004D66]">Beskrivning:</span> {selectedProject.intro}</p>
              )}
              
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-[#004D66]">Fas:</span>
                <span className={`px-2 py-1 rounded text-white text-xs ${
                  selectedProject.phase === 'idea' ? 'bg-blue-500' :
                  selectedProject.phase === 'pilot' ? 'bg-yellow-500' :
                  selectedProject.phase === 'implemented' ? 'bg-green-500' : 'bg-gray-500'
                }`}>
                  {selectedProject.phase === 'idea' ? 'Idé' : 
                   selectedProject.phase === 'pilot' ? 'Pilot' :
                   selectedProject.phase === 'implemented' ? 'Implementerad' : selectedProject.phase}
                </span>
              </div>

              {selectedProject.areas && selectedProject.areas.length > 0 && (
                <p><span className="font-semibold text-[#004D66]">Områden:</span> {selectedProject.areas.join(', ')}</p>
              )}
              {selectedProject.value_dimensions && selectedProject.value_dimensions.length > 0 && (
                <p><span className="font-semibold text-[#004D66]">Värdedimensioner:</span> {selectedProject.value_dimensions.join(', ')}</p>
              )}

              {/* Financial Overview */}
              {(selectedProject as any).cost_data && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h4 className="font-semibold text-[#004D66] mb-2">💰 Ekonomisk översikt</h4>
                  {(selectedProject as any).cost_data.budgetDetails?.budgetAmount && (
                    <p className="text-xs">
                      <span className="font-medium">Budget:</span> {new Intl.NumberFormat('sv-SE').format((selectedProject as any).cost_data.budgetDetails.budgetAmount)} SEK
                    </p>
                  )}
                  
                  {(selectedProject as any).cost_data.actualCostDetails?.costEntries && (
                    <div className="mt-2">
                      <span className="font-medium text-xs">Kostnadsposter:</span>
                      <ul className="text-xs mt-1 space-y-1">
                        {(selectedProject as any).cost_data.actualCostDetails.costEntries.slice(0, 2).map((entry: any, i: number) => (
                          <li key={i} className="flex justify-between">
                            <span>{entry.costLabel || entry.costType}</span>
                            <span>{entry.costFixed > 0 ? `${new Intl.NumberFormat('sv-SE').format(entry.costFixed)} SEK` : `${entry.costHours}h × ${entry.costRate} SEK`}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Effects Overview */}
              {(selectedProject as any).effects_data?.effectDetails && (
                <div className="mt-3 p-3 bg-green-50 rounded">
                  <h4 className="font-semibold text-[#004D66] mb-2">📈 Förväntade effekter</h4>
                  {(selectedProject as any).effects_data.effectDetails.slice(0, 2).map((effect: any, i: number) => (
                    <div key={i} className="text-xs mb-2">
                      {effect.impactMeasurement?.measurements?.slice(0, 1).map((measurement: any, j: number) => (
                        <div key={j}>
                          <p className="font-medium">{measurement.measurementName}</p>
                          {measurement.monetaryEstimate && (
                            <p className="text-green-600">Uppskattad värde: {new Intl.NumberFormat('sv-SE').format(measurement.monetaryEstimate)} SEK</p>
                          )}
                          {measurement.affectedGroups && (
                            <p className="text-gray-600">Påverkar: {measurement.affectedGroups.join(', ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Technical Info */}
              {(selectedProject as any).technical_data && (
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <h4 className="font-semibold text-[#004D66] mb-2">🔧 Teknisk information</h4>
                  <div className="text-xs space-y-1">
                    {(selectedProject as any).technical_data.system_name && (
                      <p><span className="font-medium">System:</span> {(selectedProject as any).technical_data.system_name}</p>
                    )}
                    {(selectedProject as any).technical_data.ai_methodology && (
                      <p><span className="font-medium">AI-metod:</span> {(selectedProject as any).technical_data.ai_methodology}</p>
                    )}
                    {(selectedProject as any).technical_data.deployment_environment && (
                      <p><span className="font-medium">Miljö:</span> {(selectedProject as any).technical_data.deployment_environment}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t space-x-2">
                <button 
                  onClick={() => handleDelete(selectedProject.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
                >
                  Ta bort projekt
                </button>
                <button 
                  onClick={() => window.open(`/projects/new?edit=${selectedProject.id}`, '_blank')}
                  className="px-3 py-1 bg-[#004D66] text-white rounded text-sm font-medium hover:bg-[#003A52]"
                >
                  Redigera projekt
                </button>
              </div>
            </div>
          </section>
        )}

        <main className="flex-1 relative bg-[#004D66]">
          <MapSweden aiFilter={aiFilter} valFilter={valFilter} onSelectMunicipality={handleMapMunicipalitySelect} onSelectIdeas={handleIdeasSelect}/>
        </main>
      </div>
      <AddProjectFab />
    </div>
  );
} 