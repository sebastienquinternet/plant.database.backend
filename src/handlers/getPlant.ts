import { jsonResponse } from '../utils/response';
import { getPlantByPK, searchPlantByPrefix } from '../services/plantService';

export const handler = async (event: any) => {
  const q = event?.queryStringParameters?.q;
  const id = event?.pathParameters?.id;

  try {
    if (q) {
      const plants = await searchPlantByPrefix(q);
      return jsonResponse(200, { plants });
    }

    if (id) {
      const plant = await getPlantByPK(`PLANT#${id}`);
      if (!plant) return jsonResponse(404, { message: 'Plant not found' });
      return jsonResponse(200, { plant });
    }

    return jsonResponse(400, { message: 'Provide either query param `q` or path param `id`' });
  } catch (err: any) {
    console.error(err);
    return jsonResponse(500, { message: 'Internal server error' });
  }
};
