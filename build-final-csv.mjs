/**
 * build-final-csv.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Constructs CDN URLs directly from known filenames + shop CDN base URL,
 * then writes the final Shopify-ready import CSV.
 *
 * CDN pattern: https://cdn.shopify.com/s/files/1/0586/0415/9022/files/FILENAME.png
 *
 * Run: node build-final-csv.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CDN_BASE = 'https://cdn.shopify.com/s/files/1/0586/0415/9022/files/';
const CSV_IN   = path.join(__dirname, 'On Inventory - shopify-wave1-core-launch-image-mapped-v5.csv');
const CSV_OUT  = path.join(__dirname, 'On Inventory - shopify-import-ready.csv');

// Build a set of filenames we actually uploaded (PNG versions in Optimized folder)
const OPT_DIR = path.join(__dirname, 'On Images Optimized');

function walkPNG(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walkPNG(full));
    else if (/\.(png|jpg)$/i.test(entry.name)) results.push(entry.name);
  }
  return results;
}

const uploadedFilenames = new Set(
  walkPNG(OPT_DIR).map(f => path.basename(f, path.extname(f)).toLowerCase())
);
console.log(`📁 ${uploadedFilenames.size} optimized images available`);

// ── Process CSV ───────────────────────────────────────────────────────────────

// Normalize line endings (Windows \r\n → \n) before splitting
const csvText = fs.readFileSync(CSV_IN, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const lines   = csvText.split('\n');
const header  = lines[0];
const cols    = header.split(',');

const idxImageSrc      = cols.indexOf('Image Src');
const idxLocalHeroPath = cols.indexOf('Local Hero Image Path');

let matched = 0, unmatched = 0, skipped = 0;
const outLines = [header];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) { outLines.push(line); continue; }

  const fields = parseCSVLine(line);
  const localPath = fields[idxLocalHeroPath] || '';

  if (!localPath) {
    skipped++;
    outLines.push(serializeCSVLine(fields));
    continue;
  }

  // Get base filename (no extension), convert to PNG
  const base = path.basename(localPath, path.extname(localPath)).toLowerCase();

  if (uploadedFilenames.has(base)) {
    // Construct CDN URL using the PNG filename
    const pngFilename = path.basename(localPath, path.extname(localPath)) + '.png';
    fields[idxImageSrc] = CDN_BASE + pngFilename;
    matched++;
  } else {
    unmatched++;
  }

  outLines.push(serializeCSVLine(fields));
}

fs.writeFileSync(CSV_OUT, outLines.join('\n'), 'utf8');

console.log('\n─────────────────────────────────────────────');
console.log(`✅ Matched:   ${matched} rows with CDN image URLs`);
console.log(`⚠️  Unmatched: ${unmatched} rows (image not in optimized set)`);
console.log(`⏭️  Skipped:   ${skipped} rows (low confidence, no local path)`);
console.log(`📄 Output:  ${CSV_OUT}`);

// Show a sample row
const sampleLine = outLines.find(l => l.includes('cdn.shopify.com'));
if (sampleLine) {
  const f = parseCSVLine(sampleLine);
  console.log(`\nSample: ${f[0]} | ${f[idxImageSrc]?.substring(0, 80)}...`);
}

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

function serializeCSVLine(fields) {
  return fields.map(f => {
    if (f == null) return '';
    const s = String(f);
    // Quote any field that contains a comma, double-quote, or newline
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(',');
}
