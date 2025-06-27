'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AddProjectFab from '@/components/AddProjectFab';
import Header from '@/components/Header';
import { Trash2, X, ChevronDown, ChevronRight } from 'lucide-react';

const MapSweden = dynamic(() => import('@/components/MapSwedenLeaflet'), { ssr: false });

/* Områden och värdedimensioner */
export const AREAS = [
  'Administration och personal',
  'Kultur och fritid',
  'Ledning och styrning',
  'Medborgarservice och kommunikation',
  'Miljö och hållbarhet',
  'Samhällsbyggnad och stadsbyggnad',
  'Socialtjänst och hälsa/vård och omsorg',
  'Säkerhet och krisberedskap',
  'Utbildning och skola',
  'Övrigt/oklart',
] as const;

export const VALUE_DIMENSIONS = [
  'Effektivisering',
  'Kvalitet',
  'Innovation',
  'Medborgarnytta',
  'Annat',
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

// Collapsible Section Component
function CollapsibleSection({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mt-3 border border-gray-200 rounded">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
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

              {/* Basic Project Info - Collapsible */}
              <CollapsibleSection title="Projektinformation" icon="📋" defaultOpen={true}>
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
                <CollapsibleSection title="Ekonomisk översikt" icon="💰">
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
                <CollapsibleSection title="Förväntade effekter" icon="📈">
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

              {/* Enhanced Technical & Data Section */}
              {(selectedProject as any).technical_data && (
                <CollapsibleSection title="Teknisk information & Data" icon="🔧">
                  <div className="space-y-4">
                    {/* Data Information */}
                    <div className="bg-blue-50 p-3 rounded">
                      <h6 className="font-semibold text-[#004D66] text-xs mb-2">📊 Datainformation</h6>
                      <div className="space-y-2">
                        {(selectedProject as any).technical_data.data_types && Array.isArray((selectedProject as any).technical_data.data_types) && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">Datatyper:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(selectedProject as any).technical_data.data_types.map((type: string, i: number) => (
                                <span key={i} className="px-1 py-0.5 bg-blue-200 text-blue-800 rounded text-xs">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(selectedProject as any).technical_data.data_sources && Array.isArray((selectedProject as any).technical_data.data_sources) && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">Datakällor:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(selectedProject as any).technical_data.data_sources.map((source: string, i: number) => (
                                <span key={i} className="px-1 py-0.5 bg-green-200 text-green-800 rounded text-xs">
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(selectedProject as any).technical_data.data_sensitivity_level && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">Känslighetsnivå:</span>
                            <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                              (selectedProject as any).technical_data.data_sensitivity_level.includes('känslig') 
                                ? 'bg-red-200 text-red-800' 
                                : 'bg-gray-200 text-gray-800'
                            }`}>
                              {(selectedProject as any).technical_data.data_sensitivity_level}
                            </span>
                          </div>
                        )}
                        
                        {(selectedProject as any).technical_data.data_freshness && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">Aktualitet:</span>
                            <p className="text-xs mt-1">{(selectedProject as any).technical_data.data_freshness}</p>
                          </div>
                        )}
                        
                        {(selectedProject as any).technical_data.data_quality && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">Datakvalitet:</span>
                            <p className="text-xs mt-1">{(selectedProject as any).technical_data.data_quality}</p>
                          </div>
                        )}
                        
                        {(selectedProject as any).technical_data.data_description_free && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">Databeskrivning:</span>
                            <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).technical_data.data_description_free}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Technical Implementation */}
                    <div className="bg-purple-50 p-3 rounded">
                      <h6 className="font-semibold text-[#004D66] text-xs mb-2">⚙️ Teknisk implementation</h6>
                      <div className="space-y-2">
                        {(selectedProject as any).technical_data.system_name && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">System/Plattform:</span>
                            <p className="text-xs mt-1">{(selectedProject as any).technical_data.system_name}</p>
                          </div>
                        )}
                        
                        {(selectedProject as any).technical_data.ai_methodology && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">AI-metodik:</span>
                            <p className="text-xs mt-1">{(selectedProject as any).technical_data.ai_methodology}</p>
                          </div>
                        )}
                        
                        {(selectedProject as any).technical_data.deployment_environment && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">Driftmiljö:</span>
                            <p className="text-xs mt-1">{(selectedProject as any).technical_data.deployment_environment}</p>
                          </div>
                        )}
                        
                        {(selectedProject as any).technical_data.integration_capabilities && Array.isArray((selectedProject as any).technical_data.integration_capabilities) && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">Integrationsmöjligheter:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(selectedProject as any).technical_data.integration_capabilities.map((capability: string, i: number) => (
                                <span key={i} className="px-1 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">
                                  {capability}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(selectedProject as any).technical_data.technical_obstacles && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">Tekniska hinder:</span>
                            <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).technical_data.technical_obstacles}</p>
                          </div>
                        )}
                        
                        {(selectedProject as any).technical_data.technical_solutions && (
                          <div>
                            <span className="font-medium text-[#004D66] text-xs">Tekniska lösningar:</span>
                            <p className="text-xs mt-1 text-gray-700">{(selectedProject as any).technical_data.technical_solutions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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

        <main className="flex-1 relative bg-[#004D66]">
          <MapSweden aiFilter={aiFilter} valFilter={valFilter} onSelectMunicipality={handleMapMunicipalitySelect} onSelectIdeas={handleIdeasSelect}/>
        </main>
      </div>
      <AddProjectFab />
    </div>
  );
} 