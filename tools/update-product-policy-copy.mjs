import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const shop = 'bhnfcj-9i.myshopify.com';
const workDir = join('tools', '.policy-update');
const sourcePath = join(workDir, 'product-copy-readback.json');
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const products = source.products?.nodes || [];

const changes = products.map((product) => {
  let descriptionHtml = product.descriptionHtml;
  descriptionHtml = descriptionHtml.replace(
    /Reserve online and try it in store[^<.]*(?:\.|$)/gi,
    'Buy online for pickup, or visit us for expert fit help in North Myrtle Beach — serving the Grand Strand since 1978.'
  );
  descriptionHtml = descriptionHtml.replace(
    /Free exchanges in store, and free North Myrtle Beach pickup, usually ready within 2 hours\./gi,
    'Unworn merchandise returned within 14 days receives store credit. Paid online pickup is usually ready within 2 hours.'
  );
  return { ...product, updatedDescriptionHtml: descriptionHtml };
}).filter((product) => product.updatedDescriptionHtml !== product.descriptionHtml);

if (!changes.length) {
  console.log(JSON.stringify({ ok: true, updated: [], message: 'No stale product policy copy found.' }, null, 2));
  process.exit(0);
}

mkdirSync(workDir, { recursive: true });
writeFileSync(join(workDir, 'product-copy-backup.json'), JSON.stringify(changes.map(({ id, handle, title, descriptionHtml }) => ({ id, handle, title, descriptionHtml })), null, 2));

const definitions = changes.map((_, index) => `$p${index}: ProductUpdateInput!`).join(', ');
const operations = changes.map((_, index) => `
  p${index}: productUpdate(product: $p${index}) {
    product { id handle }
    userErrors { field message }
  }
`).join('\n');
const mutation = `mutation UpdateProductPolicyCopy(${definitions}) { ${operations} }`;
const variables = Object.fromEntries(changes.map((product, index) => [`p${index}`, {
  id: product.id,
  descriptionHtml: product.updatedDescriptionHtml,
}]));

const queryPath = join(workDir, 'update-product-policy-copy.graphql');
const variablesPath = join(workDir, 'update-product-policy-copy-variables.json');
const outputPath = join(workDir, 'update-product-policy-copy-result.json');
writeFileSync(queryPath, mutation, 'utf8');
writeFileSync(variablesPath, JSON.stringify(variables, null, 2), 'utf8');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
execFileSync(npx, [
  '--yes', '@shopify/cli@latest', 'store', 'execute',
  '--store', shop,
  '--query-file', queryPath,
  '--variable-file', variablesPath,
  '--output-file', outputPath,
  '--allow-mutations',
  '--json',
], { shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'pipe'] });

const result = JSON.parse(readFileSync(outputPath, 'utf8'));
const failures = changes.flatMap((product, index) => (result[`p${index}`]?.userErrors || []).map((error) => ({ handle: product.handle, ...error })));
if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, updated: changes.map(({ handle }) => handle), backup: join(workDir, 'product-copy-backup.json') }, null, 2));
