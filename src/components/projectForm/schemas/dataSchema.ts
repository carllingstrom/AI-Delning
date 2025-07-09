export const dataSections = [
  {
    title: 'Databeskrivning och tillgänglighet',
    questions: [
      {
        id: 'data_types',
        type: 'checkbox',
        label: 'Vilka typer av data används?',
        options: ['Strukturerad', 'Text', 'Bild', 'Ljud', 'Video', 'Annat'],
      },
      {
        id: 'data_type_other',
        type: 'text',
        label: 'Ange annan datatyp',
        condition: { id: 'data_types', value: 'Annat' },
      },
      {
        id: 'data_sources',
        type: 'checkbox',
        label: 'Datakällor',
        options: [
          'Öppna data',
          'Sensor-/IoT-data',
          'Interna system',
          'Nationella källor',
          'Externa licenser',
          'Annat',
        ],
      },
      {
        id: 'data_source_other',
        type: 'text',
        label: 'Ange annan källa',
        condition: { id: 'data_sources', value: 'Annat' },
      },
      {
        id: 'data_sensitivity_level',
        type: 'radio',
        label: 'Känslighetsnivå',
        options: [
          'Innehåller personuppgifter',
          'Känsliga personuppgifter',
          'Skyddsklassad information',
          'Ej känslig',
          'Vet ej',
        ],
      },
      {
        id: 'data_freshness',
        type: 'radio',
        label: 'Hur aktuell är projektets data?',
        options: ['Realtid', 'Dagligen', 'Månadsvis', 'Historisk engångsimport'],
      },
      {
        id: 'data_quality',
        type: 'radio',
        label: 'Hur bedömer ni datakvaliteten?',
        options: [
          'Ej bearbetad (rådata)',
          'Rensad och filtrerad',
          'Verifierad mot andra källor',
          'Hög tillförlitlighet (används operativt)',
          'Vet ej'
        ],
      },
      {
        id: 'data_license',
        type: 'radio',
        label: 'Finns licens eller reglering kring användning av datan?',
        options: ['Ja', 'Nej', 'Vet ej'],
      },
      {
        id: 'data_license_link',
        type: 'text',
        label: 'Länk eller referens till licens/regelverk',
        condition: { id: 'data_license', value: 'Ja' },
      },
      {
        id: 'data_description_free',
        type: 'textarea',
        label: 'Fri beskrivning av data (t.ex. volym, format, begränsningar)',
      },
    ],
  },
  {
    title: 'Tekniska val och infrastruktur',
    questions: [
      {
        id: 'system_name',
        type: 'text',
        label: 'Vilket system/plattform användes (t.ex. Google AI Platform, Azure AI eller IBM Watson)?',
      },
      {
        id: 'deployment_environment',
        type: 'radio',
        label: 'Hur är lösningen driftad?',
        options: ['Self-hostad (on-prem)', 'Molnbaserad', 'Säker svensk hosting', 'Hybridlösning', 'Vet ej'],
      },
      {
        id: 'deployment_environment_description',
        type: 'text',
        label: 'Beskriv hybridlösningen',
        condition: { id: 'deployment_environment', value: 'Hybridlösning' },
      },
      {
        id: 'ai_methodology',
        type: 'text',
        label: 'Vilken AI-metod eller modell användes?',
        placeholder: 'T.ex. NLP, klassificering, Llama 3.1, regressionsmodell'
      },
      {
        id: 'integration_capabilities',
        type: 'checkbox',
        label: 'Vilka API:er eller integrationsmöjligheter finns?',
        options: ['REST API', 'GraphQL', 'Webhook', 'SOAP', 'MQTT', 'FTP/SFTP', 'Ingen integration', 'Annat'],
      },
      {
        id: 'integration_capabilities_text',
        type: 'text',
        label: 'Beskriv annan integrationsmöjlighet',
        condition: { id: 'integration_capabilities', value: 'Annat' },
      },
      {
        id: 'technical_obstacles',
        type: 'textarea',
        label: 'Vilka tekniska hinder stötte ni på?',
        placeholder: 'T.ex. dålig datakvalitet, kompetensbrist, integrationsproblem',
        optional: true
      },
      {
        id: 'technical_solutions',
        type: 'textarea',
        label: 'Hur löstes de tekniska utmaningarna?',
        placeholder: 'T.ex. cleansing, ny pipeline, samarbete med extern part',
        optional: true
      }
    ]
  }
];
