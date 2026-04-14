# Website Roadmap

This roadmap combines:

- the current theme audit
- the rebrand vision/spec
- the stated goal of reaching a true "10/10" Shopify experience

## North Star

Build a Shopify storefront that:

- converts confidently on mobile and desktop
- feels premium, coastal, and locally rooted
- reduces fit uncertainty at the point of decision
- grows men's sales without alienating core women and dance customers
- supports omnichannel pickup and a large catalog gracefully

## Core Positioning

Primary brand promise:

- `We Make Your Feet Happy`

Commercial interpretation:

- comfort-first
- fit-guided
- service-led
- coastal lifestyle
- local trust
- modern curation built on legacy credibility

## Business Context To Preserve

The store is not starting from zero.

Important context:

- the legacy customer base historically skewed older
- the business was already known for service, comfort, and trust
- Rachel has spent the last two years modernizing the assortment
- newer brands and fresher styles have been added without abandoning what the store was known for
- `On` is currently the largest brand and represents roughly 35 percent of sales
- about two-thirds of `On` sales are women's
- the long-term business goal includes opening at least one and possibly two additional stores in the Myrtle Beach area

Strategic implication:

- the site should not feel like an "older comfort store trying to look younger"
- the site should feel like a modern, style-aware comfort destination with real service depth and local trust

Primary audience priorities:

- women seeking comfort without sacrificing style
- men who want fast, confident shopping and clear product relevance
- dance and Shag customers who want continuity, familiarity, and trusted help

Merchandising priorities:

- protect the existing comfort-and-service reputation
- reflect Rachel's modernization of the assortment
- feature women's performance/lifestyle discovery more strongly because of current sales mix
- use `On` as a flagship growth and merchandising anchor
- keep the brand architecture ready for future locations

## Phase 1: Revenue-Critical Fixes

Goal:

- remove friction and repair weak or missing conversion infrastructure

Success criteria:

- cart interactions work reliably
- search works reliably
- hero communicates clearer value
- proof and trust appear near the first CTA
- PDP includes reassurance near add-to-cart

Work items:

- Fix cart trigger wiring between header and theme JavaScript.
- Fix or complete search drawer / predictive search implementation.
- Correct brand-history references to one canonical version.
- Rewrite homepage hero for stronger value clarity.
- Shift hero copy toward legacy + modern curation, not just nostalgia.
- Add proof line below hero CTA:
  - family-owned since 1978
  - fit help
  - local pickup
  - dance-ready expertise
- Add a subtle line of future-facing brand language that can survive multi-location growth.
- Add PDP reassurance block near add-to-cart:
  - pickup availability
  - easy returns
  - fit support
  - local service promise
- Add LocalBusiness schema and stronger location signals.
- Add store visit content:
  - address
  - hours
  - phone
  - pickup promise
- Reduce hardcoded single-location phrasing that may become limiting later.

## Phase 2: Conversion Upgrade

Goal:

- move from "pretty storefront" to "decision-supporting retail experience"

Success criteria:

- homepage supports clearer problem-to-proof flow
- PDP reduces fit anxiety
- men and dance segments feel intentionally merchandised
- merchandising supports use-case shopping, not just generic browsing

Work items:

- Reorder homepage toward this sequence:
  - hero
  - trust bar
  - category tiles
  - best sellers
  - find your fit
  - editorial story
  - Shag community teaser
  - brands
  - visit the store
  - newsletter / retention
- Add `Find Your Fit` module.
- Add `Visit the Store` module.
- Add `Shag Community` teaser and page plan.
- Add a `Locations` planning path even if only one store is live now.
- Add stronger proof blocks:
  - reviews / rating summary
  - service award or trust credential if verified
  - why locals choose us
- Add men's visibility features:
  - men's featured rail
  - men-forward imagery
  - stronger men's collection merchandising
- Add women's performance/lifestyle emphasis where sales data supports it.
- Build a flagship brand module or collection path for `On`.
- Add fit-support content:
  - size guide entry point near size selection
  - fit notes
  - width notes
  - arch support and cushioning signals
- Add product recommendation logic around use cases:
  - walking
  - work
  - travel
  - sandals
  - dance
  - wide fit

## Phase 3: Catalog-Ready UX

Goal:

- prepare the storefront to handle 10,000 SKUs without turning into a cluttered, unfindable catalog

Success criteria:

- navigation stays understandable
- search and filtering scale
- collection pages support intent-based discovery
- structured product data drives merchandising

Work items:

- Design collection templates for:
  - women
  - men
  - dance
  - on-running
  - brands
  - new arrivals
  - sale
- Define automated collection rules.
- Add filter strategy tied to product metafields.
- Add search relevance priorities:
  - title
  - vendor
  - product type
  - use case
  - width / support
- Add product badges driven by structured data:
  - all-day comfort
  - wide friendly
  - travel favorite
  - dance-ready
  - pickup available
- Plan for future location-aware messaging and pickup behavior.

## Phase 4: Theme Maintainability

Goal:

- keep the theme fast and editable as complexity grows

Success criteria:

- giant sections are reduced
- repeated patterns become reusable
- behavior and presentation are easier to reason about

Work items:

- Refactor oversized sections into smaller snippets.
- Reduce duplicated product-card logic.
- Consolidate reusable trust modules.
- Separate content structure from section-specific visual logic where practical.
- Keep JavaScript minimal and purposeful.

## Design Direction Rules

- Preserve the calm, premium, coastal feel.
- Avoid flashy animation, carousels, and overdesigned gimmicks.
- Keep men visible without making the site feel split-branded.
- Keep Shag present but secondary to the broader retail offer.
- Use product clarity and fit confidence as the primary conversion mechanism.

## Copy Priorities

Homepage hero should communicate:

- who this is for
- why this store is better
- why buying here feels safer

PDP copy should communicate:

- comfort
- fit
- support level
- occasion / use case
- pickup / return clarity

## Metrics To Watch

- overall conversion rate
- mobile conversion rate
- add-to-cart rate
- PDP exit rate
- pickup adoption rate
- men's revenue share
- women's performance-brand revenue share
- `On` brand revenue share
- dance collection conversion rate
- return rate for fit-related reasons

## Immediate Next Build Sequence

1. Fix cart and search foundations.
2. Correct brand-history and trust messaging.
3. Upgrade hero and proof stack.
4. Add PDP reassurance block.
5. Add store/pickup module.
6. Define metafield-driven fit system.
7. Restructure homepage around the spec.
