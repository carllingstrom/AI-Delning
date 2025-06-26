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
    {
      title: 'Tekniska val och infrastruktur',
      questions: [
        {
          id: 'system_name',
          type: 'text',
          label: 'System och tekniska plattformar som använts (t.ex. Easit GO, Copilot)',
        },
        {
          id: 'deployment_environment',
          type: 'radio',
          label: 'Driftmiljö',
          options: ['Self-hostad', 'Molnbaserad (t.ex. Azure, GCP)', 'Hybrid', 'Vet ej'],
        },
        {
          id: 'deployment_environment_description',
          type: 'text',
          label: 'Beskriv hybridlösningen',
          condition: { id: 'deployment_environment', value: 'Hybrid' },
        },
        {
          id: 'ai_methodology',
          type: 'text',
          label: 'AI-metod eller modelltyp',
          placeholder: 'T.ex. NLP, klassificering, Llama 3.1, regressionsmodell'
        },
        {
          id: 'integration_capabilities',
          type: 'checkbox',
          label: 'API:er och integrationsmöjligheter',
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
          label: 'Hinder eller utmaningar i data-/teknikimplementering',
          placeholder: 'T.ex. dålig datakvalitet, omformatering, intern kompetensbrist etc.',
          optional: true
        },
        {
          id: 'technical_solutions',
          type: 'textarea',
          label: 'Lösningar eller arbetssätt för att hantera tekniska hinder',
          placeholder: 'T.ex. cleansing, ny pipeline, extern datascientist',
          optional: true
        }
      ]
    }
  ] as const; 