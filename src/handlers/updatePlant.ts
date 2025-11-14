import { jsonResponse } from '../utils/response';
import { PlantTaxon } from '../models/plant';
import { updatePlant } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' });

export const handler = async (event: any) => {
  const id = event?.pathParameters?.id;
  if (!id) return jsonResponse(400, { message: 'Missing id in path' });

  try {
    const body = event?.body ? JSON.parse(event.body) : null;
    if (!body) return jsonResponse(400, { message: 'Missing body' });

    logger.info(`PUT Plant request: PLANT#${id}`, body);
    const updated = await updatePlant(body as Partial<PlantTaxon>);
    if (!updated) {
      logger.info(`PUT Plant response: PLANT#${id}`, { message: 'Plant not found' });
      return jsonResponse(404, { message: 'Plant not found' });
    }
    logger.success(`PUT Plant response: PLANT#${id}`, { updated });
    return jsonResponse(200, { plant: updated });
  } catch (err: any) {
    logger.error(err);
    return jsonResponse(500, { message: 'Failed to update plant' });
  }
};
