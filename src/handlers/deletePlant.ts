import { jsonResponse } from '../utils/response';
import { deletePlant } from '../services/plantService';

export const handler = async (event: any) => {
  const id = event?.pathParameters?.id;
  if (!id) return jsonResponse(400, { message: 'Missing id in path' });

  try {
    const ok = await deletePlant(id);
    if (!ok) return jsonResponse(404, { message: 'Plant not found' });
    return jsonResponse(204, null);
  } catch (err: any) {
    return jsonResponse(500, { message: 'Failed to delete plant' });
  }
};
