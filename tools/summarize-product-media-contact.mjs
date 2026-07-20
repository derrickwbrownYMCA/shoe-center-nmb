import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const shop = 'bhnfcj-9i.myshopify.com';
const workDir = join('tools', '.media-audit');
const queryPath = join('tools', 'product-media-contact-audit.graphql');
const outputPath = join(workDir, 'product-media-contact.json');

mkdirSync(workDir, { recursive: true });

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
execFileSync(npx, [
  '--yes', '@shopify/cli@latest', 'store', 'execute',
  '--store', shop,
  '--query-file', queryPath,
  '--output-file', outputPath,
  '--json',
], { shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'pipe'] });

const data = JSON.parse(readFileSync(outputPath, 'utf8'));
const products = data.products?.nodes || [];

const rows = products.map((product) => {
  const media = product.media?.nodes || [];
  const imageMedia = media.filter((item) => item.mediaContentType === 'IMAGE');
  const normalizedAlts = imageMedia.map((item) => (item.alt || '').trim().toLowerCase());
  const altCounts = normalizedAlts.reduce((counts, alt) => {
    if (alt) counts.set(alt, (counts.get(alt) || 0) + 1);
    return counts;
  }, new Map());
  const variants = product.variants?.nodes || [];
  const variantMedia = variants.map((variant) => ({
    id: variant.id,
    title: variant.title,
    available: variant.availableForSale,
    options: Object.fromEntries((variant.selectedOptions || []).map(({ name, value }) => [name, value])),
    mediaIds: (variant.media?.nodes || []).map((item) => item.id),
  }));

  return {
    title: product.title,
    handle: product.handle,
    mediaCount: media.length,
    blankAltCount: normalizedAlts.filter((alt) => !alt).length,
    duplicateAltGroups: [...altCounts.values()].filter((count) => count > 1).length,
    oversizedImageCount: imageMedia.filter((item) => (item.image?.width || 0) >= 3000 || (item.image?.height || 0) >= 3000).length,
    featuredMedia: product.featuredMedia ? {
      id: product.featuredMedia.id,
      alt: product.featuredMedia.alt,
      dimensions: product.featuredMedia.image ? `${product.featuredMedia.image.width}x${product.featuredMedia.image.height}` : null,
    } : null,
    variantCount: variants.length,
    variantsWithoutMedia: variantMedia.filter((variant) => !variant.mediaIds.length).length,
    variants: product.handle === 'on-cloudrunner-3-women' ? variantMedia : undefined,
  };
});

const cloudrunner = rows.find((row) => row.handle === 'on-cloudrunner-3-women') || null;
const contact = (data.pages?.nodes || []).map((page) => ({
  id: page.id,
  title: page.title,
  handle: page.handle,
  isPublished: page.isPublished,
  bodyLength: (page.body || '').length,
  containsForm: /<form|contact\[|shopify-section/i.test(page.body || ''),
  containsGmail: /shoecenternmb@gmail\.com/i.test(page.body || ''),
}));

console.log(JSON.stringify({
  productCount: rows.length,
  catalog: {
    productsWithBlankAlts: rows.filter((row) => row.blankAltCount).length,
    productsWithDuplicateAlts: rows.filter((row) => row.duplicateAltGroups).length,
    productsWithOversizedImages: rows.filter((row) => row.oversizedImageCount).length,
    productsWithUnboundVariants: rows.filter((row) => row.variantsWithoutMedia).length,
  },
  cloudrunner,
  contact,
  products: rows.map(({ variants, ...row }) => row),
}, null, 2));
