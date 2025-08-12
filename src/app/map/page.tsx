'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AddProjectFab from '@/components/AddProjectFab';
import Header from '@/components/Header';
import { Trash2, X, ChevronDown, ChevronRight } from 'lucide-react';
import { AREAS, VALUE_DIMENSIONS } from '@/constants/projectForm';
import ProjectScoreBar from '@/components/ProjectScoreBar';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { getScoreBarColor, calculateProjectScore } from '@/lib/projectScore';
import { computeROIMetrics } from '@/services/roi/roi.service';

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
  municipality_info?: { id: number; name?: string; county?: string }[];
  calculatedMetrics?: {
    budget: number | null;
    actualCost: number;
    roi: number | null;
    affectedGroups: string[];
    technologies: string[];
  };
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
          <span className="font-semibold text-[#fffefa] text-sm">{title}</span>
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
  const entries = Object.entries(data)
    .filter(([k, v]) => v !== null && v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0))
    // Hide duplicated security_measures in legal view
    .filter(([k]) => k !== 'security_measures');
  if (entries.length === 0) return null;
  return (
    <dl className="text-xs space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col">
          <dt className="font-semibold text-[#fecb00] capitalize">{key.replace(/_/g, ' ')}</dt>
          <dd className="text-gray-300 break-words">{typeof value === 'string' || typeof value === 'number' ? value as any : JSON.stringify(value)}</dd>
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
  const [detailTab, setDetailTab] = useState<'overview'|'cost'|'effects'|'tech'|'leadership'|'legal'>('overview');

  // Helpers (mirrors project detail page)
  const getEffectName = (effect: any, index: number) => {
    try {
      if (effect?.hasQuantitative && effect.quantitativeDetails) {
        const q = effect.quantitativeDetails;
        if (q.effectType === 'financial' && q.financialDetails?.measurementName) return q.financialDetails.measurementName;
        if (q.effectType === 'redistribution' && q.redistributionDetails?.resourceType) return q.redistributionDetails.resourceType;
      }
      if (effect?.hasQualitative && effect.qualitativeDetails?.factor) return effect.qualitativeDetails.factor;
      if (effect?.valueDimension) return effect.valueDimension === 'Annat' && effect.customValueDimension ? effect.customValueDimension : effect.valueDimension;
      return `Effekt ${index + 1}`;
    } catch { return `Effekt ${index + 1}`; }
  };

  const parseFinancialDetails = (details: any) => {
    if (!details || typeof details !== 'object') return null;
    const { valueUnit, countDetails, hoursDetails, otherDetails, measurementName, annualizationYears, currencyDetails, percentageDetails } = details;
    let value = 0; let description = '';
    if (valueUnit === 'count' && countDetails) {
      value = (countDetails.count || 0) * (countDetails.valuePerUnit || 0);
      const timescale = countDetails.timescale === 'per_month' ? '/månad' : countDetails.timescale === 'per_year' ? '/år' : '';
      description = `${countDetails.count} enheter ${timescale} × ${formatCurrency(countDetails.valuePerUnit || 0)}`;
      if (annualizationYears) { value *= (annualizationYears * (countDetails.timescale === 'per_month' ? 12 : 1)); description += ` under ${annualizationYears} år`; }
    } else if (valueUnit === 'hours' && hoursDetails) {
      const affectedPeople = hoursDetails.affectedPeople || 0;
      const timePerPerson = hoursDetails.timePerPerson || 0;
      const hourlyRate = hoursDetails.hourlyRate || 0;
      let totalHours = 0; let peopleDescription = '';
      if (affectedPeople > 0 && timePerPerson > 0) {
        const timescale = hoursDetails.timescale;
        if (timescale === 'per_day') { totalHours = affectedPeople * timePerPerson * 235; peopleDescription = `${affectedPeople} personer × ${timePerPerson} timmar/dag`; }
        else if (timescale === 'per_week') { totalHours = affectedPeople * timePerPerson * 47; peopleDescription = `${affectedPeople} personer × ${timePerPerson} timmar/vecka`; }
        else if (timescale === 'per_month') { totalHours = affectedPeople * timePerPerson * 12; peopleDescription = `${affectedPeople} personer × ${timePerPerson} timmar/månad`; }
        else if (timescale === 'per_year') { totalHours = affectedPeople * timePerPerson; peopleDescription = `${affectedPeople} personer × ${timePerPerson} timmar/år`; }
        else { totalHours = affectedPeople * timePerPerson; peopleDescription = `${affectedPeople} personer × ${timePerPerson} timmar`; }
      } else {
        totalHours = hoursDetails.hours || 0; const timescale = hoursDetails.timescale === 'per_month' ? '/månad' : hoursDetails.timescale === 'per_year' ? '/år' : ''; peopleDescription = `${totalHours} timmar ${timescale}`;
      }
      value = totalHours * hourlyRate;
      description = `${peopleDescription} × ${formatCurrency(hourlyRate)}/timme = ${totalHours.toFixed(0)} timmar totalt`;
      if (annualizationYears && annualizationYears > 1) { value *= annualizationYears; description += ` under ${annualizationYears} år`; }
    } else if (valueUnit === 'currency' && currencyDetails) {
      const curr = currencyDetails; value = curr.amount || 0;
      const timescale = curr.timescale === 'per_month' ? '/månad' : curr.timescale === 'per_year' ? '/år' : curr.timescale === 'one_time' ? ' (engångsbelopp)' : '';
      description = `${formatCurrency(curr.amount || 0)} ${timescale}`;
      if (annualizationYears && curr.timescale !== 'one_time') { value *= (annualizationYears * (curr.timescale === 'per_month' ? 12 : 1)); description += ` under ${annualizationYears} år`; }
    } else if (valueUnit === 'percentage' && percentageDetails) {
      const perc = percentageDetails; value = (perc.percentage || 0) * (perc.baseValue || 0) / 100;
      const timescale = perc.timescale === 'per_month' ? '/månad' : perc.timescale === 'per_year' ? '/år' : '';
      description = `${perc.percentage}% av ${formatCurrency(perc.baseValue || 0)} ${timescale}`;
      if (annualizationYears) { value *= (annualizationYears * (perc.timescale === 'per_month' ? 12 : 1)); description += ` under ${annualizationYears} år`; }
    } else if (valueUnit === 'other' && otherDetails) {
      value = (otherDetails.amount || 0) * (otherDetails.valuePerUnit || 0);
      const unit = otherDetails.customUnit || 'enheter';
      const timescale = otherDetails.timescale === 'per_month' ? '/månad' : otherDetails.timescale === 'per_year' ? '/år' : '';
      description = `${otherDetails.amount || 0} ${unit} ${timescale} × ${formatCurrency(otherDetails.valuePerUnit || 0)}`;
      if (annualizationYears) { value *= (annualizationYears * (otherDetails.timescale === 'per_month' ? 12 : 1)); description += ` under ${annualizationYears} år`; }
    }
    return { value, description, measurementName };
  };

  const parseRedistributionDetails = (details: any) => {
    if (!details || typeof details !== 'object') return null;
    const { valueUnit, resourceType, annualizationYears, hoursDetails, currencyDetails, countDetails, otherDetails, percentageDetails } = details;
    let value = 0; let description = ''; let savedAmount = 0;
    if (valueUnit === 'hours' && hoursDetails) {
      const affectedPeople = hoursDetails.affectedPeople || 0;
      const currentTimePerPerson = hoursDetails.currentTimePerPerson || 0;
      const newTimePerPerson = hoursDetails.newTimePerPerson || 0;
      const hourlyRate = hoursDetails.hourlyRate || 0;
      let currentTotalHours = 0; let newTotalHours = 0; let peopleDescription = '';
      const timescale = hoursDetails.timescale;
      if (timescale === 'per_day') { currentTotalHours = affectedPeople * currentTimePerPerson * 235; newTotalHours = affectedPeople * newTimePerPerson * 235; peopleDescription = `${affectedPeople} personer: ${currentTimePerPerson} → ${newTimePerPerson} timmar/dag`; }
      else if (timescale === 'per_week') { currentTotalHours = affectedPeople * currentTimePerPerson * 47; newTotalHours = affectedPeople * newTimePerPerson * 47; peopleDescription = `${affectedPeople} personer: ${currentTimePerPerson} → ${newTimePerPerson} timmar/vecka`; }
      else if (timescale === 'per_month') { currentTotalHours = affectedPeople * currentTimePerPerson * 12; newTotalHours = affectedPeople * newTimePerPerson * 12; peopleDescription = `${affectedPeople} personer: ${currentTimePerPerson} → ${newTimePerPerson} timmar/månad`; }
      else if (timescale === 'per_year') { currentTotalHours = affectedPeople * currentTimePerPerson; newTotalHours = affectedPeople * newTimePerPerson; peopleDescription = `${affectedPeople} personer: ${currentTimePerPerson} → ${newTimePerPerson} timmar/år`; }
      else { currentTotalHours = affectedPeople * currentTimePerPerson; newTotalHours = affectedPeople * newTimePerPerson; peopleDescription = `${affectedPeople} personer: ${currentTimePerPerson} → ${newTimePerPerson} timmar`; }
      savedAmount = currentTotalHours - newTotalHours; value = Math.abs(savedAmount) * hourlyRate;
      description = `${peopleDescription} = ${Math.abs(savedAmount).toFixed(0)} ${savedAmount > 0 ? 'besparade' : 'extra'} timmar${hourlyRate > 0 ? ` × ${formatCurrency(hourlyRate)}/timme` : ''}`;
      if (annualizationYears && annualizationYears > 1) { value *= annualizationYears; description += ` under ${annualizationYears} år`; }
    } else if (valueUnit === 'percentage' && percentageDetails) {
      const baseValue = percentageDetails.baseValue || 0; const currentPercentage = percentageDetails.currentPercentage || 100; const newPercentage = percentageDetails.newPercentage || 0;
      const currentAmount = (baseValue * currentPercentage) / 100; const newAmount = (baseValue * newPercentage) / 100; savedAmount = currentAmount - newAmount; value = Math.abs(savedAmount);
      description = `${resourceType}: ${currentPercentage}% → ${newPercentage}% av ${formatCurrency(baseValue)}`;
      if (annualizationYears && annualizationYears > 1) { value *= annualizationYears; description += ` under ${annualizationYears} år`; }
    } else if (valueUnit === 'currency' && currencyDetails) {
      const currentAmount = currencyDetails.currentAmount || 0; const newAmount = currencyDetails.newAmount || 0; savedAmount = currentAmount - newAmount; value = Math.abs(savedAmount);
      const timescale = currencyDetails.timescale === 'per_month' ? '/månad' : currencyDetails.timescale === 'per_year' ? '/år' : '';
      description = `${formatCurrency(Math.abs(savedAmount))} ${savedAmount > 0 ? 'besparade' : 'extra kostnad'} ${timescale}`;
      if (annualizationYears) { value *= (annualizationYears * (currencyDetails.timescale === 'per_month' ? 12 : 1)); description += ` under ${annualizationYears} år`; }
    } else if (valueUnit === 'count' && countDetails) {
      const currentCount = countDetails.currentCount || 0; const newCount = countDetails.newCount || 0; savedAmount = currentCount - newCount; const valuePerUnit = countDetails.valuePerUnit || 0; value = Math.abs(savedAmount) * valuePerUnit;
      const timescale = countDetails.timescale === 'per_month' ? '/månad' : countDetails.timescale === 'per_year' ? '/år' : '';
      description = `${Math.abs(savedAmount)} ${savedAmount > 0 ? 'färre' : 'fler'} enheter ${timescale}${valuePerUnit > 0 ? ` × ${formatCurrency(valuePerUnit)}/enhet` : ''}`;
      if (annualizationYears) { value *= (annualizationYears * (countDetails.timescale === 'per_month' ? 12 : 1)); description += ` under ${annualizationYears} år`; }
    } else if (valueUnit === 'other' && otherDetails) {
      const currentAmount = otherDetails.currentAmount || 0; const newAmount = otherDetails.newAmount || 0; savedAmount = currentAmount - newAmount; const valuePerUnit = otherDetails.valuePerUnit || 0; value = Math.abs(savedAmount) * valuePerUnit; const unit = otherDetails.customUnit || 'enheter';
      const timescale = otherDetails.timescale === 'per_month' ? '/månad' : otherDetails.timescale === 'per_year' ? '/år' : '';
      description = `${Math.abs(savedAmount)} ${savedAmount > 0 ? 'färre' : 'fler'} ${unit} ${timescale}${valuePerUnit > 0 ? ` × ${formatCurrency(valuePerUnit)}/${unit}` : ''}`;
      if (annualizationYears) { value *= (annualizationYears * (otherDetails.timescale === 'per_month' ? 12 : 1)); description += ` under ${annualizationYears} år`; }
    }
    return { value, description, resourceType, savedAmount };
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'idea': return 'bg-blue-500';
      case 'pilot': return 'bg-orange-500';
      case 'implemented': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'idea': return 'Idé';
      case 'pilot': return 'Pilot';
      case 'implemented': return 'Implementerat';
      default: return phase;
    }
  };

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
        {count > 0 && <div className="absolute left-0 top-0 h-2 bg-[#fecb00]" style={{ width: `${Math.min(100, count * 30)}%` }} />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#121f2b] text-[#fffefa]">
      <Header />
      <div className="flex flex-1">
        <aside className="w-96 bg-[#1E3A4A] border-r border-gray-600 p-6 flex flex-col relative">
          {/* Välj kommun always at the top */}
          <div className="mb-4 space-y-2">
            <select className="w-full px-3 py-2 bg-[#224556] border border-gray-600 rounded text-[#fffefa]" value={selectedMunicipalityId || ''} onChange={(e)=>setSelectedMunicipalityId(e.target.value?Number(e.target.value):null)}>
              <option value="">Välj organisation</option>
              {municipalities.map(m=>(<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
            <button 
              onClick={() => {
                fetch('/api/ideas')
  .then(async r => {
    if (!r.ok) {
      const text = await r.text();
      console.error(`Ideas API error (${r.status}):`, text);
      throw new Error(`Ideas API failed: ${r.status} - ${text}`);
    }
    return r.json();
  })
  .then(handleIdeasSelect)
  .catch(error => {
    console.error('Error loading ideas:', error);
  });
                setSelectedMunicipalityId(null);
              }}
              className="w-full px-4 py-2 bg-[#fecb00] text-[#121f2b] font-bold rounded hover:bg-[#fecb00] transition-colors flex items-center justify-center"
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
              <h2 className="text-lg font-bold text-[#fecb00] mb-2">Nationell översikt</h2>
              <div className="flex gap-4 mb-4 border-b border-gray-600 text-sm font-semibold">
                <button className={`${tab==='areas'?'border-b-2 border-[#fecb00] text-[#fffefa]':'text-gray-400'}`} onClick={()=>setTab('areas')}>Områden</button>
                <button className={`${tab==='value'?'border-b-2 border-[#fecb00] text-[#fffefa]':'text-gray-400'}`} onClick={()=>setTab('value')}>Värdeskapande</button>
              </div>
              {tab==='areas' && (
                <ul className="space-y-2 text-xs">
                  {AREAS.map((area, i) => (
                    <li key={area} className="flex items-center justify-between">
                      <span className="text-[#fffefa]">{area}</span>
                      {bar(areaCounts[i])}
                      <span className="font-bold text-[#fecb00]">{areaCounts[i]}</span>
                    </li>
                  ))}
                </ul>
              )}
              {tab==='value' && (
                <ul className="space-y-2 text-xs">
                  {VALUE_DIMENSIONS.map((dimension, i) => (
                    <li key={dimension} className="flex items-center justify-between">
                      <span className="text-[#fffefa]">{dimension}</span>
                      {bar(valueCounts[i])}
                      <span className="font-bold text-[#fecb00]">{valueCounts[i]}</span>
                    </li>
                  ))}
                </ul>
              )}
             
            </div>
          )}
          {ideaProjects && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-[#fecb00] flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                  Idébank
                </h2>
                <button className="text-sm underline text-[#fffefa] hover:text-[#fecb00]" onClick={()=>setIdeaProjects(null)}>Tillbaka</button>
              </div>
              <div className="text-xs text-gray-300 mb-3">
                {ideaProjects.length} idéer från organisationer över hela Sverige
              </div>
              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
                {ideaProjects.map((p:any)=>(
                  <div key={p.id} className="bg-[#121F2B] border border-gray-600 p-4 rounded-lg hover:bg-[#224556] transition-colors cursor-pointer group shadow" onClick={() => setSelectedProject(p)}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold text-[#fffefa] truncate pr-2 group-hover:text-[#fecb00] transition-colors">{p.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium text-[#fffefa] bg-blue-500">Idé</span>
                    </div>
                    {p.intro && (<p className="text-gray-300 text-xs mb-2 line-clamp-2">{p.intro}</p>)}
                    <div className="space-y-1 text-xs">
                      {p.municipality && (
                        <div className="flex items-center gap-1">
                          <span className="text-[#fecb00] font-medium">Organisation: </span>
                          <span className="text-gray-300">{p.municipality}</span>
                        </div>
                      )}
                      {(p.areas?.length || p.value_dimensions?.length) && (
                        <div className="flex flex-wrap items-center gap-1">
                          {p.areas?.slice(0, 2).map((area: string, i: number) => (
                            <span key={`a-${i}`} className="px-1.5 py-0.5 bg-blue-900 text-blue-200 rounded text-[10px]">{area}</span>
                          ))}
                          {p.value_dimensions?.slice(0, 1).map((dim: string, i: number) => (
                            <span key={`v-${i}`} className="px-1.5 py-0.5 bg-green-900 text-green-200 rounded text-[10px]">{dim}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} 
                        title="Ta bort idé" 
                        className="text-gray-300 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                      <span className="text-[#fecb00] text-xs font-medium">Se detaljer →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!ideaProjects && selectedMunicipalityId && (
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center mb-2 gap-2">
                <button
                  className="bg-[#224556] border border-gray-600 text-[#fffefa] rounded px-2 py-1 text-xs font-semibold hover:bg-[#2a5a6e] transition-colors"
                  onClick={() => { setSelectedMunicipalityId(null); setSelectedMunicipalityName(null); }}
                  aria-label="Tillbaka"
                >
                  ←
                </button>
                <h2 className="text-lg font-bold text-[#fecb00]">{selectedMunicipalityName}</h2>
              </div>
              <div className="flex gap-4 mb-4 border-b border-gray-600 text-sm font-semibold">
                <button className={`${tab==='areas'?'border-b-2 border-[#fecb00] text-[#fffefa]':'text-gray-400'}`} onClick={()=>setTab('areas')}>Områden</button>
                <button className={`${tab==='value'?'border-b-2 border-[#fecb00] text-[#fffefa]':'text-gray-400'}`} onClick={()=>setTab('value')}>Värdeskapande</button>
              </div>
              {tab==='areas' && (
                <ul className="space-y-2 text-xs">
                  {AREAS.map((area, i) => (
                    <li key={area} className="flex items-center justify-between">
                      <span className="text-[#fffefa]">{area}</span>
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
                      <span className="text-[#fffefa]">{dimension}</span>
                      {bar(valueCounts[i])}
                      <span className="font-bold">{valueCounts[i]}</span>
                    </li>
                  ))}
                </ul>
              )}
              {/* Show list of projects for this municipality - project portal card style */}
              {filteredProjects.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-[#fecb00] text-base">Projekt</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="bg-[#121F2B] border border-gray-600 p-4 rounded-lg hover:bg-[#224556] transition-colors cursor-pointer group shadow" onClick={() => setSelectedProject(project)}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-semibold text-[#fffefa] truncate pr-2 group-hover:text-[#fecb00] transition-colors">{project.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium text-[#fffefa] flex-shrink-0 ${getPhaseColor(project.phase)}`}>{getPhaseLabel(project.phase)}</span>
                          </div>
                        {project.intro && (<p className="text-gray-300 text-xs mb-2 line-clamp-2">{project.intro}</p>)}
                        <div className="space-y-1 text-xs">
                          {project.municipality_info?.length ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[#fecb00] font-medium">Organisation: </span>
                              <span className="text-gray-300">{project.municipality_info.map((m:any) => m.name).join(', ')}</span>
                            </div>
                          ) : null}
                          {project.areas?.length ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[#fecb00] font-medium">Områden: </span>
                              <span className="text-gray-300">{project.areas.slice(0, 2).join(', ')}</span>
                              {project.areas.length > 2 && <span className="text-gray-400"> +{project.areas.length - 2}</span>}
                            </div>
                          ) : null}
                          {project.calculatedMetrics?.budget ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[#fecb00] font-medium">Budget: </span>
                              <span className="text-gray-300">{formatCurrency(Number(project.calculatedMetrics.budget))}</span>
                            </div>
                          ) : null}
                          {project.calculatedMetrics?.roi ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[#fecb00] font-medium">ROI: </span>
                              <span className={`font-semibold ${project.calculatedMetrics.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>{formatPercentage(project.calculatedMetrics.roi)}</span>
                            </div>
                          ) : null}
                        </div>
                        <ProjectScoreBar project={project} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="sticky bottom-0 left-0 w-full">
            <div
              className="bg-[#121f2b] border-t border-gray-600 px-6 pt-4 pb-4 cursor-pointer flex items-center justify-center gap-2 font-semibold text-[#fffefa] hover:bg-[#0e1722] transition-colors select-none"
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
          <section className="w-[34rem] bg-[#1E3A4A] text-[#fffefa] p-6 overflow-y-auto shadow-lg border-l border-gray-600">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-[#fffefa]">{selectedProject.title}</h3>
              <button onClick={() => setSelectedProject(null)}>
                <X size={20} className="text-gray-300 hover:text-[#fffefa]" />
              </button>
            </div>
            <div className="text-sm space-y-3">
              {selectedProject.intro && (
                <p><span className="font-semibold text-[#fecb00]">Beskrivning:</span> {selectedProject.intro}</p>
              )}
              
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-[#fecb00]">Fas:</span>
                <span className={`px-2 py-1 rounded text-[#fffefa] text-xs ${getPhaseColor(selectedProject.phase)}`}>
                  {getPhaseLabel(selectedProject.phase)}
                </span>
              </div>

              {/* Delningspoäng stapel */}
              <ProjectScoreBar project={selectedProject} />

              {/* Sub-tabs for detail sections */}
              <div className="mt-4 mb-2 flex gap-2 text-xs">
                {[
                  {k:'overview', l:'Översikt'},
                  {k:'cost', l:'Kostnad'},
                  {k:'effects', l:'Effekter'},
                  {k:'tech', l:'Teknik'},
                  {k:'leadership', l:'Ledarskap'},
                  {k:'legal', l:'Juridik'}
                ].map(t => (
                  <button key={t.k}
                    onClick={()=>setDetailTab(t.k as any)}
                    className={`px-3 py-1 rounded ${detailTab===t.k?'bg-[#fecb00] text-[#121f2b]':'bg-[#224556] text-gray-200 hover:text-[#fffefa]'}`}
                  >{t.l}</button>
                ))}
              </div>

              {detailTab === 'overview' && (
              <>
              {/* Summary cards mirroring project focus page */}
              {(() => {
                const score = calculateProjectScore(selectedProject as any);
                const roi = (() => {
                  try {
                    return computeROIMetrics({
                      effectEntries: (selectedProject as any)?.effects_data?.effectDetails || [],
                      costEntries: (selectedProject as any)?.cost_data?.actualCostDetails?.costEntries || [],
                      budgetAmount: (selectedProject as any)?.cost_data?.budgetDetails?.budgetAmount || null,
                    });
                  } catch { return null as any; }
                })();
                const isCounty = (selectedProject as any)?.overview_details?.location_type === 'county';
                const countyCodes = (selectedProject as any)?.overview_details?.county_codes || [];
                const municipalityCount = (selectedProject as any)?.project_municipalities?.length || 0;
                const locationCount = isCounty ? countyCodes.length : municipalityCount;
                return (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="border border-gray-600 p-3 rounded text-center">
                      <div className="text-xl font-bold" style={{ color: getScoreBarColor(score.percentage) }}>{score.percentage}%</div>
                      <div className="text-gray-400 text-xs">Delningspoäng</div>
                    </div>
                    <div className="border border-gray-600 p-3 rounded text-center">
                      <div className="text-xl font-bold text-[#fecb00]">{roi ? `${roi.economicROI.toFixed(1)}%` : '—'}</div>
                      <div className="text-gray-400 text-xs">Total ROI</div>
                    </div>
                    <div className="border border-gray-600 p-3 rounded text-center">
                      <div className="text-xl font-bold text-[#fecb00]">{roi ? formatCurrency(roi.totalMonetaryValue || 0) : '—'}</div>
                      <div className="text-gray-400 text-xs">Total nytta</div>
                    </div>
                    <div className="border border-gray-600 p-3 rounded text-center">
                      <div className="text-xl font-bold text-[#fecb00]">{locationCount}</div>
                      <div className="text-gray-400 text-xs">{isCounty ? 'Län' : 'Organisationer'}</div>
                    </div>
                  </div>
                );
              })()}
                              {/* Grundinfo */}
                {(selectedProject as any).overview_details?.location_type === 'county' ? (
                  (selectedProject as any).overview_details?.county_codes?.length > 0 && (
                    <p><span className="font-semibold text-[#fecb00]">Län:</span> {(() => {
                      const countyCodes = (selectedProject as any).overview_details?.county_codes || [];
                      const counties: Record<string, string> = {
                        '01': 'Stockholm', '03': 'Uppsala', '04': 'Södermanland', '05': 'Östergötland',
                        '06': 'Jönköping', '07': 'Kronoberg', '08': 'Kalmar', '09': 'Gotland',
                        '10': 'Blekinge', '12': 'Skåne', '13': 'Halland', '14': 'Västra Götaland',
                        '17': 'Värmland', '18': 'Örebro', '19': 'Västmanland', '20': 'Dalarna',
                        '21': 'Gävleborg', '22': 'Västernorrland', '23': 'Jämtland', '24': 'Västerbotten', '25': 'Norrbotten'
                      };
                      return countyCodes.map((code: string) => counties[code] || code).join(', ');
                    })()}</p>
                  )
                ) : (
                  selectedProject.municipality_info && selectedProject.municipality_info.length > 0 && (
                    <p><span className="font-semibold text-[#fecb00]">Organisationer:</span> {selectedProject.municipality_info.map((m:any)=>m.name).join(', ')}</p>
                  )
                )}
              {selectedProject.areas && selectedProject.areas.length > 0 && (
                <p><span className="font-semibold text-[#fecb00]">Områden:</span> {selectedProject.areas.join(', ')}</p>
              )}
              {selectedProject.value_dimensions && selectedProject.value_dimensions.length > 0 && (
                <p><span className="font-semibold text-[#fecb00]">Värdedimensioner:</span> {selectedProject.value_dimensions.join(', ')}</p>
              )}
              { (selectedProject as any).link && (
                <p className="text-xs"><a href={(selectedProject as any).link} target="_blank" className="text-[#fecb00] underline">Länk till projekt&nbsp;↗</a></p>
              )}
              </>
              )}

              {/* Basic Project Info */}
              {detailTab === 'overview' && (
              <div className="mt-3">
                <h4 className="text-[#fecb00] font-semibold mb-2">Projektinformation</h4>
                {(selectedProject as any).problem && (
                  <div className="mb-3">
                    <span className="font-semibold text-[#fecb00] text-xs">Problem/Utmaning:</span>
                    <p className="text-xs mt-1 text-gray-300">{(selectedProject as any).problem}</p>
                  </div>
                )}
                {(selectedProject as any).opportunity && (
                  <div className="mb-3">
                    <span className="font-semibold text-[#fecb00] text-xs">Möjlighet:</span>
                    <p className="text-xs mt-1 text-gray-300">{(selectedProject as any).opportunity}</p>
                  </div>
                )}
                {(selectedProject as any).responsible && (
                  <div className="mb-3">
                    <span className="font-semibold text-[#fecb00] text-xs">Ansvarig:</span>
                    <p className="text-xs mt-1 text-gray-300">{(selectedProject as any).responsible}</p>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  <p>Skapad: {selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString('sv-SE') : 'Okänt'}</p>
                  {selectedProject.updated_at !== selectedProject.created_at && (
                    <p>Uppdaterad: {new Date(selectedProject.updated_at || '').toLocaleDateString('sv-SE')}</p>
                  )}
                </div>
              </div>
              )}

              {/* Financial Overview */}
              {detailTab === 'cost' && (selectedProject as any).cost_data && (
                <div>
                  <h4 className="text-[#fecb00] font-semibold mb-2">Ekonomisk översikt</h4>
                  {(selectedProject as any).cost_data.budgetDetails?.budgetAmount && (
                    <div className="mb-3">
                      <span className="font-semibold text-[#fecb00] text-xs">Total budget:</span>
                      <p className="text-sm font-bold">{new Intl.NumberFormat('sv-SE').format((selectedProject as any).cost_data.budgetDetails.budgetAmount)} SEK</p>
                    </div>
                  )}
                  
                  {/* Spegling av tabell från projektsidan */}
                  {(() => {
                    const entries = (selectedProject as any).cost_data?.actualCostDetails?.costEntries || [];
                    if (!Array.isArray(entries) || entries.length === 0) return null;
                    const rows = entries.map((entry: any) => {
                      let description = '';
                      let calculation = '';
                      let total = 0;
                      switch (entry?.costUnit) {
                        case 'hours': {
                          const hours = Number(entry.hoursDetails?.hours) || Number(entry.costHours || 0);
                          const rate = Number(entry.hoursDetails?.hourlyRate) || Number(entry.costRate || 0);
                          total = hours * rate;
                          description = entry.costLabel || `${hours} timmar`;
                          calculation = `${new Intl.NumberFormat('sv-SE').format(rate)}/tim × ${hours}h`;
                          break;
                        }
                        case 'fixed': {
                          total = Number(entry.fixedDetails?.fixedAmount) || Number(entry.costFixed || 0);
                          description = entry.costLabel || 'Fast kostnad';
                          calculation = new Intl.NumberFormat('sv-SE').format(total) + ' SEK';
                          break;
                        }
                        case 'monthly': {
                          const monthlyAmount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
                          const monthlyDuration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
                          total = monthlyAmount * monthlyDuration;
                          description = entry.costLabel || `${monthlyDuration} månader`;
                          calculation = `${new Intl.NumberFormat('sv-SE').format(monthlyAmount)}/mån × ${monthlyDuration}mån`;
                          break;
                        }
                        case 'yearly': {
                          const yearlyAmount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
                          const yearlyDuration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
                          total = yearlyAmount * yearlyDuration;
                          description = entry.costLabel || `${yearlyDuration} år`;
                          calculation = `${new Intl.NumberFormat('sv-SE').format(yearlyAmount)}/år × ${yearlyDuration}år`;
                          break;
                        }
                        default: {
                          const hours = Number(entry.costHours || 0);
                          const rate = Number(entry.costRate || 0);
                          total = hours * rate;
                          description = entry.costLabel || (hours ? `${hours} timmar` : 'Kostnad');
                          calculation = hours ? `${new Intl.NumberFormat('sv-SE').format(rate)}/tim × ${hours}h` : new Intl.NumberFormat('sv-SE').format(total) + ' SEK';
                        }
                      }
                      return { entry, description, calculation, total };
                    });
                    const totalSum = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
                    return (
                      <div className="mt-2">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-2 text-[#fecb00] font-medium">Typ</th>
                              <th className="text-left py-2 text-[#fecb00] font-medium">Beskrivning</th>
                              <th className="text-right py-2 text-[#fecb00] font-medium">Beräkning</th>
                              <th className="text-right py-2 text-[#fecb00] font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r, idx) => (
                              <tr key={idx} className="border-b border-gray-800">
                                <td className="py-2 text-[#fffefa]">{r.entry.costUnit === 'hours' ? 'Timmar' : r.entry.costUnit === 'fixed' ? 'Fast' : r.entry.costUnit === 'monthly' ? 'Månadsvis' : r.entry.costUnit === 'yearly' ? 'Årsvis' : '—'}</td>
                                <td className="py-2 text-gray-300">{r.description}</td>
                                <td className="py-2 text-right text-gray-300">{r.calculation}</td>
                                <td className="py-2 text-right text-[#fffefa] font-semibold">{new Intl.NumberFormat('sv-SE').format(r.total)} SEK</td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-[#fecb00]">
                              <td className="py-2 text-[#fecb00] font-bold" colSpan={3}>Total kostnad</td>
                              <td className="py-2 text-right text-[#fecb00] font-bold">{new Intl.NumberFormat('sv-SE').format(totalSum)} SEK</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}

                  {/* ROI Calculation info */}
                  {(selectedProject as any).effects_data?.effectDetails && (
                    <div className="mt-3 p-2 bg-[#0e1722] border border-gray-700 rounded">
                      <span className="font-semibold text-[#fecb00] text-xs">ROI-analys:</span>
                      <p className="text-xs mt-1 text-gray-300">Se fliken Effekter för monetära uppskattningar</p>
                    </div>
                  )}
                    </div>
              )}

              {/* Effects Overview */}
              {detailTab === 'effects' && (
                <div>
                  <h4 className="text-[#fecb00] font-semibold mb-2">Effektanalys</h4>
                  {(() => {
                    const effects = (selectedProject as any)?.effects_data?.effectDetails || [];
                    if (!Array.isArray(effects) || effects.length === 0) return <div className="text-gray-400 text-sm">Inga effekter registrerade</div>;
                    let totalQuant = 0;
                    const rows: any[] = [];
                    effects.forEach((effect: any, idx: number) => {
                      if (effect?.hasQuantitative && effect.quantitativeDetails) {
                        const fin = parseFinancialDetails(effect.quantitativeDetails.financialDetails);
                        const red = parseRedistributionDetails(effect.quantitativeDetails.redistributionDetails);
                        if (fin) { totalQuant += fin.value; rows.push({ name: getEffectName(effect, idx), type: 'Kvantitativ (Finansiell)', description: fin.description, value: fin.value }); }
                        if (red) { totalQuant += red.value; rows.push({ name: getEffectName(effect, idx), type: 'Kvantitativ (Omfördelning)', description: red.description, value: red.value }); }
                      }
                    });
                    // ROI via samma tjänst som projektsidan
                    let roiBlock: any = null;
                    try {
                      const roi = computeROIMetrics({
                        effectEntries: effects,
                        costEntries: (selectedProject as any)?.cost_data?.actualCostDetails?.costEntries || [],
                        budgetAmount: (selectedProject as any)?.cost_data?.budgetDetails?.budgetAmount || null,
                      });
                      if (isFinite(roi.economicROI)) {
                        roiBlock = (
                          <div className="mt-3 text-sm">
                            <span className="font-semibold text-[#fecb00]">ROI: </span>
                            <span className={roi.economicROI >= 0 ? 'text-green-400' : 'text-red-400'}>{roi.economicROI.toFixed(1)}%</span>
                            <span className="text-gray-300 ml-2">Återbetalningstid: {isFinite(roi.paybackPeriod) ? `${roi.paybackPeriod.toFixed(1)} år` : '—'}</span>
                          </div>
                        );
                      }
                    } catch {}

                    return (
                      <>
                        {roiBlock}
                        <div className="overflow-x-auto mt-3">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-gray-700">
                                <th className="text-left py-2 text-[#fecb00] font-medium">Effekt</th>
                                <th className="text-left py-2 text-[#fecb00] font-medium">Typ</th>
                                <th className="text-left py-2 text-[#fecb00] font-medium">Beskrivning</th>
                                <th className="text-right py-2 text-[#fecb00] font-medium">Monetärt värde</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((r, i) => (
                                <tr key={i} className="border-b border-gray-800">
                                  <td className="py-2 text-[#fffefa]">{r.name}</td>
                                  <td className="py-2 text-gray-300">{r.type}</td>
                                  <td className="py-2 text-gray-300">{r.description}</td>
                                  <td className="py-2 text-right text-[#fffefa] font-semibold">{formatCurrency(r.value)}</td>
                                </tr>
                              ))}
                              {totalQuant > 0 && (
                                <tr className="border-t-2 border-[#fecb00]">
                                  <td className="py-2 text-[#fecb00] font-bold" colSpan={3}>Total kvantifierat monetärt värde</td>
                                  <td className="py-2 text-right text-[#fecb00] font-bold">{formatCurrency(totalQuant)}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Leadership & Organization */}
              {detailTab === 'leadership' && (selectedProject as any).leadership_data && Object.keys((selectedProject as any).leadership_data).some(key => (selectedProject as any).leadership_data[key]) && (
                <div>
                  <h4 className="text-[#fecb00] font-semibold mb-2">Organisation & Ledarskap</h4>
                  <div className="space-y-3 text-gray-300">
                    {(selectedProject as any).leadership_data.projectOwnership && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Projektansvar:</span>
                        <p className="text-xs mt-1 text-gray-300">
                          {(selectedProject as any).leadership_data.projectOwnership === 'it' ? 'IT-avdelning' :
                           (selectedProject as any).leadership_data.projectOwnership === 'operations' ? 'Verksamheten' :
                           (selectedProject as any).leadership_data.projectOwnership === 'joint' ? 'Gemensamt ansvar' : 'Annat'}
                        </p>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.organizationalChange && Array.isArray((selectedProject as any).leadership_data.organizationalChange) && (selectedProject as any).leadership_data.organizationalChange.length > 0 && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Organisationsförändringar:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(selectedProject as any).leadership_data.organizationalChange.map((change: string, i: number) => (
                            <span key={i} className="px-1 py-0.5 bg-purple-900 text-purple-200 rounded text-xs">
                              {change}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.staffInvolvement && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Medarbetarinvolvering:</span>
                        <p className="text-xs mt-1">
                          {(selectedProject as any).leadership_data.staffInvolvement === 'early' ? 'Ja, från start' :
                           (selectedProject as any).leadership_data.staffInvolvement === 'later' ? 'Ja, men först senare' : 'Nej'}
                        </p>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.changeManagementEfforts && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Förändringsledning:</span>
                        <p className="text-xs mt-1 text-gray-300">{(selectedProject as any).leadership_data.changeManagementEfforts}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.sdgAlignment && Array.isArray((selectedProject as any).leadership_data.sdgAlignment) && (selectedProject as any).leadership_data.sdgAlignment.length > 0 && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Agenda 2030-mål:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(selectedProject as any).leadership_data.sdgAlignment.map((goal: string, i: number) => (
                            <span key={i} className="px-1 py-0.5 bg-green-900 text-green-200 rounded text-xs">
                              {goal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.nextSteps && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Nästa steg:</span>
                        <p className="text-xs mt-1 text-gray-300">{(selectedProject as any).leadership_data.nextSteps}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).leadership_data.lessonsLearned && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Lärdomar & utmaningar:</span>
                        <p className="text-xs mt-1 text-gray-300">{(selectedProject as any).leadership_data.lessonsLearned}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legal & Security */}
              {detailTab === 'legal' && (selectedProject as any).legal_data && Object.keys((selectedProject as any).legal_data).some(key => (selectedProject as any).legal_data[key]) && (
                <div>
                  <h4 className="text-[#fecb00] font-semibold mb-2">Juridik & Informationssäkerhet</h4>
                  <div className="space-y-3">
                    {(selectedProject as any).legal_data.processes_personal_data && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Behandlar personuppgifter:</span>
                        <p className="text-xs mt-1">{(selectedProject as any).legal_data.processes_personal_data}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.data_categories && Array.isArray((selectedProject as any).legal_data.data_categories) && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Personuppgiftskategorier:</span>
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
                        <span className="font-semibold text-[#fecb00] text-xs">Rättslig grund:</span>
                        <p className="text-xs mt-1">{(selectedProject as any).legal_data.legal_basis}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.dpia_done && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">DPIA genomförd:</span>
                        <p className="text-xs mt-1">{(selectedProject as any).legal_data.dpia_done}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.high_risk_ai && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Högrisk AI (EU-förordning):</span>
                        <p className="text-xs mt-1">{(selectedProject as any).legal_data.high_risk_ai}</p>
                      </div>
                    )}
                    
                    {(selectedProject as any).legal_data.is_open_source && (
                      <div>
                        <span className="font-semibold text-[#fecb00] text-xs">Öppen källkod:</span>
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
                        <span className="font-semibold text-[#fecb00] text-xs">Säkerhetsåtgärder:</span>
                        <p className="text-xs mt-1 text-gray-300">{(selectedProject as any).legal_data.security_measures}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Data */}
              {detailTab === 'tech' && (selectedProject as any).technical_data && Object.keys((selectedProject as any).technical_data).length > 0 && (
                <div>
                  <h4 className="text-[#fecb00] font-semibold mb-2">Teknisk information</h4>
                  <KeyValueList data={(selectedProject as any).technical_data} />
                </div>
              )}

              {/* Legal Data (extra key-value) */}
              {detailTab === 'legal' && (selectedProject as any).legal_data && Object.keys((selectedProject as any).legal_data).length > 0 && (
                <div className="mt-3">
                  <KeyValueList data={(selectedProject as any).legal_data} />
                </div>
              )}

              <div className="mt-4 pt-3 border-t space-x-2">
                <button 
                  onClick={() => handleDelete(selectedProject.id)}
                  className="px-3 py-1 bg-red-500 text-[#fffefa] rounded text-sm font-medium hover:bg-red-600"
                >
                  Ta bort projekt
                </button>
                <button 
                  onClick={() => window.open(`/projects/new?edit=${selectedProject.id}`, '_blank')}
                  className="px-3 py-1 bg-[#224556] text-[#fffefa] rounded text-sm font-medium hover:bg-[#2a5a6e]"
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