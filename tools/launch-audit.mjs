import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'launch-artifacts', 'shoecenternmb-launch-2026-05-27');
const OLD_SITE = 'https://shoecenternmb.com';
const SHOPIFY = 'https://bhnfcj-9i.myshopify.com';
const IMPORT_CSV = path.join(ROOT, 'On Inventory - shopify-import-ready.csv');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.join(OUT_DIR, 'old-site-html-snapshot'), { recursive: true });

const oldUrls = await loadSitemapUrls(`${OLD_SITE}/sitemap.xml`);
const shopifyUrls = await loadSitemapUrls(`${SHOPIFY}/sitemap.xml`);
const products = await loadShopifyProducts(shopifyUrls);
const collections = shopifyUrls.filter((url) => url.includes('/collections/'));
const pages = shopifyUrls.filter((url) => url.includes('/pages/'));
const redirects = buildRedirects(oldUrls, collections, pages);
const imageRepairRows = buildImageRepairRows(products);
const imageRepairImport = buildImageRepairImport(products);

writeCsv(
  path.join(OUT_DIR, 'old-site-url-inventory.csv'),
  ['url', 'path', 'kind', 'suggested_shopify_target'],
  oldUrls.map((url) => [url, new URL(url).pathname, classifyOldUrl(url), suggestTarget(url)])
);

writeCsv(
  path.join(OUT_DIR, 'shopify-url-inventory.csv'),
  ['url', 'path', 'kind'],
  shopifyUrls.map((url) => [url, new URL(url).pathname, classifyShopifyUrl(url)])
);

writeCsv(
  path.join(OUT_DIR, 'shopify-product-audit.csv'),
  [
    'handle',
    'title',
    'vendor',
    'type',
    'available',
    'variant_count',
    'image_count',
    'featured_image',
    'description_empty',
    'risk',
    'action',
  ],
  products.map((product) => [
    product.handle,
    product.title,
    product.vendor,
    product.type,
    product.available,
    product.variants?.length ?? 0,
    product.images?.length ?? 0,
    product.featured_image || '',
    stripHtml(product.description || '').trim() ? 'no' : 'yes',
    productRisk(product),
    productAction(product),
  ])
);

writeCsv(
  path.join(OUT_DIR, 'shopify-redirects-import.csv'),
  ['Redirect from', 'Redirect to'],
  redirects
);

writeCsv(
  path.join(OUT_DIR, 'on-product-image-repair.csv'),
  [
    'Handle',
    'Title',
    'Image Src',
    'Image Position',
    'Image Alt Text',
    'Local Hero Image Path',
    'Matched Product Folder',
    'Matched Color Folder',
    'Matched Width Folder',
    'Hero Match Confidence',
  ],
  imageRepairRows
);

writeCsv(
  path.join(OUT_DIR, 'on-image-repair-shopify-import.csv'),
  imageRepairImport.header,
  imageRepairImport.rows
);

const snapshotRows = await snapshotOldHtml(oldUrls);
writeCsv(
  path.join(OUT_DIR, 'old-site-html-snapshot-index.csv'),
  ['url', 'status', 'final_url', 'file', 'title'],
  snapshotRows
);

writeMarkdownSummary({ oldUrls, shopifyUrls, products, redirects, imageRepairRows, snapshotRows });

console.log(`Launch artifacts written to ${OUT_DIR}`);
console.log(`Old URLs: ${oldUrls.length}`);
console.log(`Shopify URLs: ${shopifyUrls.length}`);
console.log(`Shopify products audited: ${products.length}`);
console.log(`Redirect rows: ${redirects.length}`);
console.log(`Image repair rows: ${imageRepairRows.length}`);
console.log(`High-confidence image repair import rows: ${imageRepairImport.rows.length}`);

async function loadSitemapUrls(indexUrl) {
  const seenSitemaps = new Set();
  const urls = new Set();

  async function visit(url) {
    if (seenSitemaps.has(url)) return;
    seenSitemaps.add(url);

    const xml = await fetchText(url);
    for (const loc of [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decodeXml(match[1]))) {
      if (loc.includes('sitemap') && loc.endsWith('.xml') || loc.includes('sitemap_')) {
        await visit(loc);
      } else {
        urls.add(loc);
      }
    }
  }

  await visit(indexUrl);
  return [...urls].sort();
}

async function loadShopifyProducts(urls) {
  const productUrls = urls.filter((url) => url.includes('/products/'));
  const products = [];

  for (const url of productUrls) {
    const jsonUrl = `${url}.js`;
    try {
      const product = JSON.parse(await fetchText(jsonUrl));
      products.push(product);
    } catch (error) {
      products.push({
        handle: new URL(url).pathname.split('/').pop(),
        title: new URL(url).pathname,
        vendor: '',
        type: '',
        available: false,
        variants: [],
        images: [],
        featured_image: '',
        description: '',
        error: error.message,
      });
    }
  }

  return products.sort((a, b) => String(a.handle).localeCompare(String(b.handle)));
}

function buildRedirects(oldUrls) {
  const rows = [];
  const add = (from, to) => {
    if (!rows.some((row) => row[0] === from)) rows.push([from, to]);
  };

  for (const url of oldUrls) {
    const pathname = new URL(url).pathname;
    const target = suggestTarget(url);
    if (target) add(pathname, target);
  }

  add('/shop/', '/collections/all');
  add('/shop-buy-save-big-at-our-retail-store-in-north-myrtle-beach/', '/collections/all');
  add('/about/', '/pages/our-story');
  add('/contact/', '/pages/contact');
  add('/comfort/', '/collections/everyday-comfort');
  add('/fashion/', '/collections/all');
  add('/dance/', '/collections/dance');
  add('/brands/coast/', '/collections/brands');
  add('/brands/trotters/', '/collections/brands');
  add('/brands/mariana/', '/collections/brands');
  add('/brands/kela-ci/', '/collections/brands');
  add('/brands/florsheim/', '/collections/brands');

  return rows.sort((a, b) => a[0].localeCompare(b[0]));
}

function buildImageRepairRows(products) {
  const missing = new Set(
    products
      .filter((product) => product.vendor === 'On' && (!product.images || product.images.length === 0))
      .map((product) => product.handle)
  );

  if (!fs.existsSync(IMPORT_CSV) || missing.size === 0) return [];

  const rows = parseCsv(fs.readFileSync(IMPORT_CSV, 'utf8'));
  const header = rows[0];
  const indexes = Object.fromEntries(header.map((name, index) => [name, index]));
  const usedKeys = new Set();
  const output = [];

  for (const fields of rows.slice(1)) {
    const handle = fields[indexes.Handle];
    const imageSrc = fields[indexes['Image Src']];
    const color = fields[indexes['Option2 Value']] || '';
    const width = fields[indexes['Option3 Value']] || '';
    const imagePosition = fields[indexes['Image Position']] || '1';

    if (!missing.has(handle) || !imageSrc) continue;

    const key = `${handle}|${imageSrc}|${color}|${width}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);

    output.push([
      handle,
      fields[indexes.Title],
      imageSrc,
      imagePosition,
      fields[indexes['Image Alt Text']] || `${fields[indexes.Title]} in ${color}`.trim(),
      fields[indexes['Local Hero Image Path']] || '',
      fields[indexes['Matched Product Folder']] || '',
      fields[indexes['Matched Color Folder']] || '',
      fields[indexes['Matched Width Folder']] || '',
      fields[indexes['Hero Match Confidence']] || '',
    ]);
  }

  return output;
}

function buildImageRepairImport(products) {
  const missing = new Set(
    products
      .filter((product) => product.vendor === 'On' && (!product.images || product.images.length === 0))
      .map((product) => product.handle)
  );

  if (!fs.existsSync(IMPORT_CSV) || missing.size === 0) return { header: ['Handle'], rows: [] };

  const rows = parseCsv(fs.readFileSync(IMPORT_CSV, 'utf8'));
  const header = rows[0];
  const indexes = Object.fromEntries(header.map((name, index) => [name, index]));

  const filtered = rows.slice(1).filter((fields) => {
    const handle = fields[indexes.Handle];
    const imageSrc = fields[indexes['Image Src']];
    const confidence = Number(fields[indexes['Hero Match Confidence']] || 0);
    return missing.has(handle) && imageSrc && confidence >= 0.9;
  });

  return { header, rows: filtered };
}

async function snapshotOldHtml(urls) {
  const rows = [];
  const htmlUrls = prioritizeSnapshotUrls(urls.filter((url) => !url.includes('?'))).slice(0, 220);
  let cursor = 0;

  async function worker() {
    while (cursor < htmlUrls.length) {
      const index = cursor++;
      const url = htmlUrls[index];
      const pathname = new URL(url).pathname;
      const file = safeSnapshotName(index, pathname);

      try {
        const filePath = path.join(OUT_DIR, 'old-site-html-snapshot', file);
        let text;
        let status = 'CACHED';
        let finalUrl = url;

        if (fs.existsSync(filePath)) {
          text = fs.readFileSync(filePath, 'utf8');
        } else {
          const response = await fetchWithTimeout(url, 12000);
          status = response.status;
          finalUrl = response.url;
          text = await response.text();
          fs.writeFileSync(filePath, text, 'utf8');
        }

        rows[index] = [url, status, finalUrl, `old-site-html-snapshot/${file}`, extractTitle(text)];
      } catch (error) {
        rows[index] = [url, 'ERROR', '', '', error.message];
      }
    }
  }

  await Promise.all(Array.from({ length: 8 }, worker));

  return rows.filter(Boolean);
}

function prioritizeSnapshotUrls(urls) {
  return [...urls].sort((a, b) => snapshotPriority(a) - snapshotPriority(b) || a.localeCompare(b));
}

function snapshotPriority(url) {
  const path = new URL(url).pathname;
  if (path === '/') return 0;
  if (['/about/', '/contact/', '/comfort/', '/fashion/', '/dance/'].includes(path)) return 1;
  if (path.startsWith('/product-category/') || path.startsWith('/brands/')) return 2;
  if (path.startsWith('/project/')) return 3;
  if (path.startsWith('/product/')) return 4;
  return 5;
}

function writeMarkdownSummary({ oldUrls, shopifyUrls, products, redirects, imageRepairRows, snapshotRows }) {
  const missingImages = products.filter((product) => product.vendor === 'On' && (!product.images || product.images.length === 0));
  const emptyDescriptions = products.filter((product) => !stripHtml(product.description || '').trim());
  const lines = [
    '# Shoe Center NMB Launch Implementation Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Artifacts',
    '',
    '- `old-site-url-inventory.csv`: public WordPress/WooCommerce URL inventory from the old sitemap.',
    '- `old-site-html-snapshot/`: HTML snapshot of old public sitemap URLs for archive/reference.',
    '- `old-site-html-snapshot-index.csv`: lookup table from old URL to local HTML snapshot file.',
    '- `shopify-url-inventory.csv`: current public Shopify URL inventory.',
    '- `shopify-product-audit.csv`: product/image/content readiness audit.',
    '- `shopify-redirects-import.csv`: Shopify URL Redirects import file.',
    '- `on-product-image-repair.csv`: rows from the existing Shopify import CSV that should repair currently image-missing On products.',
    '- `on-image-repair-shopify-import.csv`: full Shopify product CSV rows filtered to high-confidence image repairs only.',
    '',
    '## Counts',
    '',
    `- Old-site URLs discovered: ${oldUrls.length}`,
    `- Old-site HTML snapshots saved: ${snapshotRows.filter((row) => row[1] !== 'ERROR').length}`,
    `- Shopify URLs discovered: ${shopifyUrls.length}`,
    `- Shopify products audited: ${products.length}`,
    `- Redirect import rows generated: ${redirects.length}`,
    `- On image repair rows generated: ${imageRepairRows.length}`,
    `- High-confidence image repair import rows generated: ${imageRepairImport.rows.length}`,
    '',
    '## Critical Findings',
    '',
    `- On products missing live Shopify images: ${missingImages.length}`,
    ...missingImages.map((product) => `  - ${product.title} (${product.handle})`),
    `- Products with empty descriptions: ${emptyDescriptions.length}`,
    ...emptyDescriptions.map((product) => `  - ${product.title} (${product.handle})`),
    '',
    '## Manual Admin Steps Still Required',
    '',
    '1. Import or manually apply `on-product-image-repair.csv` in Shopify for products currently missing images.',
    '2. Connect `shoecenternmb.com` in Shopify Admin and apply GoDaddy DNS records.',
    '3. Import `shopify-redirects-import.csv` in Shopify Admin under URL redirects after the domain is connected.',
    '4. Keep Flywheel active for at least 30-60 days after launch as rollback/archive protection.',
    '',
  ];

  fs.writeFileSync(path.join(OUT_DIR, 'launch-implementation-report.md'), lines.join('\n'), 'utf8');
}

function suggestTarget(url) {
  const path = new URL(url).pathname;
  if (path === '/' || path === '') return '/';
  if (path === '/about/') return '/pages/our-story';
  if (path === '/contact/') return '/pages/contact';
  if (path === '/comfort/') return '/collections/everyday-comfort';
  if (path === '/dance/') return '/collections/dance';
  if (path === '/fashion/') return '/collections/all';
  if (path.startsWith('/shop')) return '/collections/all';
  if (path.startsWith('/product/')) return '/collections/all';
  if (path.includes('/product-category/men-s-shoes/dance')) return '/collections/dance';
  if (path.includes('/product-category/women-s-shoes/dance')) return '/collections/dance';
  if (path.includes('/product-category/men-s-shoes/comfort')) return '/collections/everyday-comfort';
  if (path.includes('/product-category/women-s-shoes/comfort')) return '/collections/everyday-comfort';
  if (path.includes('/product-category/men-s-shoes')) return '/collections/mens-favorites';
  if (path.includes('/product-category/women-s-shoes')) return '/collections/womens-favorites';
  if (path.startsWith('/brands/')) return '/collections/brands';
  if (path.startsWith('/project/')) return '/pages/our-story';
  if (path.startsWith('/category/') || path.startsWith('/type/')) return '/blogs/news';
  return '';
}

function classifyOldUrl(url) {
  const path = new URL(url).pathname;
  if (path === '/') return 'home';
  if (path.startsWith('/product/')) return 'woocommerce_product';
  if (path.startsWith('/product-category/')) return 'woocommerce_collection';
  if (path.startsWith('/brands/')) return 'brand_archive';
  if (path.startsWith('/project/')) return 'project';
  if (path.startsWith('/category/') || path.startsWith('/type/')) return 'blog_archive';
  if (/\/\d{4}\//.test(path)) return 'post';
  return 'page_or_post';
}

function classifyShopifyUrl(url) {
  const path = new URL(url).pathname;
  if (path === '/') return 'home';
  if (path.startsWith('/products/')) return 'product';
  if (path.startsWith('/collections/')) return 'collection';
  if (path.startsWith('/pages/')) return 'page';
  if (path.startsWith('/blogs/')) return 'blog';
  return 'other';
}

function productRisk(product) {
  if (product.error) return 'fetch_error';
  if (!product.images || product.images.length === 0) return 'critical_missing_images';
  if (!stripHtml(product.description || '').trim()) return 'high_empty_description';
  if (!product.available) return 'medium_unavailable';
  return 'ok';
}

function productAction(product) {
  if (product.error) return `Review product endpoint: ${product.error}`;
  if (!product.images || product.images.length === 0) return 'Add product media and featured image before marketing.';
  if (!stripHtml(product.description || '').trim()) return 'Add product description before SEO/ads.';
  if (!product.available) return 'Confirm intentional unavailable state.';
  return 'No immediate launch blocker.';
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'ShoeCenterNMBLaunchAudit/1.0' },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.text();
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'ShoeCenterNMBLaunchAudit/1.0' },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function writeCsv(file, header, rows) {
  fs.writeFileSync(file, [header, ...rows].map(serializeCsvRow).join('\n'), 'utf8');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell);
      if (row.some((field) => field !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((field) => field !== '')) rows.push(row);
  return rows;
}

function serializeCsvRow(row) {
  return row
    .map((value) => {
      const string = value == null ? '' : String(value);
      if (/[",\n\r]/.test(string)) return `"${string.replace(/"/g, '""')}"`;
      return string;
    })
    .join(',');
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function safeSnapshotName(index, pathname) {
  const clean = pathname === '/' ? 'home' : pathname.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `${String(index + 1).padStart(3, '0')}-${clean || 'home'}.html`;
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeXml(stripHtml(match[1]).trim()) : '';
}
