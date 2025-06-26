import { VALUE_DIMENSIONS } from '../../../constants/projectForm';
import { SectionSchema } from '../DynamicFormSection';

// Uppdaterat schema enligt förbättrad kvantifieringslogik
export const valueCreationSchema: SectionSchema = {
  title: 'Värdeskapande',
  condition: (formValues: any) => {
    const valueDimensions = formValues.valueDimensions || [];
    return valueDimensions.length > 0;
  },
  questions: [
    {
      id: 'effectDetails',
      type: 'repeat',
      label: 'Effektdetaljer per värdedimension',
      repeatFor: 'valueDimensions',
      itemLabelField: null,
      questions: [
        {
          id: 'hasQualitative',
          type: 'radio',
          label: 'Finns det kvalitativa effekter kopplade till denna dimension?',
          options: [
            { value: true, label: 'Ja' },
            { value: false, label: 'Nej' },
          ],
        },
        {
          id: 'qualitativeDetails',
          type: 'group',
          label: 'Kvalitativa uppgifter',
          condition: { id: 'hasQualitative', value: true },
          questions: [
            { id: 'factor', type: 'text', label: 'Faktor', placeholder: 't.ex. "Användarupplevelse", "Kvalitet på service", "Medarbetarnöjdhet"' },
            { id: 'currentRating', type: 'number', label: 'Nuläge (1–10)', placeholder: 'Betyg före projektet (1=mycket dåligt, 10=utmärkt)' },
            { id: 'targetRating', type: 'number', label: 'Målvärde (1–10)', placeholder: 'Förväntad förbättring efter projektet' },
            { id: 'durationYears', type: 'number', label: 'Antal år med effekt', placeholder: 't.ex. 3 (hur länge förväntas effekten bestå)' },
          ],
        },
        {
          id: 'missingQualitativeReason',
          type: 'text',
          label: 'Varför saknas kvalitativ beskrivning?',
          condition: { id: 'hasQualitative', value: false },
          placeholder: 't.ex. "För tidigt att mäta", "Svårt att kvantifiera", "Fokus låg på andra mål"',
          optional: true,
        },
        {
          id: 'hasQuantitative',
          type: 'radio',
          label: 'Finns det kvantitativa mått kopplade till denna effekt?',
          options: [
            { value: true, label: 'Ja' },
            { value: false, label: 'Nej' },
          ],
        },
        {
          id: 'impactMeasurement',
          type: 'group',
          label: 'Effektmätning',
          condition: { id: 'hasQuantitative', value: true },
          questions: [
            {
              id: 'measurements',
              type: 'repeat',
              label: 'Mätningar för denna effekt',
              addLabel: '+ Lägg till ytterligare mätning',
              questions: [
                {
                  id: 'measurementName',
                  type: 'text',
                  label: 'Beskrivning av mätningen',
                  placeholder: 't.ex. "Minskad handläggningstid för ansökningar"'
                },
                {
                  id: 'affectedGroups',
                  type: 'multiSelect',
                  label: 'Vilka påverkas av denna mätning?',
                  options: ['Medborgare', 'Anställda', 'Förvaltning/avdelning', 'Externa aktörer', 'Annat']
                },
                {
                  id: 'effectChangeType',
                  type: 'radio',
                  label: 'Är effekten en ökning eller minskning?',
                  options: [
                    { value: 'increase', label: 'Ökning' },
                    { value: 'decrease', label: 'Minskning' },
                    { value: 'other', label: 'Annat / Vet ej' }
                  ]
                },
                {
                  id: 'effectValue',
                  type: 'group',
                  label: 'Uppmätt förändring',
                  questions: [
                    { id: 'unit', type: 'select', label: 'Enhet', options: ['Timmar', '%', 'Kronor', 'Antal', 'Annat'] },
                    { id: 'amount', type: 'number', label: 'Förändringsvärde (ange siffra)', placeholder: 't.ex. 2.5, 15, 1000' },
                    { id: 'timescale', type: 'text', label: 'Tidsperiod (t.ex. per månad, per år)', placeholder: 't.ex. "per ärende", "per månad", "totalt under projektperioden"', optional: true }
                  ]
                },
                {
                  id: 'monetaryEstimate',
                  type: 'number',
                  label: 'Omräknat värde i SEK (valfritt)',
                  placeholder: 't.ex. 50000 (uppskattat ekonomiskt värde av denna förbättring)',
                  optional: true
                },
                {
                  id: 'quantComment',
                  type: 'text',
                  label: 'Kommentar till denna mätning',
                  placeholder: 't.ex. "Baserat på mätningar under 3 månader", "Uppskattning från användare"',
                  optional: true
                }
              ]
            }
          ]
        },
        {
          id: 'missingQuantitativeReason',
          type: 'text',
          label: 'Varför saknas kvantitativa mått?',
          condition: { id: 'hasQuantitative', value: false },
          placeholder: 't.ex. "Ingen mätning genomförd ännu", "Svårt att mäta objektivt", "Effekten är för ny"',
          optional: true,
        },
        {
          id: 'overallComment',
          type: 'textarea',
          label: 'Övrig kommentar',
          placeholder: 'Beskriv andra aspekter av effekten, osäkerheter i mätningen, eller framtida förväntningar...',
        },
      ],
    },
    {
      id: 'otherEffectsText',
      type: 'textarea',
      label: 'Beskriv övriga effekter projektet haft',
      condition: { id: 'valueDimensions', value: 'Annat', op: 'contains' },
      placeholder: 'Beskriv effekter som inte passar in i de standardiserade värdedimensionerna, t.ex. kulturella förändringar, miljöpåverkan, eller oväntade positiva bieffekter...',
      optional: true,
    },
  ],
};


