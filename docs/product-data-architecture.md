# Product Data Architecture

This document defines how Shoe Center NMB products should be modeled in Shopify so the storefront, search, filters, and merchandising all work from the same logic.

## Modeling Philosophy

- Shopify variants are for things a shopper actively selects.
- Metafields are for structured product intelligence.
- Collections should be automated wherever possible.
- Tags should be light-weight and not carry the full data model.

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

Recommended variant metafields if needed later:

- `custom.fit_note_variant`
- `custom.width_label_normalized`

## Metafield Value Guidelines

Use controlled values whenever possible.

Examples:

- `gender_target`
  - women
  - men
  - unisex
- `use_case`
  - walking
  - work
  - travel
  - sandal
  - casual
  - dress
  - dance
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

## PDP Content Mapping

Metafields should render into:

- fit summary block
- size guide support
- support/cushion indicators
- use-case badges
- pickup messaging

## Import Governance Rules

- no SKU duplicates
- one canonical vendor name per brand
- one canonical product type per category
- one canonical size and width format
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
3. Build a sample import template with 10 to 20 products.
4. Use that pilot to validate theme rendering and collection logic.
