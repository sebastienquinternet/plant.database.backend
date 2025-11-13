import { jsonResponse } from '../utils/response';
import { getPlantByPK, searchPlantByPrefix } from '../services/plantService';
import { createLogger } from '../services/loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' });

export const handler = async (event: any) => {
  const q = event?.queryStringParameters?.q;
  const id = event?.pathParameters?.id;

  try {
    if (q) {
      logger.info(`GET Plant request: q=${q}`);
      const plants = await searchPlantByPrefix(q);
      logger.success(`GET Plant response: q=${q}`, { plants });
      return jsonResponse(200, { plants });
    }

    if (id) {
      logger.info(`GET Plant request: PLANT#${id}`);
      const plant = await getPlantByPK(`PLANT#${id}`);
      if (!plant) {
        logger.info(`GET Plant response: PLANT#${id}`, { message: 'Plant not found' });
        return jsonResponse(404, { message: 'Plant not found' });
      }
      logger.success(`GET Plant response: PLANT#${id}`, { plant });
      return jsonResponse(200, { plant });
    }

    return jsonResponse(400, { message: 'Provide either query param `q` or path param `id`' });
  } catch (err: any) {
    logger.error(err);
    return jsonResponse(500, { message: 'Internal server error' });
  }
};
