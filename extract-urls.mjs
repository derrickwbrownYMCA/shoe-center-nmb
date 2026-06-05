/**
 * extract-urls.mjs
 * Reads all Shopify GraphQL result files, extracts filename → CDN URL pairs,
 * then re-builds the import CSV with all 147 images matched.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESULTS_DIR = 'C:\\Users\\DerrickBrown\\.claude\\projects\\C--Users-DerrickBrown-OneDrive---YMCA-of-Coastal-Carolina--Codex-shoe-center-nmb\\9c96ae80-4161-44bf-bdb0-fb5f344667b5\\tool-results';
const CSV_IN  = path.join(__dirname, 'On Inventory - shopify-wave1-core-launch-image-mapped-v5.csv');
const CSV_OUT = path.join(__dirname, 'On Inventory - shopify-import-ready.csv');

// ── Step 1: Find all graphql_query result files ───────────────────────────────

const resultFiles = fs.readdirSync(RESULTS_DIR)
  .filter(f => f.includes('graphql_query') && f.endsWith('.txt'))
  .map(f => path.join(RESULTS_DIR, f));

console.log(`📡 Found ${resultFiles.length} GraphQL result file(s)`);

// ── Step 2: Extract filename → CDN URL from all files ────────────────────────

const urlMap = {};

for (const file of resultFiles) {
  const raw = fs.readFileSync(file, 'utf8');

  let json;
  try {
    json = JSON.parse(raw);
  } catch(e) {
    console.warn(`  ⚠️  Could not parse ${path.basename(file)}`);
    continue;
  }

  const edges = json?.data?.files?.edges || [];
  const pageInfo = json?.data?.files?.pageInfo;

  for (const edge of edges) {
    const node = edge.node;
    const cdnUrl = node?.image?.url;
    const srcUrl = node?.originalSource?.url || cdnUrl || '';

    if (!cdnUrl) continue;

    // Extract filename from originalSource URL (has the original filename)
    const rawFilename = srcUrl.split('/').pop().split('?')[0];
    const base = path.basename(rawFilename, path.extname(rawFilename)).toLowerCase();
    urlMap[base] = cdnUrl;
  }

  console.log(`   Parsed ${edges.length} URLs from ${path.basename(file)} (hasNextPage: ${pageInfo?.hasNextPage}, cursor: ${pageInfo?.endCursor?.slice(0,20)}...)`);
}

console.log(`\n✅ Total unique CDN URLs: ${Object.keys(urlMap).length}`);

// Show sample
const sample = Object.entries(urlMap).slice(0, 3);
for (const [k, v] of sample) {
  console.log(`   ${k} → ${v.slice(0, 60)}...`);
}

// ── Step 3: Read CSV and match ────────────────────────────────────────────────

console.log('\n📄 Building import CSV...');
const csvText = fs.readFileSync(CSV_IN, 'utf8');
const lines   = csvText.split('\n');
const header  = lines[0];
const cols    = header.split(',');

const idxImageSrc      = cols.indexOf('Image Src');
const idxLocalHeroPath = cols.indexOf('Local Hero Image Path');

let matched = 0, unmatched = 0, skipped = 0;
const outLines = [header];
const unmatchedNames = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) { outLines.push(line); continue; }

  const fields = parseCSVLine(line);
  const localPath = fields[idxLocalHeroPath] || '';

  if (!localPath) {
    skipped++;
    outLines.push(fields.join(','));
    continue;
  }

  const filename = path.basename(localPath, path.extname(localPath)).toLowerCase();
  let cdnUrl = urlMap[filename];

  if (!cdnUrl) {
    // Try without trailing __2, __3 suffixes
    const clean = filename.replace(/__\d+$/, '');
    cdnUrl = urlMap[clean];
  }

  if (cdnUrl) {
    fields[idxImageSrc] = cdnUrl;
    matched++;
  } else {
    unmatchedNames.add(filename);
    unmatched++;
  }

  outLines.push(fields.join(','));
}

fs.writeFileSync(CSV_OUT, outLines.join('\n'), 'utf8');

console.log('\n─────────────────────────────────────────────');
console.log(`✅ Matched:   ${matched} rows`);
console.log(`⚠️  Unmatched: ${unmatched} rows`);
console.log(`⏭️  Skipped:   ${skipped} rows (low confidence)`);

if (unmatchedNames.size > 0 && unmatchedNames.size <= 20) {
  console.log('\nUnmatched filenames:');
  for (const n of unmatchedNames) console.log(`  - ${n}`);
}

console.log(`\n📄 Output: ${CSV_OUT}`);

// ── Helper ────────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}
