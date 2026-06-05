import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, 'On Images Optimized');
function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (/\.(png|jpg)$/i.test(entry.name)) results.push(full);
  }
  return results;
}
const files = walk(root);
console.log(files.join('\n'));
process.stderr.write('TOTAL: ' + files.length + '\n');
