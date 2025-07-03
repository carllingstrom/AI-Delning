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
};

export default function OverviewSection({ register, watch, setValue, setError, clearErrors, errors, municipalities }: Props) {
  const selectedAreas = watch('areas') || [];
  const selectedValues = watch('valueDimensions') || [];
  const [municipalityIds, setMunicipalityIds] = useState<string[]>(watch('municipality_ids') || ['']);

  // Add/remove municipality logic
  const addMunicipality = () => setMunicipalityIds([...municipalityIds, '']);
  const removeMunicipality = (idx: number) => setMunicipalityIds(municipalityIds.filter((_, i) => i !== idx));
  const setMunicipality = (idx: number, value: string) => setMunicipalityIds(municipalityIds.map((id, i) => (i === idx ? value : id)));

  // Sync with react-hook-form
  useEffect(() => {
    setValue('municipality_ids', municipalityIds);
    
    // Validate municipality selection
    if (municipalityIds.length === 0 || municipalityIds[0] === '') {
      setError?.('municipality_ids', { message: 'Minst en kommun måste väljas' });
    } else {
      clearErrors?.('municipality_ids');
    }
  }, [municipalityIds, setValue, setError, clearErrors]);

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
      setError?.('valueDimensions', { message: 'Minst en värdeskapande dimension måste väljas' });
    } else {
      clearErrors?.('valueDimensions');
    }
  }, [selectedValues, setError, clearErrors]);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Projektöversikt */}
      <div className="bg-[#121F2B] rounded-lg p-6 space-y-6 shadow">
        <h2 className="text-xl font-bold text-[#FFD600] mb-2">Projektöversikt</h2>
        <div>
          <label className="block font-medium text-white mb-1">
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
          <label className="block font-medium text-white mb-1">
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
          <label className="block font-medium text-white mb-1">Problem</label>
          <textarea 
            {...register('problem')} 
            className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]" 
            rows={2} 
            placeholder="Problem" 
          />
        </div>
        <div>
          <label className="block font-medium text-white mb-1">Möjlighet</label>
          <textarea 
            {...register('opportunity')} 
            className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]" 
            rows={2} 
            placeholder="Möjlighet" 
          />
        </div>
        <div>
          <label className="block font-medium text-white mb-1">
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
      {/* Kommun(er) */}
      <div className="bg-[#121F2B] rounded-lg p-6 space-y-4 shadow">
        <label className="block font-bold text-white">
          Kommun(er) <span className="text-red-400">*</span>
        </label>
        {municipalityIds.map((id, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <select
              className="flex-1 p-3 rounded border border-gray-600 bg-[#121F2B]"
              value={id}
              onChange={(e) => setMunicipality(idx, e.target.value)}
              required={idx === 0} // Make first municipality required
            >
              <option value="">Välj kommun</option>
              {Array.isArray(municipalities) ? municipalities
                .filter((m) => !municipalityIds.includes(m.id.toString()) || m.id.toString() === id)
                .map((m) => (
                  <option key={m.id} value={m.id.toString()}>
                    {m.name}
                  </option>
                )) : (
                  <option value="">Laddar kommuner...</option>
                )}
            </select>
            {municipalityIds.length > 1 && (
              <button type="button" onClick={() => removeMunicipality(idx)} className="w-6 h-6 flex items-center justify-center text-white hover:text-gray-300 transition-colors">
                ×
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addMunicipality} className="px-3 py-1 bg-[#FFD600] text-[#121F2B] rounded mb-2">
          + Lägg till kommun
        </button>
        {errors?.municipality_ids && <p className="text-red-400 text-sm mt-1">{String(errors.municipality_ids.message || 'Minst en kommun måste väljas')}</p>}
      </div>
      {/* Område */}
      <div className="bg-[#121F2B] rounded-lg p-6 space-y-4 shadow">
        <label className="block font-bold text-white">
          Område <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((area) => (
            <button
              type="button"
              key={area}
              className={`px-3 py-1 rounded-full border text-sm font-medium ${selectedAreas.includes(area) ? 'bg-[#FFD600] text-[#121F2B]' : 'bg-[#121F2B] text-white border-gray-600'}`}
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
        <label className="block font-bold text-white">
          Värdeskapande dimension <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {VALUE_DIMENSIONS.map((val) => (
            <button
              type="button"
              key={val}
              className={`px-3 py-1 rounded-full border text-sm font-medium ${selectedValues.includes(val) ? 'bg-[#FFD600] text-[#121F2B]' : 'bg-[#121F2B] text-white border-gray-600'}`}
              onClick={() => {
                const newVals = selectedValues.includes(val) ? selectedValues.filter((v: string) => v !== val) : [...selectedValues, val];
                setValue('valueDimensions', newVals);
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
        {errors?.valueDimensions && <p className="text-red-400 text-sm mt-1">{String(errors.valueDimensions.message || 'Minst en värdeskapande dimension måste väljas')}</p>}
      </div>
      {/* Projektskede */}
      <div className="bg-[#121F2B] rounded-lg p-6 space-y-4 shadow">
        <label className="block font-bold text-white">
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
    </div>
  );
} 