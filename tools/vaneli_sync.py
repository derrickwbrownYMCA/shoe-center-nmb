"""
vaneli_sync.py - Shoe Center NMB: Vaneli image to Shopify pipeline
==================================================================
Parses Vaneli product images, creates DRAFT Shopify products, uploads
images, and binds them to variants.

PHASES (run in order):
  1. python vaneli_sync.py --scan
        Scans VANELI_DIR, groups images by style and color.
        NO API calls. Review groupings, confirm with Derrick.
  2. python vaneli_sync.py --create
        Creates DRAFT Shopify products (one per style) with one
        placeholder variant per color. STOP here — Derrick adds
        real sizes/prices/inventory from AmberPOS before images upload.
  3. python vaneli_sync.py --upload
        Uploads all images to their matching products.
        Resumable (state checkpointed in vaneli_state.json).
  4. python vaneli_sync.py --bind
        Binds each color's seq-1 image to its variants so PDP
        photo swaps when the customer picks a color.

SETUP:
  pip install requests python-dotenv
  .env file (same directory as this script):
      SHOP_DOMAIN=bhnfcj-9i.myshopify.com
      ADMIN_TOKEN=shpat_xxxxxxxxxxxxxxxx
      API_VERSION=2025-01
      VANELI_DIR=C:\\path\\to\\Vaneli\\Shoe Center NMB Fall 2026 images
"""

import os
import re
import json
import time
import sys
import subprocess
import mimetypes
import tempfile
from pathlib import Path
from collections import defaultdict

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

SHOP_DOMAIN = os.getenv("SHOP_DOMAIN", "bhnfcj-9i.myshopify.com").strip()
_vaneli_dir = os.getenv("VANELI_DIR", "").strip()
VANELI_DIR  = Path(_vaneli_dir) if _vaneli_dir else None
STATE_FILE  = Path(__file__).parent / "vaneli_state.json"

VALID_EXT          = {".png", ".jpg", ".jpeg", ".webp", ".avif"}
RATE_DELAY         = 0.6
MAX_IMAGES_PER_COLOR = 6

KNOWN_STYLES = ["aiker", "katri", "kelley", "merida", "molke", "oleg", "perky", "shaine"]


# ─────────────────────────────────────────────────── filename parser

def parse_filename(path: Path) -> dict | None:
    """
    Handles all observed Vaneli filename patterns:
      {style} {color}-{angle_code}{seq}.jpg   — e.g. aiker navy suede-wmc01.jpg
      {style} {color} reshoot ...-{angle_code}{seq}.png — aiker tmoro suede reshoot x4-tra01.png
      {style} {color} reshoot ...{seq}.jpg    — molke black suede reshoot 12 17 202401.jpg
      {style} {color}{seq}.jpg                — molke cuoio suede01.jpg
    """
    stem = path.stem.lower().strip()

    style = None
    for s in KNOWN_STYLES:
        if stem.startswith(s + " ") or stem == s:
            style = s
            rest = stem[len(s):].strip()
            break
    if style is None:
        return None

    # Try: -{angle_code}{seq} at the end  (e.g. -wmc01, -tra06)
    m = re.search(r"-([a-z]+)(\d{2})$", rest)
    if m:
        angle_code = m.group(1)
        seq        = int(m.group(2))
        color_raw  = rest[: m.start()].strip()
    else:
        # Try: plain 2-digit sequence at the end (e.g. 01, 06)
        m2 = re.search(r"(\d{2})$", rest)
        if m2:
            seq        = int(m2.group(1))
            color_raw  = rest[: m2.start()].strip()
            angle_code = "photo"
        else:
            return None

    # Strip reshoot noise and trailing "x{n}" modifiers
    color = re.sub(r"\s+reshoot\b.*", "", color_raw, flags=re.IGNORECASE).strip()
    color = re.sub(r"\s+x\d+$",       "", color,     flags=re.IGNORECASE).strip()
    if not color:
        return None

    return {
        "file":       path.name,
        "path":       str(path),
        "style":      style,
        "color":      color,
        "angle_code": angle_code,
        "seq":        seq,
    }


# ─────────────────────────────────────────────────── image grouper

def scan_images() -> tuple[dict, list]:
    """Return ({style: {color: [parsed, ...]}}, [skipped_names])."""
    if not VANELI_DIR or not VANELI_DIR.is_dir():
        sys.exit(f"ERROR: VANELI_DIR not found or not set: {VANELI_DIR}")
    files = sorted(f for f in VANELI_DIR.rglob("*") if f.suffix.lower() in VALID_EXT)
    grouped: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))
    skipped: list[str] = []
    for f in files:
        parsed = parse_filename(f)
        if parsed:
            grouped[parsed["style"]][parsed["color"]].append(parsed)
        else:
            skipped.append(f.name)
    for style in grouped:
        for color in grouped[style]:
            grouped[style][color].sort(key=lambda x: x["seq"])
    return dict(grouped), skipped


# ─────────────────────────────────────────────────── API helpers

def gql(query: str, variables: dict | None = None) -> dict:
    """Call Shopify Admin GraphQL via the stored CLI auth (no token needed)."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.graphql', delete=False, encoding='utf-8') as qf:
        qf.write(query)
        query_file = qf.name

    var_file = None
    if variables:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as vf:
            json.dump(variables, vf)
            var_file = vf.name

    try:
        cmd = [
            'shopify', 'store', 'execute',
            '--store', SHOP_DOMAIN,
            '--query-file', query_file,
            '--allow-mutations',
        ]
        if var_file:
            cmd += ['--variable-file', var_file]

        for attempt in range(4):
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=180, shell=True)
            if r.returncode != 0:
                stderr = r.stderr + r.stdout
                if 'THROTTLED' in stderr or 'throttl' in stderr.lower():
                    wait = 2 ** attempt
                    print(f"  throttled, waiting {wait}s...")
                    time.sleep(wait)
                    continue
                raise RuntimeError(f"CLI error (rc={r.returncode}): {stderr[:400]}")
            m = re.search(r'\{[\s\S]+\}', r.stdout)
            if not m:
                raise RuntimeError(f"No JSON in CLI output: {r.stdout[:200]}")
            return json.loads(m.group(0))
        sys.exit("ERROR: rate-limited repeatedly; try again later.")
    finally:
        os.unlink(query_file)
        if var_file:
            os.unlink(var_file)


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"products": {}, "uploads": {}}


def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, indent=2))


# ─────────────────────────────────────────────────── Phase 1: scan

def phase_scan():
    grouped, skipped = scan_images()

    print(f"\n{'='*62}")
    print(f"VANELI IMAGE SCAN")
    print(f"DIR: {VANELI_DIR}")
    print(f"{'='*62}")

    total_images = 0
    for style in sorted(grouped):
        colors      = grouped[style]
        style_count = sum(len(imgs) for imgs in colors.values())
        total_images += style_count
        print(f"\n  {style.upper()}  —  {style_count} images  /  {len(colors)} color{'s' if len(colors) != 1 else ''}")
        for color in sorted(colors):
            imgs        = colors[color]
            angle_codes = ", ".join(sorted({i["angle_code"] for i in imgs}))
            print(f"    {color:<40}  {len(imgs):>2} imgs  [{angle_codes}]")

    print(f"\n{'='*62}")
    print(f"  Styles found : {len(grouped)}")
    print(f"  Total images : {total_images}")
    if skipped:
        print(f"  Unparseable  : {len(skipped)}")
        for s in skipped[:10]:
            print(f"    - {s}")
        if len(skipped) > 10:
            print(f"    ... and {len(skipped)-10} more")
    print(f"{'='*62}")
    print()
    print("STOP HERE. Confirm groupings match AmberPOS records.")
    print("Then run --create when Derrick gives the go-ahead.")
    print()


# ─────────────────────────────────────────────────── Phase 2: create

CREATE_PRODUCT_MUT = """
mutation($input: ProductInput!) {
  productCreate(input: $input) {
    product { id handle title }
    userErrors { field message }
  }
}
"""

ADD_COLOR_OPTION_MUT = """
mutation($productId: ID!, $options: [OptionCreateInput!]!) {
  productOptionsCreate(productId: $productId, options: $options) {
    product {
      variants(first: 50) {
        edges { node { id selectedOptions { name value } } }
      }
    }
    userErrors { field message }
  }
}
"""

ADD_VARIANTS_MUT = """
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkCreate(productId: $productId, variants: $variants) {
    productVariants { id selectedOptions { name value } }
    userErrors { field message }
  }
}
"""


def phase_create():
    grouped, _ = scan_images()
    state       = load_state()

    print(f"\nWill create {len(grouped)} DRAFT Vaneli products:\n")
    for style in sorted(grouped):
        colors = sorted(grouped[style])
        print(f"  vaneli-{style:<10}  {len(colors)} colors: {', '.join(colors)}")

    if "--yes" in set(sys.argv[1:]):
        confirm = "yes"
    else:
        confirm = input("\nType 'yes' to proceed (DRAFT status — never Active): ").strip().lower()
    if confirm != "yes":
        print("Aborted.")
        return

    for style in sorted(grouped):
        if style in state["products"]:
            print(f"SKIP {style}: already created (id={state['products'][style]['id']})")
            continue

        colors = sorted(grouped[style])
        title  = f"Vaneli {style.title()}"
        handle = f"vaneli-{style}"

        # Step 1: create product (basic info; options/variants are separate in 2025-01 API)
        data1 = gql(CREATE_PRODUCT_MUT, {"input": {
            "title":       title,
            "handle":      handle,
            "vendor":      "Vaneli",
            "productType": "Women's Shoes",
            "status":      "DRAFT",
            "tags":        ["vaneli", "womens", "women's shoes", style],
        }})["productCreate"]
        if data1["userErrors"]:
            print(f"ERROR creating {title}: {data1['userErrors']}")
            continue
        prod_id = data1["product"]["id"]
        time.sleep(RATE_DELAY)

        # Step 2: add Color option with first value (replaces default variant)
        data2 = gql(ADD_COLOR_OPTION_MUT, {
            "productId": prod_id,
            "options": [{"name": "Color", "values": [{"name": colors[0]}]}],
        })["productOptionsCreate"]
        if data2["userErrors"]:
            print(f"ERROR adding option for {title}: {data2['userErrors']}")
            continue
        color_variants: dict[str, list[str]] = defaultdict(list)
        for edge in data2["product"]["variants"]["edges"]:
            v = edge["node"]
            for opt in v["selectedOptions"]:
                if opt["name"] == "Color":
                    color_variants[opt["value"]].append(v["id"])
        time.sleep(RATE_DELAY)

        # Step 3: add remaining color variants (one per extra color)
        if len(colors) > 1:
            data3 = gql(ADD_VARIANTS_MUT, {
                "productId": prod_id,
                "variants": [
                    {"optionValues": [{"optionName": "Color", "name": c}], "price": "0.00"}
                    for c in colors[1:]
                ],
            })["productVariantsBulkCreate"]
            if data3["userErrors"]:
                print(f"ERROR adding variants for {title}: {data3['userErrors']}")
            for pv in data3["productVariants"]:
                for opt in pv["selectedOptions"]:
                    if opt["name"] == "Color":
                        color_variants[opt["value"]].append(pv["id"])
            time.sleep(RATE_DELAY)

        state["products"][style] = {
            "id":             prod_id,
            "handle":         handle,
            "title":          title,
            "color_variants": dict(color_variants),
        }
        save_state(state)
        print(f"CREATED  {title}  ({handle})  {len(color_variants)} colors")

    print("\nAll products created as DRAFT.")
    print("Derrick: add real sizes / prices / inventory from AmberPOS.")
    print("Then run --upload.")


# ─────────────────────────────────────────────────── Phase 3: upload

STAGED_MUT = """
mutation($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets { url resourceUrl parameters { name value } }
    userErrors { field message }
  }
}
"""

MEDIA_MUT = """
mutation($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    media { ... on MediaImage { id } }
    mediaUserErrors { field message }
  }
}
"""


def phase_upload():
    grouped, _ = scan_images()
    state       = load_state()
    if not state["products"]:
        sys.exit("ERROR: No products in state. Run --create first.")

    queue: list[dict] = []
    for style in grouped:
        prod_info = state["products"].get(style)
        if not prod_info:
            print(f"SKIP {style}: not in state (run --create)")
            continue
        for color in grouped[style]:
            for img in grouped[style][color][:MAX_IMAGES_PER_COLOR]:
                queue.append({
                    "file":       img["file"],
                    "path":       img["path"],
                    "style":      style,
                    "color":      color,
                    "seq":        img["seq"],
                    "product_id": prod_info["id"],
                    "handle":     prod_info["handle"],
                })

    done = sum(1 for q in queue if q["file"] in state["uploads"])
    print(f"{len(queue)} images queued; {done} already uploaded.")

    for i, item in enumerate(queue, 1):
        if item["file"] in state["uploads"]:
            continue
        path = Path(item["path"])
        if not path.exists():
            print(f"[{i}] MISSING: {path}")
            continue

        mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
        size = path.stat().st_size

        staged = gql(STAGED_MUT, {"input": [{
            "filename":   path.name,
            "mimeType":   mime,
            "resource":   "IMAGE",
            "httpMethod": "POST",
            "fileSize":   str(size),
        }]})["stagedUploadsCreate"]
        if staged["userErrors"]:
            print(f"[{i}] stage error: {staged['userErrors']}")
            continue

        tgt  = staged["stagedTargets"][0]
        form = {p["name"]: p["value"] for p in tgt["parameters"]}
        with open(path, "rb") as fh:
            up = requests.post(tgt["url"], data=form,
                               files={"file": (path.name, fh, mime)}, timeout=120)
        if up.status_code not in (200, 201, 204):
            print(f"[{i}] HTTP {up.status_code}: {path.name}")
            continue

        alt = f"Vaneli {item['style'].title()} in {item['color'].title()}"
        res = gql(MEDIA_MUT, {"productId": item["product_id"], "media": [{
            "originalSource":   tgt["resourceUrl"],
            "alt":              alt,
            "mediaContentType": "IMAGE",
        }]})["productCreateMedia"]
        if res["mediaUserErrors"]:
            print(f"[{i}] media error: {res['mediaUserErrors']}")
            continue

        media_id = res["media"][0]["id"] if res["media"] else ""
        state["uploads"][item["file"]] = {
            "media_id": media_id,
            "style":    item["style"],
            "color":    item["color"],
            "seq":      item["seq"],
            "handle":   item["handle"],
        }
        save_state(state)
        print(f"[{i}/{len(queue)}]  {item['handle']}  {item['color']}  {path.name}")
        time.sleep(RATE_DELAY)

    print("\nUpload complete. Run --bind to attach images to variants.")


# ─────────────────────────────────────────────────── Phase 4: bind

BIND_MUT = """
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    userErrors { field message }
  }
}
"""

FETCH_VARIANTS_QUERY = """
query($id: ID!) {
  product(id: $id) {
    variants(first: 100) {
      edges { node { id selectedOptions { name value } } }
    }
  }
}
"""


def phase_bind():
    state = load_state()
    if not state["products"]:
        sys.exit("ERROR: No products in state.")
    if not state["uploads"]:
        sys.exit("ERROR: No uploads in state. Run --upload first.")

    # Best (lowest seq) uploaded image per (style, color)
    best: dict[tuple, dict] = {}
    for fname, info in state["uploads"].items():
        key = (info["style"], info["color"])
        if key not in best or info["seq"] < best[key]["seq"]:
            best[key] = info

    for style, prod_info in state["products"].items():
        prod_id = prod_info["id"]

        # Fetch live variants (Derrick may have expanded sizes since --create)
        live_data = gql(FETCH_VARIANTS_QUERY, {"id": prod_id})
        live_by_color: dict[str, list[str]] = defaultdict(list)
        for edge in live_data["product"]["variants"]["edges"]:
            v = edge["node"]
            for opt in v["selectedOptions"]:
                if opt["name"] == "Color":
                    live_by_color[opt["value"]].append(v["id"])

        bind_list = []
        for color, vids in live_by_color.items():
            media_info = best.get((style, color))
            if not media_info or not media_info.get("media_id"):
                print(f"  no media for {style}/{color} — skipping")
                continue
            for vid in vids:
                bind_list.append({"id": vid, "mediaId": media_info["media_id"]})

        if not bind_list:
            print(f"SKIP {style}: nothing to bind")
            continue

        res  = gql(BIND_MUT, {"productId": prod_id, "variants": bind_list})
        errs = res["productVariantsBulkUpdate"]["userErrors"]
        if errs:
            print(f"ERR  {prod_info['handle']}: {errs}")
        else:
            print(f"OK   {prod_info['handle']}  ({len(bind_list)} variant binds)")
        time.sleep(RATE_DELAY)

    print("\nBind complete. Spot-check a Vaneli PDP — color swap should show the right photo.")


# ─────────────────────────────────────────────────── CLI

if __name__ == "__main__":
    args = set(sys.argv[1:])
    if "--scan" in args:
        phase_scan()
    elif "--create" in args:
        phase_create()
    elif "--upload" in args:
        phase_upload()
    elif "--bind" in args:
        phase_bind()
    else:
        print(__doc__)
