import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const themeDir = path.join(root, 'theme');
const failures = [];
const warnings = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function fail(message) {
  failures.push(message);
}

function isValidImage(file) {
  const ext = path.extname(file).toLowerCase();
  const buffer = fs.readFileSync(file);
  if (ext === '.svg') {
    const text = buffer.toString('utf8').trim().toLowerCase();
    return text.includes('<svg') && !text.startsWith('file not found') && !text.startsWith('<!doctype html');
  }
  if (ext === '.png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (ext === '.jpg' || ext === '.jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (ext === '.webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  if (ext === '.gif') return ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString());
  return true;
}

const files = walk(themeDir);
const textFiles = files.filter((file) => ['.liquid', '.json', '.js', '.css'].includes(path.extname(file).toLowerCase()));
const combined = textFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

for (const file of files.filter((candidate) => candidate.endsWith('.json'))) {
  const raw = fs.readFileSync(file, 'utf8');
  const withoutBlockComments = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  try {
    const document = JSON.parse(withoutBlockComments);
    if (document.sections && typeof document.sections === 'object') {
      for (const [sectionId, section] of Object.entries(document.sections)) {
        if (!section?.blocks || typeof section.blocks !== 'object') continue;
        const blockIds = Object.keys(section.blocks);
        if (!blockIds.length) continue;
        if (!Array.isArray(section.block_order)) {
          fail(`${relative(file)} section "${sectionId}" has blocks but no block_order, so Shopify can ignore the configured blocks.`);
          continue;
        }
        const ordered = new Set(section.block_order);
        const missing = blockIds.filter((blockId) => !ordered.has(blockId));
        const unknown = section.block_order.filter((blockId) => !Object.hasOwn(section.blocks, blockId));
        if (missing.length) fail(`${relative(file)} section "${sectionId}" omits blocks from block_order: ${missing.join(', ')}.`);
        if (unknown.length) fail(`${relative(file)} section "${sectionId}" has unknown block_order entries: ${unknown.join(', ')}.`);
      }
    }
  } catch (error) {
    fail(`${relative(file)} is not valid JSON: ${error.message}`);
  }
}

const referencedAssets = new Set();
for (const file of textFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const assetPattern = /['"]([^'"]+\.(?:png|jpe?g|webp|gif|svg))['"]\s*\|\s*asset_url/gi;
  for (const match of source.matchAll(assetPattern)) referencedAssets.add(match[1]);
}

for (const asset of referencedAssets) {
  const file = path.join(themeDir, 'assets', asset);
  if (!fs.existsSync(file)) {
    fail(`Referenced asset is missing: theme/assets/${asset}`);
  } else if (!isValidImage(file)) {
    fail(`Referenced asset is not a valid image: theme/assets/${asset}`);
  }
}

const stalePatterns = [
  [/\/pages\/about\b/i, 'old /pages/about link'],
  [/Reserve online/i, 'unsupported reserve-online language'],
  [/Everything the launch needs to communicate at a glance/i, 'internal launch placeholder copy'],
  [/Send shoppers back to the buy panel/i, 'internal campaign instruction copy'],
];

for (const [pattern, label] of stalePatterns) {
  if (pattern.test(combined)) fail(`Found ${label}.`);
}

const requiredChecks = [
  ['theme/sections/main-product.liquid', 'data-required-option="true"', 'explicit size selection'],
  ['theme/assets/theme.js', "idInput.value = matchingVariant ? matchingVariant.id : '';", 'scoped variant form update'],
  ['theme/snippets/product-card.liquid', "product_vendor_downcase == 'new balance'", 'New Balance online-sales guard'],
  ['theme/layout/theme.liquid', 'Suite I', 'Suite I address'],
  ['theme/templates/index.json', 'Sun 11:00a-5:00p through Labor Day, then 12:00p-5:00p', 'seasonal Sunday hours'],
  ['theme/templates/index.json', '"launch_countdown_enabled": false', 'expired launch countdown disabled'],
  ['theme/templates/blog.json', 'main-blog', 'blog route template'],
  ['theme/templates/article.json', 'main-article', 'article route template'],
  ['theme/snippets/cart-drawer.liquid', '.cart-drawer__empty[hidden]', 'cart drawer hidden-state accessibility guard'],
  ['theme/layout/theme.liquid', "assign seo_title = 'Comfort Shoes in North Myrtle Beach | Shoe Center NMB'", 'homepage SEO metadata'],
  ['theme/layout/theme.liquid', 'twitter:card', 'Twitter social metadata'],
  ['theme/layout/theme.liquid', "blog.articles_count == 0", 'indexable non-empty blog guard'],
  ['theme/sections/main-collection.liquid', 'id="CollectionFiltersForm"', 'collection facet controls'],
  ['theme/sections/main-collection.liquid', 'name="collection-filters"', 'single-open filter accordion'],
  ['theme/sections/header.liquid', '>Fit Guides</a>', 'Fit Guides navigation link'],
];

for (const [name, marker, label] of requiredChecks) {
  const file = path.join(root, name);
  if (!fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes(marker)) {
    fail(`Missing ${label} (${name}).`);
  }
}

const allImageFiles = files.filter((file) => /\.(?:png|jpe?g|webp|gif|svg)$/i.test(file));
for (const file of allImageFiles) {
  if (!isValidImage(file) && !referencedAssets.has(path.basename(file))) {
    warnings.push(`Unused invalid image remains on disk: ${relative(file)}`);
  }
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  console.error(`\nStorefront theme QA failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(`Storefront theme QA passed: ${files.length} theme files, ${referencedAssets.size} referenced local images.`);
if (warnings.length) console.log(`${warnings.length} non-blocking warning(s) reported above.`);
