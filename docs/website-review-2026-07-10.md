# Shoe Center NMB — Independent Website Review

Reviewed July 9–10, 2026 against the live public storefront at [shoecenternmb.com](https://shoecenternmb.com/). This is the cold Phase 1 review requested in `SC-REVIEW-PROMPT.md`: desktop, mobile, collection, product, cart, checkout, SEO, trust, traffic, monetization, and competitive positioning.

## Verdict

Shoe Center has the bones of a genuinely differentiated business online: nearly 50 years of local trust, expert fitting, useful fit copy, local pickup, a warm coastal point of view, and a house-exclusive product story with real potential. The homepage communicates that better than most independent shoe stores. But the store is not ready for scaled traffic yet. On July 9, a tested On Cloud 6 Women option failure added Black/White after Glacier/White was visibly selected, size 5 could be added without an explicit size choice, and that PDP expanded to roughly 1,702 pixels wide on a 390-pixel viewport. Add a 13-product catalog, no real review layer, thin retention features, broken internal/SEO links, and stale hacked WordPress results still visible in search, and the honest read is: this is a polished launch shell with a strong brand idea, not yet a dependable commerce engine. Fix the transaction layer and search cleanup first; then the local/dance/fit story can become a serious traffic advantage.

## Scorecard

| Area | Score | One-line justification |
|---|---:|---|
| 1. First impression | 8/10 | “Local since 1978 + expert fit + pickup” is clear above the fold, although the stock hero and “finally online” language weaken authority. |
| 2. Design & visual identity | 7/10 | Cohesive typography, palette, spacing, and photography treatment; still relies heavily on generic/reused imagery and text-only brand proof. |
| 3. UI/UX & navigation | 5/10 | The main paths are simple, but the menu is shallow, breadcrumbs and meaningful filters are absent, and a homepage story CTA leads to a 404. |
| 4. Product pages | 3/10 | Excellent fit-oriented copy and clean product imagery are outweighed by an observed wrong-variant add-to-cart failure and default-size behavior. |
| 5. Mobile experience | 3/10 | Collection/cart layouts are usable, but the PDP has catastrophic horizontal overflow and the header also exceeds the viewport. |
| 6. Conversion & monetization | 4/10 | Standard Shopify checkout and pickup are good; reviews, nearby policy clarity, cross-sells, shipping motivation, and safe variant selection are missing. |
| 7. Monetization opportunities | 3/10 | No visible loyalty, referral, gift-card, SMS, bundle, fit-profile, or mature retention program. |
| 8. Features | 4/10 | Search, accounts, cart, checkout, pickup, swatches, and policies exist; filters, reviews, wishlist, back-in-stock, gift cards, and loyalty do not surface. |
| 9. SEO & content | 3/10 | Useful collection/PDP copy and schema exist, but metadata is inconsistent, the blog sitemap points to a 404, content depth is minimal, and legacy spam remains in search results. |
| 10. Trust & credibility | 6/10 | Address, phone, history, policies, checkout security, and local schema are strong; proof is anonymous, hours conflict, Gmail feels temporary, and the return promise is ambiguous. |
| 11. Performance & technical | 4/10 | No console errors appeared in the tested PDP, but variant state, mobile overflow, broken links, and sitemap quality are material defects. |
| 12. Competitive positioning | 6/10 | The local-fit/coastal/shag-dance combination is more ownable than competitors’ generic comfort positioning, but competitors have much deeper merchandising, content, proof, and retention. |

**Overall: 4.7/10.** The positioning is ahead of the commerce execution.

## Five-second test

- **What is it?** A family-owned specialty shoe store in North Myrtle Beach, now selling online.
- **Who is it for?** Women and men who want comfort/performance footwear and help finding the right fit.
- **Why buy here instead of Amazon, Zappos, or On?** Expert fit help, regular/wide guidance, local pickup, a real store, and a house-exclusive Carolina Drift loafer.
- **Is that obvious above the fold?** Mostly yes. The headline, 1978 proof, pickup line, and women/men CTAs do the job.
- **What is missing?** Real staff/customer/store imagery, a verified rating, and a sharper promise such as “expert fitting online and in store” would make the difference more credible immediately.

## Funnel test

The shortest observed path is three actions: **Homepage → Women’s collection → product → Add to Cart**. A normal shopper should also choose size/color/width, so the practical path is four to six interactions. Checkout is one more action.

The path length is fine. The state management is not:

1. On `On Cloud 6 Women`, the page visibly showed `Glacier/White` after that swatch was selected.
2. The hidden product form still contained the original variant ID.
3. Add to Cart placed `5 / Black/White / Regular` in the cart.
4. The size control simultaneously displayed `Size — 5` and `Select a size`; size 5 was already selected in the underlying control and the Add button was enabled.

That is the highest-priority revenue and customer-service defect in this review.

## Strongest and weakest product experiences

### Strongest presentation: Carolina Drift Loafer — 6/10

Strengths: an exclusive proposition, attractive leather photography, clear use cases, useful fit language, and a price that supports storytelling. It is the store’s most defensible product.

Weaknesses: the PDP still defaults to men’s size 8, has no reviews, no material/care/sole detail near the decision, no shipping/return summary beside the CTA, and no complementary-product cross-sell. The campaign page also contains internal-sounding copy (“Everything the launch needs to communicate at a glance” and “Send shoppers back to the buy panel...”) and its first “Shop the Drop” link points back to the same page instead of the purchase panel.

### Weakest transaction: On Cloud 6 Women — 2/10

The editorial portion is actually strong: five images, plain-English fit advice, width guidance, local pickup, and a direct phone number. But a product page that adds a different color and an unconfirmed size cannot be trusted. Until fixed and regression-tested across every product, the copy quality does not matter.

## Top five revenue leaks

1. **Wrong/default variant added to cart.** This creates wrong-item orders, refunds, chargebacks, support contacts, and lost trust.
2. **The tested mobile PDP is roughly 4.4× the viewport width.** On July 9, the On Cloud 6 Women gallery forced a 1,702-pixel layout on a 390-pixel viewport; the Add button inherited a width around 1,670 pixels. The shared PDP template may affect other products and needs regression testing.
3. **The online promise is much larger than the purchasable catalog.** The sitemap contains 13 products from two vendors while the site promotes 50+ brands and broad women’s, comfort, sandal, and dance selection without making the likely in-store/online distinction clear.
4. **No decision-point proof.** “What Our Customers Say” contains statistics, not named customer quotes; PDPs have no review count, verified reviews, customer photos, or staff attribution.
5. **No retention/AOV engine.** The cart has no shipping-progress bar, accessories, bundles, or recommendations; email is footer-only, and no SMS, loyalty, gift card, referral, back-in-stock, or saved-fit program is visible.

## Findings

| # | Severity | Location | Finding | Specific fix |
|---:|---|---|---|---|
| 1 | **Critical** | On Cloud 6 Women / cart, observed July 9 | Glacier/White was visibly selected, yet Add to Cart placed `5 / Black/White / Regular` in the cart. The visible control state and submitted variant ID did not agree. The shared variant component may affect other PDPs but requires a full regression matrix. | Rebuild variant resolution around one source of truth; update the form’s `input[name="id"]`, gallery, URL, price, and availability on every size/color/width change; add automated tests asserting selected options equal the resulting cart line. |
| 2 | **High** | On Cloud 6 Women and Carolina Drift, observed July 9 | Size 5 (or size 8 on Carolina Drift) is selected underneath a control that says “Select a size,” and Add to Cart is enabled. | Start with no size selected, include a disabled placeholder option, disable Add until a valid available variant is explicitly chosen, and focus/announce the missing field on submit. |
| 3 | **Critical** | On Cloud 6 Women mobile PDP, observed July 9 | At a 390×844 test viewport, the document was about 1,702 px wide and the Add button about 1,670 px wide. The shared PDP template may affect other products and should be treated as suspect until tested. | At the mobile breakpoint, force a one-column grid; add `min-width: 0` to grid children; constrain gallery/info/form to `max-width:100%`; make gallery slides `flex:0 0 100%`; clip only accidental page overflow after fixing the source. |
| 4 | **High** | Search results / legacy URLs | Search engines still show the recently crawled Shopify password page, old WordPress categories/products, and a spam-injected concert post. On July 10, sampled legacy URLs returned true 404 status with clean Shopify 404 bodies; that proves the old content is no longer served at those URLs, not that the old host, compromise, or credentials have been remediated. | In Search Console, inspect Security Issues/Manual Actions, request temporary removals for obsolete spam URLs, submit the clean sitemap, use URL Inspection/request reindexing for the current homepage/password remnant, map valuable old URLs with one-hop 301s, and leave spam/useless URLs as true 404/410. Monitor until they disappear. |
| 5 | **High** | Homepage hero | “Discover Our Story” links to `/pages/about`, which returns 404; the valid page is `/pages/our-story`. | Correct the URL immediately and add an automated internal-link check to deployment QA. |
| 6 | **High** | XML sitemap / blog | `/sitemap_blogs_1.xml` lists `/blogs/news`, but that URL returns a 404 and canonicalizes to `/404`. | Either publish a real blog index and first article, or remove/disable the empty blog so the sitemap no longer advertises a broken URL. |
| 7 | **High** | Catalog / homepage claims | The product sitemap contains 13 products from On and Shoe Center NMB, while homepage/collection copy promotes 50+ brands, sandals, comfort, and dance breadth. The 50+ figure may be true in store, but that distinction is not clear online. Five indexable collections—Dance, Brands, Style Forward, Dance Ready, and Vaneli—currently contain zero live products. | Publish only reliably fulfilled, online-authorized inventory; prioritize the top 30–50 proven styles, fill the collections customers can shop, and temporarily unpublish/noindex empty collections. Use explicit wording such as “50+ brands in store; selected styles online” until the online catalog catches up. |
| 8 | **High** | Reviews / homepage / PDPs | “What Our Customers Say” has no crawlable customer quote, name, rating, or review source. PDPs have no review layer. | Add verified product/store reviews, 3–6 named testimonials with permission, rating/count links to Google, and post-purchase review requests. |
| 9 | **High** | Shipping/refund policy | The refund page promises “store credit or exchange,” then later says “Refunds are issued,” leaving cash-refund eligibility unclear. | Decide the actual policy, use one term consistently, state exclusions and original-payment/store-credit treatment, and surface a plain-English summary beside Add to Cart. |
| 10 | **High** | NAP/hours / local SEO | Observed July 10: homepage/contact/schema say Sunday 12–5; the shipping policy says Sunday 11–5; the Apple listing reports Sunday closed. Address variants include no suite, `Suite 1`, and `Unit I`, while the store schema omits the suite. | Verify the official business name, whether the unit is numeral `1` or letter `I`, and one hours schedule with the owner. Update Shopify/schema, Google Business Profile, Apple Business Connect, Bing, Facebook, Yelp, On/brand locators, tourism/chamber listings, policies, and pickup messaging together. |
| 11 | **High** | Carolina Drift campaign | User-facing copy includes internal/placeholder language and the primary top CTA loops to the same page. | Replace process language with customer benefits; point all “Shop the Drop” CTAs to the buy panel or PDP and verify anchor behavior on mobile. |
| 12 | **High** | PDP decision area | Shipping price/threshold, delivery timing, return window, and exchange terms are not summarized beside Add to Cart. | Add a compact reassurance row: “Free pickup • $7.95 shipping / free $200+ • 14-day [accurate policy]”; link each item to details. |
| 13 | **Medium** | Mobile header, observed July 9 | In a separate 375-pixel client-area test, the header’s content width was 403 px, partially clipping the menu control and creating horizontal overflow. | Reduce mobile logo width/gaps, remove or move account into the menu, use `min-width:0`, and test 320/360/375/390/414 widths. |
| 14 | **High** | Organic traffic | No functioning editorial hub or article URLs are in the sitemap. There are no current comparison, fit, local, condition, or dance guides. | Launch a small, commerce-linked learning center; start with high-intent local/use-case topics listed in the 90-day plan. |
| 15 | **Medium** | Homepage metadata | Homepage title is only “Shoe Center NMB” and has no meta description, Open Graph description/image, or Twitter card. | Use a descriptive title and 145–160 character value proposition, e.g. expert fitting, North Myrtle Beach, comfort/performance, pickup/shipping; add a strong social-share image and complete OG/Twitter tags. |
| 16 | **Medium** | Page metadata | Contact and Our Story descriptions are auto-generated at ~320 characters; Carolina Drift has no description. Several titles run 69–85 characters. | Write unique titles around 50–60 characters and descriptions around 145–160; prioritize intent and benefit before the brand suffix. |
| 17 | **Medium** | Main navigation | No visible Shop All, New Arrivals, Brands, Wide Widths, Walking, Waterproof, or Gift Cards. | Add a restrained mega-menu or grouped mobile menu once catalog depth supports it; expose the paths customers actually search. |
| 18 | **Medium** | Collections | Women’s has six products and only Sort by—no size, width, color, brand, activity, price, or availability filters. | Enable Shopify Search & Discovery filters, starting with size, width, availability, brand, activity, color, waterproof, and price. |
| 19 | **Medium** | Collection/PDP navigation | No breadcrumbs were present. | Add `Home > Women > On Cloud 6 Women` UI plus `BreadcrumbList` schema. |
| 20 | **Medium** | Product gallery | Gallery images repeat the same accessible alt text instead of describing view/angle; no zoom/video was observed. | Use distinct alt text (“side,” “top,” “sole,” “on-foot”), add zoom, and add short fit/on-foot video to priority PDPs. |
| 21 | **Medium** | PDP merchandising | No related products, recently viewed, wishlist, complementary accessories, or back-in-stock capture. | Add context-aware recommendations, saved items, stock alerts, and “complete the fit” accessories without burying the main CTA. |
| 22 | **Medium** | Cart | No free-shipping progress, pickup emphasis, estimated timing, or cross-sell. At $160, a typical On order is $40 short of free shipping. | Show the exact threshold gap and recommend margin-safe socks/insoles/care; test whether a lower threshold outperforms $200 after shipping-margin analysis. |
| 23 | **Medium** | Homepage social proof | “48 years / 50+ brands / 1:1 help” is company-authored proof, not customer evidence. | Pair proof points with real quotes, star rating, review count, staff faces, store photography, and a link to reviews. |
| 24 | **Medium** | About/story | The page is almost entirely text and does not show the Brown family, staff, storefront, fitting process, timeline, or local community. | Add original photography, named staff bios, a concise timeline, fitting philosophy, community/dance history, and clear shop/visit CTAs. |
| 25 | **Medium** | Contact | The live page currently contains address, phone, email, hours, and a map, but a crawler snapshot still saw only the Contact H1 and footer—likely stale crawl or inconsistent rendering. The public email is Gmail, there is no contact form/text option, and the map can leave a large blank area if it does not render. | Ensure contact content is server-rendered consistently, request recrawl, use an on-domain address, add a simple form and optional SMS/fit-help channel, and provide a visible Directions fallback plus parking/accessibility notes. |
| 26 | **Medium** | Homepage imagery | The hero is generic athletic stock imagery and is reused in category merchandising; it does not prove local expertise or show the actual store. | Commission a small original shoot: staff fitting customers, storefront, beach/boardwalk use, real product, and Carolina Drift/dance context. |
| 27 | **Medium** | Homepage launch copy | “We’re finally online” and “Now online” make the store feel newly assembled rather than established. | Replace with evergreen customer value after the launch period: shipping/pickup cutoff, fit help, new arrivals, or store event. |
| 28 | **Medium** | Email/SMS | Email capture is footer-only with no clear value exchange, preferences, SMS, or visible automated lifecycle. | Offer a useful fit guide/new-arrival access or accessory benefit; segment local, visitor, On, comfort, and dance; build welcome, browse, cart, post-purchase, review, replenishment, back-in-stock, and win-back flows. |
| 29 | **Medium** | Loyalty/gifting | No visible loyalty, referral, gift card, or saved-fit program. | Add POS-connected gift cards first, then rewards/referrals and a consented “My Fit” profile with size, width, model, and staff notes. |
| 30 | **Medium** | Accessibility | Hero CTAs are anchors with `role="listitem"`, so the accessibility snapshot exposes them as list items rather than links. | Keep link semantics; wrap anchors in semantic `<li>` elements rather than overwriting the anchor role. |
| 31 | **Medium** | Accessibility / cart drawer | The cart drawer accessibility snapshot contained both the line item and “Your cart is empty” after an item was added. | Remove the empty state from the accessibility tree whenever items exist (`hidden`, `display:none`, or conditional render) and announce updates through a concise live region. |
| 32 | **Polish** | Product cards | “Shop Now” is weakly styled and color thumbnails are very small/dense on narrow screens. | Make the entire card clearly clickable, retain strong focus states, cap visible swatches with “+N,” and prioritize title/price/availability. |
| 33 | **Medium** | Structured data | Valid `Store`, `Product`, and `Offer` schema is present, but the local entity is generic/minimal and product offers omit GTINs, shipping details, and merchant return policy. | Use `ShoeStore` with a stable `@id`, full suite, geo, map, logo/image, `sameAs`, and price range. Add valid `gtin13` values where available, plus shipping details and merchant return policy; add review schema only for genuine visible reviews. |
| 34 | **Medium** | PDP media/performance | One inspected PDP exposes 36 media items; 34 source masters are 4,000×4,000. Shopify can resize delivery, so this is a performance risk rather than proof of excess transferred bytes or poor LCP. | Initially render only the selected colorway, use accurate `srcset`/`sizes`, lazy-load below-fold media, preload only the LCP image, and measure actual transfer/LCP on priority mobile PDPs. |
| 35 | **High** | Local theme assets / next deployment | A file-signature audit found five referenced brand “images” that are not images: Brooks and Rieker SVGs contain “File not found” text; Johnston & Murphy, New Balance, and OluKai PNGs contain HTML documents. Live CDN behavior could not be independently confirmed after the browser helper stopped, but publishing these workspace assets will produce broken logos. | Replace them with licensed, valid SVG/PNG assets, verify magic bytes and visual rendering, then test the complete brand strip on desktop/mobile before the next theme publish. Do not upload the current files. |
| 36 | **Medium** | On Cloudrunner 3 Women media state | The server-rendered default/hidden variant is `6 / Pearl/Sailor / Regular`, while the first visible and Open Graph image represents White/Ivory. This is a media-state mismatch, not a second proven wrong-cart transaction. | Make the default variant match the first/OG image or filter/swap the selected variant gallery before first paint; regression-test media, OG data, selected options, and variant URL together. |

## Competitive position

| Competitor | What it does better | Shoe Center’s opening |
|---|---|---|
| [Schuler Shoes](https://www.schulershoes.com/) | Deep activity/style navigation, seasonal collections, appointments/evaluations, foot-health content, gift cards, and rewards. | Be warmer, more stylish, and less clinical while making fit expertise equally concrete. |
| [Sole Provisions](https://www.soleprovisions.com/) | Broad brands/categories, education hub, video, reviews, SMS, loyalty, accessories, and a lower free-shipping threshold. | Own coastal travel, local pickup, personal staff recommendations, and Carolina shag footwear. |
| [The Foot Store](https://www.footstore.com/) | Community runs, clinics, demos, events, medical/athletic credentials, gift cards, and visible review links. | Rebuild the store’s event/dance/community history into a recurring local content and referral engine. |

Shoe Center’s best competitive territory is not “another place to buy On.” It is **expert fit without the clinical feel, rooted in North Myrtle Beach, with a potential national niche in Carolina shag/dance and a house-exclusive product in Carolina Drift**.

## Top 10 actions, ranked by revenue impact per unit of effort

1. **Fix and regression-test variant selection plus mobile PDP overflow before buying traffic.** Test every product and option combination on 320–1440 px widths; assert selected option, hidden variant ID, price, availability, image, cart line, and checkout all agree.
2. **Repair trust-breaking details in one release.** Correct `/pages/about`, replace the five invalid brand-logo assets, remove internal Carolina Drift copy, fix CTA anchors, reconcile Sunday hours/address/refund language, and remove the dead blog sitemap entry or publish the blog.
3. **Clean the legacy search footprint.** Use Search Console Security Issues, Manual Actions, Removals, URL Inspection, sitemap resubmission, targeted 301s, and 404/410 monitoring. Do not redirect every old URL to the homepage.
4. **Add verified proof at the point of decision.** Product reviews, named testimonials, Google rating/count, customer photos, staff faces/bios, and review-request automation.
5. **Expand the online catalog to the top reliably fulfilled 30–50 styles.** Respect brand/MAP restrictions and inventory accuracy. Build collections around activity and fit, not just gender.
6. **Put shipping, pickup, returns, and fit help beside Add to Cart.** Make “reserve” versus “buy online for pickup” unambiguous.
7. **Build lifecycle marketing.** Welcome, browse/cart/checkout abandonment, back-in-stock, post-purchase care, review, replacement, new-model, and win-back email/SMS flows.
8. **Turn Carolina Drift into a complete, potentially higher-control product.** Clarify materials, construction, outsole/dance characteristics, origin, fit, inventory, margin, limited-run terms, waitlist, video, and reviews; create an excellent dedicated PDP and launch story.
9. **Activate local/free shopping traffic.** Optimize Google Business Profile, Merchant Center free listings/local inventory, brand dealer locators, review replies, photos, pickup links, and consistent NAP/hours.
10. **Publish commerce-first content and only then test paid acquisition.** Start with local/use-case/comparison queries; run Google Search/Shopping/local inventory before broad social prospecting, then retarget with Carolina Drift and fit-video creative.

## 90-day monetization memo

### Days 0–7: stop leakage

- Fix variant ID synchronization, explicit size selection, mobile overflow, broken links, policy/hour inconsistencies, metadata, and the blog sitemap.
- Run a complete order-path QA matrix across all 13 products, colors, sizes, widths, pickup, shipping, cart, discount, tax, and checkout.
- Set up/verify GA4, Shopify analytics, Search Console, Merchant Center, consent, conversion events, and server-side purchase deduplication.
- Verify old WordPress hosting/credentials are retired and begin search-result removal/redirect work.

### Days 8–30: convert the traffic already available

- Add reviews/testimonials, clear fit/shipping/return reassurance, staff proof, and on-domain contact email.
- Publish the top 30–50 online-authorized styles and enable useful filters.
- Launch email/SMS lifecycle flows and back-in-stock capture.
- Add gift cards, accessory recommendations, and a free-shipping progress message.
- Fully optimize Google Business Profile, Merchant Center free/local listings, and brand dealer locators.
- Rebuild Carolina Drift as a complete PDP/drop with waitlist and video.

### Days 31–90: create compounding demand

- Publish two useful, shoppable pieces per week and repurpose each into short video, email, GBP post, and social clips.
- Priority topics: “Best shoes for walking Myrtle Beach,” “What makes a good Carolina shag shoe,” “On Cloud 6 vs Cloudrunner 3,” “Wide-width On fit guide,” “Shoes for standing all shift,” “Waterproof shoes for coastal weather,” and “How local pickup works for vacation shoppers.”
- Restart community programming: shag clubs/SOS, walking/running groups, brand demos, hospitality employers, PT/podiatry education, senior communities, hotels/resorts, and visitor concierges.
- Launch tightly measured Google Search/Shopping/local inventory campaigns; retarget site visitors and video viewers. Hold broad paid social until conversion and catalog depth are healthy.
- Add POS-connected loyalty/referrals and a consented digital fit profile so vacation customers can reorder the right model/size/width later.

### High-value offers to test

- Shoe + socks/insoles/care “complete the fit” bundles.
- Free local pickup with a fitting check at pickup.
- Gift cards for visitors, holidays, and family shoppers.
- Carolina Drift limited-drop waitlist/preorder and dance-club partnerships.
- Replacement reminders based on product/use and purchase date.
- Referral credit for existing local customers, subject to margin and brand rules.
- A useful welcome incentive that avoids MAP issues—fit guide, accessory credit, or local service benefit instead of blanket shoe discounting.

## Traffic plan

1. **Technical recovery:** remove stale legacy/spam URLs from search and preserve valuable legacy equity with precise redirects.
2. **Local SEO:** one strong location page with NAP, hours, parking/landmarks, fitting process, pickup, brands, FAQs, real photos, review proof, directions, and consistent `Store` schema.
3. **Product discovery:** Merchant Center product feed, free listings, free local listings, inventory accuracy, and updated manufacturer store locators.
4. **Commercial collection pages:** walking, all-day comfort, wide widths, waterproof, travel, performance, sandals, men, women, Carolina shag/dance, new arrivals, and brand pages—with enough unique inventory to justify each.
5. **Content commerce:** answer local, fit, use-case, and comparison questions, then link directly to relevant products/collections.
6. **Review flywheel:** post-purchase request, QR at checkout/pickup, owner responses, on-site excerpts with permission, and review schema only where policy-compliant.
7. **Community/backlinks:** resorts, concierges, dance clubs, events, run/walk groups, employers, clinicians, chamber/tourism listings, and local media.
8. **Retention:** email/SMS segmentation by local/visitor, gender, activity, brand, size/width, and dance interest—using only properly consented data.

## Phase 2 questions

These are the answers that would materially change the priorities or economics:

1. Who controls the former WordPress hosting and Search Console? Was the clean-404 change observed on July 10 intentional, and have all old admin/database/SFTP credentials been rotated?
2. Which brands and SKUs are authorized for online sale, and what MAP, geography, image, or paid-ad restrictions apply?
3. What POS/inventory system is authoritative? How reliable is the “usually within 2 hours” pickup promise?
4. Does “reserve” mean a no-payment hold, or buy online and pick up? Do you want to offer both?
5. Which 10–20 styles lead revenue, units, gross margin, and repeat purchase in store?
6. What are the last 90 days of sessions, conversion rate, add-to-cart rate, checkout completion, AOV, gross margin, return/exchange rate, shipping cost, and pickup share?
7. Which audience is first for the next 90 days: locals, Grand Strand visitors, national On buyers, comfort/wide-width shoppers, or the shag community?
8. Is the official Sunday schedule 11–5 or 12–5, and is the suite numeral `1` or letter `I`? Are mailed returns refundable to the original payment method, store-credit only, or exchange only?
9. Can existing Google/Yelp reviews and customer photos be reused with permission, and who will own review requests/responses?
10. How large are the email, SMS, and POS customer lists, and what marketing consent was collected?
11. For Carolina Drift: who manufactures it, what is the margin/inventory depth, exact size/width range, trademark status, restock plan, and specific dance-performance advantage?
12. Who can appear on camera and sustain two or three useful fitting/product videos per week?
13. Are concerts, shag events, demos, fittings, or travel-store appearances still operationally realistic?
14. What paid-media test budget and maximum contribution-margin CAC can the business support after shipping and returns?

## Evidence notes

- The live checkout supports shipping, pickup, Shop Pay/installments, PayPal, Google Pay, Venmo, card payments, and policy links.
- Current robots.txt is a standard Shopify storefront configuration and declares the Shopify sitemap.
- The sitemap currently contains 13 products, 4 pages, 11 collections, and an empty/broken blog index entry. Five sitemap collections currently expose zero live products: Dance, Brands, Style Forward, Dance Ready, and Vaneli.
- `Store`, `PostalAddress`, and opening-hours schema are present; PDPs also include `Product`, `Brand`, and `Offer` schema. Review/aggregate-rating schema is absent because no review layer is present.
- Direct HTTP checks on July 10 returned proper 404 status and clean Shopify 404 bodies for sampled legacy WordPress URLs. Search results still expose cached old products/categories and the spam-injected concert page, so Search Console cleanup remains necessary.
- A local signature audit found five invalid brand assets referenced by the current theme work: two “SVGs” contain file-not-found text and three “PNGs” contain HTML. Their live CDN behavior was not independently confirmed; they must be replaced before the next theme publish.
- A current PageSpeed Insights run could not be completed in this session. Performance conclusions above are based on live interaction, layout measurements, DOM inspection, and console checks rather than a Lighthouse score.

Useful official references: [Google site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), [Search Console removals](https://support.google.com/webmasters/answer/9689846), [Search Console security issues](https://support.google.com/webmasters/answer/9044101), [Google Business Profile local ranking guidance](https://support.google.com/business/answer/7091), and [Merchant Center free local listings](https://support.google.com/merchants/answer/15310605).
