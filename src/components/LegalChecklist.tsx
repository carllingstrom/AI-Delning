import { useEffect } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';

type Question = {
  id: string;
  type: 'radio' | 'checkbox' | 'select' | 'textarea';
  label: string;
  options?: string[];
  placeholder?: string;
  condition?: {
    id: string;
    value: string;
  };
};

type Section = {
  title: string;
  questions: Question[];
};

interface Props {
  sections: Section[];
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export default function LegalChecklist({ sections, register, watch, setValue }: Props) {
  // Helper to check if a question should render
  const shouldRender = (q: Question): boolean => {
    if (!q.condition) return true;
    const current = watch(q.condition.id);
    if (Array.isArray(current)) {
      // checkbox list – check inclusion
      return current.includes(q.condition.value);
    }
    return current === q.condition.value;
  };

  // Generic onChange for checkbox arrays
  const handleCheckbox = (fieldId: string, val: string, checked: boolean) => {
    const prev: string[] = watch(fieldId) || [];
    let next: string[];
    if (checked) {
      next = [...prev, val];
    } else {
      next = prev.filter((v) => v !== val);
    }
    setValue(fieldId, next, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {sections.map((section) => (
        <div key={section.title} className="bg-[#181A1B] rounded-lg p-6 space-y-6 shadow">
          <h2 className="text-xl font-bold text-[#FFD600] mb-2">{section.title}</h2>
          {section.questions.map((q) => shouldRender(q) && (
            <div key={q.id} className="space-y-2">
              <label className="block font-medium">{q.label}</label>
              {q.type === 'radio' && q.options && (
                <div className="flex flex-wrap gap-4">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2">
                      <input type="radio" value={opt} {...register(q.id)} className="accent-[#FFD600]" />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'select' && q.options && (
                <select {...register(q.id)} className="w-full p-3 rounded border border-gray-600 bg-[#23272A]">
                  <option value="">Välj...</option>
                  {q.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )}
              {q.type === 'checkbox' && q.options && (
                <div className="flex flex-wrap gap-4">
                  {q.options.map((opt) => {
                    const checked = (watch(q.id) || []).includes(opt);
                    return (
                      <label key={opt} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => handleCheckbox(q.id, opt, e.target.checked)}
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              )}
              {q.type === 'textarea' && (
                <textarea
                  {...register(q.id)}
                  placeholder={q.placeholder || ''}
                  className="w-full p-3 rounded border border-gray-600 bg-[#23272A]"
                  rows={3}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
} 