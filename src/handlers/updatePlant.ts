import { jsonResponse } from '../utils/response';
import { PlantTaxon } from '../models/plant';

export const handler = async (event: any) => {
  const id = event?.pathParameters?.id;
  if (!id) return jsonResponse(400, { message: 'Missing id in path' });

  try {
    const body = event?.body ? JSON.parse(event.body) : null;
    if (!body) return jsonResponse(400, { message: 'Missing body' });

    const updated = {
      PK: `PLANT#${id}`,
      ...(body as Partial<PlantTaxon>),
      updatedAt: new Date().toISOString()
    } as Partial<PlantTaxon>;

    // TODO: persist partial update to DynamoDB
    return jsonResponse(200, { plant: updated });
  } catch (err: any) {
    console.error(err);
    return jsonResponse(400, { message: 'Invalid JSON body' });
  }
};
