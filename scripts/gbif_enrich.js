// Minimal GBIF enricher (single-threaded, Node 18+)
// - Reads `scripts/data/candidates-done.ndjson`
// - For each line, uses `scientific_name` or `scientificName`
// - Calls GBIF `/species/match?name=...` then `/species/{usageKey}` if present
// - Writes one JSON file per species to `data/gbif/<usageKey>-<slug>.json`
// - No retries, no concurrency, minimal logging

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const INPUT = process.env.CANDIDATES_FILE || 'data/candidates-done.ndjson';
const OUT_DIR = process.env.OUT_DIR || 'data';
const OUT_FILE = process.env.OUT_FILE || `${OUT_DIR}/gbif_all.json`;

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function ensureOutDir() {
  await fs.mkdir(OUT_DIR, { recursive: true });
}

async function writeJson(filePath, obj) {
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(obj, null, 2), 'utf8');
  await fs.rename(tmp, filePath);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'gbif-enricher/1.0' } });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

async function processLine(line) {
  if (!line || !line.trim()) return;
  let obj;
  try { obj = JSON.parse(line); } catch (e) { console.error('invalid json, skip'); return; }
  const name = obj.scientific_name || obj.scientificName;
  if (!name) return;
  const matchUrl = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`;
  const match = await fetchJson(matchUrl);
  if (!match) { console.log('no-match', name); return { name, match: null }; }

  const usageKey = match.usageKey || match.speciesKey || match.usageKey;
  const detail = usageKey ? await fetchJson(`https://api.gbif.org/v1/species/${usageKey}`) : null;

  // Choose canonicalName for scientificName (prefer detail over match)
  const canonical = (detail && detail.canonicalName) || match.canonicalName || match.scientificName || name;

  // helper to prefer detail then match
  const pick = (field) => {
    if (detail && Object.prototype.hasOwnProperty.call(detail, field) && detail[field]) return detail[field];
    if (match && Object.prototype.hasOwnProperty.call(match, field) && match[field]) return match[field];
    return undefined;
  };

  const aliasesSet = new Set();
  if (obj.common_name) aliasesSet.add(String(obj.common_name));
  if (obj.slug) aliasesSet.add(String(obj.slug));
  if (match && match.scientificName) aliasesSet.add(String(match.scientificName));
  if (match && match.canonicalName) aliasesSet.add(String(match.canonicalName));
  if (detail && detail.scientificName) aliasesSet.add(String(detail.scientificName));
  if (detail && detail.canonicalName) aliasesSet.add(String(detail.canonicalName));

  const aliases = Array.from(aliasesSet).filter(Boolean);

  const plantTaxon = {
    scientificName: canonical,
    kingdom: pick('kingdom'),
    phylum: pick('phylum'),
    class: pick('class'),
    order: pick('order'),
    family: pick('family'),
    genus: pick('genus'),
    species: pick('species'),
    images: obj.image_url,
    aliases
  };

  return plantTaxon;
}

async function run() {
  await ensureOutDir();
  const results = [];
  const stream = await fs.open(INPUT, 'r');
  const rl = readline.createInterface({ input: stream.createReadStream(), crlfDelay: Infinity });
  for await (const line of rl) {
    const r = await processLine(line);
    if (r) results.push(r);
    if (results.length % 10 === 0) {
      console.log(`Processed ${results.length} records`);
    }
  }
  await stream.close();
  await writeJson(OUT_FILE, results);
  console.log('wrote', OUT_FILE, 'entries:', results.length);
}

run().catch(err => { console.error(err && err.message); process.exit(1); });
