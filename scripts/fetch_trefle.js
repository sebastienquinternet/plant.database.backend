/*
  Trefle fetcher (Node 18+)
  - Queries Trefle per-family (list at top)
  - Writes NDJSON lines to `data/candidates.ndjson`
  - RATE LIMIT: 1 request per second to Trefle (per-page)

  Usage:
    export TREFLE_TOKEN=your_token
    node scripts/trefle_fetch.js

  Config via env:
    OUT_FILE (default data/candidates.ndjson)
*/

const fs = require('fs').promises;
const path = require('path');

const families = [
  // "Amaryllidaceae", // 2938
  // "Anacardiaceae", // 1364
  // "Apiaceae",
  // "Apocynaceae", // 8844
  // "Araceae",
  // "Araliaceae", // 2556
  // "Arecaceae",
  // "Asparagaceae",
  // "Asteraceae",
  // "Begoniaceae",
  // "Bignoniaceae", // 1090
  // "Boraginaceae", // 4893
  // "Brassicaceae", // 5508
  // "Bromeliaceae", // 4168
  // "Cactaceae",
  // "Campanulaceae", // 3023
  // "Caryophyllaceae", // 4700
  // "Commelinaceae", // 935
  // "Crassulaceae",
  // "Cucurbitaceae",
  // "Cupressaceae", // 359
  // "Euphorbiaceae",
  // "Fabaceae",
  // "Geraniaceae", // 989
  // "Gesneriaceae",
  // "Hydrangeaceae", // 301
  // "Iridaceae", // 3078
  // "Lamiaceae",
  // "Lauraceae", // 3997
  // "Moraceae",
  // "Myrtaceae",
  // "Oleaceae", // 1001
  // "Orchidaceae",
  // "Pinaceae", // 572
  // "Poaceae",
  // "Pteridaceae", // 1694
  // "Rosaceae",
  // "Rubiaceae",
  // "Rutaceae",
  // "Solanaceae",

  // MISSING
  // "Ericaceae", // 6276


  // "Liliaceae", // 945
  // "Malvaceae", // 6764
  // "Marantaceae", // 647
  // "Musaceae", // 171
  // "Piperaceae", // 4132
  // "Plantaginaceae", // 3197
  // "Polypodiaceae", // 4899
  // "Primulaceae", // 4066
  // "Ranunculaceae", // 5140
  // "Sapindaceae", // 2709
  // "Urticaceae", // 2665
  // "Verbenaceae", // 1190
  // "Vitaceae", // 1387
];
const FAMILY_NAME = process.argv[2];

if (!FAMILY_NAME) {
  console.error('Usage: node ./fetch_trefle.js <Family-name>');
  process.exit(1);
}

const TREFLE_TOKEN = process.env.TREFLE_TOKEN || '';
if (!TREFLE_TOKEN) {
  console.error('ERROR: set TREFLE_TOKEN env var');
  process.exit(2);
}

const API_BASE_TREFLE = 'https://trefle.io/api/v1';
const OUT_FILE = process.env.OUT_FILE || `data/Trefle/${FAMILY_NAME}.ndjson`;

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function ensureOut() {
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
}

async function appendLines(lines) {
  if (!lines || lines.length === 0) return;
  const data = lines.map(l => JSON.stringify(l)).join('\n') + '\n';
  await fs.appendFile(OUT_FILE, data, 'utf8');
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'plant-pipeline/1.0' } });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
  }
  return res.json().catch(() => null);
}

async function fetchFamily(family) {
  const out = [];
  let page = 1;
  while (true) {
    const url = `${API_BASE_TREFLE}/species?filter[family_name]=${encodeURIComponent(family)}&page=${page}&token=${TREFLE_TOKEN}`;
    console.log(`Trefle: fetching family=${family} page=${page}`);
    let json;
    try {
      json = await fetchJson(url);
    } catch (err) {
      console.error('Trefle fetch error:', err.message || err);
      break;
    }
    // Respect 1 request/sec rate to Trefle
    await sleep(1100);

    if (!json || !Array.isArray(json.data) || json.data.length === 0) break;
    for (const item of json.data) {

      // const common = item.common_name || (item.common_names && item.common_names[0]) || null;
      // const image = item.image_url || item.image || null;
      // if (!common || !image) continue;
      // const rec = { trefleId: item.id ?? null, scientificName: item.scientific_name ?? item.scientificName ?? item.slug ?? null, commonName: common, image: image };

      out.push(item);
    }
    page += 1;
  }
  return out;
}

async function run() {
  await ensureOut();
  // fresh file
  await fs.writeFile(OUT_FILE, '', 'utf8');
  let total = 0;
  // for (const fam of families) {
    const items = await fetchFamily(FAMILY_NAME);
    await appendLines(items);
    total += items.length;
    console.log(`wrote ${items.length} records for ${FAMILY_NAME}, total=${total}`);
  // }
  console.log('done. total candidates:', total, 'file:', OUT_FILE);
}

run().catch(err => { console.error(err && (err.message || err)); process.exit(1); });
