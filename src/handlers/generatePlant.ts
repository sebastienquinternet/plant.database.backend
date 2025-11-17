import { jsonResponse } from '../utils/response';
import { generatePlantDetailsByPK } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' }).child({ class: 'generatePlant' });

export const handler = async (event: any) => {
  logger.info('handler_start', { event });
  const q = event?.queryStringParameters?.q;
  if (!q) {
    logger.warn('missing_query_param', { event });
    return jsonResponse(400, { message: 'Missing query parameter' });
  }
  try {
    logger.info('generatePlantDetailsByPK_call', { q });
    const plant = await generatePlantDetailsByPK(q);
    if (!plant) {
      logger.info('no_details_generated', { q });
      return jsonResponse(404, { message: 'No details generated' });
    }
    logger.success('plant_details_generated', { q, plant });
    return jsonResponse(200, { plant });
  } catch (err: any) {
    logger.error('handler_error', { error: err });
    return jsonResponse(500, { message: 'Failed to generate plant details' });
  }
};
