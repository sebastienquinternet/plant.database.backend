export enum SoilType {
  Loamy = 'loamy',
  Clay = 'clay',
  Sandy = 'sandy',
  Peaty = 'peaty',
  Saline = 'saline',
  Chalky = 'chalky',
  Silty = 'silty'
}

export interface PlantTaxon {
  PK: string;                       // "PLANT#monstera_deliciosa"
  scientificName: string;           // "Monstera deliciosa"
  family?: string;
  genus?: string;
  aliases: string[];                // ["monstera", "cheese plant", "deliciosa"]
  soil: SoilType;                   // reference to SoilType
  water?: number;                   // 1–10 scale
  light?: number;                   // 1–10 scale
  attributes?: Record<string, any>; // extra info from APIs
  createdAt: string;
  updatedAt: string;
}
