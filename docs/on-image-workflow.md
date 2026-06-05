# On Image Workflow

This is the safest and fastest way to load On product images for launch without creating a cleanup mess inside Shopify.

## Recommended Width Strategy

Keep `Width` as a selectable product option when both regular and wide exist for the same product family.

Why this is the best launch choice:

- it matches how customers actually shop
- it avoids duplicate product pages for regular and wide
- it keeps inventory tied to one product page
- it supports future filters and merchandising better

Launch caution:

- use the trimmed core Wave 1 import first
- validate the width picker on the product page before expanding to the full Wave 1 load
- if one specific family becomes unwieldy, split that family later instead of splitting all wide products up front

## Best Image Loading Order

Do not start by manually attaching images one product at a time inside Shopify.

Start here instead:

1. Gather all On images into one local source folder outside the theme.
2. Rename nothing yet unless a filename is truly unusable.
3. Build a mapping sheet that connects each image to:
   - Shopify handle
   - color
   - optional SKU
   - image position
4. Use naming patterns to infer matches where possible.
5. Only after the mapping is clean should we populate `Image Src`, `Image Position`, and `Image Alt Text` in the import CSV.

## Best Practice For Your Current Situation

Because many filenames include the shoe model and color, but not always the exact item number, the best move is:

- load all of the shoe images into a structured local image folder first
- use the naming convention to map images to product handle and color
- use item number or SKU only where it exists and is trustworthy

That is better than trying to force every image to have the item number before mapping.

Why:

- the model + color is often enough to match the correct product family
- SKU-based matching breaks down when vendors use incomplete or inconsistent filenames
- once images are mapped to handle + color, we can backfill SKU-level precision later if needed

## Matching Priority

Use this order when deciding what an image belongs to:

1. Model family
2. Gender family if the filename or folder indicates it
3. Color name
4. Waterproof indicator if present
5. SKU or item number

## Folder Recommendation

Suggested local structure:

- `product-images/on/raw`
- `product-images/on/processed`
- `product-images/on/mapped`

Raw:

- untouched source files from On

Processed:

- web-safe renamed copies if needed

Mapped:

- final approved files that are ready to reference in Shopify import work

## Launch Rule

For launch, product correctness matters more than perfect SKU-level image precision.

That means:

- one correct hero image per color is enough to launch
- lifestyle images can be added after the core PDPs are live
- do not block the first import waiting for every alternate angle

## Next Step

Use `On Image Intake Tracker.csv` to map each Wave 1 product family to image filenames before we generate the image columns for Shopify.
