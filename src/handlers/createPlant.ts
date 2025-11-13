import { jsonResponse } from '../utils/response';
import { PlantTaxon } from '../models/plant';
import { putPlant } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' });

export const handler = async (event: any) => {
  try {
    const body = event?.body ? JSON.parse(event.body) : null;
    logger.info(`POST Plant request`, body);
    if (!body) return jsonResponse(400, { message: 'Missing body' });

    const created = await putPlant(body as Partial<PlantTaxon>);
    logger.info(`POST Plant response`, { created });
    return jsonResponse(201, { plant: created });
  } catch (err: any) {
    logger.error(err);
    return jsonResponse(500, { message: 'Failed to create plant' });
  }
};
