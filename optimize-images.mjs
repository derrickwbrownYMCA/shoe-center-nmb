/**
 * optimize-images.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans the On Images folder, deduplicates JPG/PNG pairs (keeps PNG),
 * picks the best hero shot per colorway, resizes to max 2048px,
 * and saves optimized PNGs to On Images Optimized/.
 *
 * Run: node optimize-images.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT_DIR  = path.join(__dirname, 'On Images', 'Library');
const OUTPUT_DIR = path.join(__dirname, 'On Images Optimized');
const MAX_PX     = 2048;   // Shopify recommended max dimension
const PNG_QUALITY = 80;    // 0-100 — 80 gives ~60-70% size reduction with no visible loss

// Shot priority — we pick the first match found per colorway
// d = detail/hero, l-g1 = lifestyle, g1 = gallery 1, g2 = gallery 2, etc.
const SHOT_PRIORITY = ['-d.', '-l-g1.', '-g1.', '-g2.', '-g3.', '-g4.', '-g5.', '-g6.'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else results.push(full);
  }
  return results;
}

function baseName(filePath) {
  // Strip extension for comparison
  return path.basename(filePath, path.extname(filePath)).toLowerCase();
}

function shotPriority(filePath) {
  const name = path.basename(filePath).toLowerCase();
  for (let i = 0; i < SHOT_PRIORITY.length; i++) {
    if (name.includes(SHOT_PRIORITY[i])) return i;
  }
  return SHOT_PRIORITY.length; // lowest priority
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`Input folder not found: ${INPUT_DIR}`);
    process.exit(1);
  }

  const allFiles = walk(INPUT_DIR);

  // Step 1: Separate PNGs and JPGs
  const pngs = allFiles.filter(f => f.toLowerCase().endsWith('.png'));
  const jpgs = allFiles.filter(f => /\.(jpg|jpeg)$/i.test(f));

  // Step 2: Build set of PNG base names to detect duplicates
  const pngBaseNames = new Set(pngs.map(baseName));

  // Step 3: Find JPGs that have a PNG twin (duplicates to skip)
  const jpgDuplicates = jpgs.filter(f => pngBaseNames.has(baseName(f)));
  const jpgUnique     = jpgs.filter(f => !pngBaseNames.has(baseName(f)));

  console.log(`\n📁 Scanned: ${allFiles.length} total files`);
  console.log(`   PNG files:        ${pngs.length}`);
  console.log(`   JPG files:        ${jpgs.length}`);
  console.log(`   JPG duplicates:   ${jpgDuplicates.length} (skipped — PNG version exists)`);
  console.log(`   JPG unique:       ${jpgUnique.length} (no PNG twin — will optimize)`);

  // Step 4: Work with PNGs + unique JPGs
  const candidates = [...pngs, ...jpgUnique];

  // Step 5: Group by colorway folder (parent directory = one colorway)
  const byFolder = {};
  for (const f of candidates) {
    const folder = path.dirname(f);
    if (!byFolder[folder]) byFolder[folder] = [];
    byFolder[folder].push(f);
  }

  // Step 6: Pick best shot per colorway
  const selected = [];
  for (const [folder, files] of Object.entries(byFolder)) {
    files.sort((a, b) => shotPriority(a) - shotPriority(b));
    selected.push(files[0]); // best shot
  }

  console.log(`\n🎯 Selected ${selected.length} hero shots (one per colorway)\n`);

  // Step 7: Optimize and save
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let processed = 0;
  let skipped   = 0;
  let totalSavedKB = 0;

  for (const src of selected) {
    // Preserve relative folder structure under OUTPUT_DIR
    const rel     = path.relative(INPUT_DIR, path.dirname(src));
    const outDir  = path.join(OUTPUT_DIR, rel);
    fs.mkdirSync(outDir, { recursive: true });

    const outName = path.basename(src, path.extname(src)) + '.png';
    const dest    = path.join(outDir, outName);

    try {
      const srcStat  = fs.statSync(src);
      const original = srcStat.size;

      await sharp(src)
        .resize({ width: MAX_PX, height: MAX_PX, fit: 'inside', withoutEnlargement: true })
        .png({ quality: PNG_QUALITY, compressionLevel: 9, effort: 10 })
        .toFile(dest);

      const optimized = fs.statSync(dest).size;
      const savedKB   = Math.round((original - optimized) / 1024);
      totalSavedKB   += Math.max(0, savedKB);

      const pct = Math.round((1 - optimized / original) * 100);
      console.log(`  ✅ ${path.relative(INPUT_DIR, src)}`);
      console.log(`     ${Math.round(original/1024)}KB → ${Math.round(optimized/1024)}KB  (${pct}% smaller)`);
      processed++;
    } catch (err) {
      console.warn(`  ⚠️  Skipped (error): ${src}\n     ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`✅ Done: ${processed} images optimized`);
  if (skipped) console.log(`⚠️  Skipped: ${skipped} files`);
  console.log(`💾 Total space saved: ~${Math.round(totalSavedKB / 1024)} MB`);
  console.log(`📂 Output: ${OUTPUT_DIR}`);
  console.log(`\nNext step: upload everything in "On Images Optimized" to`);
  console.log(`Shopify Admin → Content → Files → Upload files`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
