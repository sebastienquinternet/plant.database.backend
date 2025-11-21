const fs = require('fs');
const path = require('path');

const GBIF_FOLDER = path.join(__dirname, 'data/GBIF');
const BEDROCK_FOLDER = path.join(__dirname, 'data/Bedrock');
const API_BASE = 'https://haij5a6jre.execute-api.ap-southeast-2.amazonaws.com/prod/plants/generate';
const REQUEST_DELAY_MS = Number(process.env.BEDROCK_REQUEST_DELAY_MS || 100);
const MAX_RETRIES = Number(process.env.BEDROCK_MAX_RETRIES || 3);
const API_KEY = process.env.API_ACCESS_KEY;

if (!API_KEY) {
  console.error('Missing API_KEY environment variable.');
  process.exit(1);
}

/**
 * Pause execution for the specified duration.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call the Bedrock proxy API to fetch enriched plant attributes.
 */
async function fetchPlantAttributes(scientificName, commonName, attempt = 1) {
  const query = `${scientificName} ${commonName}`.trim();
  const url = `${API_BASE}?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY
      }
    });
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`Error fetching attributes for ${query} (attempt ${attempt}): ${err.message}`);
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying ${query} after 3 seconds...`);
      await sleep(3000);
      return fetchPlantAttributes(scientificName, commonName, attempt + 1);
    }
    console.warn(`Giving up on ${query} after ${MAX_RETRIES} attempts.`);
    return null;
  }
}

/**
 * Main processing function.
 */
async function processFile(fileName) {
  const inputPath = path.join(GBIF_FOLDER, fileName);
  const outputPath = path.join(BEDROCK_FOLDER, fileName);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(BEDROCK_FOLDER)) {
    fs.mkdirSync(BEDROCK_FOLDER, { recursive: true });
  }

  let plants;
  try {
    plants = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  } catch (err) {
    console.error(`Failed to parse JSON file ${inputPath}: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(plants)) {
    console.error(`Expected an array in ${inputPath}`);
    process.exit(1);
  }

  console.log(`Processing ${plants.length} plants from ${fileName}`);

  const enriched = [];
  let processed = 0;
  let skipped = 0;

  for (const plant of plants) {
    const { scientificName, commonName } = plant;
    if (!scientificName || !commonName) {
      console.warn('Skipping record missing scientificName or commonName.');
      skipped++;
      enriched.push(plant);
      continue;
    }

    console.log(`Fetching data for [${fileName}] (${processed + 1}/${plants.length}) ${scientificName}`);
    const attributes = await fetchPlantAttributes(scientificName, commonName);
    if (attributes) {
      enriched.push({ ...plant, ...attributes });
      processed++;
    } else {
      enriched.push(plant);
      skipped++;
    }

    // console.log(`Progress: processed ${processed}, skipped ${skipped}`);
    await sleep(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2));
  console.log(`Done. Saved ${enriched.length} records to ${outputPath}. Processed ${processed}, skipped ${skipped}.`);
}

async function main() {
  // const fileName = process.argv[2];
  // if (!fileName) {
  //   console.error('Usage: node enrich_with_bedrock.js <GBIF-file-name>');
  //   process.exit(1);
  // }
  // await processFile(fileName);

  const families = [
    // "Apiaceae", // 238
    // "Araceae", // 97
    // "Arecaceae", // 184
    // "Asparagaceae", // 232
    // "Asteraceae", // 1306
    // "Begoniaceae", // 18
    // "Cactaceae", // 202
    // "Crassulaceae", // 123
    // "Cucurbitaceae", // 56
    // "Euphorbiaceae", // 203
    // "Fabaceae", // 1033
    // "Gesneriaceae", // 13
    // "Lamiaceae", // 431
    // "Moraceae", // 35
    // "Myrtaceae", // 207
    // "Orchidaceae", // 404
    // "Poaceae", // 717
    // "Pteridaceae", // 55
    // "Rosaceae", // 508
    // "Rubiaceae", // 185
    // "Rutaceae", // 82
    // "Solanaceae", // 179

    // MISSING
    // "Amaryllidaceae",
    // "Anacardiaceae",
    // "Apocynaceae",
    // "Araliaceae",
    // "Bignoniaceae",
    // "Boraginaceae",
    // "Brassicaceae",
    // "Bromeliaceae",
    // "Campanulaceae",
    // "Caryophyllaceae",
    // "Commelinaceae",
    // "Cupressaceae",
    // "Ericaceae",
    // "Geraniaceae",
    // "Hydrangeaceae",
    // "Iridaceae",
    // "Lauraceae",
    // "Liliaceae",
    // "Malvaceae",
    // "Marantaceae",
    // "Musaceae",
    // "Oleaceae",
    // "Pinaceae",
    // "Piperaceae",
    // "Plantaginaceae",
    // "Polypodiaceae",
    // "Primulaceae",
    // "Ranunculaceae",
    // "Sapindaceae",
    // "Urticaceae",
    // "Verbenaceae",
    // "Vitaceae",
  ];
  for (const family of families) {
    await processFile(`${family}.json`);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
