import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const shop = 'bhnfcj-9i.myshopify.com';
const blogId = 'gid://shopify/Blog/81040343086';
const workDir = join('tools', '.content-update');
const draftDir = join('content', 'blog-drafts');
const draftFiles = [
  'best-shoes-for-walking-myrtle-beach.md',
  'on-cloud-6-vs-cloudrunner-3.md',
  'how-to-choose-carolina-shag-shoes.md',
];

mkdirSync(workDir, { recursive: true });

function field(frontmatter, name) {
  const match = frontmatter.match(new RegExp(`^${name}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
  return match ? match[1].replace(/["']$/, '') : '';
}

function inlineMarkdown(value) {
  return value
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith('# ')) continue;
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('- ')) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }
    if (line.startsWith('|') && index + 1 < lines.length && /^\|[\s|:-]+\|$/.test(lines[index + 1].trim())) {
      flushParagraph();
      flushList();
      const headers = line.split('|').slice(1, -1).map((cell) => cell.trim());
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(lines[index].trim().split('|').slice(1, -1).map((cell) => cell.trim()));
        index += 1;
      }
      index -= 1;
      html.push(`<div class="table-wrapper"><table><thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return html.join('\n');
}

const drafts = draftFiles.map((filename) => {
  const source = readFileSync(join(draftDir, filename), 'utf8');
  const match = source.match(/^---\s*\r?\n([\s\S]+?)\r?\n---\s*\r?\n([\s\S]+)$/);
  if (!match) throw new Error(`Invalid frontmatter in ${filename}`);
  const [, frontmatter, markdown] = match;
  const firstParagraph = markdown.split(/\r?\n\r?\n/).find((block) => !block.startsWith('#')) || '';
  return {
    filename: basename(filename),
    title: field(frontmatter, 'title'),
    handle: field(frontmatter, 'handle'),
    primaryKeyword: field(frontmatter, 'primary_keyword'),
    summary: `<p>${inlineMarkdown(firstParagraph.replace(/\r?\n/g, ' '))}</p>`,
    body: markdownToHtml(markdown),
  };
});

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const existingQueryPath = join(workDir, 'existing-articles.graphql');
const existingOutputPath = join(workDir, 'existing-articles.json');
writeFileSync(existingQueryPath, 'query ExistingArticles { articles(first: 250) { nodes { id handle title isPublished } } }', 'utf8');
execFileSync(npx, [
  '--yes', '@shopify/cli@latest', 'store', 'execute',
  '--store', shop,
  '--query-file', existingQueryPath,
  '--output-file', existingOutputPath,
  '--json',
], { shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'pipe'] });

const existing = JSON.parse(readFileSync(existingOutputPath, 'utf8')).articles?.nodes || [];
const existingHandles = new Set(existing.map((article) => article.handle));
const missing = drafts.filter((draft) => !existingHandles.has(draft.handle));

if (!missing.length) {
  console.log(JSON.stringify({ ok: true, created: [], skipped: drafts.map((draft) => draft.handle) }, null, 2));
  process.exit(0);
}

const definitions = missing.map((_, index) => `$a${index}: ArticleCreateInput!`).join(', ');
const operations = missing.map((_, index) => `
  a${index}: articleCreate(article: $a${index}) {
    article { id handle title isPublished }
    userErrors { field message }
  }
`).join('\n');
const mutation = `mutation CreateContentDrafts(${definitions}) { ${operations} }`;
const variables = Object.fromEntries(missing.map((draft, index) => [`a${index}`, {
  blogId,
  title: draft.title,
  handle: draft.handle,
  body: draft.body,
  summary: draft.summary,
  isPublished: false,
  author: { name: 'Shoe Center NMB' },
  tags: ['Fit Guide', draft.primaryKeyword].filter(Boolean),
}]));

const mutationPath = join(workDir, 'create-articles.graphql');
const variablesPath = join(workDir, 'create-articles-variables.json');
const resultPath = join(workDir, 'create-articles-result.json');
writeFileSync(mutationPath, mutation, 'utf8');
writeFileSync(variablesPath, JSON.stringify(variables, null, 2), 'utf8');

execFileSync(npx, [
  '--yes', '@shopify/cli@latest', 'store', 'execute',
  '--store', shop,
  '--query-file', mutationPath,
  '--variable-file', variablesPath,
  '--output-file', resultPath,
  '--allow-mutations',
  '--json',
], { shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'pipe'] });

const result = JSON.parse(readFileSync(resultPath, 'utf8'));
const failures = missing.flatMap((draft, index) => (result[`a${index}`]?.userErrors || []).map((error) => ({ handle: draft.handle, ...error })));
if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  created: missing.map((draft, index) => result[`a${index}`].article),
  skipped: drafts.filter((draft) => existingHandles.has(draft.handle)).map((draft) => draft.handle),
}, null, 2));
