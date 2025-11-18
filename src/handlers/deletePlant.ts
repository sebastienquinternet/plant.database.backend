import { jsonResponse } from '../utils/response';
import { deletePlant } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' }).child({ class: 'deletePlant' });

export const handler = async (event: any) => {
  const childLogger = logger.child({ requestId: event.requestContext.requestId });
  logger.info('handler_start', { event });
  const id = event?.pathParameters?.id;
  if (!id) {
    childLogger.warn('missing_id', { event });
    return jsonResponse(400, { message: 'Missing id in path' });
  }
  try {
    childLogger.info('deletePlant_call', { id });
    const ok = await deletePlant(id, childLogger);
    if (!ok) {
      childLogger.info('plant_not_found', { id });
      return jsonResponse(404, { message: 'Plant not found' });
    }
    childLogger.success('plant_deleted', { id });
    return jsonResponse(204, null);
  } catch (err: any) {
    childLogger.error('handler_error', { error: err });
    return jsonResponse(500, { message: 'Failed to delete plant' });
  }
};
