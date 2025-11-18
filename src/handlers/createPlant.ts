import { jsonResponse } from '../utils/response';
import { PlantTaxon } from '../models/plant';
import { putPlant } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' }).child({ class: 'createPlant' });

export const handler = async (event: any) => {
  const childLogger = logger.child({ requestId: event.requestContext.requestId });
  logger.info('handler_start', { event });
  try {
    const body = event?.body ? JSON.parse(event.body) : null;
    if (!body) {
      childLogger.warn('missing_body', { event });
      return jsonResponse(400, { message: 'Missing body' });
    }
    childLogger.info('putPlant_call', { body });
    const created = await putPlant(body as Partial<PlantTaxon>, childLogger);
    childLogger.success('plant_created', { created });
    return jsonResponse(201, { plant: created });
  } catch (err: any) {
    childLogger.error('handler_error', { error: err });
    return jsonResponse(500, { message: 'Failed to create plant' });
  }
};
