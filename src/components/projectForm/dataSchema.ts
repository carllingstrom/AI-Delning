export const dataSections = [
  {
    title: 'Databeskrivning och tillgänglighet',
    questions: [
      {
        id: 'data_types',
        type: 'checkbox',
        label: 'Datatyper',
        options: [
          'Strukturerad',
          'Text',
          'Bild',
          'Ljud',
          'Video',
          'Annat',
        ],
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
        label: 'Aktualitet',
        options: ['Real-tid', 'Daglig', 'Månadsvis', 'Historisk import'],
      },
      {
        id: 'data_quality',
        type: 'radio',
        label: 'Datakvalitet',
        options: ['Rådata', 'Rensad', 'Verifierad', 'Gold', 'Vet ej'],
      },
      {
        id: 'data_license',
        type: 'radio',
        label: 'Finns licens eller ägarregel?',
        options: ['Ja', 'Nej', 'Vet ej'],
      },
      {
        id: 'data_license_link',
        type: 'text',
        label: 'Länk / referens till licens',
        condition: { id: 'data_license', value: 'Ja' },
      },
      {
        id: 'data_description_free',
        type: 'textarea',
        label: 'Fri beskrivning (format, volymer, begränsningar)',
      },
    ],
  },
] as const; 