export const AREAS = [
  'Intern administration',
  'Ledning och styrning',
  'Medborgarservice & kommunikation',
  'Utbildning och skola',
  'Socialtjänst',
  'Äldre- & funktionsstöd',
  'Primärvård & e-hälsa',
  'Kultur & fritid',
  'Miljö & klimat',
  'Transport & infrastruktur',
  'Samhällsbyggnad & stadsplanering',
  'Säkerhet & krisberedskap',
  'Tvärfunktionellt',
] as const;

export const VALUE_DIMENSIONS = [
  'Tidsbesparing',
  'Kostnads­besparing',
  'Kvalitet / noggrannhet',
  'Innovation (nya tjänster)',
  'Medborgarnytta, upplevelse & service',
  'Kompetens & lärande',
  'Riskreduktion & säkerhet',
  'Ökade intäkter',
  'Etik, hållbarhet & ansvarsfull AI',
  'Annat',
] as const;

export const PROJECT_PHASES = [
  { value: 'idea', label: 'Idé' },
  { value: 'pilot', label: 'Pilot eller pågående projekt' },
  { value: 'implemented', label: 'Implementerat' },
] as const;

export const COST_TYPES = [
  'Intern arbetstid',
  'Extern konsult',
  'Licens',
  'Drift/underhåll',
  'Infrastruktur',
  'Avveckling',
  'Övrigt',
] as const; 