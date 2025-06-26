import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';

// Type definitions
type Question = {
  id: string;
  type: 'radio' | 'checkbox' | 'select' | 'textarea' | 'text' | 'matrix';
  label: string;
  options?: string[];
  placeholder?: string;
  rows?: string[]; // for matrix
  columns?: string[]; // for matrix
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
  const shouldRender = (q: Question): boolean => {
    if (!q.condition) return true;
    const current = watch(q.condition.id);
    if (Array.isArray(current)) {
      return current.includes(q.condition.value);
    }
    return current === q.condition.value;
  };

  const handleCheckbox = (fieldId: string, val: string, checked: boolean) => {
    const prev: string[] = watch(fieldId) || [];
    const next = checked ? [...prev, val] : prev.filter((v) => v !== val);
    setValue(fieldId, next, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {sections.map((section) => (
        <div key={section.title} className="bg-[#121F2B] rounded-lg p-6 space-y-6 shadow">
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
                <select {...register(q.id)} className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]">
                  <option value="">Välj...</option>
                  {q.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
              {q.type === 'checkbox' && q.options && (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = (watch(q.id) || []).includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        className={`px-3 py-1 rounded-full border text-sm font-medium ${selected ? 'bg-[#FFD600] text-[#121F2B]' : 'bg-[#121F2B] text-white border-gray-600'}`}
                        onClick={() => handleCheckbox(q.id, opt, !selected)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === 'textarea' && (
                <textarea
                  {...register(q.id)}
                  placeholder={q.placeholder || ''}
                  className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]"
                  rows={3}
                />
              )}
              {q.type === 'text' && (
                <input
                  {...register(q.id)}
                  placeholder={q.placeholder || ''}
                  className="w-full p-3 rounded border border-gray-600 bg-[#121F2B]"
                  type="text"
                />
              )}
              {q.type === 'matrix' && q.rows && q.columns && (
                <div className="overflow-auto">
                  <table className="min-w-full text-sm text-white border border-gray-700">
                    <thead>
                      <tr>
                        <th className="p-2 border-b border-gray-700"></th>
                        {q.columns!.map((col) => (
                          <th key={col} className="p-2 border-b border-gray-700 text-center font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {q.rows.map((row, rIdx) => (
                        <tr key={row} className="border-t border-gray-700">
                          <td className="p-2 font-medium border-r border-gray-700">{row}</td>
                          {q.columns!.map((col) => (
                            <td key={col} className="p-2 text-center">
                              <input
                                type="radio"
                                value={col}
                                {...register(`${q.id}.${row}` as const)}
                                className="accent-[#FFD600]"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
} 