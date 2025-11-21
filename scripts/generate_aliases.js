const fs = require('fs');
const path = require('path');

const BEDROCK_FOLDER = path.join(__dirname, 'data/Bedrock');
const OUTPUT_FILE = path.join(__dirname, 'data/aliases.json');
const LOG_INTERVAL = 100;

/**
 * Convert a scientific name to a slug: lowercase and replace non-alphanumerics with underscores.
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
 * Safely parse JSON from a file path.
 * @param {string} filePath
 * @returns {any}
 */
function parseJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse JSON file ${filePath}: ${err.message}`);
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
 * Merge the provided aliases into the global alias map.
 * @param {string[]} aliases
 * @param {string} slug
 * @param {Record<string, string[]>} aliasMap
 * @returns {number} count of new alias entries
 */
function mergeAliases(aliases, slug, aliasMap) {
  let added = 0;
  for (const alias of aliases) {
    if (typeof alias !== 'string' || !alias.trim()) continue;
    const key = alias.toLowerCase().trim();
    if (!aliasMap[key]) {
      aliasMap[key] = [];
    }
    if (!aliasMap[key].includes(slug)) {
      aliasMap[key].push(slug);
      added += 1;
    }
  }
  return added;
}

/**
 * Split a raw alias value into discrete aliases.
 * @param {string} value
 * @returns {string[]}
 */
function splitAliasValue(value) {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

/**
 * Build a set of aliases for a plant including genus/species fallbacks.
 * @param {any} plant
 * @returns {string[]}
 */
function collectAliases(plant) {
  const aliases = [];
  if (Array.isArray(plant.aliases)) {
    for (const alias of plant.aliases) {
      aliases.push(...splitAliasValue(alias));
    }
  }
  aliases.push(...splitAliasValue(plant.genus));
  aliases.push(...splitAliasValue(plant.species));
  return aliases;
}

function main() {
  try {
    const files = listBedrockFiles();
    console.log(`Found ${files.length} Bedrock files. Building alias map`);

    const aliasMap = {};
    let processed = 0;
    let aliasEntries = 0;

    for (const fileName of files) {
      const inputPath = path.join(BEDROCK_FOLDER, fileName);
      const plants = parseJsonFile(inputPath);
      if (!Array.isArray(plants)) {
        console.warn(`Skipping ${fileName}: expected an array of plants.`);
        continue;
      }

      console.log(`Processing ${plants.length} records from ${fileName}`);

      for (const plant of plants) {
        processed += 1;
        if (!plant || !plant.scientificName) continue;

        const slug = slugify(plant.scientificName);
        aliasEntries += mergeAliases(collectAliases(plant), slug, aliasMap);

        // if (processed % LOG_INTERVAL === 0) {
        //   console.log(`Processed ${processed} total records so far..`);
        // }
      }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(aliasMap, null, 2));
    console.log(
      `Done. Processed ${processed} records across ${files.length} files. Generated ${aliasEntries} alias entries. Output: ${OUTPUT_FILE}`
    );
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
