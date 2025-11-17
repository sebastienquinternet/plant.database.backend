import { jsonResponse } from '../utils/response';
import { getPlantByPK, searchPlantByPrefix } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' }).child({ class: 'getPlant' });

export const handler = async (event: any) => {
  logger.info('handler_start', { event });
  const q = event?.queryStringParameters?.q;
  const id = event?.pathParameters?.id;
  try {
    if (q) {
      logger.info('searchPlantByPrefix_call', { q });
      const plants = await searchPlantByPrefix(q);
      logger.success('plants_found', { q, count: plants.length });
      return jsonResponse(200, { plants });
    }
    if (id) {
      logger.info('getPlantByPK_call', { id });
      const plant = await getPlantByPK(id);
      if (!plant) {
        logger.info('plant_not_found', { id });
        return jsonResponse(404, { message: 'Plant not found' });
      }
      logger.success('plant_found', { id, plant });
      return jsonResponse(200, { plant });
    }
    logger.warn('missing_query_and_id', { event });
    return jsonResponse(400, { message: 'Provide either query param `q` or path param `id`' });
  } catch (err: any) {
    logger.error('handler_error', { error: err });
    return jsonResponse(500, { message: 'Internal server error' });
  }
};
