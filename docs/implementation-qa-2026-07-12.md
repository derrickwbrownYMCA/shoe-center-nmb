# Items 1-6 implementation and QA - July 12, 2026

## Release state

- Theme changes are uploaded only to Shopify development theme `130231074862`; they are not published to the live theme.
- Preview: `https://bhnfcj-9i.myshopify.com/?preview_theme_id=130231074862`
- The live refund, shipping, and contact policies were updated and read back successfully.
- All 13 active product descriptions were updated to remove reserve/free-exchange promises. A pre-change backup is stored in `tools/.policy-update/product-copy-backup.json`.

## Item status

1. **Variant/cart and mobile reliability - implemented and passed in the development theme.**
   - Size starts unselected; hidden variant ID is blank; Add to Cart is disabled.
   - Selected size/color/width update the form ID, URL, image, price, and button within the correct product section.
   - Impossible option combinations are disabled as unavailable and cannot submit a fallback variant.
   - New Balance product cards and PDPs are marked in-store-only and do not expose online checkout.

2. **Trust-breaking details - implemented.**
   - Corrected `/pages/about` links to `/pages/our-story`.
   - Removed references to five invalid logo files; the corrupt unused files remain on disk and were not deleted.
   - Corrected Carolina Drift internal copy and CTA anchors.
   - Added blog and article templates; `/blogs/news` returns 200 in the development theme.
   - Empty collections are omitted from the collection directory and marked `noindex,follow`.
   - Suite I and seasonal Sunday hours are in theme copy and store schema.
   - Live Shopify policies now use Suite I, store credit only, and paid online pickup language.

3. **Legacy search cleanup - Search Console ownership verified and initial cleanup started.**
   - Verified the `shoecenternmb.com` domain property through GoDaddy Domain Connect while signed into the owner's Google account.
   - Confirmed that both Manual Actions and Security Issues report no detected problems.
   - Resubmitted `https://shoecenternmb.com/sitemap.xml`; Google accepted and read it successfully on July 12, 2026, with 31 discovered pages.
   - Requested priority recrawling of the homepage to refresh its current search result.
   - Submitted an exact temporary removal for the obsolete spam/legacy concert URL; the request is processing. No broad prefix removal was used.
   - Search Console currently reports 41 indexed pages and 374 excluded pages. The largest exclusion group is 232 legacy WordPress URLs returning proper 404 responses; these should remain selective redirects or true 404s rather than blanket homepage redirects.
   - After the owner confirmed `accountspayable@shoecenternmb.com` was canceled, removed only that account's exact Google verification TXT record from GoDaddy. Search Console verified the removal and now reports zero unused ownership tokens. Shopify routing, current verification tokens, MX records, and SPF records were left unchanged.

4. **Verified proof - Google reviews selected and staged.**
   - Confirmed the public Google listing at 4.7 stars from 181 reviews on July 12, 2026.
   - Replaced unsourced sample testimonials with verified five-star reviews from Linda Pettigrew, Barbara Mollica, and Krista DeSocio, each linked to the Google review listing.
   - Homepage proof now shows 4.7 Google rating, 181 Google reviews, and 48 years serving the area.
   - Removed fake testimonial defaults and sample preset content so new sections cannot accidentally create unsourced customer quotes.

5. **Catalog expansion - Vaneli owner-only workspace created.**
   - Shopify has 25 real Vaneli draft products; 24 have 235 vendor images uploaded and 39 confident color mappings.
   - Ten image/color matches remain unresolved and were skipped.
   - The automatic Vaneli collection was unpublished from the Online Store. It is now excluded from all sales channels but remains fully visible and editable in Shopify Admin.
   - All audited Vaneli drafts currently show zero total inventory and blank descriptions. A public coming-soon presentation should wait until a curated subset has complete copy and approved imagery.
   - New Balance remains in-store-only.

6. **PDP decision support - implemented.**
   - Added breadcrumbs, paid-pickup/shipping/store-credit/fit-help summaries, variant-linked media, related products, and fit-help links.
   - Live product copy now states 14-day store credit and paid online pickup instead of reserve/free exchange.

## Regression evidence

### Responsive matrix - On Cloud 6 Women

| Viewport | Horizontal overflow | Header clipped | Size preselected | Add enabled initially |
|---:|---|---|---|---|
| 320 | No | No | No | No |
| 360 | No | No | No | No |
| 375 | No | No | No | No |
| 390 | No | No | No | No |
| 414 | No | No | No | No |
| 768 | No | No | No | No |
| 1024 | No | No | No | No |
| 1440 | No | No | No | No |

### Variant/cart assertions

- `5.5 / Glacier/White / Regular` resolved to variant `42453329215534`.
- URL updated to `?variant=42453329215534`.
- Main image changed to Glacier/White.
- Cart line read exactly `5.5 / Glacier/White / Regular` at `$160.00` and persisted after navigating to Carolina Drift.
- Invalid `5 / Glacier/White / Regular` produced no variant ID and a disabled `Unavailable` button.
- Carolina Drift starts on `Select a size`, with Add disabled, and all purchase CTAs point to the buy panel.

## Automated checks

- `npm run qa:theme`: passed. Five unused corrupt image files are warnings only; no live theme reference remains.
- Shopify Theme Check: 53 files inspected, no offenses.
- `git diff --check`: passed.
- No tracked files are deleted.

## Next improvement batch - actions 7-10

- **Lifecycle capture:** Repositioned the footer signup as "Shoe Center Fit Notes," added purpose-specific Shopify tags, clear privacy language, and a documented welcome/recovery/post-purchase/review blueprint. SMS remains intentionally disabled until consent is confirmed.
- **Cart conversion:** Added a live $200 free-standard-shipping progress indicator plus accurate paid-pickup, $7.95 shipping, and 14-day store-credit reassurance.
- **Carolina Drift:** Added the missing color and service-benefit cards, replaced unsupported restock urgency with current-stock language, and added an email update form explicitly labeled as neither a reservation nor preorder.
- **Local SEO:** Expanded store schema from generic `Store` to `ShoeStore` with a stable entity ID, Suite I address, map, coordinates, price range, and current seasonal Sunday hours.
- **Commerce content:** Created three unpublished Shopify article drafts: Myrtle Beach walking shoes, Cloud 6 vs. Cloudrunner 3, and choosing Carolina shag shoes. Source markdown is stored in `content/blog-drafts/`.
- **Release state:** All theme changes remain on development theme `130231074862`; none of this batch was published to the live theme.
- **Verification:** Local storefront QA passed, Shopify Theme Check inspected 53 files with no offenses, and browser checks confirmed the Fit Notes signup, Carolina Drift update form/cards, and cart shipping/reassurance content in the development preview.
- **Search Console:** Domain ownership is verified, security/manual-action checks are clean, the sitemap was refreshed, the homepage was queued for recrawl, and the identified obsolete spam URL was submitted for temporary removal.

## Live-publication release candidate

- **Live theme protected:** The currently published theme remains `Copy of Ethos` (`130146828334`). It was downloaded before release work to `QA/live-theme-backup-2026-07-12/` and was not modified or published over.
- **Release theme:** `Development (3aca57-Derrick)` (`130231074862`) remains unpublished and is the prepared release candidate.
- **Remote audit snapshots:** The pre-final development snapshot is stored at `QA/development-theme-remote-2026-07-12/`; the post-fix release candidate is stored at `QA/release-candidate-remote-2026-07-12/`.
- **Homepage blocker fixed:** Restored the missing `block_order` arrays for all four category tiles and all four feature-bar blocks. Browser verification confirmed Women's, Men's, On Running, and Everyday Comfort link to their intended collections.
- **Visual fallback improved:** Everyday Comfort now uses a distinct casual-sandals coastal image instead of duplicating the Women's tile fallback.
- **Cart accessibility blocker fixed:** Explicitly hide the empty-state message and checkout footer while the cart drawer is closed. The remote preview shows `display: none` when closed and correctly renders On Cloud 6 Women plus Carolina Drift Loafer when opened.
- **Remote integrity:** SHA-256 comparisons confirm the remote release candidate exactly matches the local category-tile section, cart drawer, and homepage template. Remote Shopify Theme Check inspected 53 files with no offenses.
- **Route smoke test:** Homepage, Women's collection, Carolina Drift, News, and Contact rendered without 404 text or horizontal overflow. The homepage shows Suite I, the current seasonal Sunday-hours rule, and both intended lifestyle images.
- **Purchase regression:** On Cloud 6 Women `5.5 / Glacier/White / Regular` resolved to variant `42453329215534`, enabled Add to Cart, and produced the exact cart line at `$160.00`.
- **Deletion audit:** No tracked files are deleted. Five corrupt brand-logo files remain only as unused local warnings and are not referenced by the theme.
- **Publication status:** Published July 12, 2026. Because Shopify does not permit a development-role theme to be published directly, the verified files were uploaded as a new unpublished release copy, renamed `Ethos`, and published as live theme `130231566382`. The former live theme `Copy of Ethos` (`130146828334`) remains unpublished as the immediate rollback copy. Shopify's theme list and the public `shoecenternmb.com` homepage were verified after publication.

## Next review section - findings 14-18

- **Organic content foundation:** Renamed the customer-facing blog hub to `Fit & Footwear Guides`, added it to desktop, mobile, and footer navigation, and changed the robots rule so only an empty blog is `noindex`. Published the three reviewed guides on July 12, 2026: Myrtle Beach walking shoes, Cloud 6 vs. Cloudrunner 3, and Carolina Shag shoes.
- **Homepage metadata:** Added a concise local-intent title, a 145-character value description, Open Graph description/image fallbacks, and Twitter large-card metadata.
- **Page metadata:** Added targeted titles and descriptions for Contact, Our Story, Carolina Drift, and the guides hub. Browser verification confirmed the rendered title/description values and no horizontal overflow.
- **Collection discovery:** Added real storefront facet controls with accessible disclosures, preserved filter parameters while sorting, active-filter tags, price inputs, and responsive mobile behavior. Shopify currently exposes only Availability and Price because Search & Discovery is not installed.
- **Navigation discipline:** Added only the ready `Fit Guides` path. Brands, Dance, Dance Ready, and Style Forward remain excluded because their Shopify collections contain zero products.
- **Collection copy correction:** Backed up and corrected Featured Online, Men's, On Running, and Women's descriptions. Removed `pick up free`, aligned pickup language to prepaid online pickup, and corrected the old `$150` free-shipping claim to `$200+`. Added collection SEO titles and descriptions.
- **Search & Discovery:** Installed the free Shopify Search & Discovery app with owner approval. Configured Availability, Price, Brand, Color, Size, Men's Size, and Width filters.
- **Subscriber stack:** Installed Shopify Forms and Shopify Messaging with owner approval. Both appear in Shopify's installed-app list alongside Search & Discovery. No form, popup, SMS campaign, email campaign, or automation was activated during installation. Contact-form delivery should use `shoecenternmb@gmail.com`.
- **Messaging cost guard:** Shopify Messaging is free to install and currently includes the first 10,000 emails per month; usage above that threshold is billed. No sends or billable messaging actions were initiated.
- **Filter screenshot regression:** Fixed the overlapping filter panels shown in the owner screenshot. Filters now share a single-open accordion group, each panel contains its own Apply button, and widths up to 899px use full-width in-flow panels instead of overlapping dropdowns.
- **Publication:** Published the approved findings 14-18 theme batch to live `Ethos` theme `130231566382` on July 12, 2026. The five deployed files were `layout/theme.liquid`, `sections/main-blog.liquid`, `sections/main-collection.liquid`, `sections/header.liquid`, and `sections/footer.liquid`.
- **Rollback and integrity:** The pre-batch live backup is stored at `QA/live-ethos-pre-batch-backup-2026-07-12/`. The post-deployment five-file snapshot is stored at `QA/live-ethos-post-batch-2026-07-12/`; SHA-256 checks confirm all five live files exactly match the tested local versions.
- **QA:** Custom storefront QA passed, `git diff --check` passed, no tracked files were deleted, Shopify Theme Check inspected 53 files with no offenses, and browser checks confirmed metadata, filter rendering, Fit Guides navigation, corrected collection copy, and no horizontal overflow. Post-publication public requests confirmed HTTP 200 responses and expected content for the homepage, Women's collection, guides hub, and all three articles, with no unintended `noindex` tags.

## Next section - product media, fit-help contact, and gift-card readiness

- **Catalog media audit:** Read all 13 active products without changing catalog media. All products have alt text, but 12 reuse identical alt text across multiple views and 12 have source masters at or above 3,000 pixels. Shopify CDN resizing remains the delivery mechanism; no product images were deleted or replaced.
- **Accessible product imagery:** Added a keyboard-accessible native-dialog image viewer, unique `product view X of Y` descriptions for gallery images, 1,200-pixel displayed image requests, and 2,000-pixel larger-image requests. Thumbnail and variant changes keep the main image, larger-image source, caption, and active thumbnail synchronized.
- **Missing-color-photo safeguard:** Twenty-three variants across three older Cloudrunner 2 products have no media assignment, and their color names have no matching media in the product record. No false image assignments were made. When one of those variants is selected, the development theme now displays a clear photo-coming-soon notice with the store phone number; all variants and media remain intact.
- **Cloudrunner default state:** The On Cloudrunner 3 Women product's actual featured media is White/Ivory and all 60 variants have media assignments, but Shopify's first available variant was Pearl/Sailor. The development theme now opens an unlinked visit on the true White/Ivory featured color, keeps size unselected, and continues to honor explicit variant links.
- **Fit-help contact conversion:** The existing Contact page now adds a server-rendered contact form for fit/sizing, product availability, paid pickup, order, and general questions. Shopify's store email and contact email were both verified as `shoecenternmb@gmail.com`, which is the form-delivery destination. The existing address, phone, email, hours, map, and directions content remains intact.
- **Gift-card preparation:** Confirmed no gift-card product currently exists. Shopify's API supports a true gift-card product and a safe unpublished draft workflow, but draft creation was rejected because gift cards have not yet been activated for this store. The rejection occurred before product creation, so no catalog or publication change was made. `tools/prepare-gift-card-draft.mjs` is ready to create a draft with $25, $50, $75, $100, $150, and $200 denominations after activation.
- **Release state:** Product-gallery and Contact-form changes are uploaded only to development theme `130231074862`. They are not on the live `Ethos` theme `130231566382`.
- **QA:** Custom storefront QA passed; Shopify Theme Check inspected 53 files with no offenses; `git diff --check` passed; no tracked files are deleted. Development-preview checks confirmed White/Ivory as the initial Cloudrunner image/color, no preselected size, the 2,000-pixel larger-image dialog, one complete Contact form, desktop two-column layout, and zero captured console errors.

## July 13 live collection-card consistency hotfix

- **Root cause:** `sections/main-collection.liquid` was released before its new `snippets/product-card-styles.liquid` dependency. Standard collection routes rendered a visible Liquid missing-asset error and retained the old multi-image card behavior. The specialized On Running cards were unaffected because that route intentionally bypasses the shared standard-card snippet.
- **Live correction:** Published `snippets/product-card-styles.liquid`, `snippets/product-card.liquid`, and `sections/main-search.liquid` to live Ethos theme `130231566382` with `--nodelete --allow-live`. The already-published `sections/main-collection.liquid` now resolves its dependency.
- **Consistent media treatment:** Standard collection and search cards render exactly one primary product image in a square `#F2F0EB` frame with `object-fit: contain` and `mix-blend-mode: multiply`, preventing duplicate stacked images and reducing visible white-background blocks from source JPEGs.
- **Desktop route matrix:** Men's (7 cards), Women's (6), Everyday Comfort (12), On Running (12), and search for `cloud` (6) render without Liquid errors, horizontal overflow, or console errors. Every standard card has exactly one image, all measured media frames are square, and every visible product has a matching shop/detail control.
- **On Running regression:** The specialized grid still renders 12 cards and 62 two-tone color swatches after the standard-card release.
- **Filter regression:** On the responsive layout, Availability opens as a single in-flow panel, stays within the page, does not overlap adjacent filter summaries, and keeps its Apply button visible.
- **Static responsive rules:** Collection and search grids switch from four columns to two at `1023px`; filter panels become full-width and in-flow at `899px`; card footers stack and buttons become full-width at `599px`.
- **Automated checks:** Custom storefront QA passed for 79 theme files; Shopify Theme Check inspected 54 files with no offenses; `git diff --check` passed; no tracked files are deleted. Five unused invalid legacy logo files remain warnings only and are not referenced by the live theme.
