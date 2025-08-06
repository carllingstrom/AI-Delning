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
        {
          id: 'budgetOtherComment',
          type: 'text',
          label: 'Beskriv annan budgetpost',
          placeholder: 't.ex. "Materialkostnader", "Resekostnader"',
          condition: { id: 'budgetBreakdown', value: 'Annat' },
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
              placeholder: 't.ex. "Senior utvecklare", "Azure-licens", "Workshop"',
            },
            {
              id: 'costTypeOther',
              type: 'text',
              label: 'Beskriv annan kostnadstyp',
              placeholder: 't.ex. "Materialkostnader", "Resekostnader"',
              condition: { id: 'costType', value: 'Annat' },
            },
            {
              id: 'costUnit',
              type: 'select',
              label: 'Enhet för kostnad',
              options: [
                { value: 'hours', label: 'Timmar' },
                { value: 'fixed', label: 'Fast belopp (SEK)' },
                { value: 'monthly', label: 'Månadsavgift (SEK)' },
                { value: 'yearly', label: 'Årsavgift (SEK)' },
              ],
            },
            // Timmar-baserade kostnader
            {
              id: 'hoursDetails',
              type: 'group',
              label: 'Timmar-baserad kostnad',
              condition: { id: 'costUnit', value: 'hours' },
              questions: [
                {
                  id: 'hours',
                  type: 'number',
                  label: 'Antal timmar',
                  placeholder: 't.ex. 40',
                },
                {
                  id: 'hourlyRate',
                  type: 'number',
                  label: 'Kostnad per timme (SEK)',
                  placeholder: 't.ex. 800',
                },
              ],
            },
            // Fast belopp
            {
              id: 'fixedDetails',
              type: 'group',
              label: 'Fast belopp',
              condition: { id: 'costUnit', value: 'fixed' },
              questions: [
                {
                  id: 'fixedAmount',
                  type: 'number',
                  label: 'Belopp (SEK)',
                  placeholder: 't.ex. 15000',
                },
              ],
            },
            // Månadsavgift
            {
              id: 'monthlyDetails',
              type: 'group',
              label: 'Månadsavgift',
              condition: { id: 'costUnit', value: 'monthly' },
              questions: [
                {
                  id: 'monthlyAmount',
                  type: 'number',
                  label: 'Månadsavgift (SEK)',
                  placeholder: 't.ex. 5000',
                },
                {
                  id: 'monthlyDuration',
                  type: 'number',
                  label: 'Antal månader',
                  placeholder: 't.ex. 12',
                },
              ],
            },
            // Årsavgift
            {
              id: 'yearlyDetails',
              type: 'group',
              label: 'Årsavgift',
              condition: { id: 'costUnit', value: 'yearly' },
              questions: [
                {
                  id: 'yearlyAmount',
                  type: 'number',
                  label: 'Årsavgift (SEK)',
                  placeholder: 't.ex. 50000',
                },
                {
                  id: 'yearlyDuration',
                  type: 'number',
                  label: 'Antal år',
                  placeholder: 't.ex. 3',
                },
              ],
            },

            {
              id: 'costComment',
              type: 'text',
              label: 'Kommentar (valfri)',
              optional: true,
              placeholder: 'T.ex. osäkerheter, särskilda omständigheter',
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
