import type { SectionSchema } from '../DynamicFormSection';

export const leadershipSchema: SectionSchema = {
  title: 'Organisation & Ledarskap',
  questions: [
    {
      id: 'projectOwnership',
      type: 'radio',
      label: 'Vem har haft ansvar för projektets genomförande?',
      options: [
        { value: 'it', label: 'IT-avdelning' },
        { value: 'operations', label: 'Verksamheten' },
        { value: 'joint', label: 'Gemensamt ansvar' },
        { value: 'other', label: 'Annat' }
      ]
    },
    {
      id: 'organizationalChange',
      type: 'checkbox',
      label: 'Har projektet inneburit förändringar i organisationen?',
      options: [
        'Förändrade roller eller ansvar',
        'Nya arbetssätt eller rutiner',
        'Omorganisation',
        'Nytt tvärfunktionellt samarbete',
        'Inga större förändringar'
      ]
    },
    {
      id: 'staffInvolvement',
      type: 'radio',
      label: 'Har berörda medarbetare varit involverade i projektet?',
      options: [
        { value: 'early', label: 'Ja, från start' },
        { value: 'later', label: 'Ja, men först senare' },
        { value: 'no', label: 'Nej' }
      ]
    },
    {
      id: 'changeManagementEfforts',
      type: 'textarea',
      label: 'Hur har ni arbetat med förändringsledning?',
      placeholder: 'Beskriv kommunikation, utbildning, förankring, etc.'
    },
    {
      id: 'sdgAlignment',
      type: 'checkbox',
      label: 'Stödjer projektet några av Agenda 2030:s mål (SDGs)?',
      options: [
        'Hälsa och välbefinnande (mål 3)',
        'God utbildning (mål 4)',
        'Jämställdhet (mål 5)',
        'Hållbara städer och samhällen (mål 11)',
        'Bekämpa klimatförändringarna (mål 13)',
        'Fredliga och inkluderande samhällen (mål 16)',
        'Partnerskap och samverkan (mål 17)',
        'Annat',
        'Vet ej'
      ]
    },
    {
      id: 'sdgDescription',
      type: 'text',
      label: 'Beskriv hur projektet kopplar till Agenda 2030',
      condition: { id: 'sdgAlignment', value: 'Annat' },
      optional: true
    },
    {
      id: 'nextSteps',
      type: 'text',
      label: 'Nästa steg för projektet',
      placeholder: 'Beskriv planerade fortsatta aktiviteter eller expansion'
    },
    {
      id: 'lessonsLearned',
      type: 'textarea',
      label: 'Lärdomar & utmaningar',
      placeholder: 'Beskriv viktiga lärdomar, erfarenheter eller hinder under projektet'
    }
  ]
};
