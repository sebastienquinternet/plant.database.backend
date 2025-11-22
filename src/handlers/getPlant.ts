import { jsonResponse } from '../utils/response';
import { getPlantByPK, searchPlantByPrefix } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' }).child({ class: 'getPlant' });

export const handler = async (event: any) => {
  const childLogger = logger.child({ requestId: event.requestContext.requestId });
  logger.info('handler_start', { event });
  const q = event?.queryStringParameters?.q;
  const id = event?.pathParameters?.id;
  try {
    if (q) {
      childLogger.info('searchPlantByPrefix_call', { q });
      const plants = await searchPlantByPrefix(q, childLogger);
      childLogger.success('plants_found', { q, count: plants.length });
      return jsonResponse(200, plants);
    }
    if (id) {
      childLogger.info('getPlantByPK_call', { id });
      const plant = await getPlantByPK(id, childLogger);
      if (!plant) {
        childLogger.info('plant_not_found', { id });
        return jsonResponse(404, { message: 'Plant not found' });
      }
      childLogger.success('plant_found', { id, plant });
      return jsonResponse(200, plant);
    }
    childLogger.warn('missing_query_and_id', { event });
    return jsonResponse(400, { message: 'Provide either query param `q` or path param `id`' });
  } catch (err: any) {
    childLogger.error('handler_error', { error: err });
    return jsonResponse(500, { message: 'Internal server error' });
  }
};
