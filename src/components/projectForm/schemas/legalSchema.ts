export const legalSections = [
    {
      title: 'Behandling av personuppgifter (GDPR)',
      questions: [
        { id: 'processes_personal_data', type: 'radio', label: 'Behandlar projektet personuppgifter?', options: ['Ja', 'Nej', 'Vet ej'] },
        {
          id: 'data_categories',
          type: 'checkbox',
          label: 'Vilka typer av personuppgifter behandlas?',
          options: ['Namn', 'Personnummer', 'Kontaktuppgifter', 'Hälsouppgifter', 'Uppgifter om etnicitet eller religion', 'Positioneringsdata', 'Annan känslig information', 'Vet ej'],
          condition: { id: 'processes_personal_data', value: 'Ja' }
        },
        {
          id: 'legal_basis',
          type: 'select',
          label: 'Vilken rättslig grund används för personuppgiftsbehandlingen?',
          options: ['Samtycke', 'Avtal', 'Rättslig förpliktelse', 'Skydd av grundläggande intressen', 'Myndighetsutövning eller uppgift av allmänt intresse', 'Berättigat intresse (ej tillämpligt i offentlig sektor)', 'Vet ej'],
          condition: { id: 'processes_personal_data', value: 'Ja' }
        },
        { id: 'dpia_done', type: 'radio', label: 'Har en konsekvensbedömning (DPIA) genomförts?', options: ['Ja', 'Nej', 'Vet ej'], condition: { id: 'processes_personal_data', value: 'Ja' } },
        { id: 'data_controller', type: 'radio', label: 'Vem är personuppgiftsansvarig för AI-lösningen?', options: ['Kommunen själv', 'Extern leverantör', 'Gemensamt personuppgiftsansvar', 'Vet ej'], condition: { id: 'processes_personal_data', value: 'Ja' } },
        { id: 'processor_agreement', type: 'radio', label: 'Finns ett personuppgiftsbiträdesavtal (PUB-avtal) med leverantören?', options: ['Ja', 'Nej', 'Ej relevant'], condition: { id: 'data_controller', value: 'Kommunen själv' } }
      ]
    },
    {
      title: 'Offentlig upphandling och avtal',
      questions: [
        { id: 'procurement_type', type: 'checkbox', label: 'Vilken typ av upphandling användes?', options: ['Direktupphandling', 'Ramavtal', 'Dynamiskt inköpssystem (DIS)', 'Öppet förfarande', 'Gemensam upphandling med annan kommun', 'Ej upphandlad ännu', 'Vet ej'] },
        { id: 'reusable_contract', type: 'radio', label: 'Kan andra kommuner avropa på det avtal som användes?', options: ['Ja', 'Nej', 'Vet ej'], condition: { id: 'procurement_type', value: 'Ramavtal' } },
        { id: 'supplier_contract_clauses', type: 'textarea', label: 'Finns särskilda klausuler i leverantörsavtalet värda att lyfta fram?', placeholder: 'T.ex. krav på AI-transparens, dataskydd, återanvändning, öppna standarder, etc.' }
      ]
    },
    {
      title: 'AI-förordningen och riskbedömning',
      questions: [
        { id: 'high_risk_ai', type: 'radio', label: 'Klassificeras AI-lösningen som högrisk enligt EU:s AI-förordning?', options: ['Ja', 'Nej', 'Vet ej'] },
        { id: 'ce_marked', type: 'radio', label: 'Har systemet CE-märkning enligt AI-förordningen?', options: ['Ja', 'Nej', 'Ej tillämpligt'], condition: { id: 'high_risk_ai', value: 'Ja' } },
        { id: 'fundamental_rights_assessment', type: 'radio', label: 'Har en konsekvensbedömning av grundläggande rättigheter genomförts?', options: ['Ja', 'Nej', 'Vet ej'], condition: { id: 'high_risk_ai', value: 'Ja' } }
      ]
    },
    {
      title: 'Åtkomst, ägande och tillgänglighet',
      questions: [
        { id: 'data_access_rights', type: 'textarea', label: 'Vem äger data och algoritmer? Hur regleras åtkomst?' },
        { id: 'is_open_source', type: 'radio', label: 'Är lösningen (helt eller delvis) öppen källkod?', options: ['Ja', 'Nej', 'Vet ej'] },
        { id: 'open_source_link', type: 'text', label: 'Länk till kod (t.ex. GitHub)', condition: { id: 'is_open_source', value: 'Ja' } },
        { id: 'accessibility', type: 'radio', label: 'Följer eventuella användargränssnitt tillgänglighetsdirektivet (WCAG)?', options: ['Ja', 'Nej', 'Vet ej'] },
        {
          id: 'security_measures',
          type: 'textarea',
          label: 'Vilka säkerhetsåtgärder har implementerats?',
          placeholder: 'Beskriv informationssäkerhetsåtgärder, åtkomstkontroll, etc.',
        },
      ]
    }
  ] as const; 