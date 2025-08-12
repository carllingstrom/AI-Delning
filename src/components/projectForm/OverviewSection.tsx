import { useState, useEffect } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue, UseFormSetError, UseFormClearErrors, FieldErrors } from 'react-hook-form';
import { AREAS, VALUE_DIMENSIONS, PROJECT_PHASES } from '../../constants/projectForm';
import React from 'react';

type Props = {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  setError?: UseFormSetError<any>;
  clearErrors?: UseFormClearErrors<any>;
  errors?: FieldErrors<any>;
  municipalities: { id: number; name: string }[];
  isEditing?: boolean;
};

export default function OverviewSection({ register, watch, setValue, setError, clearErrors, errors, municipalities, isEditing = false }: Props) {
  const selectedAreas = watch('areas') || [];
  const selectedValues = watch('value_dimensions') || [];
  const [municipalityIds, setMunicipalityIds] = useState<string[]>(watch('municipality_ids') || ['']);
  
  // New state for region/county selection
  const [locationMode, setLocationMode] = useState<'municipality' | 'county'>('municipality');
  const [countyCodes, setCountyCodes] = useState<string[]>(watch('county_codes') || ['']);
  const [counties, setCounties] = useState<{ code: string; name: string }[]>([]);

  // Load counties when component mounts
  useEffect(() => {
    fetch('/api/counties')
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          console.error(`Counties API error (${r.status}):`, text);
          throw new Error(`Counties API failed: ${r.status} - ${text}`);
        }
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCounties(data);
        } else {
          console.error('Counties API returned non-array data:', data);
          setCounties([]);
        }
      })
      .catch(error => {
        console.error('Error loading counties:', error);
        setCounties([]);
      });
  }, []);

  // Set location mode based on existing data when editing
  useEffect(() => {
    const currentCountyCodes = watch('county_codes') || [];
    const currentMunicipalityIds = watch('municipality_ids') || [];
    
    // If we have county codes and no municipality IDs, switch to county mode
    if (currentCountyCodes.length > 0 && currentCountyCodes[0] !== '' && 
        (currentMunicipalityIds.length === 0 || currentMunicipalityIds[0] === '')) {
      setLocationMode('county');
    }
  }, [watch]);

  // Add/remove municipality logic
  const addMunicipality = () => setMunicipalityIds([...municipalityIds, '']);
  const removeMunicipality = (idx: number) => setMunicipalityIds(municipalityIds.filter((_, i) => i !== idx));
  const setMunicipality = (idx: number, value: string) => setMunicipalityIds(municipalityIds.map((id, i) => (i === idx ? value : id)));

  // Add/remove county logic
  const addCounty = () => setCountyCodes([...countyCodes, '']);
  const removeCounty = (idx: number) => setCountyCodes(countyCodes.filter((_, i) => i !== idx));
  const setCounty = (idx: number, value: string) => setCountyCodes(countyCodes.map((code, i) => (i === idx ? value : code)));

  // Handle location mode toggle
  const handleLocationModeChange = (mode: 'municipality' | 'county') => {
    setLocationMode(mode);
    if (mode === 'municipality') {
      // Clear county data and ensure municipality has at least one entry
      setCountyCodes(['']);
      setValue('county_codes', ['']);
      if (municipalityIds.length === 0 || municipalityIds[0] === '') {
        setMunicipalityIds(['']);
      }
    } else {
      // Clear municipality data and ensure county has at least one entry
      setMunicipalityIds(['']);
      setValue('municipality_ids', ['']);
      if (countyCodes.length === 0 || countyCodes[0] === '') {
        setCountyCodes(['']);
      }
    }
  };

  // Sync municipality data with react-hook-form
  useEffect(() => {
    setValue('municipality_ids', locationMode === 'municipality' ? municipalityIds : ['']);
    setValue('location_type', locationMode); // Save location_type for detail page
    
    // Validate municipality selection
    if (locationMode === 'municipality') {
      if (municipalityIds.length === 0 || municipalityIds[0] === '') {
        setError?.('municipality_ids', { message: 'Minst en organisation måste väljas' });
      } else {
        clearErrors?.('municipality_ids');
      }
    } else {
      clearErrors?.('municipality_ids');
    }
  }, [municipalityIds, locationMode, setValue, setError, clearErrors]);

  // Sync county data with react-hook-form
  useEffect(() => {
    setValue('county_codes', locationMode === 'county' ? countyCodes : ['']);
    setValue('location_type', locationMode); // Save location_type for detail page
    
    // Validate county selection
    if (locationMode === 'county') {
      if (countyCodes.length === 0 || countyCodes[0] === '') {
        setError?.('county_codes', { message: 'Minst ett län måste väljas' });
      } else {
        clearErrors?.('county_codes');
      }
    } else {
      clearErrors?.('county_codes');
    }
  }, [countyCodes, locationMode, setValue, setError, clearErrors]);

  // Validate areas selection
  useEffect(() => {
    if (selectedAreas.length === 0) {
      setError?.('areas', { message: 'Minst ett område måste väljas' });
    } else {
      clearErrors?.('areas');
    }
  }, [selectedAreas, setError, clearErrors]);

  // Validate value dimensions selection
  useEffect(() => {
    if (selectedValues.length === 0) {
      setError?.('value_dimensions', { message: 'Minst en värdeskapande dimension måste väljas' });
    } else {
      clearErrors?.('value_dimensions');
    }
  }, [selectedValues, setError, clearErrors]);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Projektöversikt */}
      <div className="bg-[#121F2B] rounded-lg p-6 space-y-6 shadow">
        <h2 className="text-xl font-bold text-[#fecb00] mb-2">Projektöversikt</h2>
        <div>
          <label className="block font-medium text-[#fffefa] mb-1">
            Titel <span className="text-red-400">*</span>
          </label>
          <input 
            {...register('title', { required: 'Titel är obligatorisk' })} 
            className="w-full p-3 rounded border border-gray-600 bg-[#121F2B] text-lg" 
            placeholder="Titel" 
          />
          {errors?.title && <p className="text-red-400 text-sm mt-1">{String(errors.title.message || 'Detta fält är obligatoriskt')}</p>}
        </div>
        <div>
          <label className="block font-medium text-[#fffefa] mb-1">
            Intro till projektet <span className="text-red-400">*</span>
          </label>
          <textarea 
            {...register('intro', { required: 'Intro är obligatorisk' })} 
            className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]" 
            rows={3} 
            placeholder="Intro till projektet (2–4 rader)" 
          />
          {errors?.intro && <p className="text-red-400 text-sm mt-1">{String(errors.intro.message || 'Detta fält är obligatoriskt')}</p>}
        </div>
        <div>
          <label className="block font-medium text-[#fffefa] mb-1">Problem</label>
          <textarea 
            {...register('problem')} 
            className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]" 
            rows={2} 
            placeholder="Problem" 
          />
        </div>
        <div>
          <label className="block font-medium text-[#fffefa] mb-1">Möjlighet</label>
          <textarea 
            {...register('opportunity')} 
            className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]" 
            rows={2} 
            placeholder="Möjlighet" 
          />
        </div>
        <div>
          <label className="block font-medium text-[#fffefa] mb-1">
            Ansvarig för implementationen <span className="text-red-400">*</span>
          </label>
          <input 
            {...register('responsible', { required: 'Ansvarig är obligatorisk' })} 
            className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]" 
            placeholder="Ansvarig för implementationen" 
          />
          {errors?.responsible && <p className="text-red-400 text-sm mt-1">{String(errors.responsible.message || 'Detta fält är obligatoriskt')}</p>}
        </div>
      </div>
      
      {/* Location Selection (Municipality or County) */}
      <div className="bg-[#121F2B] rounded-lg p-6 space-y-4 shadow">
        <label className="block font-bold text-[#fffefa]">
          Geografisk omfattning <span className="text-red-400">*</span>
        </label>
        
        {/* Toggle between Municipality and County */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              locationMode === 'municipality' 
                ? 'bg-[#fecb00] text-[#121F2B]' 
                : 'bg-gray-600 text-[#fffefa] hover:bg-gray-500'
            }`}
            onClick={() => handleLocationModeChange('municipality')}
          >
            Organisation(er)
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              locationMode === 'county' 
                ? 'bg-[#fecb00] text-[#121F2B]' 
                : 'bg-gray-600 text-[#fffefa] hover:bg-gray-500'
            }`}
            onClick={() => handleLocationModeChange('county')}
          >
            Län
          </button>
        </div>

        {/* Municipality Selection */}
        {locationMode === 'municipality' && (
          <div>
            <label className="block text-[#fffefa] text-sm mb-2">
              Välj en eller flera organisationer
            </label>
            {municipalityIds.map((id, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <select
                  className="flex-1 p-3 rounded border border-gray-600 bg-[#121F2B]"
                  value={id}
                  onChange={(e) => setMunicipality(idx, e.target.value)}
                  required={idx === 0}
                >
                  <option value="">Välj organisation</option>
                  {Array.isArray(municipalities) ? municipalities
                    .filter((m) => !municipalityIds.includes(m.id.toString()) || m.id.toString() === id)
                    .map((m) => (
                      <option key={m.id} value={m.id.toString()}>
                        {m.name}
                      </option>
                    )) : (
                      <option value="">Laddar organisationer...</option>
                    )}
                </select>
                {municipalityIds.length > 1 && (
                  <button type="button" onClick={() => removeMunicipality(idx)} className="w-6 h-6 flex items-center justify-center text-[#fffefa] hover:text-gray-300 transition-colors">
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addMunicipality} className="px-3 py-1 bg-[#fecb00] text-[#121F2B] rounded mb-2">
              + Lägg till organisation
            </button>
            {errors?.municipality_ids && <p className="text-red-400 text-sm mt-1">{String(errors.municipality_ids.message || 'Minst en organisation måste väljas')}</p>}
          </div>
        )}

        {/* County Selection */}
        {locationMode === 'county' && (
          <div>
            <label className="block text-[#fffefa] text-sm mb-2">
              Välj ett eller flera län
            </label>
            {countyCodes.map((code, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <select
                  className="flex-1 p-3 rounded border border-gray-600 bg-[#121F2B]"
                  value={code}
                  onChange={(e) => setCounty(idx, e.target.value)}
                  required={idx === 0}
                >
                  <option value="">Välj län</option>
                  {counties
                    .filter((c) => !countyCodes.includes(c.code) || c.code === code)
                    .map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                </select>
                {countyCodes.length > 1 && (
                  <button type="button" onClick={() => removeCounty(idx)} className="w-6 h-6 flex items-center justify-center text-[#fffefa] hover:text-gray-300 transition-colors">
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addCounty} className="px-3 py-1 bg-[#fecb00] text-[#121F2B] rounded mb-2">
              + Lägg till län
            </button>
            {errors?.county_codes && <p className="text-red-400 text-sm mt-1">{String(errors.county_codes.message || 'Minst ett län måste väljas')}</p>}
          </div>
        )}
      </div>

      {/* Område */}
      <div className="bg-[#121F2B] rounded-lg p-6 space-y-4 shadow">
        <label className="block font-bold text-[#fffefa]">
          Område <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((area) => (
            <button
              type="button"
              key={area}
              className={`px-3 py-1 rounded-full border text-sm font-medium ${selectedAreas.includes(area) ? 'bg-[#fecb00] text-[#121F2B]' : 'bg-[#121F2B] text-[#fffefa] border-gray-600'}`}
              onClick={() => {
                const newAreas = selectedAreas.includes(area) ? selectedAreas.filter((a: string) => a !== area) : [...selectedAreas, area];
                setValue('areas', newAreas);
              }}
            >
              {area}
            </button>
          ))}
        </div>
        {errors?.areas && <p className="text-red-400 text-sm mt-1">{String(errors.areas.message || 'Minst ett område måste väljas')}</p>}
      </div>
      {/* Värdeskapande dimension */}
      <div className="bg-[#121F2B] rounded-lg p-6 space-y-4 shadow">
        <label className="block font-bold text-[#fffefa]">
          Värdeskapande dimension <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {VALUE_DIMENSIONS.map((val) => (
            <button
              type="button"
              key={val}
              className={`px-3 py-1 rounded-full border text-sm font-medium ${selectedValues.includes(val) ? 'bg-[#fecb00] text-[#121F2B]' : 'bg-[#121F2B] text-[#fffefa] border-gray-600'}`}
              onClick={() => {
                const newVals = selectedValues.includes(val) ? selectedValues.filter((v: string) => v !== val) : [...selectedValues, val];
                setValue('value_dimensions', newVals);
              }}
            >
              {val}
            </button>
          ))}
        </div>
        {/* Fritext om "Annat" */}
        {selectedValues.includes('Annat') && (
          <input
            {...register('valueDimensionOther')}
            className="w-full p-2 rounded border border-gray-600 bg-[#121F2B] mt-2"
            placeholder="Beskriv annan typ av värdeskapande"
          />
        )}
        {errors?.value_dimensions && <p className="text-red-400 text-sm mt-1">{String(errors.value_dimensions.message || 'Minst en värdeskapande dimension måste väljas')}</p>}
      </div>
      {/* Projektskede */}
      <div className="bg-[#121F2B] rounded-lg p-6 space-y-4 shadow">
        <label className="block font-bold text-[#fffefa]">
          Projektskede <span className="text-red-400">*</span>
        </label>
        <select {...register('phase', { required: 'Projektskede är obligatoriskt' })} className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]">
          {PROJECT_PHASES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Project Expansion - Only show when editing */}
      {isEditing && (
        <div className="bg-[#121F2B] rounded-lg p-6 space-y-4 shadow">
          <label className="block font-bold text-[#fffefa]">
            Projektutvidgning
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-[#fffefa] text-sm mb-2">
                Är detta en utvidgning eller fortsättning av ett befintligt projekt?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register('isExpansion')}
                    value="yes"
                    className="mr-2"
                  />
                  <span className="text-[#fffefa]">Ja</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register('isExpansion')}
                    value="no"
                    className="mr-2"
                  />
                  <span className="text-[#fffefa]">Nej</span>
                </label>
              </div>
            </div>
            
            {watch('isExpansion') === 'yes' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[#fffefa] text-sm mb-2">
                    Vad är det ursprungliga projektet?
                  </label>
                  <input
                    {...register('originalProject')}
                    className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]"
                    placeholder="Beskriv det ursprungliga projektet"
                  />
                </div>
                
                <div>
                  <label className="block text-[#fffefa] text-sm mb-2">
                    Vad är nytt i denna utvidgning?
                  </label>
                  <textarea
                    {...register('expansionDetails')}
                    className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]"
                    rows={3}
                    placeholder="Beskriv vad som är nytt eller förändrat i denna utvidgning"
                  />
                </div>
                
                <div>
                  <label className="block text-[#fffefa] text-sm mb-2">
                    Vilka lärdomar från det ursprungliga projektet används?
                  </label>
                  <textarea
                    {...register('lessonsApplied')}
                    className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]"
                    rows={3}
                    placeholder="Beskriv vilka lärdomar från det ursprungliga projektet som används"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 