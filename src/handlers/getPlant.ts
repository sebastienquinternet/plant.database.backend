import { jsonResponse } from '../utils/response';
import { getPlantByPK, searchPlantByPrefix } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', environment: 'dev' });

// logger.info('Hello world', { userId: 123 });
// logger.error('Oops', { err: { message: 'boom' } });
export const handler = async (event: any) => {
  logger.info('getPlant handler', event);
  const q = event?.queryStringParameters?.q;
  const id = event?.pathParameters?.id;

  try {
    // Authentication is handled by API Gateway (API Key required at the gateway)
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
    logger.error(err);
    return jsonResponse(500, { message: 'Internal server error' });
  }
};
