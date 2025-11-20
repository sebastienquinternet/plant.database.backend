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

// const families = [
//   "Araceae","Arecaceae","Asparagaceae","Moraceae","Rosaceae",
//   "Orchidaceae","Lamiaceae","Apiaceae","Rutaceae","Fabaceae",
//   "Poaceae","Solanaceae","Cucurbitaceae","Myrtaceae","Euphorbiaceae",
//   "Asteraceae","Rubiaceae","Gesneriaceae","Begoniaceae","Crassulaceae",
//   "Cactaceae"
// ];

const families = [
];

const TREFLE_TOKEN = process.env.TREFLE_TOKEN || '';
if (!TREFLE_TOKEN) {
  console.error('ERROR: set TREFLE_TOKEN env var');
  process.exit(2);
}

const API_BASE_TREFLE = 'https://trefle.io/api/v1';
const OUT_FILE = process.env.OUT_FILE || 'data/tresfle_fetch_output.ndjson';

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
  for (const fam of families) {
    const items = await fetchFamily(fam);
    await appendLines(items);
    total += items.length;
    console.log(`wrote ${items.length} records for ${fam}, total=${total}`);
  }
  console.log('done. total candidates:', total, 'file:', OUT_FILE);
}

run().catch(err => { console.error(err && (err.message || err)); process.exit(1); });
