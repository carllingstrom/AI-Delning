import type { SectionSchema } from '../DynamicFormSection';

export const costSectionSchemaIdea: SectionSchema = {
  title: 'Ekonomi & Resursanvändning',
  questions: [
    {
      id: 'hasDedicatedBudget',
      type: 'radio',
      label: 'Har projektet en dedikerad budget eller kostnadsuppskattning?',
      options: [
        { value: 'true', label: 'Ja' },
        { value: 'false', label: 'Nej' },
      ],
    },
    {
      id: 'budgetDetails',
      type: 'group',
      label: 'Budgetinformation',
      condition: { id: 'hasDedicatedBudget', value: 'true', op: 'equals' },
      questions: [
        {
          id: 'budgetAmount',
          type: 'number',
          label: 'Total budget (SEK)',
          placeholder: 'Ange belopp i kronor',
        },
        {
          id: 'budgetBreakdown',
          type: 'checkbox',
          label: 'Vad ingår i budgeten?',
          options: [
            { value: 'staff_time', label: 'Interna arbetstimmar' },
            { value: 'consultant_fees', label: 'Konsultkostnader' },
            { value: 'software', label: 'Programvarulicenser' },
            { value: 'hardware', label: 'Hårdvara/infrastruktur' },
            { value: 'training', label: 'Kompetensutveckling' },
            { value: 'other', label: 'Annat' },
          ],
        },
        {
          id: 'budgetComment',
          type: 'text',
          label: 'Kommentar om budget',
          optional: true,
          placeholder: 'T.ex. finansieringskällor, osäkerheter eller budgetmetod',
        },
        {
          id: 'budgetOtherCommentIdea',
          type: 'text',
          label: 'Beskriv annan budgetpost',
          placeholder: 't.ex. "Materialkostnader", "Resekostnader"',
          condition: { id: 'budgetBreakdown', value: 'other' },
        },
      ],
    },
    // Skip the "actualCostDetails" section for IDEA stage
  ],
}; 