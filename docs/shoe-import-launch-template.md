# Shoe Import Launch Template

This document turns the migration planning into a practical loading template for the first brands, especially `On`.

Use this as the operating model before entering products into Shopify.

## Launch Principle

Do not build the first brands by hand directly in Shopify unless the product count is tiny.

For launch-speed and consistency:

- define the product structure first
- define the image structure first
- define variant rules first
- then load products in controlled batches

## Recommended Brand Order

1. `On`
2. one additional women's-focused brand
3. one men's-supporting brand
4. one dance or specialty brand

## Product Structure Rule

Default product model:

- one product per style + gender
- variants for `Size` and `Color`
- use `Width` only when width is a real selectable inventory dimension

Examples:

- `On Cloud 6 Women's`
- `On Cloud 6 Men's`
- `On Cloudrunner 2 Women's`

Do not duplicate products unnecessarily by:

- use case
- waterproof status
- broad merchandising labels

Those belong in attributes/metafields, not separate products.

## Variant Count Control

Even though Shopify supports many more variants than it used to, launch should stay operationally simple.

Recommended launch rule:

- keep first-wave products below roughly `250` variants each
- if a product would go much higher, split it intentionally or reduce launch colors

Launch-safe approach for `On`:

- load core colors first
- load seasonal or fringe colors later
- keep widths only where truly stocked

## Width Rule

Use width as a variant only when:

- the product is stocked in more than one width
- shoppers must choose width before purchase
- width changes inventory materially

Otherwise:

- use `custom.width_notes`
- describe width in PDP content

## Waterproof Rule

Waterproof should be treated as a product attribute, not a variant.

Recommended field:

- `custom.waterproof`

Suggested values:

- `true`
- `false`

Optional later if needed:

- `water_resistant`
- `waterproof`
- `weather_ready`

For launch, boolean is simpler and safer.

## Size Rule

Use the previously defined size-system logic:

- US brands keep native US sizing
- EU brands keep native EU sizing
- unisex labels like `8M / 10W` stay native
- use size guidance, not forced conversion, to help shoppers

## Shopify CSV Columns To Prepare

Minimum native Shopify columns:

- `Handle`
- `Title`
- `Body (HTML)`
- `Vendor`
- `Product Category`
- `Type`
- `Tags`
- `Published`
- `Option1 Name`
- `Option1 Value`
- `Option2 Name`
- `Option2 Value`
- `Option3 Name`
- `Option3 Value`
- `Variant SKU`
- `Variant Barcode`
- `Variant Price`
- `Variant Compare At Price`
- `Variant Inventory Tracker`
- `Variant Inventory Qty`
- `Variant Inventory Policy`
- `Variant Fulfillment Service`
- `Image Src`
- `Image Position`
- `Image Alt Text`

## On Normalized Source To Shopify Mapping

The normalized On export now gives us a cleaner source layer to map from.

Current normalized columns:

- `internal_sku`
- `description_raw`
- `style_base_normalized`
- `gender_normalized`
- `gender_source`
- `waterproof_attribute`
- `quantity_on_hand`
- `barcode`
- `size_group_raw`
- `size_raw`
- `size_value_normalized`
- `size_display_normalized`
- `wide_variant`
- `color_raw`
- `color_normalized`
- `color_normalization_method`
- `price`
- `list_cost`

Recommended Shopify mapping:

| Normalized source | Shopify field | Notes |
| --- | --- | --- |
| `style_base_normalized` + `gender_normalized` | `Title` | Example: `On Cloudrunner 2 Men's` |
| derived from title | `Handle` | Example: `on-cloudrunner-2-mens` |
| `On` | `Vendor` | Fixed for this brand |
| derived | `Type` | Example: `Men's Running Shoes` |
| derived | `Product Category` | Can be assigned later if needed |
| `size_value_normalized` | `Option1 Value` | `Option1 Name` should be `Size` |
| `color_normalized` | `Option2 Value` | `Option2 Name` should be `Color` |
| `wide_variant` | `Option3 Value` only if needed | Use `Width` only on true multi-width products |
| `internal_sku` | `Variant SKU` | Source of truth |
| `barcode` | `Variant Barcode` | Source of truth |
| `price` | `Variant Price` | Source of truth |
| `list_cost` | working cost column | map to cost if desired later |
| `quantity_on_hand` | `Variant Inventory Qty` | Source of truth |
| `waterproof_attribute` | `custom.waterproof` | Attribute, not variant |
| `gender_normalized` | `custom.gender_target` | Product-level |
| derived | `custom.size_system` | likely `us_men` or `us_women` for On |

## Product Grouping Rule For The Normalized On File

Rows should be grouped into one Shopify product when these fields match:

- `style_base_normalized`
- `gender_normalized`
- `waterproof_attribute`

That means:

- `Cloudrunner 2` men's non-waterproof = one product
- `Cloudrunner 2` women's non-waterproof = one product
- `Cloudrunner 2 Waterproof Men` = separate product

This keeps waterproof as a separate product family where the vendor already treats it as a distinct style/SKU family, while still modeling waterproof as an attribute for filtering and PDP logic.

## Width Decision Rule In The Shopify Schema

Do not automatically turn every `wide_variant = true` row into a third option across the whole brand.

Instead:

- if a given grouped product contains both regular and wide inventory, use:
  - `Option3 Name` = `Width`
  - `Option3 Value` = `Regular` or `Wide`
- if a grouped product is only wide or only regular, keep width out of the option stack and store that fact in:
  - `custom.width_notes`

This avoids unnecessary variant explosion.

## Recommended Additional Working Columns

Keep these in the prep sheet even if they are not part of the first raw Shopify CSV export:

- `gender_target`
- `size_system`
- `size_notes`
- `true_to_size`
- `width_notes`
- `waterproof`
- `use_case`
- `arch_support_level`
- `cushioning_level`
- `pickup_eligible`
- `brand_priority`
- `style_generation`
- `primary_collection`
- `secondary_collections`

## What The Inventory File Is Still Missing

The On inventory file is now a good variant/inventory source, but it is not yet a complete Shopify import file.

Still needed before import:

- final Shopify product titles
- final handles
- product descriptions / `Body (HTML)`
- product type assignments
- product category assignments
- tags
- product-level image assignments
- image URLs or image file mapping
- image alt text
- publish status
- compare-at pricing if used
- collection assignments
- fit / support / merchandising metafields
- final width strategy by grouped product

Most important missing layer:

- product grouping decisions
- image mapping
- launch wave decisions

Without those, the file is normalized inventory, but not a finished Shopify load sheet.

## Recommended Next Translation Step

When the full On matrix is ready, create the next sheet with one row per Shopify variant and add:

- `shopify_title`
- `shopify_handle`
- `option1_name`
- `option1_value`
- `option2_name`
- `option2_value`
- `option3_name`
- `option3_value`
- `body_html`
- `product_type`
- `product_category`
- `tags`
- `image_src`
- `image_alt_text`
- `published`

That sheet becomes the actual import-ready working file.

## Recommended On Variant Model

For most `On` shoes:

- `Option1 Name` = `Size`
- `Option2 Name` = `Color`
- `Option3 Name` = blank unless width is real

Why:

- shoe shoppers usually think size first
- keeps the variant grid intuitive
- makes imports easier to QA

## Image Management Rules

Use a strict naming pattern.

Suggested pattern:

- `brand-style-gender-color-01`
- `brand-style-gender-color-02`
- `brand-style-gender-detail-01`

Examples:

- `on-cloud-6-womens-black-01.jpg`
- `on-cloud-6-womens-black-02.jpg`
- `on-cloud-6-mens-white-01.jpg`

Image rules:

- primary image should be the cleanest hero angle
- keep all images grouped by product/style
- use alt text that names the product and color

## Suggested On Loading Matrix

When you build the `On` master sheet, include:

| Style | Gender | Waterproof | Color Count | Size Count | Width Count | Estimated Variants | Launch Wave | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cloud 6 | women | no |  |  |  |  | 1 | flagship lifestyle/performance |
| Cloud 6 | men | no |  |  |  |  | 1 | men's growth anchor |
| Cloudrunner 2 | women | no |  |  |  |  | 1 | comfort/performance bridge |
| Cloudrunner 2 | men | no |  |  |  |  | 1 | men's performance |
| Cloud 6 WP | women | yes |  |  |  |  | 2 | weather story |

Use this matrix to decide:

- one product versus split product
- launch-now versus wave-two
- where width should remain a variant

## Batch Loading Strategy

Do not load all `On` styles at once.

Use this order:

1. one style
2. test in Shopify
3. verify images and variants
4. expand to 3-5 styles
5. then continue brand rollout

## QA Checklist For Each Product Batch

After import, verify:

- title and handle
- vendor and product type
- variant count
- color naming consistency
- size naming consistency
- width behavior
- waterproof attribute
- image order
- image/color alignment
- PDP variant selection
- collection placement
- search appearance

## Recommended Next Step

When the full `On` inventory matrix is ready, map it into this structure first.

Do not import directly from a vendor list until:

- style naming is normalized
- colors are normalized
- sizes are normalized
- width logic is decided
- image naming is controlled
