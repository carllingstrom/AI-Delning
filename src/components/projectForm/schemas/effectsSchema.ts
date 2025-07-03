import { SectionSchema } from '../DynamicFormSection';

export const createValueCreationSchema = (selectedValueDimensions: string[] = []): SectionSchema => ({
  title: 'Effekter & ROI-uppskattning',
  questions: [
    {
      id: 'effectEntries',
      type: 'repeat',
      label: 'Effektposter',
      addLabel: '+ Lägg till ny effekt',
      questions: [
        {
          id: 'valueDimension',
          type: 'select',
          label: 'Värdedimension',
          options: selectedValueDimensions.length > 0 
            ? selectedValueDimensions 
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
            { id: 'factor', type: 'text', label: 'Faktor (t.ex. "Servicekvalitet")' },
            { id: 'currentRating', type: 'number', label: 'Nuläge (1–10)' },
            { id: 'targetRating', type: 'number', label: 'Målvärde (1–10)' },
            { id: 'durationYears', type: 'number', label: 'Antal år effekten håller i sig' }
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
            { id: 'measurementName', type: 'text', label: 'Vad mäts?' },
            { id: 'financialCategory', type: 'select', label: 'Typ av värde', options: ['Finansiell besparing', 'Omdistribuerad resurs', 'Annat'] },
            { id: 'unit', type: 'select', label: 'Enhet', options: ['Timmar', '%', 'Kronor', 'Antal', 'Annat'] },
            { id: 'amount', type: 'number', label: 'Förändringsvärde' },
            { id: 'timescale', type: 'text', label: 'Tidsperiod', placeholder: 't.ex. per månad, per år', optional: true },
            { id: 'monetaryEstimate', type: 'number', label: 'Omräknat SEK (valfritt)', optional: true },
            { id: 'investmentCostPerDimension', type: 'number', label: 'Investering för denna effekt (SEK)', optional: true }
          ]
        },
        {
          id: 'effectComment',
          type: 'textarea',
          label: 'Kommentar till denna effekt',
          optional: true
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
