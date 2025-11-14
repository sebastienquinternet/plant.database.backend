export enum SoilType {
  Loamy = 'loamy',
  Clay = 'clay',
  Sandy = 'sandy',
  Peaty = 'peaty',
  Saline = 'saline',
  Chalky = 'chalky',
  Silty = 'silty'
}

export interface Metric<T = any> {
  value: T;
  confidence: number; // 0.0 - 1.0
}

export interface PlantTaxon {
  PK: string;                       // "PLANT#monstera_deliciosa"
  scientificName: string;           // "Monstera deliciosa"
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  aliases: string[];                // ["monstera", "cheese plant", "deliciosa"]
  watering?: Metric<number>;        // value 1-10
  light?: Metric<number>;           // value 1-10
  soil?: Metric<string>;            // value one of SoilType
  humidity?: Metric<number>;        // value 1-10
  temperature?: Metric<string>;     // e.g. "18-28°C"
  attributes?: Record<string, any>; // extra info from APIs
  createdAt: string;
  updatedAt: string;
  images?: {
    thumbnail?: string;
    gallery?: string[];
  };
}

export interface PlantCard {
  PK: string;           // full PK with PLANT# prefix
  id?: string;          // short id matching details.json key
  scientificName?: string;
  images?: {
    thumbnail?: string;
    gallery?: string[];
  };
}
