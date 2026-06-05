# On Grouped Product Preview

- Grouped Shopify products: `32`
- Low-risk groups: `22`
- Medium-risk groups: `7`
- High-risk groups: `3`

## Launch Wave 1 Candidates

- `On Cloud 6 Men` ? 13 colors, 13 sizes, widths: Regular, Wide, est. grid `338`, strategy `variant_width`
- `On Cloud 6 Men Waterproof` ? 6 colors, 10 sizes, widths: Regular, est. grid `60`, strategy `no_width_variant`
- `On Cloud 6 Women` ? 17 colors, 14 sizes, widths: Regular, Wide, est. grid `476`, strategy `variant_width`
- `On Cloud 6 Women Waterproof` ? 7 colors, 12 sizes, widths: Regular, est. grid `84`, strategy `no_width_variant`
- `On Cloudrunner 2 Men` ? 8 colors, 12 sizes, widths: Regular, Wide, est. grid `192`, strategy `variant_width`
- `On Cloudrunner 2 Men Waterproof` ? 2 colors, 9 sizes, widths: Regular, est. grid `18`, strategy `no_width_variant`
- `On Cloudrunner 2 Women` ? 11 colors, 13 sizes, widths: Regular, Wide, est. grid `286`, strategy `variant_width`
- `On Cloudrunner 2 Women Waterproof` ? 3 colors, 10 sizes, widths: Regular, est. grid `30`, strategy `no_width_variant`
- `On Cloudrunner 3 Men` ? 5 colors, 12 sizes, widths: Regular, Wide, est. grid `120`, strategy `variant_width`
- `On Cloudrunner 3 Women` ? 6 colors, 11 sizes, widths: Regular, Wide, est. grid `132`, strategy `variant_width`
- `On Cloudsurfer 2 Men` ? 5 colors, 10 sizes, widths: Regular, Wide, est. grid `100`, strategy `variant_width`
- `On Cloudsurfer 2 Women` ? 8 colors, 11 sizes, widths: Regular, Wide, est. grid `176`, strategy `variant_width`
- `On Cloudswift 4 Men` ? 9 colors, 12 sizes, widths: Regular, est. grid `108`, strategy `no_width_variant`
- `On Cloudswift 4 Women` ? 8 colors, 11 sizes, widths: Regular, est. grid `88`, strategy `no_width_variant`

## Notes

- `estimated_variant_grid` is the theoretical full matrix if every color carried every size and width.
- `actual_inventory_rows` is the real row count from the source file.
- Width recommendation is conservative: only use Width as an option when both regular and wide exist in the same grouped product.
- Waterproof families remain separate grouped products for now because the source inventory already treats them as distinct style families.
