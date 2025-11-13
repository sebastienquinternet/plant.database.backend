import { jsonResponse } from '../utils/response';

export const handler = async (event: any) => {
  const id = event?.pathParameters?.id;
  if (!id) return jsonResponse(400, { message: 'Missing id in path' });

  // TODO: delete from DynamoDB in later iteration
  return jsonResponse(204, null);
};
