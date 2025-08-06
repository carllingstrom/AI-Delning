'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { OverviewSection, LegalChecklist } from '../../../components/projectForm';
import DynamicFormSection from '../../../components/projectForm/DynamicFormSection';
import { costSectionSchema } from '../../../components/projectForm/schemas/costSchema';
import { costSectionSchemaIdea } from '../../../components/projectForm/schemas/costSchema-idea';
import { dataSections } from '../../../components/projectForm/schemas/dataSchema';
import { legalSections } from '../../../components/projectForm/schemas/legalSchema';
import { legalSectionsIdea } from '../../../components/projectForm/schemas/legalSchema-idea';
import useWizard from '../../../hooks/useWizard';
import { leadershipSchema } from '../../../components/projectForm/schemas/leadershipSchema';
import { createValueCreationSchema } from '../../../components/projectForm/schemas/effectsSchema';

// Step identifiers
const STEPS = [
  'Översikt',
  'Ekonomi & ROI',
  'Effekt & Nytta',
  'Teknik & Data',
  'Organisation & Ledarskap',
  'Juridik & Informationssäkerhet',
];

type StepId = (typeof STEPS)[number];

const BASE_DEFAULTS = {
  title: '',
  intro: '',
  problem: '',
  opportunity: '',
  responsible: '',
  municipality_ids: [''],
  county_codes: [''],
  areas: [],
  value_dimensions: [],
  phase: 'idea',
  effectEntries: [],
  // Add common form fields to prevent TypeScript errors
  hasDedicatedBudget: false,
  budgetDetails: {},
  actualCostDetails: {},
  costEntries: [],
  costSummaryComment: '',
  otherEffectsText: '',
  valueDimensionOther: '',
  // Project expansion fields
  isExpansion: '',
  originalProject: '',
  expansionDetails: '',
  lessonsApplied: '',
  // Add form section defaults to prevent undefined errors
  cost_data: {},
  effects_data: {},
  technical_data: {},
  leadership_data: {},
  legal_data: {},
  overview_details: {},
  // PoV data
  povTimeframe: null,
};

// Auto-save functionality
const saveFormData = async (projectId: string | null, formData: any, step: number) => {
  try {
    // Extract form section data
    const {
      cost_data,
      effects_data,
      technical_data,
      leadership_data,
      legal_data,
      overview_details,
      povTimeframe,
      ...basicData
    } = formData;

    const payload = {
      // Basic project info
      title: basicData.title || 'Untitled Project',
      intro: basicData.intro || '',
      phase: basicData.phase || 'idea',
      problem: basicData.problem || '',
      opportunity: basicData.opportunity || '',
      responsible: basicData.responsible || '',
      areas: basicData.areas || [],
      value_dimensions: basicData.value_dimensions || [],
      municipality_ids: basicData.municipality_ids || [],
      // Form section data - only include if not empty
      ...(cost_data && typeof cost_data === 'object' && Object.keys(cost_data).length > 0 && { cost_data }),
      ...(effects_data && typeof effects_data === 'object' && Object.keys(effects_data).length > 0 && { 
        effects_data: {
          ...effects_data,
          povTimeframe: povTimeframe || effects_data.povTimeframe
        }
      }),
      ...(technical_data && typeof technical_data === 'object' && Object.keys(technical_data).length > 0 && { technical_data }),
      ...(leadership_data && typeof leadership_data === 'object' && Object.keys(leadership_data).length > 0 && { leadership_data }),
      ...(legal_data && typeof legal_data === 'object' && Object.keys(legal_data).length > 0 && { legal_data }),
      ...(overview_details && typeof overview_details === 'object' && Object.keys(overview_details).length > 0 && { overview_details }),
    };

    const url = projectId ? `/api/projects/${projectId}` : '/api/projects';
    const method = projectId ? 'PUT' : 'POST';
    

    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Save failed:', response.status, errorText);
      throw new Error(`Failed to save draft: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.id || projectId;
  } catch (error) {
    console.error('Auto-save failed:', error);
    return projectId; // Return existing ID if save failed
  }
};

// --- Project Wizard Component ---
function ProjectWizardContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;
  
  const methods = useForm({ defaultValues: BASE_DEFAULTS, mode: 'onChange' });
  const { control, handleSubmit, watch, register, setValue, setError, clearErrors, formState: { errors } } = methods;
  const phase = watch('phase');

  const { stepIdx, totalSteps, next, prev } = useWizard(STEPS, phase);
  const [municipalities, setMunicipalities] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [projectId, setProjectId] = useState<string | null>(editId);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save timer
  useEffect(() => {
    const formData = watch();
    const timer = setTimeout(async () => {
      if (Object.keys(formData).length > 0 && formData.title) {
        setIsSaving(true);
        const savedId = await saveFormData(projectId, formData, stepIdx);
        if (savedId && !projectId) {
          setProjectId(savedId);
          // Update URL to include the project ID
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('edit', savedId);
          window.history.replaceState({}, '', newUrl.toString());
          
          // Show success notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
          notification.textContent = 'Projekt skapat och sparat!';
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        }
        setLastSaved(new Date());
        setIsSaving(false);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [watch(), stepIdx, projectId]);

  // Load municipalities
  useEffect(() => {
    fetch('/api/municipalities')
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          console.error(`Municipalities API error (${r.status}):`, text);
          throw new Error(`Municipalities API failed: ${r.status} - ${text}`);
        }
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setMunicipalities(data);
        } else {
          console.error('Municipalities API returned non-array data:', data);
          setMunicipalities([]);
        }
      })
      .catch(error => {
        console.error('Error loading municipalities:', error);
        setMunicipalities([]);
      });
  }, []);

  // Load existing project data if editing
  useEffect(() => {
    if (editId) {
      setIsLoading(true);
      
      // Load both project data and municipality associations
      Promise.all([
        fetch(`/api/projects/${editId}`)
          .then(async r => {
            if (!r.ok) {
              const text = await r.text();
              console.error(`Project API error (${r.status}):`, text);
              throw new Error(`Project API failed: ${r.status} - ${text}`);
            }
            return r.json();
          }),
        fetch(`/api/projects/${editId}/municipalities`)
          .then(async r => {
            if (!r.ok) {
              const text = await r.text();
              console.error(`Project municipalities API error (${r.status}):`, text);
              throw new Error(`Project municipalities API failed: ${r.status} - ${text}`);
            }
            return r.json();
          })
          .catch(() => [])
      ])
        .then(([project, projectMunicipalities]) => {
          console.log('Loaded project for editing:', project);
          
          // Set form values from the loaded project
          setValue('title', project.title || '');
          setValue('intro', project.intro || '');
          setValue('problem', project.problem || '');
          setValue('opportunity', project.opportunity || '');
          setValue('responsible', project.responsible || '');
          setValue('phase', project.phase || 'idea');
          setValue('areas', project.areas || []);
          setValue('value_dimensions', project.value_dimensions || []);
          
          // Set municipality IDs from associations
          const municipalityIds = Array.isArray(projectMunicipalities) 
            ? projectMunicipalities.map((pm: any) => pm.municipality_id?.toString() || pm.id?.toString())
            : [];
          setValue('municipality_ids', municipalityIds.length > 0 ? municipalityIds : ['']);
          
          // Set county codes from overview_details if present
          const countyCodes = project.overview_details?.county_codes || [];
          setValue('county_codes', countyCodes.length > 0 ? countyCodes : ['']);
          
          // Load cost data
          if (project.cost_data) {
            setValue('hasDedicatedBudget', project.cost_data.hasDedicatedBudget);
            setValue('budgetDetails', project.cost_data.budgetDetails);
            setValue('actualCostDetails', project.cost_data.actualCostDetails);
            setValue('costEntries', project.cost_data.costEntries || []);
            setValue('costSummaryComment', project.cost_data.costSummaryComment);
          }
          
          // Load effects data
          if (project.effects_data) {
            setValue('effectEntries', project.effects_data.effectDetails || []);
            setValue('otherEffectsText', project.effects_data.otherEffectsText);
            setValue('povTimeframe', project.effects_data.povTimeframe);
            // Set effects_data for PoV logic
            setValue('effects_data', project.effects_data);
          } else {
            // Initialize empty effects_data for PoV logic
            setValue('effects_data', { effectDetails: [] });
          }
          
          // Load technical data
          if (project.technical_data) {
            Object.keys(project.technical_data).forEach(key => {
              (setValue as any)(key, project.technical_data[key]);
            });
          }
          
          // Load leadership data
          if (project.leadership_data) {
            Object.keys(project.leadership_data).forEach(key => {
              (setValue as any)(key, project.leadership_data[key]);
            });
          }
          
          // Load legal data
          if (project.legal_data) {
            Object.keys(project.legal_data).forEach(key => {
              (setValue as any)(key, project.legal_data[key]);
            });
          }
          
          // Load overview details
          if (project.overview_details) {
            setValue('valueDimensionOther', project.overview_details.valueDimensionOther);
            // Load project expansion data
            setValue('isExpansion', project.overview_details.isExpansion);
            setValue('originalProject', project.overview_details.originalProject);
            setValue('expansionDetails', project.overview_details.expansionDetails);
            setValue('lessonsApplied', project.overview_details.lessonsApplied);
          }
          
          // Set last saved time if available
          if (project.last_saved) {
            setLastSaved(new Date(project.last_saved));
          }
          
          // Set current step if available
          if (project.current_step !== undefined) {
            // Note: We don't change stepIdx here to avoid navigation issues
            // but we could add a "Resume from step X" button
          }
          
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error loading project:', error);
          alert('Fel vid laddning av projekt');
          setIsLoading(false);
        });
    }
  }, [editId, setValue]);

  const onNext = async (data: any) => {
    // Additional validation for overview step
    if (stepIdx === 0) {
      let hasErrors = false;

      // Check location selection (either municipality or county)
      const hasMunicipalities = data.municipality_ids && data.municipality_ids.length > 0 && data.municipality_ids[0] !== '';
      const hasCounties = data.county_codes && data.county_codes.length > 0 && data.county_codes[0] !== '';
      
      if (!hasMunicipalities && !hasCounties) {
        setError('municipality_ids', { message: 'Antingen kommuner eller län måste väljas' });
        setError('county_codes', { message: 'Antingen kommuner eller län måste väljas' });
        hasErrors = true;
      }

      // Check areas selection
      if (!data.areas || data.areas.length === 0) {
        setError('areas', { message: 'Minst ett område måste väljas' });
        hasErrors = true;
      }

      // Check value dimensions selection
          if (!data.value_dimensions || data.value_dimensions.length === 0) {
      setError('value_dimensions', { message: 'Minst en värdeskapande dimension måste väljas' });
        hasErrors = true;
      }

      if (hasErrors) {
        return; // Don't proceed if there are validation errors
      }
    }

    // Always save all form data before proceeding to next step
    try {
      const formData = watch() as any; // Get all form data with flexible typing
      
      // Prepare the payload for the API
      const payload = {
        // Overview data
        title: formData.title,
        intro: formData.intro,
        problem: formData.problem,
        opportunity: formData.opportunity,
        responsible: formData.responsible,
        municipality_ids: formData.municipality_ids?.filter((id: string) => id && id !== '') || [],
        county_codes: formData.county_codes?.filter((code: string) => code && code !== '') || [],
        areas: formData.areas || [],
        value_dimensions: formData.value_dimensions || [], // Note: API expects value_dimensions
        phase: formData.phase || 'idea',
        
        // Form section data (store as JSON)
        cost_data: {
          hasDedicatedBudget: formData.hasDedicatedBudget,
          budgetDetails: formData.budgetDetails,
          actualCostDetails: formData.actualCostDetails,
          costEntries: formData.costEntries || formData.cost_entries || [],
          costSummaryComment: formData.costSummaryComment,
        },
        effects_data: {
          effectDetails: formData.effectEntries || [],
          otherEffectsText: formData.otherEffectsText,
          povTimeframe: formData.povTimeframe,
        },
        technical_data: {
          // Data section
          data_types: formData.data_types,
          data_type_other: formData.data_type_other,
          data_sources: formData.data_sources,
          data_source_other: formData.data_source_other,
          data_sensitivity_level: formData.data_sensitivity_level,
          data_freshness: formData.data_freshness,
          data_quality: formData.data_quality,
          data_license: formData.data_license,
          data_license_link: formData.data_license_link,
          data_description_free: formData.data_description_free,
          // Technical section
          system_name: formData.system_name,
          deployment_environment: formData.deployment_environment,
          deployment_environment_description: formData.deployment_environment_description,
          ai_methodology: formData.ai_methodology,
          integration_capabilities: formData.integration_capabilities,
          integration_capabilities_text: formData.integration_capabilities_text,
          technical_obstacles: formData.technical_obstacles,
          technical_solutions: formData.technical_solutions,
        },
        leadership_data: {
          // Store leadership schema fields directly
          projectOwnership: formData.projectOwnership,
          organizationalChange: formData.organizationalChange,
          staffInvolvement: formData.staffInvolvement,
          changeManagementEfforts: formData.changeManagementEfforts,
          sdgAlignment: formData.sdgAlignment,
          sdgDescription: formData.sdgDescription,
          nextSteps: formData.nextSteps,
          lessonsLearned: formData.lessonsLearned,
        },
        legal_data: {
          // Full legal schema fields
          processes_personal_data: formData.processes_personal_data,
          data_categories: formData.data_categories,
          legal_basis: formData.legal_basis,
          dpia_done: formData.dpia_done,
          data_controller: formData.data_controller,
          processor_agreement: formData.processor_agreement,
          procurement_type: formData.procurement_type,
          reusable_contract: formData.reusable_contract,
          supplier_contract_clauses: formData.supplier_contract_clauses,
          high_risk_ai: formData.high_risk_ai,
          ce_marked: formData.ce_marked,
          fundamental_rights_assessment: formData.fundamental_rights_assessment,
          data_access_rights: formData.data_access_rights,
          is_open_source: formData.is_open_source,
          open_source_link: formData.open_source_link,
          accessibility: formData.accessibility,
          security_measures: formData.security_measures,
          // IDEA version fields (backward compatibility)
          gdpr_assessment: formData.gdpr_assessment,
          data_privacy: formData.data_privacy,
          legal_review: formData.legal_review,
        },
        overview_details: {
          valueDimensionOther: formData.valueDimensionOther,
          location_type: formData.location_type,
          county_codes: formData.county_codes,
          // Project expansion data
          isExpansion: formData.isExpansion,
          originalProject: formData.originalProject,
          expansionDetails: formData.expansionDetails,
          lessonsApplied: formData.lessonsApplied,
        }
      };

      // If this is the last step, submit the project
      if (stepIdx === totalSteps - 1) {
        // Submit to API - use PUT for editing, POST for creating
        const url = isEditing ? `/api/projects/${editId}` : '/api/projects';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'save'} project`);
        }

        const project = await response.json();
        
        // Success! Redirect to project page or show success message
        alert(isEditing ? 'Projektet har uppdaterats!' : 'Projektet har sparats!');
        window.location.href = '/projects'; // Redirect to project page to see the new project
        
      } else {
        // Save as draft and continue to next step
        const url = isEditing ? `/api/projects/${editId}` : '/api/projects';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'save'} project`);
        }

        const savedProject = await response.json();
        
        // Update project ID if this is a new project
        if (!isEditing && savedProject.id) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('edit', savedProject.id);
          window.history.replaceState({}, '', newUrl.toString());
        }
        
        // Continue to next step
        next();
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'saving'} project:`, error);
      alert(`Fel vid ${isEditing ? 'uppdatering' : 'sparande'} av projekt: ` + (error instanceof Error ? error.message : 'Okänt fel'));
    }
  };

  const onBack = () => prev();

  const renderStep = () => {
    // Get selected value dimensions for dynamic effects schema
    const selectedValueDimensions = watch('value_dimensions') || [];
    const dynamicEffectsSchema = createValueCreationSchema(selectedValueDimensions);
    
    // For 'idea' phase, use IDEA-specific schemas where needed
    if (phase === 'idea') {
      switch (stepIdx) {
        case 0: return <OverviewSection register={register} watch={watch} setValue={setValue} setError={setError} clearErrors={clearErrors} errors={errors} municipalities={municipalities} isEditing={isEditing} />;
        case 1: return <DynamicFormSection schema={costSectionSchemaIdea} {...methods} />;
        case 2: return <DynamicFormSection schema={dynamicEffectsSchema} {...methods} />;
        case 3: return <LegalChecklist sections={dataSections as any} {...methods} />;
        case 4: return <DynamicFormSection schema={leadershipSchema} {...methods} />;
        case 5: return <LegalChecklist sections={legalSectionsIdea as any} {...methods} />;
        default: return null;
      }
    }

    // Full flow for other phases
    switch (stepIdx) {
      case 0: return <OverviewSection register={register} watch={watch} setValue={setValue} setError={setError} clearErrors={clearErrors} errors={errors} municipalities={municipalities} isEditing={isEditing} />;
      case 1: return <DynamicFormSection schema={costSectionSchema} {...methods} />;
      case 2: return <DynamicFormSection schema={dynamicEffectsSchema} {...methods} />;
      case 3: return <LegalChecklist sections={dataSections as any} {...methods} />;
      case 4: return <DynamicFormSection schema={leadershipSchema} {...methods} />;
      case 5: return <LegalChecklist sections={legalSections as any} {...methods} />;
      default: return null;
    }
  };

  // Show loading state while loading project data
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#121F2B] text-[#fffefa]">
        <div className="text-center">
          <div className="text-xl mb-4 text-[#fecb00]">Laddar projekt...</div>
          <div className="w-8 h-8 border-2 border-[#fecb00] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="min-h-screen flex justify-center items-start p-6 bg-[#121F2B] text-[#fffefa]">
      <div className="w-full max-w-5xl bg-[#121F2B] rounded-lg shadow-lg p-8 px-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#fecb00]">
            {isEditing ? 'Redigera projekt' : 'Nytt projekt'}
          </h1>
          
          {/* Auto-save indicator */}
          <div className="flex items-center gap-2 text-sm">
            {isSaving && (
              <div className="flex items-center gap-2 text-[#fecb00]">
                <div className="w-4 h-4 border-2 border-[#fecb00] border-t-transparent rounded-full animate-spin"></div>
                <span>Sparar...</span>
              </div>
            )}
            {lastSaved && !isSaving && (
              <div className="text-gray-400">
                Senast sparad: {lastSaved.toLocaleTimeString('sv-SE')}
              </div>
            )}
            {projectId && (
              <div className="text-xs bg-[#224556] px-2 py-1 rounded text-gray-300">
                ID: {projectId}
              </div>
            )}
          </div>
        </div>
        
        <div className="h-2 bg-[#224556] rounded mb-8">
          <div className="h-2 bg-[#fecb00] rounded" style={{ width: `${((stepIdx + 1) / totalSteps) * 100}%` }} />
        </div>
        
        {renderStep()}

        <div className="flex justify-between gap-4 mt-8">
          {stepIdx > 0 && (
            <button type="button" onClick={onBack} className="px-4 py-2 bg-[#224556] text-[#fffefa] rounded font-bold">Tillbaka</button>
          )}
          {stepIdx < totalSteps - 1 && (
            <button type="submit" className={`px-6 py-2 rounded bg-[#fecb00] text-[#181A1B] font-bold shadow hover:bg-[#fecb00] transition ${stepIdx === 0 ? 'ml-auto' : ''}`}>Spara & Nästa</button>
          )}
          {stepIdx === totalSteps - 1 && (
            <button type="submit" className="px-6 py-2 rounded bg-[#fecb00] text-[#181A1B] font-bold shadow hover:bg-[#fecb00] transition">
              {isEditing ? 'Uppdatera projekt' : 'Spara projekt'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default function NewProjectWizard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex justify-center items-center bg-[#121F2B] text-[#fffefa]">
        <div className="text-center">
          <div className="text-xl mb-4 text-[#fecb00]">Laddar projekt...</div>
          <div className="w-8 h-8 border-2 border-[#fecb00] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    }>
      <ProjectWizardContent />
    </Suspense>
  );
}