# Release review: September 4 package vs. current theme

Review date: 2026-09-07

## Decision

**Hold the combined release.** The saved September 4 delta is internally consistent and its ten-file payload is reproducible, but it must not be replaced by the current `theme/` directory or combined with the uncommitted work without a merge. Six shared files contain substantive conflicts, two current dependencies are absent from the package, and the packaged snapshot fails the repository-specific QA check for seasonal Sunday hours.

The package records that the September 4 delta was already published to theme `130231566382`. This review did not publish or change Shopify data.

## Checks run

- Current `theme/`: JavaScript syntax passed; repository QA passed (82 files reported by the check, six referenced images); Shopify Theme Check inspected 55 files and returned one non-blocking `AssetPreload` warning for `fraunces-600.woff2`.
- Packaged `release-sept4/theme/`: JavaScript syntax passed; Shopify Theme Check inspected 54 files with zero offenses; repository QA failed one required marker because `templates/index.json` does not contain the seasonal Sunday-hours string.
- Release payload: `changed-files.json` has 11 entries but only 10 unique paths (`templates/index.json` is duplicated). `prepare-release.mjs` deduplicates it correctly. All 10 payload bodies exactly match the packaged files, and the saved upsert responses contain no user errors.
- Current font asset: `assets/fraunces-600.woff2` is a valid 35,120-byte WOFF2 file.

## Exact September 4 delta (verified/redeployable as that historical delta)

1. `layout/theme.liquid`
2. `sections/exclusive-drop.liquid`
3. `sections/featured-products.liquid`
4. `sections/hero-banner.liquid`
5. `sections/main-page.liquid`
6. `sections/main-product.liquid`
7. `sections/related-products.liquid`
8. `sections/visit-store.liquid`
9. `templates/index.json`
10. `templates/page.exclusive-drop.json`

Do not upload the full packaged `theme/` snapshot as the next theme: it lacks the current Fraunces asset and Carolina Drift section and predates the current settings/schema work.

## Combined deploy manifest after conflicts are resolved (20 files)

### Must be merged before deploy (6)

- `layout/theme.liquid` — current Fraunces/palette and post-Labor-Day structured-hours work conflicts with September 4 pickup/SEO wording.
- `sections/hero-banner.liquid` — current design adds `role="listitem"` to CTA anchors, reversing the September 4 accessibility fix that preserved native link roles.
- `sections/main-page.liquid` — “Free store pickup” changed to “Store pickup.”
- `sections/main-product.liquid` — “Free store pickup” changed to generic pickup while the current file also adds variant buttons and the sticky purchase bar.
- `templates/index.json` — current version removes the September 4 curated eight-product selection, changes pickup/hours, adds Carolina Drift, and changes hero/section presentation settings.
- `templates/page.exclusive-drop.json` — “Free local pickup” changed to generic local-pickup copy.

### Same content; normalize/package once (1)

- `sections/exclusive-drop.liquid` — only line endings differ between package and worktree.

### Carry forward from the September 4 delta (3)

- `sections/featured-products.liquid` — retains `featured_selection` support.
- `sections/related-products.liquid` — retains department-aware, same-vendor-first, available-only recommendations.
- `sections/visit-store.liquid` — retains direct Google Maps default and the September 4 store-hours default.

### Current-only files to add to the merged package (10)

- `assets/fraunces-600.woff2`
- `config/settings_data.json`
- `config/settings_schema.json`
- `sections/drift-band.liquid`
- `sections/feature-bar.liquid`
- `sections/main-cart.liquid`
- `sections/main-collection.liquid`
- `snippets/cart-drawer.liquid`
- `snippets/product-card-styles.liquid`
- `snippets/product-card.liquid`

## Asset/template/settings mismatches and blockers

- **Missing asset:** packaged `layout/theme.liquid` does not use Fraunces, while the current layout does; the package does not contain `assets/fraunces-600.woff2`.
- **Missing section/template dependency:** current `templates/index.json` references `drift-band`, but the package has neither that template entry nor `sections/drift-band.liquid`.
- **Global settings mismatch:** the package omits the current Coastal Ink color settings, `use_fraunces_headings`, and related typography defaults from both config files.
- **Homepage schema mismatch across versions:** the current homepage uses `heading_accent_word`, `scrim_style`, and `background_style`; the matching current section schemas must travel with the template. Conversely, the September 4 homepage uses `featured_selection`, which requires the packaged `featured-products.liquid` schema and behavior.
- **September 4 regressions in current source:** a full upload of current `theme/` would replace the live direct-directions default, curated featured selection, and recommendation logic with older versions. Uploading only the 17 uncommitted paths would still overwrite September 4 behavior in the six substantive shared files.
- **QA blocker:** the repository check expects `Sun 11:00a-5:00p through Labor Day, then 12:00p-5:00p`; the packaged homepage has only `Sun 11am–5pm`. Reconcile the intended post-Labor-Day copy and structured data, then rerun both checks.
- **Non-blocking cleanup:** remove the duplicate `templates/index.json` entry from `changed-files.json`; consider changing the font preload to Shopify's `preload_tag` filter; five invalid but unreferenced brand-logo files remain warnings only.

## Release gate

Merge the six substantive collisions, build one 20-file payload, and require both `npm run qa:theme` and `shopify theme check --path theme` to pass before deployment. Reconfirm homepage product selection, direct directions, recommendation ordering, native CTA link roles, pickup wording, and Sunday-hours behavior in preview.
