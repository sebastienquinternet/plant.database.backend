import { jsonResponse } from '../utils/response';
import { deletePlant } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' });

export const handler = async (event: any) => {
  const id = event?.pathParameters?.id;
  if (!id) return jsonResponse(400, { message: 'Missing id in path' });
  logger.info(`DELETE Plant: PLANT#${id}`);

  try {
    const ok = await deletePlant(id);
    if (!ok) return jsonResponse(404, { message: 'Plant not found' });
    return jsonResponse(204, null);
  } catch (err: any) {
    logger.error(err);
    return jsonResponse(500, { message: 'Failed to delete plant' });
  }
};
