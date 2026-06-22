"""
on_image_sync.py - Shoe Center NMB: On image to Shopify pipeline
================================================================
Matches On AG official product images (by filename convention) to Shopify
products/variants and uploads them via the Admin GraphQL API.

PHASES (run in order):
  1. python on_image_sync.py --map
        Scans IMAGE_DIR, parses filenames, matches against live Shopify
        products, writes mapping_report.csv. NO uploads. Review the CSV.
  2. python on_image_sync.py --upload
        Uploads rows from mapping_report.csv where action == "UPLOAD".
        Resumable (progress checkpointed in upload_state.json).
  3. python on_image_sync.py --bind
        Binds each colorway's primary image to its variants so the PDP
        photo swaps when the customer picks a color.

SETUP:
  pip install requests python-dotenv
  Create a file named .env next to this script:
      SHOP_DOMAIN=shoecenternmb.myshopify.com
      ADMIN_TOKEN=shpat_xxxxxxxxxxxxxxxx
      IMAGE_DIR=C:\\Users\\torsion\\OneDrive - YMCA of Coastal Carolina\\_Codex\\shoe-center-nmb\\On Images

FILENAME CONVENTION (On AG official):
  3MG10071043-cloudrunner_3-ss26-black_black-m-1x1-d.png
  {article}-{model[_wide][_waterproof]}-{season}-{colorway}-{gender}-{angle}.png
  gender: m | w     angle: d, 1x1-d, g1..g6, lat, med, top, sole, etc.

TUNABLES (edit below): MAX_ANGLES_PER_COLOR, ANGLE_PRIORITY, RATE_DELAY.
"""

import os
import re
import csv
import json
import time
import sys
import mimetypes
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

SHOP_DOMAIN = os.getenv("SHOP_DOMAIN", "").strip()
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "").strip()
IMAGE_DIR = Path(os.getenv("IMAGE_DIR", "").strip())
API_VERSION = "2025-01"
GRAPHQL_URL = f"https://{SHOP_DOMAIN}/admin/api/{API_VERSION}/graphql.json"

MAX_ANGLES_PER_COLOR = 5          # cap uploads per product+colorway
RATE_DELAY = 0.6                  # seconds between API calls
MAPPING_CSV = "mapping_report.csv"
STATE_FILE = "upload_state.json"
VALID_EXT = {".png", ".jpg", ".jpeg", ".webp"}

# Lower index = higher priority. "d" = default/hero shot.
ANGLE_PRIORITY = ["1x1-d", "d", "g1", "g2", "lat", "lateral", "med", "medial",
                  "top", "g3", "g4", "g5", "g6", "sole", "heel", "detail"]


def angle_rank(angle: str) -> int:
    a = angle.lower()
    return ANGLE_PRIORITY.index(a) if a in ANGLE_PRIORITY else len(ANGLE_PRIORITY)


def slugify(s: str) -> str:
    """Normalize any string to lowercase underscore tokens for comparison."""
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", s.lower())).strip("_")


# ---------------------------------------------------------------- API helpers
def gql(query: str, variables: dict | None = None) -> dict:
    if not SHOP_DOMAIN or not ADMIN_TOKEN:
        sys.exit("ERROR: SHOP_DOMAIN / ADMIN_TOKEN missing from .env")
    for attempt in range(5):
        r = requests.post(
            GRAPHQL_URL,
            json={"query": query, "variables": variables or {}},
            headers={"X-Shopify-Access-Token": ADMIN_TOKEN,
                     "Content-Type": "application/json"},
            timeout=60,
        )
        if r.status_code == 429:
            time.sleep(2 ** attempt)
            continue
        r.raise_for_status()
        data = r.json()
        if "errors" in data:
            # throttled errors come through here too
            if any("THROTTLED" in str(e) for e in data["errors"]):
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"GraphQL errors: {data['errors']}")
        return data["data"]
    sys.exit("ERROR: rate-limited repeatedly; try again later.")


# ------------------------------------------------------- Fetch live catalog
PRODUCTS_QUERY = """
query($cursor: String) {
  products(first: 50, after: $cursor, query: "vendor:On") {
    edges {
      node {
        id handle title
        options { name values }
        media(first: 100) {
          edges { node { ... on MediaImage { id image { url } } } }
        }
        variants(first: 100) {
          edges { node { id selectedOptions { name value } } }
        }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
"""


def fetch_catalog() -> list[dict]:
    """Return list of products with parsed model/gender/waterproof and colors."""
    products, cursor = [], None
    while True:
        data = gql(PRODUCTS_QUERY, {"cursor": cursor})
        conn = data["products"]
        for edge in conn["edges"]:
            n = edge["node"]
            handle = n["handle"]  # e.g. on-cloudrunner-3-men[-waterproof]
            toks = handle.split("-")
            assert toks[0] == "on", f"unexpected handle {handle}"
            waterproof = toks[-1] == "waterproof"
            if waterproof:
                toks = toks[:-1]
            gender = {"men": "m", "women": "w"}.get(toks[-1])
            model = "_".join(toks[1:-1])          # cloudrunner_3, cloud_6 ...
            colors = []
            for opt in n["options"]:
                if opt["name"].lower() == "color":
                    colors = opt["values"]
            existing = set()
            for m in n["media"]["edges"]:
                node = m["node"]
                if node and node.get("image"):
                    fname = node["image"]["url"].split("/")[-1].split("?")[0]
                    existing.add(fname.lower())
            color_variants: dict[str, list[str]] = {}
            for v in n["variants"]["edges"]:
                vid = v["node"]["id"]
                for so in v["node"]["selectedOptions"]:
                    if so["name"].lower() == "color":
                        color_variants.setdefault(so["value"], []).append(vid)
            products.append({
                "id": n["id"], "handle": handle, "title": n["title"],
                "model": model, "gender": gender, "waterproof": waterproof,
                "colors": colors,
                "color_slugs": {slugify(c): c for c in colors},
                "existing_files": existing,
                "color_variants": color_variants,
            })
        if not conn["pageInfo"]["hasNextPage"]:
            break
        cursor = conn["pageInfo"]["endCursor"]
    return products


# ---------------------------------------------------------- Filename parsing
FNAME_RE = re.compile(
    r"^(?P<article>[A-Za-z0-9]+)-"
    r"(?P<model>[a-z0-9_]+?)-"
    r"(?P<season>(?:ss|fw)\d{2})-"
    r"(?P<colorway>[a-z0-9_]+)-"
    r"(?P<gender>[mw])-"
    r"(?P<angle>[a-z0-9x\-]+)$",
    re.IGNORECASE,
)


def parse_filename(path: Path) -> dict | None:
    stem = path.stem.lower()
    m = FNAME_RE.match(stem)
    if not m:
        return None
    d = m.groupdict()
    model = d["model"]
    waterproof = model.endswith("_waterproof")
    model = model.removesuffix("_waterproof").removesuffix("_wide")
    # _wide can precede _waterproof in either order; strip both, twice
    model = model.removesuffix("_waterproof").removesuffix("_wide")
    return {
        "file": path.name, "path": str(path),
        "model": model, "waterproof": waterproof,
        "season": d["season"], "colorway": slugify(d["colorway"]),
        "gender": d["gender"].lower(), "angle": d["angle"].lower(),
    }


def match_image(img: dict, catalog: list[dict]):
    """Return (product, color_value, reason). product None if no match."""
    cands = [p for p in catalog
             if p["model"] == img["model"]
             and p["gender"] == img["gender"]
             and p["waterproof"] == img["waterproof"]]
    if not cands:
        # fallback: ignore waterproof mismatch (rare On naming quirks)
        cands = [p for p in catalog
                 if p["model"] == img["model"] and p["gender"] == img["gender"]]
        if not cands:
            return None, None, "NO_PRODUCT_MATCH"
    p = cands[0]
    color = p["color_slugs"].get(img["colorway"])
    if color:
        return p, color, "OK"
    # loose color match: containment either direction
    for cs, cv in p["color_slugs"].items():
        if img["colorway"] in cs or cs in img["colorway"]:
            return p, cv, "OK_FUZZY_COLOR"
    return p, None, "COLOR_NOT_STOCKED"


# -------------------------------------------------------------- Phase: map
def phase_map():
    print(f"Scanning {IMAGE_DIR} ...")
    if not IMAGE_DIR.is_dir():
        sys.exit(f"ERROR: IMAGE_DIR not found: {IMAGE_DIR}")
    files = [f for f in sorted(IMAGE_DIR.rglob("*")) if f.suffix.lower() in VALID_EXT]
    print(f"  {len(files)} image files found")
    print("Fetching live On catalog from Shopify ...")
    catalog = fetch_catalog()
    print(f"  {len(catalog)} On products in store")

    rows, per_color_count = [], {}
    for f in files:
        img = parse_filename(f)
        if img is None:
            rows.append({"file": f.name, "action": "SKIP",
                         "reason": "UNPARSEABLE_FILENAME", "product_handle": "",
                         "color": "", "angle": "", "angle_rank": ""})
            continue
        product, color, reason = match_image(img, catalog)
        base = {"file": f.name, "product_handle": product["handle"] if product else "",
                "color": color or img["colorway"], "angle": img["angle"],
                "angle_rank": angle_rank(img["angle"])}
        if product is None:
            rows.append({**base, "action": "SKIP", "reason": reason})
        elif color is None:
            rows.append({**base, "action": "SKIP", "reason": reason})
        elif f.name.lower() in product["existing_files"]:
            rows.append({**base, "action": "SKIP", "reason": "ALREADY_UPLOADED"})
        else:
            rows.append({**base, "action": "UPLOAD", "reason": reason,
                         "_path": str(f), "_pid": product["id"]})

    # enforce MAX_ANGLES_PER_COLOR on UPLOAD rows, best angles first
    uploads = [r for r in rows if r["action"] == "UPLOAD"]
    uploads.sort(key=lambda r: (r["product_handle"], r["color"], r["angle_rank"]))
    for r in uploads:
        key = (r["product_handle"], r["color"])
        per_color_count[key] = per_color_count.get(key, 0) + 1
        if per_color_count[key] > MAX_ANGLES_PER_COLOR:
            r["action"] = "SKIP"
            r["reason"] = "OVER_ANGLE_CAP"

    with open(MAPPING_CSV, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["action", "reason", "file",
                                           "product_handle", "color", "angle",
                                           "angle_rank", "_path", "_pid"])
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in w.fieldnames})

    n_up = sum(1 for r in rows if r["action"] == "UPLOAD")
    print(f"\nWrote {MAPPING_CSV}: {n_up} UPLOAD / {len(rows)-n_up} SKIP")
    print("Reasons summary:")
    from collections import Counter
    for reason, c in Counter(r["reason"] for r in rows).most_common():
        print(f"  {reason}: {c}")
    print("\nReview the CSV (filter action=UPLOAD), edit if needed, then run --upload.")


# ------------------------------------------------------------ Phase: upload
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


def load_state() -> dict:
    if Path(STATE_FILE).exists():
        return json.loads(Path(STATE_FILE).read_text())
    return {"done": {}}


def save_state(state: dict):
    Path(STATE_FILE).write_text(json.dumps(state, indent=1))


def phase_upload():
    if not Path(MAPPING_CSV).exists():
        sys.exit("ERROR: run --map first.")
    state = load_state()
    rows = [r for r in csv.DictReader(open(MAPPING_CSV, encoding="utf-8"))
            if r["action"] == "UPLOAD"]
    rows.sort(key=lambda r: (r["product_handle"], r["color"], int(r["angle_rank"] or 99)))
    print(f"{len(rows)} files queued; {len(state['done'])} already done.")

    for i, r in enumerate(rows, 1):
        if r["file"] in state["done"]:
            continue
        path = Path(r["_path"])
        if not path.exists():
            print(f"[{i}] MISSING FILE {path}"); continue
        mime = mimetypes.guess_type(path.name)[0] or "image/png"
        size = path.stat().st_size

        staged = gql(STAGED_MUT, {"input": [{
            "filename": path.name, "mimeType": mime,
            "resource": "IMAGE", "httpMethod": "POST",
            "fileSize": str(size)}]})["stagedUploadsCreate"]
        if staged["userErrors"]:
            print(f"[{i}] staged error {staged['userErrors']}"); continue
        tgt = staged["stagedTargets"][0]

        form = {p["name"]: p["value"] for p in tgt["parameters"]}
        with open(path, "rb") as fh:
            up = requests.post(tgt["url"], data=form,
                               files={"file": (path.name, fh, mime)}, timeout=120)
        if up.status_code not in (200, 201, 204):
            print(f"[{i}] upload HTTP {up.status_code} for {path.name}"); continue

        res = gql(MEDIA_MUT, {"productId": r["_pid"], "media": [{
            "originalSource": tgt["resourceUrl"],
            "alt": f"{r['product_handle'].replace('-', ' ').title()} in {r['color']}",
            "mediaContentType": "IMAGE"}]})["productCreateMedia"]
        if res["mediaUserErrors"]:
            print(f"[{i}] media error {res['mediaUserErrors']}"); continue

        media_id = res["media"][0]["id"] if res["media"] else ""
        state["done"][r["file"]] = {"media_id": media_id,
                                    "product": r["product_handle"],
                                    "color": r["color"],
                                    "angle_rank": r["angle_rank"]}
        save_state(state)
        print(f"[{i}/{len(rows)}] OK  {r['product_handle']}  {r['color']}  {path.name}")
        time.sleep(RATE_DELAY)

    print("\nUpload phase complete. Run --bind to attach images to variants.")


# -------------------------------------------------------------- Phase: bind
BIND_MUT = """
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    userErrors { field message }
  }
}
"""


def phase_bind():
    state = load_state()
    if not state["done"]:
        sys.exit("ERROR: nothing uploaded yet.")
    catalog = fetch_catalog()
    by_handle = {p["handle"]: p for p in catalog}

    # pick best (lowest angle_rank) uploaded media per product+color
    best: dict[tuple, dict] = {}
    for fname, info in state["done"].items():
        key = (info["product"], info["color"])
        rank = int(info.get("angle_rank") or 99)
        if key not in best or rank < int(best[key].get("angle_rank") or 99):
            best[key] = info

    for (handle, color), info in sorted(best.items()):
        p = by_handle.get(handle)
        if not p or not info.get("media_id"):
            continue
        vids = p["color_variants"].get(color, [])
        if not vids:
            print(f"SKIP {handle} {color}: no variants found"); continue
        variants = [{"id": vid, "mediaId": info["media_id"]} for vid in vids]
        res = gql(BIND_MUT, {"productId": p["id"], "variants": variants})
        errs = res["productVariantsBulkUpdate"]["userErrors"]
        print(f"{'ERR ' + str(errs) if errs else 'OK'}  {handle}  {color}  "
              f"({len(vids)} variants)")
        time.sleep(RATE_DELAY)
    print("\nBind phase complete. Spot-check a PDP: changing color should swap the photo.")


# ----------------------------------------------------------------------- CLI
if __name__ == "__main__":
    args = set(sys.argv[1:])
    if "--map" in args:
        phase_map()
    elif "--upload" in args:
        phase_upload()
    elif "--bind" in args:
        phase_bind()
    else:
        print(__doc__)
