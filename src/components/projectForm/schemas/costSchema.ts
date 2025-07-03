import type { SectionSchema } from '../DynamicFormSection';
import { renderCostSummary } from '../costSummary';

export const costSectionSchema: SectionSchema = {
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
          optional: false, // obligatorisk om budget finns
        },
        {
          id: 'budgetBreakdown',
          type: 'checkbox',
          label: 'Vad ingår i budgeten?',
          options: [
            { value: 'Intern personal (debiterbar tid)', label: 'Intern personal (debiterbar tid)' },
            { value: 'Extern konsult', label: 'Extern konsult' },
            { value: 'Licenser / mjukvara', label: 'Licenser / mjukvara' },
            { value: 'Infrastruktur / hårdvara', label: 'Infrastruktur / hårdvara' },
            { value: 'Utbildning / kompetensinsats', label: 'Utbildning / kompetensinsats' },
            { value: 'Annat', label: 'Annat' },
          ],
        },
        {
          id: 'budgetComment',
          type: 'text',
          label: 'Kommentar om budget',
          optional: true,
          placeholder: 'T.ex. finansieringskällor, osäkerheter eller budgetmetod',
        },
      ],
    },
    {
      id: 'actualCostDetails',
      type: 'group',
      label: 'Faktiska kostnader (används för ROI och uppföljning)',
      condition: { id: 'hasDedicatedBudget', value: 'true', op: 'equals' }, // visas bara om budget finns
      questions: [
        {
          id: 'costEntries',
          type: 'repeat',
          label: 'Kostnadsposter',
          addLabel: '+ Lägg till kostnadspost',
          summary: renderCostSummary,
          questions: [
            {
              id: 'costType',
              type: 'select',
              label: 'Typ av kostnad',
              options: [
                'Intern personal (debiterbar tid)',
                'Extern konsult',
                'Licenser / mjukvara',
                'Infrastruktur / hårdvara',
                'Utbildning / kompetensinsats',
                'Annat',
              ],
            },
            {
              id: 'costLabel',
              type: 'text',
              label: 'Roll, aktivitet eller benämning',
            },
            {
              id: 'costHours',
              type: 'number',
              label: 'Antal timmar',
              placeholder: 't.ex. 40',
              optional: true,
            },
            {
              id: 'costRate',
              type: 'number',
              label: 'Kostnad per timme (SEK)',
              placeholder: 't.ex. 800',
              optional: true,
            },
            {
              id: 'costFixed',
              type: 'number',
              label: 'Fast kostnad / Overhead (SEK)',
              placeholder: 't.ex. 15000 för licens',
              optional: true,
            },
            {
              id: 'costComment',
              type: 'text',
              label: 'Kommentar (valfri)',
              optional: true,
            },
          ],
        },
        {
          id: 'costSummaryComment',
          type: 'textarea',
          label: 'Kommentar om avvikelser eller tolkning av kostnader',
          optional: true,
          placeholder: 'Ex. osäkerheter, förändringar, särskilda omständigheter',
        },
      ],
    },
  ],
};
