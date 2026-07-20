import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const shop = 'bhnfcj-9i.myshopify.com';
const workDir = join('tools', '.gift-card-draft');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const amounts = [25, 50, 75, 100, 150, 200];

mkdirSync(workDir, { recursive: true });

function execute(name, query, variables, allowMutations = false) {
  const queryPath = join(workDir, `${name}.graphql`);
  const variablesPath = join(workDir, `${name}-variables.json`);
  const outputPath = join(workDir, `${name}-result.json`);
  writeFileSync(queryPath, query, 'utf8');
  writeFileSync(variablesPath, JSON.stringify(variables, null, 2), 'utf8');

  const args = [
    '--yes', '@shopify/cli@latest', 'store', 'execute',
    '--store', shop,
    '--query-file', queryPath,
    '--variable-file', variablesPath,
    '--output-file', outputPath,
  ];
  if (allowMutations) args.push('--allow-mutations');
  args.push('--json');

  execFileSync(npx, args, {
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(readFileSync(outputPath, 'utf8'));
}

const existing = execute('existing', `
  query ExistingGiftCardDraft($query: String!) {
    products(first: 20, query: $query) {
      nodes {
        id title handle status isGiftCard
        variants(first: 20) { nodes { id title price } }
      }
    }
  }
`, { query: 'gift_card:true' });

if (existing.products?.nodes?.length) {
  console.log(JSON.stringify({
    ok: true,
    skipped: true,
    reason: 'A gift-card product already exists.',
    products: existing.products.nodes,
  }, null, 2));
  process.exit(0);
}

const descriptionHtml = `
  <p>Give them the freedom to choose the right pair with help from the Shoe Center NMB team.</p>
  <ul>
    <li>Redeemable online at shoecenternmb.com or in our North Myrtle Beach store</li>
    <li>Available in six amounts from $25 to $200</li>
    <li>Delivered by email with a unique gift-card code</li>
    <li>No physical gift card is mailed</li>
  </ul>
  <p>To give it in person, forward the gift-card email or print it. Questions? Call <a href="tel:+18432726515">(843) 272-6515</a>.</p>
`.trim();

const created = execute('create-product', `
  mutation CreateGiftCardDraft($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        id title handle status isGiftCard
        options { id name optionValues { id name } }
      }
      userErrors { field message }
    }
  }
`, {
  product: {
    title: 'Shoe Center NMB Gift Card',
    handle: 'shoe-center-nmb-gift-card',
    descriptionHtml,
    productType: 'Gift Card',
    vendor: 'Shoe Center NMB',
    giftCard: true,
    status: 'DRAFT',
    tags: ['Gift Card', 'Online and In Store'],
    productOptions: [{
      name: 'Amount',
      position: 1,
      values: amounts.map((amount) => ({ name: `$${amount}` })),
    }],
    seo: {
      title: 'Shoe Center NMB Gift Card | Online & In Store',
      description: 'Give a Shoe Center NMB gift card, redeemable online or at our North Myrtle Beach shoe store. Choose from $25 to $200.',
    },
  },
}, true);

const createErrors = created.productCreate?.userErrors || [];
if (createErrors.length || !created.productCreate?.product?.id) {
  console.error(JSON.stringify({ ok: false, step: 'productCreate', errors: createErrors }, null, 2));
  process.exit(1);
}

const product = created.productCreate.product;
const variants = execute('create-variants', `
  mutation CreateGiftCardVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(
      productId: $productId
      variants: $variants
      strategy: REMOVE_STANDALONE_VARIANT
    ) {
      productVariants { id title price }
      userErrors { field message }
    }
  }
`, {
  productId: product.id,
  variants: amounts.map((amount) => ({
    optionValues: [{ optionName: 'Amount', name: `$${amount}` }],
    price: amount.toFixed(2),
    taxable: false,
  })),
}, true);

const variantErrors = variants.productVariantsBulkCreate?.userErrors || [];
if (variantErrors.length) {
  console.error(JSON.stringify({
    ok: false,
    step: 'productVariantsBulkCreate',
    product,
    errors: variantErrors,
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  skipped: false,
  product,
  variants: variants.productVariantsBulkCreate.productVariants,
  publication: 'Unpublished draft; no sales channel publication was requested.',
}, null, 2));
