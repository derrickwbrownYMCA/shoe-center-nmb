# Cloud 6 Pilot Upload Plan

This is the cleanest first upload test because Cloud 6 is flagship, image coverage is strong, and width handling can be validated on a modern high-volume product.

## Pilot File

- `On Inventory - cloud-6-pilot-upload-v2.csv`

## Image Coverage

- Rows with matched hero images: `202`
- Rows still unmatched: `0`
- Unique missing image combinations: `0`

## Before Upload

- If this is products-only: proceed now and ignore local image-path columns for the first import test.
- If this is products-plus-images: hero images still need hosted URLs in `Image Src`, not local file paths.