import { jsonResponse } from '../utils/response';
import { PlantTaxon, SoilType } from '../models/plant';

export const handler = async (event: any) => {
  const id = event?.pathParameters?.id || 'monstera_deliciosa';

  const plant: PlantTaxon = {
    PK: `PLANT#${id}`,
    scientificName: 'Monstera deliciosa',
    family: 'Araceae',
    genus: 'Monstera',
    aliases: ['monstera', 'cheese plant', 'deliciosa'],
    soil: [SoilType.Loamy, SoilType.Sandy],
    water: 6,
    light: 7,
    attributes: {
      origin: 'Central America',
      floweringTime: 'Spring'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return jsonResponse(200, { plant });
};
