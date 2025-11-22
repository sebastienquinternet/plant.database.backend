import { PlantTaxon, PlantImage } from '../models/plant';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_ENDPOINT = 'https://api.pexels.com/v1/search';

/**
 * Fetch plant imagery from Pexels when absent in the stored record.
 */
export async function fetchPexelsImages(plant: PlantTaxon, logger: any): Promise<PlantImage[]> {
  if (!PEXELS_API_KEY) {
    logger.warn('fetchPexelsImages_missing_key');
    return [];
  }

  if (!plant.scientificName && !plant.commonName) {
    logger.warn('fetchPexelsImages_missing_names', { pk: plant.PK });
    return [];
  }

  const queryParts = [plant.scientificName, plant.commonName].filter(Boolean);
    const query = `"${queryParts.join('" "')}" plant`.trim();

  const url = new URL(PEXELS_ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('per_page', '5');

  try {
    let urlString = url.toString();
    logger.info('fetchPexelsImages_fetch', { urlString });
    const response = await fetch(urlString, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      logger.error('fetchPexelsImages_http_error', { status: response.status, statusText: response.statusText });
      return [];
    }

    const data = (await response.json()) as { photos?: any[] };
    if (!Array.isArray(data?.photos)) {
      logger.warn('fetchPexelsImages_unexpected_payload');
      return [];
    }

    return data.photos.map((photo) => ({
      small: photo?.src?.medium,
      regular: photo?.src?.large,
      author: photo?.photographer ?? null,
      source: photo?.url ?? null,
    }))
    .filter((img) => img.small && img.regular)
    .slice(0, 5);
  } catch (error) {
    logger.error('fetchPexelsImages_error', { error });
    return [];
  }
}
