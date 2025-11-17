import { jsonResponse } from '../utils/response';
import { PlantTaxon } from '../models/plant';
import { updatePlant } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' }).child({ class: 'updatePlant' });

export const handler = async (event: any) => {
  logger.info('handler_start', { event });
  const childLogger = logger.child({ requestId: event.requestContext.requestId });
  const id = event?.pathParameters?.id;
  if (!id) {
    childLogger.warn('missing_id', { event });
    return jsonResponse(400, { message: 'Missing id in path' });
  }
  try {
    const body = event?.body ? JSON.parse(event.body) : null;
    if (!body) {
      childLogger.warn('missing_body', { event });
      return jsonResponse(400, { message: 'Missing body' });
    }
    childLogger.info('updatePlant_call', { id, body });
    const updated = await updatePlant(body as Partial<PlantTaxon>, childLogger);
    if (!updated) {
      childLogger.info('plant_not_found', { id });
      return jsonResponse(404, { message: 'Plant not found' });
    }
    childLogger.success('plant_updated', { id, updated });
    return jsonResponse(200, { plant: updated });
  } catch (err: any) {
    childLogger.error('handler_error', { error: err });
    return jsonResponse(500, { message: 'Failed to update plant' });
  }
};
