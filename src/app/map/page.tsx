'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AddProjectFab from '@/components/AddProjectFab';
import Header from '@/components/Header';
import { Trash2, X, ChevronDown, ChevronRight } from 'lucide-react';
import { AREAS, VALUE_DIMENSIONS } from '@/constants/projectForm';

const MapSweden = dynamic(() => import('@/components/MapSwedenLeaflet'), { ssr: false });

type ProjectRow = {
  id: string;
  title: string;
  intro?: string;
  phase: string;
  areas: string[];
  value_dimensions: string[];
  created_at?: string;
  updated_at?: string;
  municipality_info?: { id: number }[];
};

// Collapsible Section Component
function CollapsibleSection({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'document':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'currency':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
        );
      case 'trending-up':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        );
      case 'wrench':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return <span className="text-sm">{icon}</span>;
    }
  };

  return (
    <div className="mt-3 border border-gray-200 rounded">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <div className="flex items-center gap-2">
          {getIcon(icon)}
          <span className="font-semibold text-[#004D66] text-sm">{title}</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div className="p-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// Simple key-value renderer for generic objects
function KeyValueList({ data }: { data: Record<string, any> }) {
  if (!data) return null;
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0));
  if (entries.length === 0) return null;
  return (
    <dl className="text-xs space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col">
          <dt className="font-semibold text-[#004D66] capitalize">{key.replace(/_/g, ' ')}</dt>
          <dd className="text-gray-700 break-words">{typeof value === 'string' || typeof value === 'number' ? value as any : JSON.stringify(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function MapPage() {
  const [municipalities, setMunicipalities] = useState<{ id: number; name: string }[]>([]);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<number | null>(null);
  const [selectedMunicipalityName, setSelectedMunicipalityName] = useState<string | null>(null);
  const [tab, setTab] = useState<'areas' | 'value'>('areas');
  const [allProjects, setAllProjects] = useState<ProjectRow[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectRow[]>([]);
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

  // Fetch all projects once on mount
  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data: ProjectRow[]) => {
        setAllProjects(Array.isArray(data) ? data : []);
        setFilteredProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setAllProjects([]);
        setFilteredProjects([]);
      });
  }, []);

  // Fetch municipalities on mount
  useEffect(() => {
    fetch('/api/municipalities')
      .then(r => r.json())
      .then(data => setMunicipalities(Array.isArray(data) ? data : []));
  }, []);

  // When a municipality is selected, filter projects by municipality
  useEffect(() => {
    if (!selectedMunicipalityId) {
      setFilteredProjects(allProjects);
      setSelectedMunicipalityName(null);
      return;
    }
    // Find projects that have the selected municipality in their municipality_info
    const filtered = allProjects.filter(p =>
      p.municipality_info && p.municipality_info.some((m: any) => m.id === selectedMunicipalityId)
    );
    setFilteredProjects(filtered);
    const found = municipalities.find((m) => m.id === selectedMunicipalityId);
    setSelectedMunicipalityName(found ? found.name : null);
  }, [selectedMunicipalityId, allProjects, municipalities]);

  // Calculate area and value counts from filteredProjects
  const areaCounts = AREAS.map(area =>
    filteredProjects.filter(p => p.areas && p.areas.includes(area)).length
  );
  const valueCounts = VALUE_DIMENSIONS.map(val =>
    filteredProjects.filter(p => p.value_dimensions && p.value_dimensions.includes(val)).length
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Ta bort projektet?')) return;
    const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { alert('Kunde inte ta bort projektet'); return; }
    
    // If we're viewing municipality projects, update the projects list
    if (selectedMunicipalityId) {
      const newList = filteredProjects.filter((p) => p.id !== id);
      setFilteredProjects(newList); 
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
        <aside className="w-96 bg-[#F9F8F3] p-6 flex flex-col shadow-lg relative">
          {/* Välj kommun always at the top */}
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
              className="w-full px-4 py-2 bg-green-100 text-green-800 font-medium rounded hover:bg-green-200 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
              Visa Idébank
            </button>
          </div>
          {/* National view if no kommun selected and not in ideaProjects mode */}
          {!selectedMunicipalityId && !ideaProjects && (
            <div className="flex-1 overflow-y-auto">
              <h2 className="text-lg font-bold text-[#004D66] mb-2">Nationell översikt</h2>
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
                </ul>
              )}
              {tab==='value' && (
                <ul className="space-y-2 text-xs">
                  {VALUE_DIMENSIONS.map((dimension, i) => (
                    <li key={dimension} className="flex items-center justify-between">
                      <span className="text-[#004D66]">{dimension}</span>
                      {bar(valueCounts[i])}
                      <span className="font-bold">{valueCounts[i]}</span>
                    </li>
                  ))}
                </ul>
              )}
             
            </div>
          )}
          {ideaProjects && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-green-700 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                  Idébank
                </h2>
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
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {p.municipality}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Idé
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!ideaProjects && selectedMunicipalityId && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center mb-2 gap-2">
                <button
                  className="bg-gray-100 border border-gray-300 text-[#004D66] rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200 transition-colors"
                  onClick={() => { setSelectedMunicipalityId(null); setSelectedMunicipalityName(null); }}
                  aria-label="Tillbaka"
                >
                  ←
                </button>
                <h2 className="text-lg font-bold text-[#004D66]">{selectedMunicipalityName}</h2>
              </div>
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
                </ul>
              )}
              {tab==='value' && (
                <ul className="space-y-2 text-xs">
                  {VALUE_DIMENSIONS.map((dimension, i) => (
                    <li key={dimension} className="flex items-center justify-between">
                      <span className="text-[#004D66]">{dimension}</span>
                      {bar(valueCounts[i])}
                      <span className="font-bold">{valueCounts[i]}</span>
                    </li>
                  ))}
                </ul>
              )}
              {/* Show list of projects for this municipality */}
              {filteredProjects.length > 0 && (
                <div className="mt-4 text-xs">
                  <div className="bg-white rounded shadow p-4 mb-4">
                    <h3 className="font-semibold mb-2 text-[#004D66] text-base">Projekt</h3>
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {filteredProjects.map((proj) => (
                        <li
                          key={proj.id}
                          className="border border-gray-200 rounded p-2 bg-white hover:shadow-sm transition-shadow cursor-pointer"
                          onClick={() => setSelectedProject(proj)}
                        >
                          <p className="font-semibold text-[#004D66] text-xs mb-1">{proj.title}</p>
                          {proj.intro && (
                            <p className="text-gray-700 text-[11px] mb-1 line-clamp-2">{proj.intro}</p>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {proj.areas?.slice(0, 2).map((area, i) => (
                              <span key={i} className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{area}</span>
                            ))}
                            {proj.value_dimensions?.slice(0, 1).map((dim, i) => (
                              <span key={i} className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">{dim}</span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="sticky bottom-0 left-0 w-full">
            <div
              className="bg-white border-t border-gray-200 px-6 pt-4 pb-4 cursor-pointer flex items-center justify-center gap-2 font-semibold text-[#004D66] hover:bg-gray-100 transition-colors select-none"
              onClick={() => window.location.href = '/projects/new'}
              role="button"
              tabIndex={0}
              onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = '/projects/new'; }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Lägg till projekt
            </div>
          </div>
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

              {/* Grundinfo */}
              {selectedProject.municipality_info && selectedProject.municipality_info.length > 0 && (
                <p><span className="font-semibold text-[#004D66]">Kommuner:</span> {selectedProject.municipality_info.map((m:any)=>m.name).join(', ')}</p>
              )}
              {selectedProject.areas && selectedProject.areas.length > 0 && (
                <p><span className="font-semibold text-[#004D66]">Områden:</span> {selectedProject.areas.join(', ')}</p>
              )}
              {selectedProject.value_dimensions && selectedProject.value_dimensions.length > 0 && (
                <p><span className="font-semibold text-[#004D66]">Värdedimensioner:</span> {selectedProject.value_dimensions.join(', ')}</p>
              )}
              { (selectedProject as any).link && (
                <p className="text-xs"><a href={(selectedProject as any).link} target="_blank" className="text-blue-600 underline">Länk till projekt&nbsp;↗</a></p>
              )}

              {/* Basic Project Info - Collapsible */}
              <CollapsibleSection title="Projektinformation" icon="document" defaultOpen={true}>
                {(selectedProject as any).problem && (
                  <div className="mb-3">
                    <span className="font-semibold text-[#004D66] text-xs">Problem/Utmaning:</span>
                    <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).problem}</p>
                  </div>
                )}
                {(selectedProject as any).opportunity && (
                  <div className="mb-3">
                    <span className="font-semibold text-[#004D66] text-xs">Möjlighet:</span>
                    <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).opportunity}</p>
                  </div>
                )}
                {(selectedProject as any).responsible && (
                  <div className="mb-3">
                    <span className="font-semibold text-[#004D66] text-xs">Ansvarig:</span>
                    <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).responsible}</p>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  <p>Skapad: {selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString('sv-SE') : 'Okänt'}</p>
                  {selectedProject.updated_at !== selectedProject.created_at && (
                    <p>Uppdaterad: {new Date(selectedProject.updated_at || '').toLocaleDateString('sv-SE')}</p>
                  )}
                </div>
              </CollapsibleSection>

              {/* Financial Overview */}
              {(selectedProject as any).cost_data && (
                <CollapsibleSection title="Ekonomisk översikt" icon="currency">
                  {(selectedProject as any).cost_data.budgetDetails?.budgetAmount && (
                    <div className="mb-3">
                      <span className="font-semibold text-[#004D66] text-xs">Total budget:</span>
                      <p className="text-sm font-bold text-green-600">{new Intl.NumberFormat('sv-SE').format((selectedProject as any).cost_data.budgetDetails.budgetAmount)} SEK</p>
                    </div>
                  )}
                  
                  {(selectedProject as any).cost_data.actualCostDetails?.costEntries && (
                    <div className="mb-3">
                      <span className="font-semibold text-[#004D66] text-xs">Detaljerad kostnadsfördelning:</span>
                      <div className="mt-2 space-y-2">
                        {(selectedProject as any).cost_data.actualCostDetails.costEntries.map((entry: any, i: number) => (
                          <div key={i} className="bg-gray-50 p-2 rounded text-xs">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium">{entry.costLabel || entry.costType || `Kostnad ${i + 1}`}</p>
                                {entry.costDescription && (
                                  <p className="text-gray-600 text-xs mt-1">{entry.costDescription}</p>
                                )}
                              </div>
                              <div className="text-right">
                                {entry.costFixed > 0 ? (
                                  <p className="font-bold">{new Intl.NumberFormat('sv-SE').format(entry.costFixed)} SEK</p>
                                ) : (
                                  <div>
                                    <p className="font-bold">{new Intl.NumberFormat('sv-SE').format(entry.costHours * entry.costRate)} SEK</p>
                                    <p className="text-gray-600">{entry.costHours}h × {entry.costRate} SEK/h</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ROI Calculation if possible */}
                  {(selectedProject as any).effects_data?.effectDetails && (selectedProject as any).cost_data && (
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <span className="font-semibold text-[#004D66] text-xs">ROI-analys:</span>
                      <p className="text-xs mt-1">
                        Se "Förväntade effekter" för monetära uppskattningar
                      </p>
                    </div>
                  )}
                </CollapsibleSection>
              )}

              {/* Effects Overview */}
              {(selectedProject as any).effects_data?.effectDetails && (
                <CollapsibleSection title="Förväntade effekter" icon="trending-up">
                  {/* ROI */}
                  { (selectedProject as any).calculatedMetrics?.roi !== null && (selectedProject as any).calculatedMetrics?.roi !== undefined && (
                    <p className="text-xs text-gray-700 mb-3"><span className="font-semibold text-[#004D66]">ROI:</span> {(selectedProject as any).calculatedMetrics.roi.toFixed(1)}%</p>
                  )}
                  {(selectedProject as any).effects_data.effectDetails.map((effect: any, i: number) => (
                    <div key={i} className="mb-4 border-b border-gray-100 pb-3 last:border-b-0">
                      {effect.effectName && (
                        <h5 className="font-semibold text-[#004D66] text-xs mb-2">{effect.effectName}</h5>
                      )}
                      {effect.effectDescription && (
                        <p className="text-xs text-gray-700 mb-2">{effect.effectDescription}</p>
                      )}
                      
                      {effect.impactMeasurement?.measurements && (
                        <div className="space-y-2">
                          {effect.impactMeasurement.measurements.map((measurement: any, j: number) => (
                            <div key={j} className="bg-green-50 p-2 rounded">
                              <p className="font-medium text-xs text-[#004D66]">{measurement.measurementName}</p>
                              
                              {measurement.monetaryEstimate && (
                                <div className="mt-1">
                                  <span className="text-xs text-green-700 font-semibold">
                                    Monetärt värde: {new Intl.NumberFormat('sv-SE').format(measurement.monetaryEstimate)} SEK
                                  </span>
                                </div>
                              )}
                              
                              {measurement.quantitativeEstimate && (
                                <div className="mt-1">
                                  <span className="text-xs text-blue-700">
                                    Kvantitativ uppskattning: {measurement.quantitativeEstimate} {measurement.unit || ''}
                                  </span>
                                </div>
                              )}
                              
                              {measurement.qualitativeDescription && (
                                <p className="text-xs text-gray-600 mt-1">{measurement.qualitativeDescription}</p>
                              )}
                              
                              {measurement.affectedGroups && measurement.affectedGroups.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-[#004D66]">Påverkade grupper:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {measurement.affectedGroups.map((group: string, k: number) => (
                                      <span key={k} className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                        {group}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CollapsibleSection>
              )}

              {/* Leadership & Organization */}
              {(selectedProject as any).leadership_data && Object.keys((selectedProject as any).leadership_data).some(key => (selectedProject as any).leadership_data[key]) && (
                <CollapsibleSection title="Organisation & Ledarskap" icon="👥">
                  <div className="space-y-3">
                    {(selectedProject as any).leadership_data.leadershipInvolved && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Ledningens engagemang:</span>
                        <p className="text-xs mt-1">{(selectedProject as any).leadership_data.leadershipInvolved === 'yes' ? 'Ja' : 'Nej'}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.strategyAlignment && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Strategisk förankring:</span>
                        <p className="text-xs mt-1">
                          {(selectedProject as any).leadership_data.strategyAlignment === 'explicit' ? 'Ja, uttryckligen i strategier' :
                           (selectedProject as any).leadership_data.strategyAlignment === 'indirect' ? 'Ja, indirekt stöd' : 'Nej'}
                        </p>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.competenceNeeds && Array.isArray((selectedProject as any).leadership_data.competenceNeeds) && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Kompetenssäkring:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(selectedProject as any).leadership_data.competenceNeeds.map((need: string, i: number) => (
                            <span key={i} className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              {need === 'internal_development' ? 'Intern utveckling' :
                               need === 'recruitment' ? 'Rekrytering' :
                               need === 'consultants' ? 'Konsulter' :
                               need === 'no_new_needs' ? 'Inga nya behov' : need}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.strategicAlignment && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Strategisk förankring:</span>
                        <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).leadership_data.strategicAlignment}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.managementSupport && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Ledningens stöd:</span>
                        <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).leadership_data.managementSupport}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.nextSteps && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Nästa steg:</span>
                        <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).leadership_data.nextSteps}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.lessonsLearned && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Lärdomar & utmaningar:</span>
                        <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).leadership_data.lessonsLearned}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Legal & Security */}
              {(selectedProject as any).legal_data && Object.keys((selectedProject as any).legal_data).some(key => (selectedProject as any).legal_data[key]) && (
                <CollapsibleSection title="Juridik & Informationssäkerhet" icon="🔒">
                  <div className="space-y-3">
                    {(selectedProject as any).legal_data.processes_personal_data && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Behandlar personuppgifter:</span>
                        <p className="text-xs mt-1">{(selectedProject as any).legal_data.processes_personal_data}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.data_categories && Array.isArray((selectedProject as any).legal_data.data_categories) && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Personuppgiftskategorier:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(selectedProject as any).legal_data.data_categories.map((category: string, i: number) => (
                            <span key={i} className="px-1 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.legal_basis && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Rättslig grund:</span>
                        <p className="text-xs mt-1">{(selectedProject as any).legal_data.legal_basis}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.dpia_done && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">DPIA genomförd:</span>
                        <p className="text-xs mt-1">{(selectedProject as any).legal_data.dpia_done}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.high_risk_ai && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Högrisk AI (EU-förordning):</span>
                        <p className="text-xs mt-1">{(selectedProject as any).legal_data.high_risk_ai}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.is_open_source && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Öppen källkod:</span>
                        <p className="text-xs mt-1">{(selectedProject as any).legal_data.is_open_source}</p>
                        {(selectedProject as any).legal_data.open_source_link && (
                          <a href={(selectedProject as any).legal_data.open_source_link} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 underline text-xs">
                            {(selectedProject as any).legal_data.open_source_link}
                          </a>
                        )}
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.security_measures && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">Säkerhetsåtgärder:</span>
                        <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).legal_data.security_measures}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.accessibility && (
                      <div>
                        <span className="font-semibold text-[#004D66] text-xs">WCAG-kompatibilitet:</span>
                        <p className="text-xs mt-1">{(selectedProject as any).legal_data.accessibility}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Technical Data */}
              {(selectedProject as any).technical_data && Object.keys((selectedProject as any).technical_data).length > 0 && (
                <CollapsibleSection title="Teknisk information" icon="wrench">
                  <KeyValueList data={(selectedProject as any).technical_data} />
                </CollapsibleSection>
              )}

              {/* Legal Data */}
              {(selectedProject as any).legal_data && Object.keys((selectedProject as any).legal_data).length > 0 && (
                <CollapsibleSection title="Juridik & Regelverk" icon="document">
                  <KeyValueList data={(selectedProject as any).legal_data} />
                </CollapsibleSection>
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
        <main className="flex-1 relative bg-[#003A52]">
          <MapSweden aiFilter={aiFilter} valFilter={valFilter} onSelectMunicipality={handleMapMunicipalitySelect} onSelectIdeas={handleIdeasSelect}/>
        </main>
      </div>
    </div>
  );
} 