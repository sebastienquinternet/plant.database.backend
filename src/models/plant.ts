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

export interface PlantImages {
  thumbnail?: string;
  gallery?: string[];
}

export interface PlantAttributes {
  toxicity?: string;
  origin?: string;
  nativeHeight?: string;
  leafSize?: string;
  growthRate?: string;
  maintenanceLevel?: string;
  airPurifying?: string;
  petFriendly?: string;
}

export interface PlantTaxon {
  PK: string;
  scientificName: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  aliases: string[];
  watering?: Metric<number>;
  light?: Metric<number>;
  humidity?: Metric<number>;
  temperature?: Metric<string>;
  soil?: Metric<string>;
  popularity?: Metric<number>;   // using number since 1–100
  attributes?: PlantAttributes;
  images?: PlantImages;
  createdAt: string;
  updatedAt: string;
}

export interface PlantCard {
  id?: string;          // short id matching details.json key
  scientificName?: string;
  thumbnail?: string;
}
