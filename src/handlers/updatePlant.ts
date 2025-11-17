import { jsonResponse } from '../utils/response';
import { PlantTaxon } from '../models/plant';
import { updatePlant } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' }).child({ class: 'updatePlant' });

export const handler = async (event: any) => {
  logger.info('handler_start', { event });
  const id = event?.pathParameters?.id;
  if (!id) {
    logger.warn('missing_id', { event });
    return jsonResponse(400, { message: 'Missing id in path' });
  }
  try {
    const body = event?.body ? JSON.parse(event.body) : null;
    if (!body) {
      logger.warn('missing_body', { event });
      return jsonResponse(400, { message: 'Missing body' });
    }
    logger.info('updatePlant_call', { id, body });
    const updated = await updatePlant(body as Partial<PlantTaxon>);
    if (!updated) {
      logger.info('plant_not_found', { id });
      return jsonResponse(404, { message: 'Plant not found' });
    }
    logger.success('plant_updated', { id, updated });
    return jsonResponse(200, { plant: updated });
  } catch (err: any) {
    logger.error('handler_error', { error: err });
    return jsonResponse(500, { message: 'Failed to update plant' });
  }
};
