# Product Data Architecture

This document defines how Shoe Center NMB products should be modeled in Shopify so the storefront, search, filters, and merchandising all work from the same logic.

## Modeling Philosophy

- Shopify variants are for things a shopper actively selects.
- Metafields are for structured product intelligence.
- Collections should be automated wherever possible.
- Tags should be light-weight and not carry the full data model.
- The model should support both today's flagship location and future multi-location expansion.
- The model should support legacy comfort shoppers and newer performance/lifestyle shoppers without splitting the catalog into disconnected systems.

## Product-Level Core Fields

- title
- handle
- vendor
- product type
- category
- description
- featured image
- media gallery
- status

## Variant-Level Core Fields

- SKU
- barcode
- price
- compare-at price
- cost
- taxable
- weight if needed
- inventory quantity
- inventory location
- option values

## Recommended Option Structure

Common option order:

1. Size
2. Color
3. Width

## Size System Architecture

Sizing should stay true to the brand's native labeling while still giving shoppers clear guidance.

Core rule:

- if a brand sells in US sizing, keep US sizing in the variant
- if a brand sells in EU sizing, keep EU sizing in the variant
- do not force all brands into one fake universal size system

Recommended approach:

- `Size` remains the primary variant option
- the visible variant value should match the box or brand-native size
- structured metafields should explain the sizing system and fit guidance

Examples:

- `US Women's 8`
- `US Men's 10.5`
- `EU 39`
- `8M / 10W`

If the team prefers shorter labels in Shopify, the native variant values can still be:

- `8`
- `10.5`
- `39`

but the product must then carry a clear size-system metafield and PDP guidance so shoppers know whether they are seeing US men's, US women's, or EU sizing.

### Size System Rules

Recommended product-level sizing metafields:

- `custom.size_system`
- `custom.size_notes`
- `custom.size_guide_label`

Recommended variant-level sizing metafields if needed later:

- `custom.approx_us_womens_size`
- `custom.approx_us_mens_size`

Suggested `size_system` values:

- `us_women`
- `us_men`
- `eu`
- `unisex_us`

Suggested `gender_target` values:

- `women`
- `men`
- `unisex`

### Unisex Product Rule

For true unisex products:

- keep one product, not duplicate men's and women's versions
- set `custom.gender_target` to `unisex`
- set `custom.size_system` to `unisex_us` when sizes are shown as men's and women's equivalents
- let collection logic surface the same product in both men's and women's paths when appropriate

Example:

- variant: `8M / 10W`
- `gender_target`: `unisex`
- `size_system`: `unisex_us`
- PDP note: `Unisex sizing shown as Men's / Women's equivalents.`

This avoids:

- duplicate inventory
- duplicate product pages
- SEO duplication
- inconsistent stock between men's and women's listings

Use `Width` as a variant only when:

- the shopper must actively choose width
- width changes inventory materially
- the product is commonly sold in multiple widths

Otherwise:

- keep width out of the option stack
- use `custom.width_notes` plus PDP fit guidance

### Conversion Guidance Strategy

For EU-sized brands:

- keep the native EU variant value
- show approximate US conversion guidance on the PDP
- support that guidance through metafields instead of relabeling the variants into US-only sizes

Example:

- variant: `EU 39`
- PDP note: `Approx. US Women's 8.5`

This protects:

- inventory accuracy
- staff sanity
- shopper trust
- future import repeatability

Use width as a variant only if:

- the customer must select it directly
- inventory differs materially by width

Otherwise width can be modeled as a filterable attribute and reflected in product copy/metafields.

## Required Metafields

Namespace suggestion:

- `custom`

Recommended product metafields:

- `custom.gender_target`
- `custom.use_case`
- `custom.size_system`
- `custom.size_notes`
- `custom.size_guide_label`
- `custom.true_to_size`
- `custom.width_notes`
- `custom.arch_support_level`
- `custom.cushioning_level`
- `custom.foot_concerns`
- `custom.fit_summary`
- `custom.material`
- `custom.closure_type`
- `custom.travel_friendly`
- `custom.dance_ready`
- `custom.pickup_eligible`
- `custom.badge_primary`
- `custom.brand_priority`
- `custom.style_generation`

Recommended variant metafields if needed later:

- `custom.fit_note_variant`
- `custom.width_label_normalized`
- `custom.approx_us_womens_size`
- `custom.approx_us_mens_size`

## Metafield Value Guidelines

Use controlled values whenever possible.

Examples:

- `gender_target`
  - women
  - men
  - unisex
- `size_system`
  - us_women
  - us_men
  - eu
  - unisex_us
- `use_case`
  - walking
  - work
  - travel
  - sandal
  - casual
  - dress
  - dance
- `brand_priority`
  - flagship
  - core
  - specialty
- `style_generation`
  - legacy
  - modern
  - crossover
- `true_to_size`
  - true_to_size
  - runs_small
  - runs_large
- `width_notes`
  - narrow
  - regular
  - wide
  - extra_wide

Numeric scales:

- `arch_support_level`
  - 1 to 5
- `cushioning_level`
  - 1 to 5

## Automated Collection Strategy

Primary collections:

- women
- men
- dance
- on-running
- new arrivals
- sale
- best sellers
- brands
- walking
- work
- travel
- sandals
- wide friendly

Rules should be driven by:

- product type
- vendor
- price/compare-at
- tags where necessary
- metafields where supported through Shopify filtering strategy

## Filter Strategy

High-value storefront filters:

- size
- width
- color
- brand
- price
- arch support
- cushioning
- use case
- pickup availability
- dance-ready

Filter rules:

- keep top filters visible
- avoid exposing noisy, low-value filters
- use language shoppers understand

## Search and Merchandising Implications

Structured data should support:

- better search relevance
- better related-product logic
- better collection curation
- more useful badges and trust cues

Examples:

- `dance_ready = true` can power dance modules and landing pages
- `pickup_eligible = true` can power pickup callouts
- `arch_support_level >= 4` can support comfort-focused merchandising
- `brand_priority = flagship` can power homepage and collection merchandising
- `style_generation = modern` can support younger-facing edits without abandoning legacy favorites

## PDP Content Mapping

Metafields should render into:

- fit summary block
- size guide support
- size-system label or conversion note where needed
- support/cushion indicators
- use-case badges
- pickup messaging

## Import Governance Rules

- no SKU duplicates
- one canonical vendor name per brand
- one canonical product type per category
- one canonical size and width format
- one canonical rule for native size system versus conversion guidance
- no freeform chaos in structured fields

## Future-Proofing

This model should support:

- 10,000+ SKUs
- collection automation
- search/filter improvements
- future quiz or recommendation logic
- POS and pickup workflows

## Recommended Next Steps

1. Finalize canonical product and variant rules.
2. Define exact Shopify metafield definitions.
3. Identify flagship brands and pilot-product groups, starting with `On`.
4. Build a sample import template with 10 to 20 products.
5. Use that pilot to validate theme rendering and collection logic.
