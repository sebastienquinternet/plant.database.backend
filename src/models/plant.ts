export interface Metric<T = any> {
  value: T;
  confidence: number;
}

export type SoilValue = 'sandy' | 'loamy' | 'saline' | 'peaty' | 'clay' | 'silt' | 'chalky';
export type LifeCycleValue = 'annual' | 'biennial' | 'perennial';
export type LeafRetentionValue = 'evergreen' | 'deciduous' | 'semi-deciduous';
export type RootTypeValue = 'shallow' | 'deep' | 'fibrous' | 'rhizome' | 'tuberous';
export type RepottingFrequencyValue = 'yearly' | '2-3 years' | 'rarely';
export type FeedingValue = 'light' | 'moderate' | 'heavy';
export type AirPurifyingValue = 'yes' | 'no' | 'strong';
export type PetFriendlyValue = 'yes' | 'no';

export interface PlantImage {
  small: string;
  regular: string;
  alt?: string | null;
  author?: string | null;
  source?: string | null;
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
  popularity?: Metric<number>;
  soil?: Metric<SoilValue>;
  lifeCycle?: Metric<LifeCycleValue>;
  leafRetention?: Metric<LeafRetentionValue>;
  rootType?: Metric<RootTypeValue>;
  repottingFrequency?: Metric<RepottingFrequencyValue>;
  feeding?: Metric<FeedingValue>;
  toxicity?: Metric<string>;
  origin?: Metric<string>;
  nativeHeight?: Metric<string>;
  leafSize?: Metric<string>;
  growthRate?: Metric<string>;
  maintenanceLevel?: Metric<string>;
  airPurifying?: Metric<AirPurifyingValue>;
  petFriendly?: Metric<PetFriendlyValue>;
  frostTolerance?: Metric<string>;
  heatTolerance?: Metric<string>;
  images?: PlantImage[];
  createdAt: string;
  updatedAt: string;
}

export interface PlantCard {
  id?: string;
  scientificName?: string;
  thumbnail?: string;
}
