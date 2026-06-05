# 10,000 SKU Catalog Migration Blueprint

This plan is for moving a large catalog into Shopify safely and in a way that supports long-term merchandising.

## Migration Principle

Do not treat this as a one-time import.

Treat it as:

- a data cleanup project
- a product-structure design project
- an operational rollout project

## Primary Goals

- import products accurately
- preserve or improve merchandising quality
- avoid duplicate, broken, or inconsistent catalog data
- support Shopify collections, filters, search, and pickup workflows
- support future multi-location operations

## Business-Specific Priorities

- protect the legacy comfort/service customer while supporting a younger and more style-aware assortment
- make women's performance and modern lifestyle discovery especially strong
- treat `On` as a flagship brand in migration QA and merchandising readiness
- keep the catalog model ready for future stores in Sayebrook and Downtown Myrtle Beach if those locations open

## Phase 1: Source Audit

Identify every current source of product data:

- current POS
- existing ecommerce platform
- vendor spreadsheets
- barcode or UPC files
- image folders
- pricing files
- inventory exports
- any manual product lists

For each source, document:

- owner
- format
- update frequency
- reliability
- overlapping fields
- missing fields

## Phase 2: Canonical Field Map

Create one master schema for every importable product record.

Minimum fields:

- handle
- title
- vendor
- product type
- category
- description
- status
- tags
- option names
- option values
- variant SKU
- barcode
- price
- compare-at price
- cost
- taxable
- inventory quantity
- inventory location
- image source
- alt text

Required business fields beyond Shopify basics:

- gender target
- size system
- size notes
- use case
- width notes
- arch support level
- cushioning level
- foot concerns
- pickup eligible

## Phase 3: Product Structure Decisions

Lock these rules before importing:

- what is a product versus a variant
- whether size is stored in native US or native EU format for each brand
- when width becomes a variant versus a filter attribute
- which fields are tags
- which fields are metafields
- which fields drive automated collections

Recommended default:

- variants for size, color, and only truly selectable dimensions
- metafields for fit, support, use case, and merchandising logic
- keep native brand sizing in the variant instead of force-converting all brands into one system
- avoid using tags as a long-term structured data system

Sizing rule:

- if the brand sells in US sizing, keep US sizing
- if the brand sells in EU sizing, keep EU sizing
- if the product is truly unisex, keep one product and use native unisex labels like `8M / 10W`
- use metafields and PDP guidance for conversion help
- only use width as a variant when width affects real inventory selection

Unisex rule:

- set `gender_target` to `unisex`
- set `size_system` to `unisex_us` when variant labels are shown as men's and women's equivalents
- avoid duplicating the same shoe into separate men's and women's products
- instead, surface the same product in both shopping paths through collection logic

## Phase 4: Data Cleanup

Before any pilot import, clean:

- duplicate SKUs
- duplicate handles
- inconsistent brand names
- inconsistent product types
- inconsistent size formats
- inconsistent size-system labeling
- inconsistent width labels
- empty descriptions
- missing prices
- missing inventory counts
- broken image references
- discontinued products that should not launch

Normalization rules should exist for:

- brand
- category
- gender
- size
- size system
- width
- color
- use case

## Phase 5: Pilot Import

Do not start with all 10,000 SKUs.

Pilot sequence:

1. 50 products
2. 500 products
3. 2,000 products
4. full catalog

Validate after each stage:

- product grouping
- variant logic
- size labeling accuracy
- EU-to-US conversion guidance where needed
- unisex products showing correctly in both discovery paths without duplicate products
- image quality
- PDP rendering
- collection membership
- filtering behavior
- search quality
- inventory counts
- pickup eligibility

Priority pilot sequence recommendation:

1. `On`
2. top women's brands
3. top men's growth brands
4. dance category
5. remaining catalog

## Phase 6: Full Import Readiness Checklist

Before full import:

- metafields are defined in Shopify
- collections and rules are defined
- navigation is planned
- filter model is planned
- size-system rules are documented by brand
- image naming is stable
- source data freeze date is chosen
- QA owner is assigned

## Phase 7: Full Import Execution

Execution order:

1. freeze source data
2. export source data
3. transform to Shopify-ready format
4. import products and variants
5. associate images
6. import inventory by location
7. verify counts
8. test collections and search
9. review top-selling and high-risk products manually

Even if only one location is live at first, structure imports with Shopify locations in mind so future store expansion does not require rethinking the inventory model from scratch.

## Phase 8: Post-Import QA

Validate:

- total product count
- total variant count
- active versus draft count
- broken images
- empty PDPs
- incorrect prices
- incorrect compare-at prices
- missing barcodes
- missing pickup flags
- missing fit data
- incorrect size labels
- incorrect size-system assignments

Top-priority manual QA:

- top brands
- top men's products
- top women's products
- dance category
- sale items
- pickup-enabled products

## Operational Recommendations

- Keep raw source exports out of Git.
- Track cleaned schemas, templates, and validation logic in Git.
- Maintain one master source-of-truth sheet or database.
- Build repeatable import and validation steps so future updates are not manual chaos.

## Recommended Working Assets

- master field-mapping sheet
- cleaned product master sheet
- image mapping sheet
- validation checklist
- Shopify import template
- launch-day QA checklist

## Risks To Manage

- duplicate products
- inconsistent naming
- bad size/width mappings
- converting EU-sized brands into incorrect US-facing variants
- duplicating unisex products into separate men's and women's SKUs
- image mismatches
- poor collection membership
- search irrelevance
- messy tags
- under-modeled fit data
- importing too much before validation

## Recommended Launch Strategy

- launch core and validated categories first if needed
- prioritize hero categories and top-selling brands
- prioritize `On` and other flagship brands first
- keep uncertain or low-quality products in draft until cleaned

## Success Definition

Migration is successful when:

- customers can find products quickly
- PDP data is clear and useful
- merchandising feels intentional
- inventory is trustworthy
- updates can be repeated without starting over
