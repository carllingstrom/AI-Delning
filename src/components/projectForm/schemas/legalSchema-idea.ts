type Question = {
  id: string;
  type: 'radio' | 'checkbox' | 'select' | 'textarea' | 'text' | 'matrix';
  label: string;
  options?: string[];
  placeholder?: string;
  rows?: string[];
  columns?: string[];
  condition?: {
    id:string;
    value: string;
  };
};

type Section = {
  title: string;
  questions: Question[];
};

export const legalSectionsIdea: Section[] = [
  {
    title: 'Juridisk bedömning och informationssäkerhet',
    questions: [
      {
        id: 'gdpr_assessment',
        type: 'radio',
        label: 'Har en GDPR-konsekvensbedömning genomförts?',
        options: ['Ja', 'Nej', 'Ej relevant'],
      },
      {
        id: 'data_privacy',
        type: 'radio',
        label: 'Behandlas personuppgifter i projektet?',
        options: ['Ja', 'Nej', 'Osäker'],
      },
      {
        id: 'security_measures',
        type: 'textarea',
        label: 'Vilka säkerhetsåtgärder har implementerats?',
        placeholder: 'Beskriv informationssäkerhetsåtgärder, åtkomstkontroll, etc.',
      },
      {
        id: 'legal_review',
        type: 'radio',
        label: 'Har projektet genomgått juridisk granskning?',
        options: ['Ja', 'Nej', 'Planerat'],
      }
    ]
  }
  // Only include the first section for IDEA stage
]; 