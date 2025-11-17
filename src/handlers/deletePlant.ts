import { jsonResponse } from '../utils/response';
import { deletePlant } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' }).child({ class: 'deletePlant' });

export const handler = async (event: any) => {
  logger.info('handler_start', { event });
  const id = event?.pathParameters?.id;
  if (!id) {
    logger.warn('missing_id', { event });
    return jsonResponse(400, { message: 'Missing id in path' });
  }
  try {
    logger.info('deletePlant_call', { id });
    const ok = await deletePlant(id);
    if (!ok) {
      logger.info('plant_not_found', { id });
      return jsonResponse(404, { message: 'Plant not found' });
    }
    logger.success('plant_deleted', { id });
    return jsonResponse(204, null);
  } catch (err: any) {
    logger.error('handler_error', { error: err });
    return jsonResponse(500, { message: 'Failed to delete plant' });
  }
};
