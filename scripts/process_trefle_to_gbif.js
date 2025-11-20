const fs = require('fs');
const path = require('path');

const TREFLE_FOLDER = path.join(__dirname, 'data/Trefle');
const GBIF_FOLDER = path.join(__dirname, 'data/GBIF');
const GBIF_API_BASE = 'https://api.gbif.org/v1/species';

async function fetchGbifData(scientificName) {
  try {
    // Step 1: Get usageKey
    const matchResponse = await fetch(`${GBIF_API_BASE}/match?name=${encodeURIComponent(scientificName)}`);
    console.log(`Fetch ${scientificName}`);
    if (!matchResponse.ok) {
      console.error(`Failed to fetch usageKey for ${scientificName}: ${matchResponse.statusText}`);
      return null;
    }
    const matchData = await matchResponse.json();
    const usageKey = matchData.usageKey;

    if (!usageKey) {
      console.warn(`No usageKey found for ${scientificName}`);
      return null;
    }

    // Step 2: Get taxonomy details
    const taxonomyResponse = await fetch(`${GBIF_API_BASE}/${usageKey}`);
    if (!taxonomyResponse.ok) {
      console.error(`Failed to fetch taxonomy for ${scientificName}: ${taxonomyResponse.statusText}`);
      return null;
    }
    return await taxonomyResponse.json();
  } catch (error) {
    console.error(`Error fetching GBIF data for ${scientificName}:`, error);
    return null;
  }
}

async function processFile(fileName) {
  const inputFilePath = path.join(TREFLE_FOLDER, fileName);
  const outputFilePath = path.join(GBIF_FOLDER, fileName.replace('.ndjson', '.json'));

  if (!fs.existsSync(inputFilePath)) {
    console.error(`Input file not found: ${inputFilePath}`);
    return;
  }

  const output = [];
  let processedCount = 0;
  let skippedCount = 0;

  const fileStream = fs.createReadStream(inputFilePath);
  const rl = require('readline').createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    try {
      const record = JSON.parse(line);
      const { scientific_name, common_name, image_url } = record;

      // Filter records
      if (image_url === null || common_name === null) {
        skippedCount++;
        console.log(`Missing field - ${scientific_name}`);
        continue;
      }

      // Fetch GBIF data
      const gbifData = await fetchGbifData(scientific_name);
      if (!gbifData) {
        skippedCount++;
        console.log(`GBIF fetch failure - ${scientific_name}`);
        continue;
      }

      // Construct output record
      output.push({
        scientificName: scientific_name,
        commonName: common_name,
        kingdom: gbifData.kingdom,
        phylum: gbifData.phylum,
        class: gbifData.class,
        order: gbifData.order,
        family: gbifData.family,
        genus: gbifData.genus,
        species: gbifData.species,
        images: image_url,
      });

      processedCount++;
      // console.log(`Processed: ${processedCount}, Skipped: ${skippedCount}`);
    } catch (error) {
      console.error('Error processing record:', error);
      skippedCount++;
      continue; // Ensure the loop continues even if an error occurs
    }
  }

  // Save output
  fs.writeFileSync(outputFilePath, JSON.stringify(output, null, 2));
  console.log(`Processing complete. Processed: ${processedCount}, Skipped: ${skippedCount}. Output saved to ${outputFilePath}`);
}

async function main() {
  // const fileName = process.argv[2];
  // if (!fileName) {
  //   console.error('Please provide a file name as an argument.');
  //   process.exit(1);
  // }
  // await processFile(fileName);

  const families = [
    "Asparagaceae","Moraceae","Rosaceae",
    "Orchidaceae","Lamiaceae","Rutaceae","Fabaceae",
    "Poaceae","Solanaceae","Cucurbitaceae","Myrtaceae","Euphorbiaceae",
    "Asteraceae","Rubiaceae","Gesneriaceae","Begoniaceae","Crassulaceae",
    "Cactaceae"
  ];
  for (const family of families) {
    console.log(`Process family: ${family}`);
    await processFile(`${family}.ndjson`);
  }
}

main();
