/**
 * build-import-csv.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Reads the Shopify GraphQL files response (CDN URLs)
 * 2. Reads the wave1 product CSV (has local image path per row)
 * 3. Matches each row's local filename → Shopify CDN URL
 * 4. Writes a clean Shopify-ready import CSV with Image Src filled in
 *
 * Run: node build-import-csv.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Paths ────────────────────────────────────────────────────────────────────

// The GraphQL result saved by the tool
const GQL_RESULT = 'C:\\Users\\DerrickBrown\\.claude\\projects\\C--Users-DerrickBrown-OneDrive---YMCA-of-Coastal-Carolina--Codex-shoe-center-nmb\\9c96ae80-4161-44bf-bdb0-fb5f344667b5\\tool-results\\mcp-0c068db0-3883-4ef8-9b79-ef6d892f15f4-graphql_query-1778366413608.txt';

const CSV_IN  = path.join(__dirname, 'On Inventory - shopify-wave1-core-launch-image-mapped-v5.csv');
const CSV_OUT = path.join(__dirname, 'On Inventory - shopify-import-ready.csv');

// ── Step 1: Build filename → CDN URL map from Shopify files ─────────────────

console.log('📡 Reading Shopify file CDN URLs...');
const raw = fs.readFileSync(GQL_RESULT, 'utf8');
const json = JSON.parse(raw);

const urlMap = {}; // basename (no extension, lowercase) → full CDN URL

for (const edge of json.data.files.edges) {
  const node = edge.node;
  // node.image.url is the CDN URL; node.originalSource.url has the filename
  const cdnUrl = node?.image?.url;
  const srcUrl = node?.originalSource?.url || cdnUrl || '';

  if (!cdnUrl) continue;

  // Extract just the filename from the URL, strip extension and query params
  const rawFilename = srcUrl.split('/').pop().split('?')[0];
  const base = path.basename(rawFilename, path.extname(rawFilename)).toLowerCase();
  urlMap[base] = cdnUrl;
}

console.log(`   Found ${Object.keys(urlMap).length} CDN URLs`);

// ── Step 2: Read CSV ─────────────────────────────────────────────────────────

console.log('📄 Reading product CSV...');
const csvText = fs.readFileSync(CSV_IN, 'utf8');
const lines   = csvText.split('\n');
const header  = lines[0];

// Find column indexes
const cols = header.split(',');
const idxImageSrc       = cols.indexOf('Image Src');
const idxLocalHeroPath  = cols.indexOf('Local Hero Image Path');

if (idxImageSrc === -1 || idxLocalHeroPath === -1) {
  console.error('Could not find required columns. Check CSV headers.');
  process.exit(1);
}

// ── Step 3: Match and fill Image Src ─────────────────────────────────────────

console.log('🔗 Matching filenames to CDN URLs...');

let matched   = 0;
let unmatched = 0;
let skipped   = 0;

const outLines = [header];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) { outLines.push(line); continue; }

  // Simple CSV split (fields don't contain commas inside quotes in this file)
  // Use a proper split that respects quoted fields
  const fields = parseCSVLine(line);

  const localPath = fields[idxLocalHeroPath] || '';
  const existingImageSrc = fields[idxImageSrc] || '';

  if (!localPath) {
    // No local path — low confidence match, leave Image Src empty
    skipped++;
    outLines.push(fields.join(','));
    continue;
  }

  // Get base filename without extension
  const filename = path.basename(localPath, path.extname(localPath)).toLowerCase();

  // Look up in urlMap
  const cdnUrl = urlMap[filename];

  if (cdnUrl) {
    fields[idxImageSrc] = cdnUrl;
    matched++;
  } else {
    // Try stripping trailing __2 duplicates that On Running sometimes adds
    const cleanFilename = filename.replace(/__\d+$/, '');
    const fallback = urlMap[cleanFilename];
    if (fallback) {
      fields[idxImageSrc] = fallback;
      matched++;
    } else {
      unmatched++;
      if (unmatched <= 5) {
        console.warn(`  ⚠️  No CDN match for: ${filename}`);
      }
    }
  }

  outLines.push(fields.join(','));
}

// ── Step 4: Write output ─────────────────────────────────────────────────────

fs.writeFileSync(CSV_OUT, outLines.join('\n'), 'utf8');

console.log('\n─────────────────────────────────────────────');
console.log(`✅ Matched:   ${matched} rows`);
console.log(`⚠️  Unmatched: ${unmatched} rows (no CDN URL found)`);
console.log(`⏭️  Skipped:   ${skipped} rows (low confidence, no local path)`);
console.log(`📄 Output: ${CSV_OUT}`);
console.log('\nNext: import this CSV via Shopify Admin → Products → Import');

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let current  = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
