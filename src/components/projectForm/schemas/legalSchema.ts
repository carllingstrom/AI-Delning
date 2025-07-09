export const legalSections = [
  {
    title: 'Behandling av personuppgifter (GDPR)',
    questions: [
      {
        id: 'processes_personal_data',
        type: 'radio',
        label: 'Behandlar projektet personuppgifter?',
        options: ['Ja', 'Nej', 'Vet ej']
      },
      {
        id: 'data_categories',
        type: 'checkbox',
        label: 'Vilka typer av personuppgifter behandlas?',
        options: [
          'Namn',
          'Personnummer',
          'Kontaktuppgifter',
          'Hälsouppgifter',
          'Etnicitet eller religion',
          'Positioneringsdata',
          'Annat',
          'Vet ej'
        ],
        condition: { id: 'processes_personal_data', value: 'Ja' }
      },
      {
        id: 'legal_basis',
        type: 'select',
        label: 'Vilken rättslig grund används för behandlingen?',
        options: [
          'Samtycke',
          'Avtal',
          'Rättslig förpliktelse',
          'Skydd av grundläggande intressen',
          'Myndighetsutövning / allmänt intresse',
          'Vet ej'
        ],
        condition: { id: 'processes_personal_data', value: 'Ja' }
      },
      {
        id: 'dpia_done',
        type: 'radio',
        label: 'Har ni genomfört en konsekvensbedömning (DPIA)?',
        options: ['Ja', 'Nej', 'Vet ej'],
        condition: { id: 'processes_personal_data', value: 'Ja' }
      },
      {
        id: 'data_controller',
        type: 'radio',
        label: 'Vem är personuppgiftsansvarig?',
        options: ['Kommunen', 'Extern leverantör', 'Gemensamt ansvar', 'Vet ej'],
        condition: { id: 'processes_personal_data', value: 'Ja' }
      },
      {
        id: 'processor_agreement',
        type: 'radio',
        label: 'Finns personuppgiftsbiträdesavtal (PUB-avtal)?',
        options: ['Ja', 'Nej', 'Ej relevant'],
        condition: { id: 'data_controller', value: 'Extern leverantör' }
      }
    ]
  },
  {
    title: 'Upphandling och avtalsvillkor',
    questions: [
      {
        id: 'procurement_type',
        type: 'checkbox',
        label: 'Vilken upphandlingsform användes?',
        options: ['Direktupphandling', 'Ramavtal', 'DIS', 'Öppet förfarande', 'Gemensam upphandling', 'Ej upphandlad ännu', 'Vet ej']
      },
      {
        id: 'reusable_contract',
        type: 'radio',
        label: 'Kan andra kommuner avropa på ert avtal?',
        options: ['Ja', 'Nej', 'Vet ej'],
        condition: { id: 'procurement_type', value: 'Ramavtal' }
      },
      {
        id: 'supplier_contract_clauses',
        type: 'textarea',
        label: 'Avtalsklausuler som rör AI/transparens/dataskydd',
        placeholder: 'T.ex. krav på öppenhet, ansvar, användarrättigheter'
      }
    ]
  },
  {
    title: 'AI-förordningen och riskklassificering',
    questions: [
      {
        id: 'high_risk_ai',
        type: 'radio',
        label: 'Är lösningen en högrisk enligt AI-förordningen?',
        options: ['Ja', 'Nej', 'Vet ej']
      },
      {
        id: 'ce_marked',
        type: 'radio',
        label: 'Är systemet CE-märkt?',
        options: ['Ja', 'Nej', 'Ej tillämpligt'],
        condition: { id: 'high_risk_ai', value: 'Ja' }
      },
      {
        id: 'fundamental_rights_assessment',
        type: 'radio',
        label: 'Har ni bedömt påverkan på grundläggande rättigheter?',
        options: ['Ja', 'Nej', 'Vet ej'],
        condition: { id: 'high_risk_ai', value: 'Ja' }
      }
    ]
  },
  {
    title: 'Ägande, öppenhet och tillgänglighet',
    questions: [
      {
        id: 'data_access_rights',
        type: 'textarea',
        label: 'Beskriv datans och modellens ägarskap och åtkomstregler'
      },
      {
        id: 'is_open_source',
        type: 'radio',
        label: 'Använder lösningen öppen källkod?',
        options: ['Ja', 'Nej', 'Vet ej']
      },
      {
        id: 'open_source_link',
        type: 'text',
        label: 'Länk till öppen källkod',
        condition: { id: 'is_open_source', value: 'Ja' }
      },
      {
        id: 'accessibility',
        type: 'radio',
        label: 'Uppfyller lösningen tillgänglighetsdirektiv (WCAG)?',
        options: ['Ja', 'Nej', 'Vet ej']
      },
      {
        id: 'security_measures',
        type: 'textarea',
        label: 'Informationssäkerhet – vilka åtgärder finns?',
        placeholder: 'T.ex. kryptering, rollbaserad åtkomst, loggning'
      }
    ]
  }
];
