# D4 — Search & Discovery Filter Grouping Runbook

**Where:** Shopify admin → Apps → **Search & Discovery** → **Filters**
(https://admin.shopify.com/store/bhnfcj-9i/apps/search-and-discovery/filters)

**Why by hand:** the Search & Discovery app has no API, and its embedded admin
iframe blocks automated clicks — this is a ~10-minute human task.

---

## Step 1 — Hide the noise filters

On the Filters list, open each of these and delete/remove it (they can be
re-added later with "Add filter"):

1. **Availability** — remove (single-brand catalog, everything's in stock or hidden)
2. **Price** — remove (only two price points exist: $160/$180)
3. **Brand** — remove (single-brand until Vaneli publishes — re-add it then)

Keep: **Color, Size, Men's Size, Width**.
(Men's Size only renders on products that have that option, so the Women's
collection still shows exactly 3 groups: Color, Size, Width.)

## Step 2 — Group the Color values

Open the **Color** filter → use **"Group values"** (Add group). Create these
7 groups and drag/check each raw value into it:

### Black
Black, Black/Black, Black/White, Black/Ivory, Black/Malibu, Eclipse/Black, Magnet/Black, Thorn/Black

### White & Ivory
White/White, White/Ivory, White/Glacier, White/Horizon, Pearl White/White,
Pearl/Ivory, Pearl/Cream, Pearl/Sailor, Ivory/Ivory, Ivory/Iceberg,
Ivory/Peony, Ivory/Creek, Ivory/Sailor, Frost/White, Frost/Glacier,
Undyed White/Green, Undyed White/Sand, Pelican/Ghost

### Neutrals & Sand
Cognac, Sand/Ivory, Pearl/Desert, Gobi/Gobi

### Blues
Navy, Midnight/White, Iceberg/Tin, Tin/Iceberg, Alloy/Chambray

### Greens
Olive/Evergreen, Olive/Safari, Olive/Mahogany, Seedling/Ivory, Zinc/Seedling,
Glacier/Sage, Shadow/Lima

### Pinks & Mauve
Nimbus/Lilac, Mauve/Zinc

### Grey
Alloy/Wolf, Wolf/Ivory, Zinc/Midnight, Heather/Metal, Heather/Marsh,
Heather/Ivory, Glacier/White, Glacier/Gourami, Glacier/Alloy

> Judgment calls (change if you disagree): grouping is by the FIRST color
> token (the shoe's main body color). Exceptions: Nimbus/Lilac → Pinks
> (lilac is what the customer sees), Alloy/Chambray → Blues (chambray pop),
> Thorn/Black → Black (reads as a black shoe).

## Step 3 — Save and verify

1. Save in the app.
2. Open https://shoecenternmb.com/collections/womens (hard refresh).
3. Acceptance: filter panel shows **3 groups** (Color, Size, Width);
   Color shows **≤10 grouped values**; no orphan values like "Gobi/Gobi".

## When Vaneli publishes
Re-add the **Brand** filter (Add filter → Vendor). New Vaneli color values
(navy suede, sigaro suede, tmoro, cuoio suede, black nappa, etc.) will need
adding to the groups above — most map to Black / Neutrals & Sand / Blues /
Greens ("sigaro"/"tmoro"/"cuoio" → Neutrals & Sand or a new "Browns" group).
