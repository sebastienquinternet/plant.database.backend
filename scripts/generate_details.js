const fs = require('fs');
const path = require('path');

const BEDROCK_FOLDER = path.join(__dirname, 'data/Bedrock');
const OUTPUT_FILE = path.join(__dirname, 'data/details.json');
const LOG_INTERVAL = 100;

/**
 * Turn a scientific name into a filesystem-safe slug.
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Safely parse a Bedrock JSON file into an array.
 * @param {string} filePath
 * @returns {any[]}
 */
function parsePlantsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error('Input JSON must be an array of plant records.');
    }
    return data;
  } catch (err) {
    throw new Error(`Failed to read or parse ${filePath}: ${err.message}`);
  }
}

/**
 * Return every JSON file in the Bedrock folder.
 * @returns {string[]}
 */
function listBedrockFiles() {
  // if (!fs.existsSync(BEDROCK_FOLDER)) {
  //   throw new Error(`Bedrock folder not found: ${BEDROCK_FOLDER}`);
  // }

  // const files = fs
  //   .readdirSync(BEDROCK_FOLDER)
  //   .filter((file) => file.toLowerCase().endsWith('.json'))
  //   .sort();

  // if (!files.length) {
  //   throw new Error('No JSON files found in Bedrock folder.');
  // }

  // return files;
  const families = [
    "Amaryllidaceae.json",
    "Anacardiaceae.json",
    "Apiaceae.json", // 238
    "Apocynaceae.json",
    "Araceae.json", // 97
    "Araliaceae.json",
    "Arecaceae.json", // 184
    "Asparagaceae.json", // 232
    "Asteraceae.json", // 1306
    "Begoniaceae.json", // 18
    "Bignoniaceae.json",
    "Boraginaceae.json",
    "Brassicaceae.json",
    "Bromeliaceae.json",
    "Cactaceae.json", // 202
    "Campanulaceae.json",
    "Caryophyllaceae.json",
    "Commelinaceae.json",
    "Crassulaceae.json", // 123
    "Cucurbitaceae.json", // 56
    "Cupressaceae.json",
    "Ericaceae.json",
    "Euphorbiaceae.json", // 203
    "Fabaceae.json", // 1033
    "Geraniaceae.json",
    "Gesneriaceae.json", // 13
    "Hydrangeaceae.json",
    "Iridaceae.json",
    "Lamiaceae.json", // 431
    "Lauraceae.json",
    "Liliaceae.json",
    "Malvaceae.json",
    "Marantaceae.json",
    "Moraceae.json", // 35
    "Musaceae.json",
    "Myrtaceae.json", // 207
    "Oleaceae.json",
    "Orchidaceae.json", // 404
    "Pinaceae.json",
    "Piperaceae.json",
    "Plantaginaceae.json",
    "Poaceae.json", // 717
    "Polypodiaceae.json",
    "Primulaceae.json",
    "Pteridaceae.json", // 55
    "Ranunculaceae.json",
    "Rosaceae.json", // 508
    "Rubiaceae.json", // 185
    "Rutaceae.json", // 82
    "Sapindaceae.json",
    "Solanaceae.json", // 179
    "Urticaceae.json",
    "Verbenaceae.json",
    "Vitaceae.json",
  ];
  return families;
}

/**
 * Normalize the images field to a single URL.
 * @param {string | string[] | undefined} imagesField
 * @returns {string | null}
 */
function extractImage(imagesField) {
  if (Array.isArray(imagesField)) {
    return imagesField.find((entry) => typeof entry === 'string' && entry.trim()) || null;
  }
  if (typeof imagesField === 'string') {
    return imagesField.trim() || null;
  }
  return null;
}

/**
 * Populate the global details map with a single plant entry.
 * @param {Record<string, any>} details
 * @param {any} plant
 */
function upsertDetails(details, plant) {
  if (!plant || !plant.scientificName) return;
  const slug = slugify(plant.scientificName);
  details[slug] = {
    slug,
    popularity: plant.popularity?.value ?? null,
    species: plant.species ?? null,
    commonName: plant.commonName ?? null,
    image: extractImage(plant.images),
  };
}

function main() {
  try {
    const files = listBedrockFiles();
    console.log(`Found ${files.length} Bedrock files. Building detail map`);

    const details = {};
    let processed = 0;

    for (const fileName of files) {
      const filePath = path.join(BEDROCK_FOLDER, fileName);
      const plants = parsePlantsFile(filePath);
      console.log(`Processing ${plants.length} records from ${fileName}`);

      for (const plant of plants) {
        processed += 1;
        upsertDetails(details, plant);

        // if (processed % LOG_INTERVAL === 0) {
        //   console.log(`Processed ${processed} total records so far...`);
        // }
      }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(details, null, 2));
    console.log(
      `Finished. Processed ${processed} records across ${files.length} files. Wrote ${Object.keys(details).length} detail entries to ${OUTPUT_FILE}.`
    );
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
