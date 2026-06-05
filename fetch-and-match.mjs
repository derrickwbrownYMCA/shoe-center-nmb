/**
 * fetch-and-match.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads ALL saved GraphQL result files from the .claude tool-results folder,
 * extracts CDN URL pairs via regex (avoids memory issues with full JSON parse),
 * then builds the final Shopify import CSV.
 *
 * Run: node fetch-and-match.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RESULTS_DIR = 'C:\\Users\\DerrickBrown\\.claude\\projects\\C--Users-DerrickBrown-OneDrive---YMCA-of-Coastal-Carolina--Codex-shoe-center-nmb\\9c96ae80-4161-44bf-bdb0-fb5f344667b5\\tool-results';
const CSV_IN  = path.join(__dirname, 'On Inventory - shopify-wave1-core-launch-image-mapped-v5.csv');
const CSV_OUT = path.join(__dirname, 'On Inventory - shopify-import-ready.csv');

// ── Step 1: Extract URL pairs from ALL result files ───────────────────────────

console.log('📡 Scanning GraphQL result files...\n');

const resultFiles = fs.readdirSync(RESULTS_DIR)
  .filter(f => f.includes('graphql_query') && f.endsWith('.txt'))
  .map(f => path.join(RESULTS_DIR, f));

console.log(`Found ${resultFiles.length} result file(s)`);

const urlMap = {}; // base filename (no ext, lowercase) → CDN URL

// Regex to extract pairs:
// "originalSource":{"url":"https://...filename.png?..."} followed by "image":{"url":"https://cdn..."}
// Or we scan for both URL types and pair them

for (const file of resultFiles) {
  const content = fs.readFileSync(file, 'utf8');

  // Extract all originalSource URLs (contain original filename)
  const origMatches = [...content.matchAll(/"originalSource"\s*:\s*\{\s*"url"\s*:\s*"([^"]+)"/g)];
  // Extract all CDN image URLs
  const cdnMatches  = [...content.matchAll(/"image"\s*:\s*\{\s*"url"\s*:\s*"([^"]+)"/g)];

  // Pair them up — in the JSON they appear as pairs in the same node
  // Strategy: find each node block between "MediaImage" markers
  const nodeBlocks = content.split('"__typename":"MediaImage"');

  let pairsFound = 0;
  for (const block of nodeBlocks.slice(1)) {
    const origMatch = block.match(/"originalSource"\s*:\s*\{\s*"url"\s*:\s*"([^"]+)"/);
    const cdnMatch  = block.match(/"image"\s*:\s*\{\s*"url"\s*:\s*"([^"]+)"/);

    // Also try reversed order (image before originalSource in JSON)
    const cdnMatchAlt  = block.match(/"url"\s*:\s*"(https:\/\/cdn\.shopify\.com\/[^"]+)"/);
    const origMatchAlt = block.match(/"url"\s*:\s*"(https:\/\/[^"]*(?:png|jpg|jpeg|webp)[^"]*)".*?"url"\s*:/s);

    const origUrl = origMatch?.[1] || origMatchAlt?.[1] || '';
    const cdnUrl  = cdnMatch?.[1] || cdnMatchAlt?.[1] || '';

    if (!cdnUrl) continue;

    // Get base filename from original URL (has the real filename)
    const rawSrc = origUrl || cdnUrl;
    const rawFilename = rawSrc.split('/').pop().split('?')[0];
    const base = path.basename(rawFilename, path.extname(rawFilename)).toLowerCase();

    if (base && cdnUrl) {
      urlMap[base] = cdnUrl;
      pairsFound++;
    }
  }

  console.log(`  ${path.basename(file)}: ${pairsFound} URLs extracted`);
}

console.log(`\n✅ Total unique CDN URLs: ${Object.keys(urlMap).length}`);

// Show a few On Running matches
const onSamples = Object.entries(urlMap)
  .filter(([k]) => k.includes('cloudrunner') || k.includes('cloud_6') || k.includes('cloudsurfer'))
  .slice(0, 5);

if (onSamples.length > 0) {
  console.log('\nSample On Running matches:');
  for (const [k, v] of onSamples) {
    console.log(`  ${k}`);
    console.log(`  → ${v.slice(0, 80)}...`);
  }
} else {
  console.log('\n⚠️  No On Running images found in results yet.');
  console.log('   Available keys (first 10):');
  Object.keys(urlMap).slice(0, 10).forEach(k => console.log(`   - ${k}`));
}

// ── Step 2: Build CSV ─────────────────────────────────────────────────────────

console.log('\n📄 Building import CSV...');
const csvText = fs.readFileSync(CSV_IN, 'utf8');
const lines   = csvText.split('\n');
const header  = lines[0];
const cols    = header.split(',');

const idxImageSrc      = cols.indexOf('Image Src');
const idxLocalHeroPath = cols.indexOf('Local Hero Image Path');

let matched = 0, unmatched = 0, skipped = 0;
const outLines = [header];
const unmatchedSet = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) { outLines.push(line); continue; }

  const fields = parseCSVLine(line);
  const localPath = fields[idxLocalHeroPath] || '';

  if (!localPath) { skipped++; outLines.push(fields.join(',')); continue; }

  const filename = path.basename(localPath, path.extname(localPath)).toLowerCase();
  let cdnUrl = urlMap[filename] || urlMap[filename.replace(/__\d+$/, '')];

  if (cdnUrl) {
    fields[idxImageSrc] = cdnUrl;
    matched++;
  } else {
    unmatchedSet.add(filename);
    unmatched++;
  }

  outLines.push(fields.join(','));
}

fs.writeFileSync(CSV_OUT, outLines.join('\n'), 'utf8');

console.log('\n─────────────────────────────────────────────');
console.log(`✅ Matched:   ${matched} rows with CDN image URLs`);
console.log(`⚠️  Unmatched: ${unmatched} rows (no CDN URL)`);
console.log(`⏭️  Skipped:   ${skipped} rows (low confidence, no local path)`);

if (unmatchedSet.size > 0 && unmatchedSet.size <= 15) {
  console.log('\nUnmatched filenames (need these in Shopify Files):');
  for (const n of unmatchedSet) console.log(`  - ${n}`);
}

console.log(`\n📄 Ready: ${CSV_OUT}`);

function parseCSVLine(line) {
  const result = [];
  let current = '', inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}
