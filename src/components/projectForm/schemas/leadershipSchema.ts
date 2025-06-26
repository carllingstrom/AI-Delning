import type { SectionSchema } from '../DynamicFormSection';

export const leadershipSchema: SectionSchema = {
  title: 'Organisation & Ledarskap',
  questions: [
    {
      id: 'leadershipInvolved',
      type: 'radio',
      label: 'Har projektet haft stöd och engagemang från ledningen?',
      options: [
        { value: 'yes', label: 'Ja' },
        { value: 'no', label: 'Nej' }
      ],
    },
    {
      id: 'strategyAlignment',
      type: 'radio',
      label: 'Var projektet strategiskt förankrat i kommunens mål/strategi?',
      options: [
        { value: 'explicit', label: 'Ja, uttryckligen i strategier' },
        { value: 'indirect', label: 'Ja, indirekt stöd' },
        { value: 'no', label: 'Nej' }
      ],
    },
    {
      id: 'competenceNeeds',
      type: 'checkbox',
      label: 'Kompetensbehov: Hur har ni säkrat nödvändig AI-kompetens?',
      options: [
        { value: 'internal_development', label: 'Intern kompetensutveckling' },
        { value: 'recruitment', label: 'Rekrytering av AI-kompetens' },
        { value: 'consultants', label: 'Anlitade konsulter/partners' },
        { value: 'no_new_needs', label: 'Inga nya behov' }
      ],
    },
    {
      id: 'strategicAlignment',
      type: 'textarea',
      label: 'Strategisk förankring',
      placeholder: 'Hur passar projektet in i kommunens strategi eller digitaliseringsplan?',
      condition: { id: 'leadershipInvolved', value: 'yes', op: 'equals' },
    },
    {
      id: 'managementSupport',
      type: 'textarea',
      label: 'Ledningens stöd',
      placeholder: 'Hur har ledning och organisation stöttat initiativet?',
      condition: { id: 'leadershipInvolved', value: 'yes', op: 'equals' },
    },
    {
      id: 'nextSteps',
      type: 'text',
      label: 'Nästa steg för projektet',
      placeholder: 'Beskriv planerade fortsatta aktiviteter eller expansion',
    },
    {
      id: 'lessonsLearned',
      type: 'textarea',
      label: 'Lärdomar & utmaningar',
      placeholder: 'Beskriv viktiga lärdomar, erfarenheter eller hinder under projektet',
    },
  ],
}; 