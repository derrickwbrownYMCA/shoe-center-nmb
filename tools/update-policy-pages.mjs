import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SHOP_DOMAIN = 'bhnfcj-9i.myshopify.com';
const sourcePath = process.argv[2] || 'C:\\Users\\DerrickBrown\\Downloads\\policy_pages_v2.html';
const workDir = join('tools', '.policy-update');
const queryPath = join(workDir, 'update-policy.graphql');
const variablePath = join(workDir, 'variables.json');
const outputPath = join(workDir, 'result.json');
const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function extractBlock(source, label) {
  const start = source.indexOf(`<!-- ============ ${label} ============ -->`);
  if (start === -1) throw new Error(`Missing block: ${label}`);
  const afterStart = source.indexOf('-->', start) + 3;
  const next = source.indexOf('<!-- ============', afterStart);
  return source.slice(afterStart, next === -1 ? source.length : next).trim();
}

const source = readFileSync(sourcePath, 'utf8');
const policyHtml = {
  refund: extractBlock(source, '1. REFUND POLICY'),
  shipping: extractBlock(source, '2. SHIPPING POLICY'),
  contact: extractBlock(source, '3. CONTACT INFORMATION'),
};

const candidates = [
  { key: 'refund', type: 'REFUND_POLICY' },
  { key: 'shipping', type: 'SHIPPING_POLICY' },
  { key: 'contact', type: 'CONTACT_INFORMATION' },
];

const mutation = `
  mutation UpdatePolicy($shopPolicy: ShopPolicyInput!) {
    shopPolicyUpdate(shopPolicy: $shopPolicy) {
      shopPolicy { id type title }
      userErrors { field message }
    }
  }
`;

const updated = [];
const skipped = [];

mkdirSync(workDir, { recursive: true });
writeFileSync(queryPath, mutation, 'utf8');

for (const item of candidates) {
  writeFileSync(variablePath, JSON.stringify({
    shopPolicy: {
      type: item.type,
      body: policyHtml[item.key],
    },
  }, null, 2), 'utf8');

  execFileSync(npxBin, [
    '--yes',
    '@shopify/cli@latest',
    'store',
    'execute',
    '--store',
    SHOP_DOMAIN,
    '--query-file',
    queryPath,
    '--variable-file',
    variablePath,
    '--output-file',
    outputPath,
    '--allow-mutations',
    '--json',
  ], { shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'pipe'] });

  const data = JSON.parse(readFileSync(outputPath, 'utf8'));
  const result = data.shopPolicyUpdate;
  if (result.userErrors?.length) {
    skipped.push({ key: item.key, type: item.type, reason: result.userErrors.map((e) => e.message).join('; ') });
  } else {
    updated.push(result.shopPolicy);
  }
}

console.log(JSON.stringify({ ok: true, updated, skipped }, null, 2));
