export function checkApiKey(event: any): boolean {
  const header = event?.headers?.['x-api-key'] || event?.headers?.['X-Api-Key'] || event?.headers?.['x-api_key'];
  const envKey = process.env.API_KEY;
  if (!envKey) return false;
  if (!header) return false;
  return header === envKey;
}

export function requireApiKey(event: any) {
  if (!checkApiKey(event)) {
    const err: any = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}
