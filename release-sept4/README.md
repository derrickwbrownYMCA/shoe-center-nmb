# September 4 storefront fixes — published

Live theme: Ethos, 130231566382. Changes were based on a fresh Admin API read of the live theme, not the separately modified workspace `theme` directory. Do not overwrite the live release with that older working directory without merging these fixes.

## Published

1. Carolina Drift newsletter Liquid form ID repair.
2. Suite I and Sunday 11am–5pm in homepage, Contact, contact/shipping policies, and ShoeStore structured data. Removed obsolete seasonal schema override.
3. Direct Google Maps directions from homepage and Contact.
4. Carolina Drift option renamed from Men's Size to Size; existing option ID and size values retained. Men’s now exposes one Size filter.
5. Free pickup wording in product theme, 13 product descriptions, contact topic, Carolina Drift feature, and SEO descriptions.
6. Women’s manual featured ordering mixes On and Vaneli. Homepage now has an editable eight-product selection spanning On, Vaneli, and Carolina Drift; headline changed to Find your next favorite.
7. Recommendations use the product’s women’s/men’s department, prefer the same vendor, and omit unavailable products and the current product.
10. Homepage shopping anchors retain their native link roles.

Items 8 and 9 are proposals in creative-recommendations.md. The generated coastal image is saved alongside it and has not replaced the current live hero.

## Evidence

- Theme Check: zero offenses (`theme-check.json`). Binary assets copied from the existing workspace solely to complete local static validation; none were uploaded.
- `theme-upsert-result.json`: ten files accepted, no user errors. `homepage-selection-result.json`: second template save after registering the product-list setting. Shopify initially stripped the unknown setting during the combined schema/template save, then accepted it after the schema existed.
- Live browser: Carolina Drift form renders an email input and Keep Me Posted button without Liquid errors. No actual email subscription submitted.
- Live browser: Contact and homepage show Suite I, Sunday 11–5, and direct map URLs; structured data confirms Sunday 11:00–17:00.
- Live browser: Men’s shows only Size; expanded filter counts include all seven products for size 9. A subsequent checkbox/apply interaction timed out and is not claimed as passed.
- Live browser: Women’s first products are Cloud 6, Paris, Cloudrunner 3, Adya, Tallis, Cloudsurfer 2.
- Live browser: Cloud 6 Women recommends Cloudrunner 3 Women, Cloudsurfer 2 Women, Cloud 6 Women Waterproof, Cloudrunner 2 Women.
- Live browser: homepage eight products match the saved selection; shopping anchors have no overriding listitem role.
- Final mobile regression checks were interrupted by browser synchronization failure. Earlier pre-change mobile checks are not treated as post-change validation.
- No orders placed, email subscriptions sent, products deleted, or variant values changed.

## Files

- `live-files-before.json`: live source backup.
- `catalog-before.json`: product/collection/policy baseline.
- `theme/`: patched live source and QA assets.
- `changed-files.json`: release file list (deduplicate entries before use).
- `data-jobs.json` and per-operation result files: exact data changes and responses.
- `theme-upsert-variables.json`: exact ten-file release payload.
- `homepage-selection-variables.json`: follow-up homepage settings payload.
- `coastal-hero-concept.png`: AI-generated image concept.

Shopify theme CLI login was unnecessary once Admin API theme-file access was verified. Existing unpublished workspace modifications were left intact.
