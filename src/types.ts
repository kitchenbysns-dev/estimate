export interface Project {
  id: string;
  name: string;
  clientName: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstimationItem {
  id: string;
  category: string; // e.g., "Foundation", "Framing", "Electrical"
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  type: 'Material' | 'Labor' | 'Equipment' | 'Other';
}

export interface Estimation {
  id: string;
  projectId: string;
  name: string;
  status: 'Draft' | 'Final' | 'Approved';
  items: EstimationItem[];
  totalMaterialCost: number;
  totalLaborCost: number;
  totalEquipmentCost: number;
  totalCost: number;
  estimatedTimeDays: number;
  totalArea?: number;
  totalFloors?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  categories: string[];
  defaultItems: Partial<EstimationItem>[];
}
