import { SectionSchema } from '../DynamicFormSection';

export const createValueCreationSchema = (selectedValueDimensions: string[] = []): SectionSchema => ({
  title: 'Effekter & ROI-uppskattning',
  questions: [
    {
      id: 'effectEntries',
      type: 'repeat',
      label: 'Effektposter',
      addLabel: '+ Lägg till effekt',
      questions: [
        {
          id: 'valueDimension',
          type: 'select',
          label: 'Värdedimension',
          options: selectedValueDimensions.length > 0 
            ? [...selectedValueDimensions, 'Annat']
            : [
            'Tidsbesparing',
            'Kostnadsbesparing',
            'Kvalitet / noggrannhet',
            'Innovation (nya tjänster)',
            'Medborgarnytta / service',
            'Kompetens / lärande',
            'Riskreduktion / säkerhet',
            'Ökade intäkter',
            'Etik / hållbarhet / ansvarsfull AI',
            'Annat'
          ]
        },
        {
          id: 'customValueDimension',
          type: 'text',
          label: 'Beskriv annan typ av nytta',
          placeholder: 't.ex. "Minskad miljöpåverkan", "Förbättrad arbetsmiljö"',
          condition: { id: 'valueDimension', value: 'Annat' }
        },
        {
          id: 'hasQualitative',
          type: 'radio',
          label: 'Finns kvalitativa effekter?',
          options: [
            { value: true, label: 'Ja' },
            { value: false, label: 'Nej' }
          ]
        },
        {
          id: 'qualitativeDetails',
          type: 'group',
          label: 'Kvalitativa uppgifter',
          condition: { id: 'hasQualitative', value: true },
          questions: [
            { 
              id: 'factor', 
              type: 'text', 
              label: 'Faktor som mäts',
              placeholder: 't.ex. "Servicekvalitet", "Medborgarnöjdhet"'
            },
            { 
              id: 'currentRating', 
              type: 'number', 
              label: 'Nuläge (1–10)',
              placeholder: '1-10'
            },
            { 
              id: 'targetRating', 
              type: 'number', 
              label: 'Målvärde (1–10)',
              placeholder: '1-10'
            },
            { 
              id: 'annualizationYears', 
              type: 'number', 
              label: 'Antal år effekten håller i sig',
              placeholder: 't.ex. 3 år'
            }
          ]
        },
        {
          id: 'hasQuantitative',
          type: 'radio',
          label: 'Finns kvantitativa effekter?',
          options: [
            { value: true, label: 'Ja' },
            { value: false, label: 'Nej' }
          ]
        },
        {
          id: 'quantitativeDetails',
          type: 'group',
          label: 'Kvantitativa uppgifter',
          condition: { id: 'hasQuantitative', value: true },
          questions: [
            {
              id: 'effectType',
              type: 'radio',
              label: 'Typ av kvantitativ effekt',
              options: [
                { value: 'financial', label: 'Finansiell effekt' },
                { value: 'redistribution', label: 'Omdistribuerad resurs' }
              ]
            },
            {
              id: 'financialDetails',
              type: 'group',
              label: 'Finansiella uppgifter',
              condition: { id: 'effectType', value: 'financial' },
              questions: [
                { 
                  id: 'measurementName', 
                  type: 'text', 
                  label: 'Vad mäts?',
                  placeholder: 't.ex. "Besparade timmar per månad"'
                },
                { 
                  id: 'valueUnit', 
                  type: 'select', 
                  label: 'Enhet för värde', 
                  options: [
                    { value: 'hours', label: 'Timmar' },
                    { value: 'currency', label: 'Kronor (SEK)' },
                    { value: 'percentage', label: 'Procent (%)' },
                    { value: 'count', label: 'Antal' },
                    { value: 'other', label: 'Annat' }
                  ]
                },
                // Timmar-baserade värden
                {
                  id: 'hoursDetails',
                  type: 'group',
                  label: 'Timmar-baserat värde',
                  condition: { id: 'valueUnit', value: 'hours' },
                  questions: [
                    {
                      id: 'hours',
                      type: 'number',
                      label: 'Antal timmar',
                      placeholder: 't.ex. 40'
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod',
                      options: [
                        { value: 'per_hour', label: 'Per timme' },
                        { value: 'per_day', label: 'Per dag' },
                        { value: 'per_week', label: 'Per vecka' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år' }
                      ]
                    },
                    {
                      id: 'hourlyRate',
                      type: 'number',
                      label: 'Värde per timme (SEK)',
                      placeholder: 't.ex. 800'
                    }
                  ]
                },
                // Kronor-baserade värden
                {
                  id: 'currencyDetails',
                  type: 'group',
                  label: 'Kronor-baserat värde',
                  condition: { id: 'valueUnit', value: 'currency' },
                  questions: [
                    {
                      id: 'amount',
                      type: 'number',
                      label: 'Belopp (SEK)',
                      placeholder: 't.ex. 50000'
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod',
                      options: [
                        { value: 'one_time', label: 'Engångsbelopp' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år' }
                      ]
                    }
                  ]
                },
                // Procent-baserade värden
                {
                  id: 'percentageDetails',
                  type: 'group',
                  label: 'Procent-baserat värde',
                  condition: { id: 'valueUnit', value: 'percentage' },
                  questions: [
                    {
                      id: 'percentage',
                      type: 'number',
                      label: 'Procent',
                      placeholder: 't.ex. 15'
                    },
                    {
                      id: 'baseValue',
                      type: 'number',
                      label: 'Basvärde (SEK)',
                      placeholder: 't.ex. 100000'
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod',
                      options: [
                        { value: 'one_time', label: 'Engångsbelopp' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år' }
                      ]
                    }
                  ]
                },
                // Antal-baserade värden
                {
                  id: 'countDetails',
                  type: 'group',
                  label: 'Antal-baserat värde',
                  condition: { id: 'valueUnit', value: 'count' },
                  questions: [
                    {
                      id: 'count',
                      type: 'number',
                      label: 'Antal',
                      placeholder: 't.ex. 100'
                    },
                    {
                      id: 'valuePerUnit',
                      type: 'number',
                      label: 'Värde per enhet (SEK)',
                      placeholder: 't.ex. 500'
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod',
                      options: [
                        { value: 'one_time', label: 'Engångsbelopp' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år' }
                      ]
                    }
                  ]
                },
                // Annat
                {
                  id: 'otherDetails',
                  type: 'group',
                  label: 'Annan enhet',
                  condition: { id: 'valueUnit', value: 'other' },
                  questions: [
                    {
                      id: 'customUnit',
                      type: 'text',
                      label: 'Beskriv enheten',
                      placeholder: 't.ex. "processer", "ansökningar"'
                    },
                    {
                      id: 'amount',
                      type: 'number',
                      label: 'Antal',
                      placeholder: 't.ex. 50'
                    },
                    {
                      id: 'valuePerUnit',
                      type: 'number',
                      label: 'Värde per enhet (SEK)',
                      placeholder: 't.ex. 200'
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod',
                      options: [
                        { value: 'one_time', label: 'Engångsbelopp' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år' }
                      ]
                    }
                  ]
                },
                { 
                  id: 'annualizationYears', 
                  type: 'number', 
                  label: 'Antal år effekten håller i sig',
                  placeholder: 't.ex. 3 år'
                }
              ]
            },
            {
              id: 'redistributionDetails',
              type: 'group',
              label: 'Omdistribuerade resurser',
              condition: { id: 'effectType', value: 'redistribution' },
              questions: [
                { 
                  id: 'resourceType', 
                  type: 'text', 
                  label: 'Typ av resurs',
                  placeholder: 't.ex. "Personalstid", "Lokaler"'
                },
                { 
                  id: 'valueUnit', 
                  type: 'select', 
                  label: 'Enhet för resurs', 
                  options: [
                    { value: 'hours', label: 'Timmar' },
                    { value: 'currency', label: 'Kronor (SEK)' },
                    { value: 'percentage', label: 'Procent (%)' },
                    { value: 'count', label: 'Antal' },
                    { value: 'other', label: 'Annat' }
                  ]
                },
                // Timmar-baserade resurser
                {
                  id: 'hoursDetails',
                  type: 'group',
                  label: 'Timmar-baserad resurs',
                  condition: { id: 'valueUnit', value: 'hours' },
                  questions: [
                    {
                      id: 'currentHours',
                      type: 'number',
                      label: 'Nuvarande användning (timmar)',
                      placeholder: 't.ex. 100'
                    },
                    {
                      id: 'newHours',
                      type: 'number',
                      label: 'Ny användning (timmar)',
                      placeholder: 't.ex. 60'
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod',
                      options: [
                        { value: 'per_hour', label: 'Per timme' },
                        { value: 'per_day', label: 'Per dag' },
                        { value: 'per_week', label: 'Per vecka' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år' }
                      ]
                    },
                    {
                      id: 'hourlyRate',
                      type: 'number',
                      label: 'Värde per timme (SEK)',
                      placeholder: 't.ex. 800',
                      optional: true
                    }
                  ]
                },
                // Kronor-baserade resurser
                {
                  id: 'currencyDetails',
                  type: 'group',
                  label: 'Kronor-baserad resurs',
                  condition: { id: 'valueUnit', value: 'currency' },
                  questions: [
                    {
                      id: 'currentAmount',
                      type: 'number',
                      label: 'Nuvarande belopp (SEK)',
                      placeholder: 't.ex. 50000'
                    },
                    {
                      id: 'newAmount',
                      type: 'number',
                      label: 'Nytt belopp (SEK)',
                      placeholder: 't.ex. 30000'
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod',
                      options: [
                        { value: 'one_time', label: 'Engångsbelopp' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år' }
                      ]
                    }
                  ]
                },
                // Procent-baserade resurser
                {
                  id: 'percentageDetails',
                  type: 'group',
                  label: 'Procent-baserad resurs',
                  condition: { id: 'valueUnit', value: 'percentage' },
                  questions: [
                    {
                      id: 'currentPercentage',
                      type: 'number',
                      label: 'Nuvarande procent',
                      placeholder: 't.ex. 100'
                    },
                    {
                      id: 'newPercentage',
                      type: 'number',
                      label: 'Ny procent',
                      placeholder: 't.ex. 60'
                    },
                    {
                      id: 'baseValue',
                      type: 'number',
                      label: 'Basvärde (SEK)',
                      placeholder: 't.ex. 100000'
                    }
                  ]
                },
                // Antal-baserade resurser
                {
                  id: 'countDetails',
                  type: 'group',
                  label: 'Antal-baserad resurs',
                  condition: { id: 'valueUnit', value: 'count' },
                  questions: [
                    {
                      id: 'currentCount',
                      type: 'number',
                      label: 'Nuvarande antal',
                      placeholder: 't.ex. 100'
                    },
                    {
                      id: 'newCount',
                      type: 'number',
                      label: 'Nytt antal',
                      placeholder: 't.ex. 60'
                    },
                    {
                      id: 'valuePerUnit',
                      type: 'number',
                      label: 'Värde per enhet (SEK)',
                      placeholder: 't.ex. 500',
                      optional: true
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod',
                      options: [
                        { value: 'one_time', label: 'Engångsbelopp' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år' }
                      ]
                    }
                  ]
                },
                // Annat
                {
                  id: 'otherDetails',
                  type: 'group',
                  label: 'Annan enhet',
                  condition: { id: 'valueUnit', value: 'other' },
                  questions: [
                    {
                      id: 'customUnit',
                      type: 'text',
                      label: 'Beskriv enheten',
                      placeholder: 't.ex. "processer", "ansökningar"'
                    },
                    {
                      id: 'currentAmount',
                      type: 'number',
                      label: 'Nuvarande användning',
                      placeholder: 't.ex. 50'
                    },
                    {
                      id: 'newAmount',
                      type: 'number',
                      label: 'Ny användning',
                      placeholder: 't.ex. 30'
                    },
                    {
                      id: 'valuePerUnit',
                      type: 'number',
                      label: 'Värde per enhet (SEK)',
                      placeholder: 't.ex. 200',
                      optional: true
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod',
                      options: [
                        { value: 'one_time', label: 'Engångsbelopp' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år' }
                      ]
                    }
                  ]
                },
                { 
                  id: 'annualizationYears', 
                  type: 'number', 
                  label: 'Antal år effekten håller i sig',
                  placeholder: 't.ex. 3 år'
                }
              ]
            }
          ]
        },
        {
          id: 'effectComment',
          type: 'textarea',
          label: 'Kommentar till denna effekt',
          optional: true,
          placeholder: 'Beskriv bakgrund, osäkerheter eller särskilda omständigheter'
        }
      ]
    },
    {
      id: 'roiInterpretation',
      type: 'textarea',
      label: 'Kommentar eller tolkning av samlad nytta/ROI',
      placeholder: 'Beskriv t.ex. om värdet är främst kvalitativt, långsiktigt eller diffust',
      optional: true
    }
  ]
});

// Keep the old export for backward compatibility
export const valueCreationSchema = createValueCreationSchema();
