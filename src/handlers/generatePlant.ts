import { jsonResponse } from '../utils/response';
import { generatePlantDetailsByPK } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' });

export const handler = async (event: any) => {
  const q = event?.queryStringParameters?.q;
  if (!q) return jsonResponse(400, { message: 'Missing query parameter' });

  logger.success(`GET AI Plant details request: ${q}`);
  try {
    const plant = await generatePlantDetailsByPK(q);
    if (!plant) return jsonResponse(404, { message: 'No details generated' });
    logger.success(`GET AI Plant details response: ${q}`, { plant });
    return jsonResponse(200, { plant: plant });
  } catch (err: any) {
    logger.error('generatePlantDetailsByPK error', err);
    return jsonResponse(500, { message: 'Failed to generate plant details' });
  }
};
