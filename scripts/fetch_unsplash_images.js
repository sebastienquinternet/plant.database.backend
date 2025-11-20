const fs = require('fs');
const path = require('path');

const GBIF_FOLDER = path.join(__dirname, 'data/GBIF');
const UNSPLASH_FOLDER = path.join(__dirname, 'data/Unsplash');
const UNSPLASH_API = 'https://api.unsplash.com/search/photos';
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const REQUEST_DELAY_MS = 90 * 1000; // 92 seconds between API calls
const MAX_IMAGES = 10;
const MAX_RETRIES = 3;

if (!UNSPLASH_KEY) {
  console.error('Missing UNSPLASH_ACCESS_KEY environment variable.');
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchUnsplashImages(scientificName, commonName, attempt = 1) {
  const query = `${scientificName} ${commonName} Plant`;
  const url = `${UNSPLASH_API}?query=${encodeURIComponent(query)}&per_page=${MAX_IMAGES}&orientation=landscape&content_filter=high&client_id=${UNSPLASH_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unsplash responded with ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.results) || data.results.length === 0) {
      console.warn(`No Unsplash results for ${scientificName}`);
      return [];
    }

    return data.results.map((photo) => ({
      small: photo.urls?.small,
      regular: photo.urls?.regular,
      alt: photo.alt_description || null,
      author: photo.user?.name || null,
      source: photo.links?.html || null,
    })).filter((img) => img.small && img.regular);
  } catch (error) {
    console.error(`Error fetching Unsplash images for ${scientificName} (attempt ${attempt}):`, error.message);
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying ${scientificName} after 5 seconds...`);
      await sleep(5000);
      return fetchUnsplashImages(scientificName, commonName, attempt + 1);
    }
    console.warn(`Giving up on ${scientificName} after ${MAX_RETRIES} attempts.`);
    return [];
  }
}

async function processFile(fileName) {
  const inputPath = path.join(GBIF_FOLDER, fileName);
  const outputPath = path.join(UNSPLASH_FOLDER, fileName);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    return;
  }

  if (!fs.existsSync(UNSPLASH_FOLDER)) {
    fs.mkdirSync(UNSPLASH_FOLDER, { recursive: true });
  }

  let plants;
  try {
    plants = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  } catch (err) {
    console.error(`Failed to parse JSON file ${fileName}:`, err.message);
    return;
  }

  if (!Array.isArray(plants)) {
    console.error(`File ${fileName} does not contain a JSON array.`);
    return;
  }

  console.log(`Processing ${plants.length} plants from ${fileName}...`);

  const enrichedPlants = [];
  let processed = 0;

  for (const plant of plants) {
    const { scientificName, commonName } = plant;
    if (!scientificName) {
      console.warn('Skipping plant without scientificName field.');
      enrichedPlants.push({ ...plant, unsplashImages: [] });
      continue;
    }

    console.log(`Fetching Unsplash images for ${scientificName} (plant ${processed + 1}/${plants.length})...`);
    const images = await fetchUnsplashImages(scientificName, commonName);

    enrichedPlants.push({
      ...plant,
      unsplashImages: images,
    });

    processed++;
    console.log(`Completed ${processed}/${plants.length}. Waiting ${REQUEST_DELAY_MS / 1000 / 60} minutes before next request...`);
    await sleep(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(outputPath, JSON.stringify(enrichedPlants, null, 2));
  console.log(`Finished ${fileName}. Output written to ${outputPath}`);
}

async function main() {
  const fileName = process.argv[2];
  if (!fileName) {
    console.error('Usage: node fetch_unsplash_images.js <GBIF_FILE_NAME>');
    process.exit(1);
  }

  await processFile(fileName);
}

main();
