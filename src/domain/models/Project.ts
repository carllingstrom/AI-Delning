export interface ProjectMunicipality {
  id: number;
  name: string;
  county: string;
}

export interface ProjectArea {
  id: number;
  name: string;
}

export interface ProjectValueDimension {
  id: number;
  name: string;
}

export interface ProjectCalculatedMetrics {
  budget: number | null;
  actualCost: number;
  roi: number | null;
  affectedGroups?: string[];
  technologies?: string[];
}

export interface Project {
  id: string;
  title: string;
  intro: string;
  problem: string;
  opportunity: string;
  responsible: string;
  phase: string;
  areas: string[];
  value_dimensions: string[];
  overview_details: any;
  cost_data: any;
  effects_data: any;
  technical_data: any;
  leadership_data: any;
  legal_data: any;
  created_at: string;
  updated_at: string;
  project_municipalities?: Array<{ municipalities: ProjectMunicipality }>;
  project_areas?: Array<{ areas: ProjectArea }>;
  project_value_dimensions?: Array<{ value_dimensions: ProjectValueDimension }>;
  calculatedMetrics?: ProjectCalculatedMetrics;
}