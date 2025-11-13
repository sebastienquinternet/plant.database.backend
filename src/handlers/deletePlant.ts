import { jsonResponse } from '../utils/response';
import { requireApiKey } from '../utils/auth';

export const handler = async (event: any) => {
  const id = event?.pathParameters?.id;
  if (!id) return jsonResponse(400, { message: 'Missing id in path' });

  try {
    requireApiKey(event);
  } catch (err: any) {
    return jsonResponse(err.statusCode || 401, { message: 'Unauthorized' });
  }

  // TODO: delete from DynamoDB in later iteration
  return jsonResponse(204, null);
};
