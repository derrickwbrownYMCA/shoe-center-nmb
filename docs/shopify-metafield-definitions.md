# Shopify Metafield Definitions

This document translates the product-data architecture into a practical first-pass Shopify metafield set.

Goal:

- support fit guidance
- support merchandising
- support filtering
- support pickup and location-aware messaging
- support flagship brands and future growth

## Notes Before Creation

- Namespace recommendation: `custom`
- Owner type for all definitions below: `Product`, unless noted otherwise
- Use controlled values where possible
- Keep the first version simple enough to populate consistently

## Phase 1 Metafields To Create First

These are the highest-value fields for conversion and merchandising.

### 1. Fit Summary

- Name: `Fit Summary`
- Namespace and key: `custom.fit_summary`
- Type: `Multi-line text`
- Purpose:
  - short human-readable fit guidance block on PDPs

Example:

- `True to size with a secure heel and roomy toe box. Great for long walking days.`

### 2. True To Size

- Name: `True To Size`
- Namespace and key: `custom.true_to_size`
- Type: `Single line text`
- Allowed values to standardize internally:
  - `true_to_size`
  - `runs_small`
  - `runs_large`

Purpose:

- rules-based fit language
- filtering or badges later if needed

### 3. Size System

- Name: `Size System`
- Namespace and key: `custom.size_system`
- Type: `Single line text`

Suggested standardized values:

- `us_women`
- `us_men`
- `eu`
- `unisex_us`

Purpose:

- tells the storefront how to label and explain the product's size system
- supports future size-guide logic

### 4. Size Notes

- Name: `Size Notes`
- Namespace and key: `custom.size_notes`
- Type: `Multi-line text`

Examples:

- `Sold in EU sizing. EU 39 is approximately US Women's 8.5.`
- `Runs small. If you wear a half size, size up.`
- `Unisex sizing shown as Men's / Women's equivalents.`

### 5. Size Guide Label

- Name: `Size Guide Label`
- Namespace and key: `custom.size_guide_label`
- Type: `Single line text`

Examples:

- `Women's US sizing`
- `Men's US sizing`
- `European sizing`

### 6. Width Notes

- Name: `Width Notes`
- Namespace and key: `custom.width_notes`
- Type: `Single line text`
- Allowed values to standardize internally:
  - `narrow`
  - `regular`
  - `wide`
- `extra_wide`

### 7. Arch Support Level

- Name: `Arch Support Level`
- Namespace and key: `custom.arch_support_level`
- Type: `Integer`
- Allowed range:
- `1` to `5`

### 8. Cushioning Level

- Name: `Cushioning Level`
- Namespace and key: `custom.cushioning_level`
- Type: `Integer`
- Allowed range:
- `1` to `5`

### 9. Foot Concerns

- Name: `Foot Concerns`
- Namespace and key: `custom.foot_concerns`
- Type: `List of single line text`

Suggested standardized values:

- `plantar_support`
- `bunion_friendly`
- `all_day_standing`
- `walking_comfort`
- `wide_forefoot`
- `travel_friendly`
- `dance_support`

### 10. Use Case

- Name: `Use Case`
- Namespace and key: `custom.use_case`
- Type: `List of single line text`

Suggested values:

- `walking`
- `work`
- `travel`
- `casual`
- `dress`
- `sandal`
- `running`
- `dance`

### 11. Gender Target

- Name: `Gender Target`
- Namespace and key: `custom.gender_target`
- Type: `Single line text`

Suggested values:

- `women`
- `men`
- `unisex`

### 12. Pickup Eligible

- Name: `Pickup Eligible`
- Namespace and key: `custom.pickup_eligible`
- Type: `True or false`

Purpose:

- supports pickup messaging and merchandising logic

### 13. Dance Ready

- Name: `Dance Ready`
- Namespace and key: `custom.dance_ready`
- Type: `True or false`

### 14. Brand Priority

- Name: `Brand Priority`
- Namespace and key: `custom.brand_priority`
- Type: `Single line text`

Suggested values:

- `flagship`
- `core`
- `specialty`

Note:

- `On` should likely be marked `flagship`

### 15. Style Generation

- Name: `Style Generation`
- Namespace and key: `custom.style_generation`
- Type: `Single line text`

Suggested values:

- `legacy`
- `modern`
- `crossover`

Purpose:

- helps balance assortment storytelling between long-time favorites and newer curation

## Phase 2 Metafields

These can come after the first schema is working.

### 16. Material

- Namespace and key: `custom.material`
- Type: `Single line text`

### 17. Closure Type

- Namespace and key: `custom.closure_type`
- Type: `Single line text`

Suggested values:

- `lace_up`
- `slip_on`
- `strap`
- `buckle`
- `zip`

### 18. Travel Friendly

- Namespace and key: `custom.travel_friendly`
- Type: `True or false`

### 19. Badge Primary

- Namespace and key: `custom.badge_primary`
- Type: `Single line text`

Suggested values:

- `all_day_comfort`
- `wide_friendly`
- `travel_favorite`
- `dance_ready`
- `pickup_available`

## Optional Variant Metafields Later

Only add these if real use cases emerge.

### Variant Width Label Normalized

- Owner type: `Variant`
- Namespace and key: `custom.width_label_normalized`
- Type: `Single line text`

### Variant Approximate US Women's Size

- Owner type: `Variant`
- Namespace and key: `custom.approx_us_womens_size`
- Type: `Single line text`

Use only when:

- the product is sold in native EU sizing
- the team wants conversion help on the PDP without changing the variant label

### Variant Approximate US Men's Size

- Owner type: `Variant`
- Namespace and key: `custom.approx_us_mens_size`
- Type: `Single line text`

### Variant Fit Note

- Owner type: `Variant`
- Namespace and key: `custom.fit_note_variant`
- Type: `Single line text`

## Suggested Creation Order

1. `fit_summary`
2. `true_to_size`
3. `size_system`
4. `size_notes`
5. `size_guide_label`
6. `width_notes`
7. `arch_support_level`
8. `cushioning_level`
9. `foot_concerns`
10. `use_case`
11. `gender_target`
12. `pickup_eligible`
13. `dance_ready`
14. `brand_priority`
15. `style_generation`

## Pilot Population Recommendation

Populate these first for a small sample set:

- `On`
- top women's best sellers
- top men's growth products
- top dance products

This gives us a realistic test set for:

- PDP rendering
- collection logic
- filtering
- size-system handling
- homepage merchandising

## What This Unlocks

With this schema in place, we can later build:

- fit summary blocks on PDPs
- `Find Your Fit` logic
- brand-aware size guidance for US and EU labels
- unisex size guidance like `8M / 10W` without duplicating products
- comfort and support filters
- better related products
- `On` and flagship-brand merchandising
- multi-location pickup messaging
