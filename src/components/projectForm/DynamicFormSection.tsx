import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue, Control, useFieldArray } from 'react-hook-form';
import ROISummary from './ROISummary';

export type Question = {
  id: string;
  type: 'radio' | 'checkbox' | 'select' | 'textarea' | 'text' | 'number' | 'repeat' | 'group' | 'multiSelect';
  label: string;
  options?: (string | { value: any; label: string })[];
  placeholder?: string;
  condition?: {
    id: string;
    value: any;
    op?: 'contains' | 'equals';
  } | {
    type: 'custom';
    evaluate: (formData: any) => boolean;
  };
  repeatFor?: string;
  questions?: Question[];
  itemLabelField?: string | null;
  optional?: boolean;
  addLabel?: string;
  summary?: (items: any[]) => React.ReactNode;
};

export type RepeatGroup = {
  name: string; // field array name in form data
  itemFields: Question[];
  addLabel?: string;
  summary?: (items: any[]) => React.ReactNode;
};

export type SectionSchema = {
  title: string;
  questions?: Question[];
  condition?: (formValues: any) => boolean;
};

type Props = {
  schema: SectionSchema;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  control: Control<any>;
};

// Separate component for repeat fields to handle hooks properly
function RepeatField({ 
  fieldId, 
  question, 
  watch, 
  control, 
  renderQuestion 
}: { 
  fieldId: string; 
  question: Question; 
  watch: UseFormWatch<any>; 
  control: Control<any>;
  renderQuestion: (q: Question, parentPath: string) => React.ReactNode;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: fieldId });
  const hasInitialized = React.useRef(false);
  
  // Ensure at least one entry exists, but only if there are truly no entries
  React.useEffect(() => {
    // Only add an initial entry if there are no fields at all and we haven't initialized yet
    if (fields.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      append({});
    }
  }, [fields.length, append]);

  return (
    <div className="space-y-4">
      <label className="block font-medium text-lg">{question.label}</label>
      {fields.map((item: any, index: number) => (
        <div key={item.id} className="bg-[#121F2B] rounded p-4 relative pt-8 border border-gray-700">
          <div className="space-y-4">
            {question.questions?.map(subQ => (
              <React.Fragment key={subQ.id}>
                {renderQuestion(subQ, `${fieldId}.${index}.`)}
              </React.Fragment>
            ))}
          </div>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-[#fffefa] hover:text-gray-300 transition-colors"
              aria-label="Remove item"
            >
              ×
            </button>
          )}
        </div>
      ))}
      
      {/* Check if first cost entry has required fields filled before showing add button */}
      {(() => {
        const firstEntry = watch(`${fieldId}.0`) || {};
        

        
        // For cost entries: require costType, costLabel, costUnit, and at least one cost value
        // Check nested fields based on costUnit
        let hasCostValue = false;
        if (firstEntry.costUnit === 'hours') {
          hasCostValue = firstEntry.hoursDetails?.hours || firstEntry.hoursDetails?.hourlyRate;
        } else if (firstEntry.costUnit === 'fixed') {
          hasCostValue = firstEntry.fixedDetails?.fixedAmount;
        } else if (firstEntry.costUnit === 'monthly') {
          hasCostValue = firstEntry.monthlyDetails?.monthlyAmount || firstEntry.monthlyDetails?.monthlyDuration;
        } else if (firstEntry.costUnit === 'yearly') {
          hasCostValue = firstEntry.yearlyDetails?.yearlyAmount || firstEntry.yearlyDetails?.yearlyDuration;
        }
        
        const hasRequiredFields = firstEntry.costType && 
                                 firstEntry.costLabel && 
                                 firstEntry.costUnit && 
                                 hasCostValue;
        
        // For effect entries: require at least one effect type (qualitative or quantitative)
        // Handle both boolean and string values from form
        const hasRequiredEffectFields = (firstEntry.hasQualitative === true || firstEntry.hasQualitative === 'true' || 
                                        firstEntry.hasQuantitative === true || firstEntry.hasQuantitative === 'true');
        
        
        // Show add button if either cost or effect requirements are met
        const canAddMore = hasRequiredFields || hasRequiredEffectFields;
        

        
        return canAddMore && (
          <button
            type="button"
            onClick={() => append({})}
            className="px-4 py-2 mt-2 bg-gray-700 hover:bg-gray-600 text-[#fffefa] rounded font-bold"
          >
            {question.addLabel || 'Add'}
          </button>
        );
      })()}
      
      {question.summary && question.summary(watch(fieldId))}
    </div>
  );
}

export default function DynamicFormSection({ schema, register, watch, setValue, control }: Props) {
  // Evaluate section-level condition
  if (schema.condition) {
    const formValues = watch(); // get entire form values
    if (!schema.condition(formValues)) return null;
  }

  // Check if this section contains effectEntries (for ROI summary)
  const effectEntries = watch('effectEntries') || [];
  const costEntries = watch('actualCostDetails.costEntries') || [];
  
  // For idea projects, get budget from form data
  const budgetAmount = watch('budgetDetails.budgetAmount') || watch('cost_data.budgetDetails.budgetAmount');
  const budgetEntries = budgetAmount ? [{ costUnit: budgetAmount.toString() }] : [];
  
  // Use cost entries if available, otherwise use budget for idea projects
  const roiCostEntries = costEntries.length > 0 ? costEntries : budgetEntries;
  
  // Check if this section has effectEntries field (for ROI summary)
  const hasEffectEntries = schema.questions?.some(q => q.id === 'effectEntries');
  
  // Check if we have effect entries and if they have the required fields
  const hasEffectData = effectEntries && effectEntries.length > 0;
  
  // Check if effect entries have actual data (not just empty objects)
  const hasEffectDataContent = effectEntries.some((entry: any) => {
    return entry && (
      entry.valueDimension ||
      entry.hasQualitative ||
      entry.hasQuantitative ||
      entry.qualitativeDetails ||
      entry.quantitativeDetails ||
      entry.comment
    );
  });

  const firstEntry = hasEffectData ? effectEntries[0] : null;
  const hasRequiredEffectFields = firstEntry && 
    (firstEntry.valueDimension || 
     firstEntry.hasQualitative || 
     firstEntry.hasQuantitative);
  


  // Check if we have cost entries
  const hasCostEntries = costEntries && costEntries.length > 0;

  // Determine if we should show this section
  const shouldShow = schema.title === 'Effekter' ? hasEffectData :
                    schema.title === 'Kostnader' ? hasCostEntries :
                    true;

  // Check if we should show ROI summary (only for effects section with effectEntries field)
  const shouldShowROISummary = (schema.title === 'Effekter & ROI-uppskattning' || schema.title === 'Effekter') && hasEffectEntries;

  if (!shouldShow) {
    return null;
  }

  const handleInfoClick = () => {
    window.dispatchEvent(new CustomEvent('openROIInfo'));
  };

  function renderQuestion(q: Question, parentPath = ''): React.ReactNode {
    // 1. Handle conditional rendering
    if (q.condition) {
      let isVisible = false;
      
      if ('type' in q.condition && q.condition.type === 'custom') {
        // Custom condition evaluation
        console.log('🔍 Evaluating custom condition for question:', q.id);
        const formData = watch();
        isVisible = q.condition.evaluate(formData);
        console.log('🔍 Custom condition result:', isVisible);
      } else if ('id' in q.condition) {
        // Standard condition evaluation
        const condPath = q.condition.id.includes('.') ? q.condition.id : `${parentPath}${q.condition.id}`;
        const operator = q.condition.op || 'equals';
        const watchValue = watch(condPath);

        if (operator === 'equals') {
          isVisible = String(watchValue) === String(q.condition.value);
        } else if (operator === 'contains') {
          isVisible = Array.isArray(watchValue) && watchValue.includes(q.condition.value);
        }
      }
      
      if (!isVisible) return null;
    }

    const fieldId = `${parentPath}${q.id}`;

    // 2. Handle structural question types
    if (q.type === 'repeat') {
      // Branch for useFieldArray logic (no repeatFor)
      if (!q.repeatFor) {
        return (
          <RepeatField
            fieldId={fieldId}
            question={q}
            watch={watch}
            control={control}
            renderQuestion={renderQuestion}
          />
        );
      }
      
      // Legacy logic for repeating based on another field's value
      const repeatSourceArray = watch(q.repeatFor || '') || [];
      return (
        <div className="space-y-4">
          <label className="block font-medium">{q.label}</label>
          {repeatSourceArray.map((item: any, idx: number) => {
            const itemLabel = typeof item === 'string' ? item : item?.[q.itemLabelField || 'label'];
            return (
              <div key={itemLabel || idx} className="bg-[#121F2B] rounded p-4 border border-gray-700">
                {itemLabel && <h3 className="text-lg font-semibold text-[#fecb00] mb-3">{itemLabel}</h3>}
                <div className="space-y-4">
                  {q.questions?.map(subQ => (
                    <React.Fragment key={subQ.id}>
                      {renderQuestion(subQ, `${fieldId}.${idx}.`)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    if (q.type === 'group') {
      const groupPath = `${parentPath}${q.id}.`;
      return (
        <div className="p-4 border border-gray-700 rounded-lg space-y-4">
          <h4 className="font-bold text-[#fffefa]">{q.label}</h4>
          {q.questions?.map(subQ => (
            <React.Fragment key={subQ.id}>
              {renderQuestion(subQ, groupPath)}
            </React.Fragment>
          ))}
        </div>
      );
    }
    
    // 3. Handle leaf question types (inputs)
    return (
      <div className="space-y-2">
        <label className="block font-medium">{q.label}</label>
        
        {q.type === 'radio' && q.options && (
          <div className="flex flex-wrap gap-4">
            {q.options.map((opt) => {
              const optionValue = typeof opt === 'object' ? opt.value : opt;
              const optionLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <label key={String(optionValue)} className="flex items-center gap-2">
                  <input type="radio" value={optionValue} {...register(fieldId)} className="accent-[#fecb00]" />
                  {optionLabel}
                </label>
              );
            })}
          </div>
        )}

        {q.type === 'checkbox' && q.options && (
          <div className="flex flex-col space-y-2">
            {q.options.map((opt) => {
              const optionValue = typeof opt === 'object' ? opt.value : opt;
              const optionLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <label key={String(optionValue)} className="flex items-center gap-2">
                  <input type="checkbox" value={optionValue} {...register(fieldId)} className="accent-[#fecb00]" />
                  {optionLabel}
                </label>
              );
            })}
          </div>
        )}

        {q.type === 'multiSelect' && q.options && (
          <div className="flex flex-col space-y-2">
            {q.options.map((opt) => {
              const optionValue = typeof opt === 'object' ? opt.value : opt;
              const optionLabel = typeof opt === 'object' ? opt.label : opt;
              const currentValues = watch(fieldId) || [];
              const isSelected = currentValues.includes(optionValue);
              
              return (
                <button
                  key={String(optionValue)}
                  type="button"
                  className={`flex items-center gap-2 px-3 py-2 rounded text-left transition-colors ${
                    isSelected 
                      ? 'bg-[#fecb00] text-[#121F2B] font-medium' 
                      : 'bg-[#121F2B] text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                  onClick={() => {
                    const newValues = isSelected
                      ? currentValues.filter((v: any) => v !== optionValue)
                      : [...currentValues, optionValue];
                    setValue(fieldId, newValues, { shouldValidate: true, shouldDirty: true });
                  }}
                >
                  <span className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                    isSelected ? 'border-[#121F2B] bg-[#121F2B]' : 'border-gray-400'
                  }`}>
                    {isSelected && <span className="text-[#fecb00] text-xs">✓</span>}
                  </span>
                  {optionLabel}
                </button>
              );
            })}
          </div>
        )}

        {q.type === 'select' && q.options && (
          <select {...register(fieldId)} className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]">
            <option value="">Välj...</option>
            {(q.options as any[]).map((o) => {
              const optionValue = typeof o === 'object' ? o.value : o;
              const optionLabel = typeof o === 'object' ? o.label : o;
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        )}

        {q.type === 'textarea' && (
           <textarea
             {...register(fieldId)}
             placeholder={q.placeholder || ''}
             className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]"
             rows={3}
           />
        )}
        
        {(q.type === 'text' || q.type === 'number') && (
           <input
             {...register(fieldId, {
               valueAsNumber: q.type === 'number',
               min: q.type === 'number' ? 0 : undefined,
               validate: q.type === 'number' ? (value) => {
                 if (value < 0) return 'Värdet kan inte vara negativt';
                 return true;
               } : undefined
             })}
             type={q.type}
             placeholder={q.placeholder || ''}
             className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]"
           />
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#121F2B] rounded-lg p-6 space-y-6 shadow mt-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-[#fecb00]">{schema.title}</h2>
        {shouldShowROISummary && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Dispatch custom event to open ROI info modal
              window.dispatchEvent(new CustomEvent('openROIInfo'));
            }}
            className="text-[#fecb00] hover:text-yellow-300 text-sm font-medium underline"
          >
            Förklaring av beräkningar
          </button>
        )}
      </div>
      {schema.questions?.map(q => <React.Fragment key={q.id}>{renderQuestion(q)}</React.Fragment>)}
      {/* ROI-sammanfattning för effekter */}
      {shouldShowROISummary && (
        <ROISummary effectEntries={effectEntries} costEntries={roiCostEntries} />
      )}
    </div>
  );
}