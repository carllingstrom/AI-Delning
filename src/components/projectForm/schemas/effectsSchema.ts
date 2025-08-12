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
                  label: 'Timbaserat värde',
                  condition: { id: 'valueUnit', value: 'hours' },
                  questions: [
                    {
                      id: 'affectedPeople',
                      type: 'number',
                      label: 'Antal personer som påverkas',
                      placeholder: 't.ex. 5 anställda'
                    },
                    {
                      id: 'timePerPerson',
                      type: 'number',
                      label: 'Tid sparad per person',
                      placeholder: 't.ex. 2 timmar'
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod för besparing',
                      options: [
                        { value: 'per_day', label: 'Per arbetsdag' },
                        { value: 'per_week', label: 'Per arbetsvecka' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år (totalt)' }
                      ]
                    },
                    {
                      id: 'hourlyRate',
                      type: 'number',
                      label: 'Kostnad per arbetstimme (SEK)',
                      placeholder: 't.ex. 800 (inkl. sociala avgifter)'
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
                  label: 'Personresurs-baserad omdistribuering',
                  condition: { id: 'valueUnit', value: 'hours' },
                  questions: [
                    {
                      id: 'affectedPeople',
                      type: 'number',
                      label: 'Antal personer som påverkas',
                      placeholder: 't.ex. 3 anställda'
                    },
                    {
                      id: 'currentTimePerPerson',
                      type: 'number',
                      label: 'Nuvarande tid per person',
                      placeholder: 't.ex. 8 timmar'
                    },
                    {
                      id: 'newTimePerPerson',
                      type: 'number',
                      label: 'Ny tid per person',
                      placeholder: 't.ex. 5 timmar'
                    },
                    {
                      id: 'timescale',
                      type: 'select',
                      label: 'Tidsperiod',
                      options: [
                        { value: 'per_day', label: 'Per arbetsdag' },
                        { value: 'per_week', label: 'Per arbetsvecka' },
                        { value: 'per_month', label: 'Per månad' },
                        { value: 'per_year', label: 'Per år (totalt)' }
                      ]
                    },
                    {
                      id: 'hourlyRate',
                      type: 'number',
                      label: 'Kostnad per arbetstimme (SEK)',
                      placeholder: 't.ex. 800 (inkl. sociala avgifter)',
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
    },
    // PoV-fråga som visas endast om inga kvalitativa eller kvantitativa effekter har registrerats
    {
      id: 'povTimeframe',
      type: 'radio',
      label: 'Hur lång tid tar det att utveckla användningsfallet tills ni kan verifiera ett PoV (Proof of Value)?',
      condition: { 
        type: 'custom',
        evaluate: (formData: any) => {
          console.log('=== PoV CONDITION EVALUATION START ===');
          console.log('PoV condition evaluating with formData:', formData);
          console.log('Effects data type:', typeof formData.effects_data);
          
          // Kontrollera om det finns några effektposter i effects_data
          const effectDetails = formData.effects_data?.effectDetails || [];
          
          console.log('Effect details:', effectDetails);
          
          // Om inga effektposter finns alls, visa PoV-frågan
          if (effectDetails.length === 0) {
            console.log('=== PoV CONDITION EVALUATION END ===');
            return true;
          }
          
          // Kontrollera varje effektpost för kvalitativa och kvantitativa effekter
          let allEffectsHaveNoData = true;
          for (const entry of effectDetails) {
            const hasQualitative = entry.hasQualitative === "true" || entry.hasQualitative === true;
            const hasQuantitative = entry.hasQuantitative === "true" || entry.hasQuantitative === true;
            
            
            // Om någon effekt har kvalitativa eller kvantitativa effekter, markera att inte alla har "Nej"
            if (hasQualitative || hasQuantitative) {
              allEffectsHaveNoData = false;
              break; // Vi behöver inte kontrollera fler om vi redan hittat en med data
            }
          }
          
          
          // Om alla effekter har "Nej" på båda frågorna, visa PoV-frågan
          if (allEffectsHaveNoData) {
            console.log('=== PoV CONDITION EVALUATION END ===');
            return true;
          }
          
          console.log('=== PoV CONDITION EVALUATION END ===');
          return false;
        }
      },
      options: [
        { value: 5, label: 'Mindre än 3 månader' },
        { value: 4, label: '4 till 6 månader' },
        { value: 3, label: '7 till 9 månader' },
        { value: 2, label: '10 till 12 månader' },
        { value: 1, label: 'Mer än 12 månader' }
      ]
    }
  ]
});

// Keep the old export for backward compatibility
export const valueCreationSchema = createValueCreationSchema();
