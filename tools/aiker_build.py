"""
aiker_build.py — one-off: build the Vaneli Aiker product (DRAFT).
7 colorways x real sizes/prices/stock from the AmberPOS export.
Photos we have (Navy, TMoro) uploaded + bound; other 5 colors show the
theme's photo-coming-soon note. Leaves the product DRAFT for review.
"""
import subprocess, json, tempfile, os, re, time, uuid, mimetypes
from pathlib import Path
from collections import defaultdict, OrderedDict

import openpyxl
import requests

SHOP = "bhnfcj-9i.myshopify.com"
LOC = "gid://shopify/Location/65878753326"
XLSX = r"C:/Users/DerrickBrown/OneDrive - YMCA of Coastal Carolina/_Claude/Shoecenter/Reports/output/Vaneli_Inventory_20260718_1521.xlsx"
IMG_DIR = Path(r"C:/Users/DerrickBrown/OneDrive - YMCA of Coastal Carolina/_Codex/shoe-center-nmb/Media/Vaneli/Shoe Center NMB Fall 2026 images")
PRICE = "175.00"

# photo folder name -> stocked colorway value
PHOTO_COLOR = {"navy": "Navy", "tmoro": "TMoro"}  # sigaro not in current stock


def gql(q, v=None):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".graphql", delete=False, encoding="utf-8") as qf:
        qf.write(q); qp = qf.name
    vp = None
    if v is not None:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as vf:
            json.dump(v, vf); vp = vf.name
    cmd = ["shopify", "store", "execute", "--store", SHOP, "--query-file", qp, "--allow-mutations"]
    if vp: cmd += ["--variable-file", vp]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=150, shell=True)
    os.unlink(qp)
    if vp: os.unlink(vp)
    if r.returncode != 0:
        raise RuntimeError((r.stderr + r.stdout)[:600])
    return json.loads(re.search(r"\{[\s\S]+\}", r.stdout).group(0))


def canon_size(size_str, width):
    s = str(size_str).replace("Women's ", "").replace("Womens ", "").strip()
    up = s.upper()
    wide = "WIDE" in up or str(width).lower() == "wide"
    narrow = up.endswith("N") or "NARROW" in up or str(width).lower() == "narrow"
    m = re.match(r"[\d.]+", s)
    if not m:
        return None
    num = m.group(0)
    if narrow: return num + "N"
    if wide: return num + "W"
    return num


# ── Read AIKER from export ────────────────────────────────────────────
wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
ws = wb["Vaneli Inventory"]
# color -> {size: qty}
stock = defaultdict(lambda: defaultdict(int))
for r in list(ws.iter_rows(values_only=True))[1:]:
    sku, base, style, color, size, width, qty, price, cost = r
    if str(style).upper() != "AIKER":
        continue
    cs = canon_size(size, width)
    if cs is None:
        continue
    stock[color][cs] += int(qty or 0)

colors = list(stock.keys())
print(f"AIKER: {len(colors)} colors")
for c in colors:
    print(f"  {c}: {sum(stock[c].values())} units, sizes {sorted(stock[c])}")

# ordered size list (numeric)
def size_key(s):
    m = re.match(r"([\d.]+)", s)
    base = float(m.group(1)) if m else 0
    suf = 0 if s[-1].isdigit() else (1 if s.endswith("N") else 2)
    return (base, suf)

all_sizes = sorted({s for c in colors for s in stock[c]}, key=size_key)

# ── Create product ────────────────────────────────────────────────────
first_color, first_size = colors[0], sorted(stock[colors[0]], key=size_key)[0]
p = gql("""
mutation($input: ProductInput!) {
  productCreate(input: $input) { product { id handle } userErrors { field message } }
}""", {"input": {
    "title": "Vaneli Aiker",
    "handle": "vaneli-aiker-fall",
    "vendor": "Vaneli",
    "productType": "Women's Shoes",
    "status": "DRAFT",
    "tags": ["vaneli", "womens", "women's shoes", "aiker"],
}})["productCreate"]
if p["userErrors"]:
    raise SystemExit(f"CREATE ERR: {p['userErrors']}")
pid = p["product"]["id"]
print(f"\nCreated {pid}")
time.sleep(0.5)

# Options: Color + Size (seed each with one value)
o = gql("""
mutation($productId: ID!, $options: [OptionCreateInput!]!) {
  productOptionsCreate(productId: $productId, options: $options) {
    product { variants(first:1){ edges { node { id } } } }
    userErrors { field message }
  }
}""", {"productId": pid, "options": [
    {"name": "Color", "values": [{"name": first_color}]},
    {"name": "Size", "values": [{"name": first_size}]},
]})["productOptionsCreate"]
if o["userErrors"]:
    raise SystemExit(f"OPTIONS ERR: {o['userErrors']}")
seed_variant = o["product"]["variants"]["edges"][0]["node"]["id"]
time.sleep(0.5)

# Fix seed variant price
gql("""
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    userErrors { field message }
  }
}""", {"productId": pid, "variants": [{"id": seed_variant, "price": PRICE}]})
time.sleep(0.5)

# Bulk-create all remaining real combos
new_variants = []
for c in colors:
    for s in sorted(stock[c], key=size_key):
        if c == first_color and s == first_size:
            continue
        new_variants.append({"optionValues": [
            {"optionName": "Color", "name": c},
            {"optionName": "Size", "name": s}], "price": PRICE,
            "inventoryItem": {"tracked": True}})

created_ct = 0
for b in range(0, len(new_variants), 100):
    chunk = new_variants[b:b+100]
    d = gql("""
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkCreate(productId: $productId, variants: $variants) {
    productVariants { id } userErrors { field message }
  }
}""", {"productId": pid, "variants": chunk})["productVariantsBulkCreate"]
    if d["userErrors"]:
        print(f"  VAR ERR: {d['userErrors'][:3]}")
    created_ct += len(d["productVariants"])
    time.sleep(0.6)
print(f"Created {created_ct} + 1 seed = {created_ct+1} variants")

# ── Fetch variants to map (color,size)->inventoryItem ─────────────────
time.sleep(1)
vd = gql("""
query($id: ID!) {
  product(id: $id) {
    variants(first: 200) {
      edges { node { id selectedOptions { name value } inventoryItem { id tracked } } }
    }
  }
}""", {"id": pid})["product"]["variants"]["edges"]
vindex = {}
untracked = []
for e in vd:
    v = e["node"]
    opts = {o["name"]: o["value"] for o in v["selectedOptions"]}
    vindex[(opts["Color"], opts["Size"])] = v
    if not v["inventoryItem"]["tracked"]:
        untracked.append(v["id"])

# Enable tracking on seed variant if needed
if untracked:
    gql("""
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } }
}""", {"productId": pid, "variants": [{"id": vid, "inventoryItem": {"tracked": True}} for vid in untracked]})
    time.sleep(1)
    vd = gql("""
query($id: ID!) { product(id: $id) { variants(first: 200) {
  edges { node { id selectedOptions { name value } inventoryItem { id } } } } } }""", {"id": pid})["product"]["variants"]["edges"]
    vindex = {}
    for e in vd:
        v = e["node"]; opts = {o["name"]: o["value"] for o in v["selectedOptions"]}
        vindex[(opts["Color"], opts["Size"])] = v

# ── Set inventory ─────────────────────────────────────────────────────
setq = []
for c in colors:
    for s, q in stock[c].items():
        v = vindex.get((c, s))
        if v:
            setq.append({"inventoryItemId": v["inventoryItem"]["id"], "locationId": LOC,
                         "quantity": q, "changeFromQuantity": 0})
mut = """
mutation($input: InventorySetOnHandQuantitiesInput!) {
  inventorySetOnHandQuantities(input: $input) @idempotent(key: "%s") {
    userErrors { field message }
  }
}""" % uuid.uuid4()
d = gql(mut, {"input": {"reason": "correction", "setQuantities": setq}})["inventorySetOnHandQuantities"]
print(f"Inventory set: {len(setq)} variants, errors: {d['userErrors'] or 'none'}")

# ── Upload + bind photos (Navy, TMoro) ────────────────────────────────
STAGED = """
mutation($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets { url resourceUrl parameters { name value } }
    userErrors { field message }
  }
}"""
MEDIA = """
mutation($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    media { ... on MediaImage { id } } mediaUserErrors { field message }
  }
}"""

def upload_image(path, alt):
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    staged = gql(STAGED, {"input": [{"filename": path.name, "mimeType": mime,
        "resource": "IMAGE", "httpMethod": "POST", "fileSize": str(path.stat().st_size)}]})["stagedUploadsCreate"]
    if staged["userErrors"]:
        print(f"  stage err {path.name}: {staged['userErrors']}"); return None
    tgt = staged["stagedTargets"][0]
    form = {p["name"]: p["value"] for p in tgt["parameters"]}
    with open(path, "rb") as fh:
        up = requests.post(tgt["url"], data=form, files={"file": (path.name, fh, mime)}, timeout=120)
    if up.status_code not in (200, 201, 204):
        print(f"  HTTP {up.status_code} {path.name}"); return None
    res = gql(MEDIA, {"productId": pid, "media": [{"originalSource": tgt["resourceUrl"],
        "alt": alt, "mediaContentType": "IMAGE"}]})["productCreateMedia"]
    if res["mediaUserErrors"]:
        print(f"  media err {path.name}: {res['mediaUserErrors']}"); return None
    return res["media"][0]["id"]

photo_media = defaultdict(list)  # color value -> [mediaId,...]
for folder_key, color_val in PHOTO_COLOR.items():
    files = sorted(IMG_DIR.glob(f"aiker {folder_key} suede*"))
    print(f"\nUploading {len(files)} {color_val} photos...")
    for f in files:
        mid = upload_image(f, f"Vaneli Aiker in {color_val}")
        if mid:
            photo_media[color_val].append(mid)
            print(f"  + {f.name}")
        time.sleep(0.5)

# Wait for media processing, then bind hero image to that color's variants
time.sleep(4)
for color_val, mids in photo_media.items():
    if not mids:
        continue
    hero = mids[0]
    variant_ids = [v["id"] for (c, s), v in vindex.items() if c == color_val]
    d = gql("""
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    userErrors { field message }
  }
}""", {"productId": pid, "variants": [{"id": vid, "mediaId": hero} for vid in variant_ids]})["productVariantsBulkUpdate"]
    print(f"Bound {color_val} hero to {len(variant_ids)} variants, errors: {d['userErrors'] or 'none'}")
    time.sleep(0.5)

print(f"\nDONE. Vaneli Aiker built as DRAFT: {pid}")
print("Navy + TMoro photographed; Black/Bone/Camel Mini Leopard/Champagne/Opal = photo-coming-soon.")
