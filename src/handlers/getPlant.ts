import { jsonResponse } from '../utils/response';
import { Plant } from '../models/plant';

export const handler = async (event: any) => {
  const id = event?.pathParameters?.id || '1';

  const plant: Plant = {
    id,
    commonName: 'Monstera Deliciosa',
    scientificName: 'Monstera deliciosa',
    family: 'Araceae',
    description: 'Tropical plant with large fenestrated leaves.',
    sunlight: 'Bright indirect light',
    watering: 'Water when top inch of soil is dry.'
  };

  return jsonResponse(200, { plant });
};
