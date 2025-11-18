const fs = require('fs');
// const fetch = require('node-fetch');

const TREFLE_FILE = './data/Moraceae.ndjson';
const OUTPUT_FILE = './data/gbif_taxonomy.json';
const GBIF_API = 'https://api.gbif.org/v1/species/match';

async function fetchGbifTaxonomy(scientificName) {
  try {
    const response = await fetch(`${GBIF_API}?name=${encodeURIComponent(scientificName)}`);
    if (!response.ok) {
      console.error(`Failed to fetch GBIF data for ${scientificName}: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    if (data.matchType === 'NONE') {
      console.warn(`No match found for ${scientificName}`);
      return null;
    }
    return {
      scientificName: data.canonicalName,
      kingdom: data.kingdom,
      phylum: data.phylum,
      class: data.class,
      order: data.order,
      family: data.family,
      genus: data.genus,
      species: data.species,
    };
  } catch (error) {
    console.error(`Error fetching GBIF data for ${scientificName}:`, error);
    return null;
  }
}

async function processTrefleData() {
  const output = [];

  const fileStream = fs.createReadStream(TREFLE_FILE);
  const rl = require('readline').createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    try {
      const trefleItem = JSON.parse(line);
      const scientificName = trefleItem.scientific_name;
      const gbifData = await fetchGbifTaxonomy(scientificName);

      if (gbifData) {
        output.push({
          scientificName: gbifData.scientificName || scientificName,
          kingdom: gbifData.kingdom,
          phylum: gbifData.phylum,
          class: gbifData.class,
          order: gbifData.order,
          family: gbifData.family,
          genus: gbifData.genus,
          species: gbifData.species,
          images: trefleItem.image_url,
        });
      }
    } catch (error) {
      console.error('Error processing line:', error);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Processed data saved to ${OUTPUT_FILE}`);
}

processTrefleData();
