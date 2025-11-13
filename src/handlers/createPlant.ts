import { jsonResponse } from '../utils/response';
import { PlantTaxon } from '../models/plant';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' });

export const handler = async (event: any) => {
  // For now, stub: accept body and echo back as created
  try {
    const body = event?.body ? JSON.parse(event.body) : null;
    if (!body) return jsonResponse(400, { message: 'Missing body' });

    const created = {
      ...(body as PlantTaxon),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as PlantTaxon;

    // TODO: persist to DynamoDB in later iteration
    return jsonResponse(201, { plant: created });
  } catch (err: any) {
    logger.error(err);
    return jsonResponse(400, { message: 'Invalid JSON body' });
  }
};
