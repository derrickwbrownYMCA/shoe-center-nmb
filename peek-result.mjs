import fs from 'fs';
import path from 'path';

const RESULTS_DIR = 'C:\\Users\\DerrickBrown\\.claude\\projects\\C--Users-DerrickBrown-OneDrive---YMCA-of-Coastal-Carolina--Codex-shoe-center-nmb\\9c96ae80-4161-44bf-bdb0-fb5f344667b5\\tool-results';

const files = fs.readdirSync(RESULTS_DIR)
  .filter(f => f.includes('graphql_query') && f.endsWith('.txt'));

for (const file of files) {
  const full = path.join(RESULTS_DIR, file);
  const txt = fs.readFileSync(full, 'utf8');
  console.log(`\n=== ${file} (${txt.length} chars) ===`);
  console.log(txt.substring(0, 600));
  console.log('...');
  // Also look for any cdn.shopify.com URL
  const cdnMatch = txt.match(/https:\/\/cdn\.shopify\.com\/s\/files\/[^\\"]+/);
  if (cdnMatch) console.log('\nSample CDN URL:', cdnMatch[0].substring(0, 120));
}
