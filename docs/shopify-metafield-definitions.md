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

### 3. Width Notes

- Name: `Width Notes`
- Namespace and key: `custom.width_notes`
- Type: `Single line text`
- Allowed values to standardize internally:
  - `narrow`
  - `regular`
  - `wide`
  - `extra_wide`

### 4. Arch Support Level

- Name: `Arch Support Level`
- Namespace and key: `custom.arch_support_level`
- Type: `Integer`
- Allowed range:
  - `1` to `5`

### 5. Cushioning Level

- Name: `Cushioning Level`
- Namespace and key: `custom.cushioning_level`
- Type: `Integer`
- Allowed range:
  - `1` to `5`

### 6. Foot Concerns

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

### 7. Use Case

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

### 8. Gender Target

- Name: `Gender Target`
- Namespace and key: `custom.gender_target`
- Type: `Single line text`

Suggested values:

- `women`
- `men`
- `unisex`

### 9. Pickup Eligible

- Name: `Pickup Eligible`
- Namespace and key: `custom.pickup_eligible`
- Type: `True or false`

Purpose:

- supports pickup messaging and merchandising logic

### 10. Dance Ready

- Name: `Dance Ready`
- Namespace and key: `custom.dance_ready`
- Type: `True or false`

### 11. Brand Priority

- Name: `Brand Priority`
- Namespace and key: `custom.brand_priority`
- Type: `Single line text`

Suggested values:

- `flagship`
- `core`
- `specialty`

Note:

- `On` should likely be marked `flagship`

### 12. Style Generation

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

### 13. Material

- Namespace and key: `custom.material`
- Type: `Single line text`

### 14. Closure Type

- Namespace and key: `custom.closure_type`
- Type: `Single line text`

Suggested values:

- `lace_up`
- `slip_on`
- `strap`
- `buckle`
- `zip`

### 15. Travel Friendly

- Namespace and key: `custom.travel_friendly`
- Type: `True or false`

### 16. Badge Primary

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

### Variant Fit Note

- Owner type: `Variant`
- Namespace and key: `custom.fit_note_variant`
- Type: `Single line text`

## Suggested Creation Order

1. `fit_summary`
2. `true_to_size`
3. `width_notes`
4. `arch_support_level`
5. `cushioning_level`
6. `foot_concerns`
7. `use_case`
8. `gender_target`
9. `pickup_eligible`
10. `dance_ready`
11. `brand_priority`
12. `style_generation`

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
- homepage merchandising

## What This Unlocks

With this schema in place, we can later build:

- fit summary blocks on PDPs
- `Find Your Fit` logic
- comfort and support filters
- better related products
- `On` and flagship-brand merchandising
- multi-location pickup messaging
