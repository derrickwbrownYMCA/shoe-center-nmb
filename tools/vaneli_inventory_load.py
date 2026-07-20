"""
vaneli_inventory_load.py — load AmberPOS QOH into the DRAFT Vaneli products.

  python vaneli_inventory_load.py --dry-run   # match + report, no writes
  python vaneli_inventory_load.py --apply     # set quantities (DRAFT products only)

Source: fresh AmberPOS export (2026-07-18). Matching is
(style -> product title) + (color, size) -> variant option values, all
normalized. Only products in DRAFT status are touched.
"""
import subprocess, json, tempfile, os, re, sys, time
from collections import defaultdict

import openpyxl

SHOP = "bhnfcj-9i.myshopify.com"
LOCATION_ID = "gid://shopify/Location/65878753326"
XLSX = r"C:/Users/DerrickBrown/OneDrive - YMCA of Coastal Carolina/_Claude/Shoecenter/Reports/output/Vaneli_Inventory_20260718_1521.xlsx"


def gql(query, variables=None):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".graphql", delete=False, encoding="utf-8") as qf:
        qf.write(query); qp = qf.name
    vp = None
    if variables is not None:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as vf:
            json.dump(variables, vf); vp = vf.name
    try:
        cmd = ["shopify", "store", "execute", "--store", SHOP, "--query-file", qp, "--allow-mutations"]
        if vp:
            cmd += ["--variable-file", vp]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=180, shell=True)
        if r.returncode != 0:
            raise RuntimeError((r.stderr + r.stdout)[:800])
        return json.loads(re.search(r"\{[\s\S]+\}", r.stdout).group(0))
    finally:
        os.unlink(qp)
        if vp: os.unlink(vp)


def norm(s):
    """Normalize color/style strings for matching."""
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def norm_size(size, width):
    """Export size ('Women's 10 Narrow', '10.5N', '12 narrow') -> draft value key."""
    s = str(size or "").strip()
    s = s.replace("Women's ", "").replace("Womens ", "")
    s = re.sub(r"\s*[Nn]arrow$", "N", s)
    s = s.strip()
    # Width column fallback: mark narrow if not already
    if str(width or "").strip().lower() == "narrow" and not s.upper().endswith("N"):
        s += "N"
    return s.upper()


# ── 1. Read the export ────────────────────────────────────────────────
wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
ws = wb["Vaneli Inventory"]
rows = list(ws.iter_rows(values_only=True))[1:]
export = []  # (style_key, color_key, size_key, qty, raw)
for r in rows:
    sku, base, style, color, size, width, qty, price, cost = r
    if not style or qty is None:
        continue
    export.append((norm(style), norm(color), norm_size(size, width), int(qty), f"{sku} | {style} {color} {size}"))
print(f"Export rows: {len(export)}, units: {sum(e[3] for e in export)}")

# ── 2. Fetch DRAFT Vaneli products + variants ─────────────────────────
data = gql("""
{
  products(first: 50, query: "vendor:Vaneli status:draft") {
    edges {
      node {
        id title
        variants(first: 100) {
          edges {
            node {
              id
              inventoryQuantity
              selectedOptions { name value }
              inventoryItem { id tracked }
            }
          }
        }
      }
    }
  }
}""")["products"]["edges"]

# (style_key, color_key, size_key) -> inventory item info
variant_index = {}
product_styles = set()
for edge in data:
    p = edge["node"]
    style_key = norm(p["title"].replace("Vaneli", ""))
    product_styles.add(style_key)
    for ve in p["variants"]["edges"]:
        v = ve["node"]
        opts = {o["name"].lower(): o["value"] for o in v["selectedOptions"]}
        color_key = norm(opts.get("color", ""))
        size_key = str(opts.get("size", "")).strip().upper()
        variant_index[(style_key, color_key, size_key)] = {
            "item": v["inventoryItem"]["id"],
            "tracked": v["inventoryItem"]["tracked"],
            "variant": v["id"],
            "product": p["title"],
            "product_id": p["id"],
            "current": v["inventoryQuantity"] or 0,
        }
print(f"Draft products: {len(data)}, variants indexed: {len(variant_index)}")

# ── 3. Match ──────────────────────────────────────────────────────────
matched = {}          # inventoryItemId -> qty (summed if dupes)
matched_info = []
unmatched_style = defaultdict(int)
unmatched_variant = []
for style_key, color_key, size_key, qty, raw in export:
    if style_key not in product_styles:
        unmatched_style[style_key] += qty
        continue
    hit = variant_index.get((style_key, color_key, size_key))
    if hit:
        matched[hit["item"]] = matched.get(hit["item"], 0) + qty
        matched_info.append((hit, qty, raw))
    else:
        unmatched_variant.append((raw, qty))

matched_units = sum(matched.values())
print(f"\nMATCHED: {len(matched)} variants / {matched_units} units")
print(f"UNMATCHED (no draft product): {len(unmatched_style)} styles / {sum(unmatched_style.values())} units")
for k, v in sorted(unmatched_style.items(), key=lambda x: -x[1])[:15]:
    print(f"    {k:<12} {v} units")
print(f"UNMATCHED (product exists, variant missing): {len(unmatched_variant)} rows / {sum(q for _, q in unmatched_variant)} units")
for raw, q in unmatched_variant[:20]:
    print(f"    {raw}  qty={q}")
if len(unmatched_variant) > 20:
    print(f"    ... and {len(unmatched_variant) - 20} more")

# Group untracked matched variants by product for bulk updates
untracked_by_product = defaultdict(list)
seen_items = set()
for hit, qty, raw in matched_info:
    if hit["item"] in matched and not hit["tracked"] and hit["item"] not in seen_items:
        seen_items.add(hit["item"])
        untracked_by_product[hit["product_id"]].append(hit["variant"])
untracked_count = sum(len(v) for v in untracked_by_product.values())
print(f"\nVariants needing tracked=true: {untracked_count} across {len(untracked_by_product)} products")

if "--apply" not in sys.argv:
    print("\nDRY RUN complete — rerun with --apply to write quantities.")
    sys.exit(0)

# ── 4. Apply ──────────────────────────────────────────────────────────
# 4a. Enable tracking — one bulk call per product
for product_id, variant_ids in untracked_by_product.items():
    d = gql("""
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id }
    userErrors { field message }
  }
}""", {
        "productId": product_id,
        "variants": [{"id": vid, "inventoryItem": {"tracked": True}} for vid in variant_ids],
    })["productVariantsBulkUpdate"]
    if d["userErrors"]:
        print(f"  TRACK ERROR {product_id}: {d['userErrors'][:2]}")
    else:
        print(f"  tracked {len(variant_ids)} variants on {product_id.split('/')[-1]}")
    time.sleep(0.5)

# 4b. Set on-hand quantities in batches (drafts have zero committed, so
# on_hand == available here)
# Use each item's actual current quantity as the compare value, and skip
# items already at the target — makes reruns fully idempotent.
current_by_item = {}
for hit, qty, raw in matched_info:
    current_by_item[hit["item"]] = hit["current"]
items = [
    {"inventoryItemId": k, "locationId": LOCATION_ID, "quantity": v, "changeFromQuantity": current_by_item.get(k, 0)}
    for k, v in matched.items()
    if current_by_item.get(k, 0) != v
]
print(f"\nItems needing a quantity write (skipping already-correct): {len(items)}")
import uuid
BATCH = 200
for b in range(0, len(items), BATCH):
    chunk = items[b:b+BATCH]
    mutation = """
mutation($input: InventorySetOnHandQuantitiesInput!) {
  inventorySetOnHandQuantities(input: $input) @idempotent(key: "%s") {
    inventoryAdjustmentGroup { createdAt }
    userErrors { field message }
  }
}""" % uuid.uuid4()
    d = gql(mutation, {"input": {
        "reason": "correction",
        "setQuantities": chunk,
    }})["inventorySetOnHandQuantities"]
    if d["userErrors"]:
        print(f"BATCH {b//BATCH + 1} ERRORS: {d['userErrors'][:5]}")
    else:
        print(f"Batch {b//BATCH + 1}: set {len(chunk)} quantities")
    time.sleep(1)

print(f"\nDone. {len(matched)} variants stocked with {matched_units} units at the store location.")
