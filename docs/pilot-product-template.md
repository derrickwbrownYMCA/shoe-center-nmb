# Pilot Product Template

This file is a working sample schema for the first product-data pilot.

Purpose:

- test the metafield model with real product types
- validate PDP rendering needs
- prepare for a future Shopify import template

## Pilot Product Groups

Use a small but representative sample:

- 3 to 5 `On` women's products
- 2 to 3 `On` men's products
- 2 to 3 legacy comfort products
- 2 to 3 dance products

This gives us a realistic mix across:

- flagship brand
- women-led sales
- men's growth
- legacy assortment
- dance specialization

## Product Record Template

Use this structure for each pilot product.

### Core Shopify Fields

- Product title:
- Handle:
- Vendor:
- Product type:
- Category:
- Status:
- Description:
- Featured image:
- Additional images:

### Variant Structure

- Option 1 name:
- Option 1 values:
- Option 2 name:
- Option 2 values:
- Option 3 name:
- Option 3 values:

### Variant Rows

For each variant capture:

- SKU
- Barcode
- Price
- Compare-at price
- Cost
- Inventory quantity
- Location
- Size
- Color
- Width

### Metafields

- `custom.fit_summary`:
- `custom.true_to_size`:
- `custom.width_notes`:
- `custom.arch_support_level`:
- `custom.cushioning_level`:
- `custom.foot_concerns`:
- `custom.use_case`:
- `custom.gender_target`:
- `custom.pickup_eligible`:
- `custom.dance_ready`:
- `custom.brand_priority`:
- `custom.style_generation`:

### Merchandising Notes

- Hero collection candidate:
- Best seller candidate:
- Brand landing page candidate:
- Homepage feature candidate:
- Notes for search/filter behavior:

## Example Sample Rows

These are placeholders to show how we should think, not final product facts.

### Example 1: On Women's Performance

- Product title: `On Cloudsurfer Next`
- Vendor: `On`
- Product type: `Women's Running Shoes`
- `custom.gender_target`: `women`
- `custom.use_case`: `running`, `walking`, `travel`
- `custom.brand_priority`: `flagship`
- `custom.style_generation`: `modern`
- `custom.pickup_eligible`: `true`

### Example 2: On Men's Everyday Performance

- Product title: `On Cloud 6`
- Vendor: `On`
- Product type: `Men's Casual Performance Shoes`
- `custom.gender_target`: `men`
- `custom.use_case`: `walking`, `travel`, `casual`
- `custom.brand_priority`: `flagship`
- `custom.style_generation`: `modern`
- `custom.pickup_eligible`: `true`

### Example 3: Legacy Comfort

- Product title: `Example Legacy Comfort Shoe`
- Vendor: `Example Brand`
- Product type: `Women's Comfort Shoes`
- `custom.gender_target`: `women`
- `custom.use_case`: `walking`, `work`
- `custom.brand_priority`: `core`
- `custom.style_generation`: `legacy`

### Example 4: Dance

- Product title: `Example Dance Shoe`
- Vendor: `Example Brand`
- Product type: `Dance Shoes`
- `custom.gender_target`: `women`
- `custom.use_case`: `dance`
- `custom.dance_ready`: `true`
- `custom.brand_priority`: `specialty`
- `custom.style_generation`: `crossover`

## Data Rules For The Pilot

- Use real products that matter to the business.
- Prioritize products with good images and known inventory.
- Do not overcomplicate the first pass.
- Focus on data consistency over perfect completeness.

## What We Learn From The Pilot

- whether the metafields are practical to populate
- whether the values are clear enough for staff
- what should be product-level versus variant-level
- which filters are truly useful
- what the theme needs to render on PDPs and collection pages

## Recommended Next Step After This Template

Create a spreadsheet or markdown table using this structure for the first 10 to 15 products.
