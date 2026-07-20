"""
vaneli_publish.py - Shoe Center NMB: match + upload Vaneli photography to the
REAL AmberPOS-synced Vaneli products (the 25 DRAFT products with real
SKU/price/size data), not the old $0 placeholder set from vaneli_sync.py.

Source images: Media/Vaneli/Shoe Center NMB Fall 2026 images/
                Media/Vaneli/Shoe Center NMB Spring 2026 images/

PHASES:
  1. python vaneli_publish.py --scan
        No API writes. Fetches live product/color data, parses every image
        filename, matches each filename-color-group to a Shopify Color
        option value, and prints a confidence report. Anything not a clean
        unique match is listed under UNRESOLVED and is never auto-bound.
  2. python vaneli_publish.py --upload
        Uploads images for CONFIDENT matches only, creates product media.
        Resumable (state in vaneli_publish_state.json).
  3. python vaneli_publish.py --bind
        Binds each color's best image to that color's variants.

SETUP: same tools/.env as vaneli_sync.py (SHOP_DOMAIN, VANELI_DIR, ...).
Requires the Shopify CLI to be authed for the store (uses `shopify store
execute`, same mechanism as vaneli_sync.py / on_image_sync.py).
"""

import os
import re
import json
import time
import sys
import subprocess
import mimetypes
import tempfile
import difflib
from pathlib import Path
from collections import defaultdict

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

SHOP_DOMAIN = os.getenv("SHOP_DOMAIN", "bhnfcj-9i.myshopify.com").strip()
BASE_DIR    = Path(os.getenv("VANELI_DIR", "")).parent  # .../Media/Vaneli
IMAGE_DIRS  = [
    BASE_DIR / "Shoe Center NMB Fall 2026 images",
    BASE_DIR / "Shoe Center NMB Spring 2026 images",
]
STATE_FILE  = Path(__file__).parent / "vaneli_publish_state.json"

VALID_EXT            = {".png", ".jpg", ".jpeg", ".webp", ".avif"}
RATE_DELAY           = 0.6
MAX_IMAGES_PER_COLOR = 8
MIN_SCORE            = 0.5   # min keyword coverage to count as a candidate match
MIN_MARGIN           = 0.15  # best must beat 2nd-best by this much to be "confident"

STOPWORDS = {
    "to", "use", "shot", "without", "pull", "tab", "with", "reshoot", "reshot",
    "correct", "nuse", "bownto", "boro", "print", "lino", "prt", "x2", "x3", "x4",
}


# ─────────────────────────────────────────────────── text helpers

def normalize(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9\s/]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def tokens(s: str) -> list:
    toks = re.split(r"[\s/]+", normalize(s))
    out = []
    for t in toks:
        if not t or t in STOPWORDS:
            continue
        if re.fullmatch(r"\d+", t):
            continue
        out.append(t)
    return out


def fuzzy_in(tok: str, tokset: set) -> bool:
    if tok in tokset:
        return True
    for t in tokset:
        if difflib.SequenceMatcher(None, tok, t).ratio() >= 0.65:
            return True
        shorter, longer = (tok, t) if len(tok) <= len(t) else (t, tok)
        if len(shorter) >= 3 and longer.startswith(shorter):
            return True
    return False


def coverage_score(color_value: str, filename_tokens: list) -> float:
    ctoks = set(tokens(color_value))
    if not ctoks:
        return 0.0
    ftoks = set(filename_tokens)
    hits = sum(1 for c in ctoks if fuzzy_in(c, ftoks))
    return hits / len(ctoks)


# ─────────────────────────────────────────────────── filename parser

STYLE_ALIASES = {"molke": "molke", "shaine": "shaine"}  # base style names in image folders


def parse_filename(path: Path, known_styles: set) -> dict | None:
    stem = path.stem.lower().strip()
    style = None
    for s in known_styles:
        if stem == s or stem.startswith(s + " "):
            style = s
            rest = stem[len(s):].strip()
            break
    if style is None:
        return None

    m = re.search(r"-([a-z]+)(\d{2})$", rest)
    if m:
        seq = int(m.group(2))
        color_raw = rest[: m.start()].strip()
    else:
        m2 = re.search(r"\((\d+)\)$", rest)
        if m2:
            seq = int(m2.group(1))
            color_raw = rest[: m2.start()].strip()
        else:
            m3 = re.search(r"(\d{2})$", rest)
            if m3:
                seq = int(m3.group(1))
                color_raw = rest[: m3.start()].strip()
            else:
                return None

    color_raw = re.sub(r"\s+x\d+$", "", color_raw).strip()
    if not color_raw:
        return None

    return {
        "file": path.name, "path": str(path), "style": style,
        "color_raw": color_raw, "seq": seq,
    }


def scan_images(known_styles: set) -> tuple[dict, list]:
    grouped: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))
    skipped = []
    for d in IMAGE_DIRS:
        if not d.is_dir():
            continue
        for f in sorted(d.rglob("*")):
            if f.suffix.lower() not in VALID_EXT:
                continue
            parsed = parse_filename(f, known_styles)
            if parsed:
                grouped[parsed["style"]][parsed["color_raw"]].append(parsed)
            else:
                skipped.append(str(f))
    for style in grouped:
        for cr in grouped[style]:
            grouped[style][cr].sort(key=lambda x: x["seq"])
    return dict(grouped), skipped


# ─────────────────────────────────────────────────── Shopify data

PRODUCTS_QUERY = """
query {
  products(first: 50, query: "vendor:Vaneli status:draft") {
    edges {
      node {
        id
        handle
        title
        options(first: 5) { name values }
        variants(first: 100) {
          edges { node { id sku selectedOptions { name value } } }
        }
      }
    }
  }
}
"""


def gql(query: str, variables: dict | None = None) -> dict:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".graphql", delete=False, encoding="utf-8") as qf:
        qf.write(query)
        query_file = qf.name
    var_file = None
    if variables:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as vf:
            json.dump(variables, vf)
            var_file = vf.name
    try:
        cmd = ["npx", "--yes", "@shopify/cli@latest", "store", "execute",
               "--store", SHOP_DOMAIN, "--query-file", query_file, "--allow-mutations"]
        if var_file:
            cmd += ["--variable-file", var_file]
        for attempt in range(4):
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=180, shell=True)
            if r.returncode != 0:
                stderr = r.stderr + r.stdout
                if "throttl" in stderr.lower():
                    time.sleep(2 ** attempt)
                    continue
                raise RuntimeError(f"CLI error (rc={r.returncode}): {stderr[:600]}")
            m = re.search(r"\{[\s\S]+\}", r.stdout)
            if not m:
                raise RuntimeError(f"No JSON in CLI output: {r.stdout[:300]}")
            return json.loads(m.group(0))
        sys.exit("ERROR: rate-limited repeatedly; try again later.")
    finally:
        os.unlink(query_file)
        if var_file:
            os.unlink(var_file)


def fetch_products() -> dict:
    data = gql(PRODUCTS_QUERY)
    out = {}
    for edge in data["products"]["edges"]:
        p = edge["node"]
        colors = []
        for opt in p["options"]:
            if opt["name"] == "Color":
                colors = opt["values"]
        variants_by_color = defaultdict(list)
        for ve in p["variants"]["edges"]:
            v = ve["node"]
            for opt in v["selectedOptions"]:
                if opt["name"] == "Color":
                    variants_by_color[opt["value"]].append(v["id"])
        # base style = handle minus "vaneli-" prefix and trailing "-<digit>" suffix
        base = re.sub(r"^vaneli-", "", p["handle"])
        base = re.sub(r"-\d+$", "", base)
        out[base] = {
            "id": p["id"], "handle": p["handle"], "title": p["title"],
            "colors": colors, "variants_by_color": dict(variants_by_color),
        }
    return out


# ─────────────────────────────────────────────────── matching

# Reviewed by hand and rejected: the coverage score finds a coincidental
# single-token overlap, but the filenames name colorways that don't actually
# exist on the product (e.g. hollis photos say "black/white/cuoio nappa" and
# "silver platino" — the product's real colors are "Silver Mercury" /
# "Black Patent"). Force these to unresolved rather than trust the score.
MANUAL_EXCLUDE = {"hollis"}


def match_style_colors(style: str, color_groups: dict, product: dict) -> dict:
    """Returns {color_value_or_None: {"groups": [...], "status": "confident"|"unresolved", "reason": str}}"""
    colors = product["colors"]
    if style in MANUAL_EXCLUDE:
        result = {cv: {"groups": [], "status": "unresolved", "reason": "manually excluded — filename colors don't match product colors"} for cv in colors}
        result["_unmatched_groups"] = list(color_groups.keys())
        return result
    result = {}
    used_groups = set()

    # score every (color_raw group) x (shopify color) pair
    scored = []
    for color_raw, imgs in color_groups.items():
        ftoks = tokens(color_raw)
        for cv in colors:
            score = coverage_score(cv, ftoks)
            scored.append((score, color_raw, cv))
    scored.sort(key=lambda x: -x[0])

    # assign each shopify color its best group, requiring a clear margin
    for cv in colors:
        candidates = sorted([s for s in scored if s[2] == cv], key=lambda x: -x[0])
        if not candidates or candidates[0][0] < MIN_SCORE:
            result[cv] = {"groups": [], "status": "unresolved", "reason": "no filename group matched"}
            continue
        best_score, best_raw, _ = candidates[0]
        # check this group isn't a clearly-better match for a DIFFERENT color
        rivals = sorted([s for s in scored if s[1] == best_raw and s[2] != cv], key=lambda x: -x[0])
        if rivals and rivals[0][0] >= best_score - 1e-9:
            result[cv] = {"groups": [], "status": "unresolved",
                          "reason": f"'{best_raw}' ties/loses to another color"}
            continue
        result[cv] = {"groups": [best_raw], "status": "confident", "reason": f"score={best_score:.2f}"}
        used_groups.add(best_raw)

    leftover = [g for g in color_groups if g not in used_groups]
    if leftover:
        result["_unmatched_groups"] = leftover
    return result


# ─────────────────────────────────────────────────── Phase 1: scan / report

def phase_scan():
    products = fetch_products()
    known_styles = set(products.keys()) | {"molke", "shaine"}
    grouped, skipped = scan_images(known_styles)

    print(f"\n{'='*72}\nVANELI PUBLISH — MATCH REPORT\n{'='*72}")

    no_product = [s for s in grouped if s not in products]
    if no_product:
        print(f"\nNO REAL PRODUCT YET (images exist, no AmberPOS product) — skipped entirely:")
        for s in sorted(no_product):
            n = sum(len(v) for v in grouped[s].values())
            print(f"  {s:<12} {n} images across {len(grouped[s])} color folder(s)")

    total_confident = total_unresolved = 0
    plan = {}
    for style in sorted(grouped):
        if style not in products:
            continue
        product = products[style]
        m = match_style_colors(style, grouped[style], product)
        print(f"\n{product['handle']}  ({product['title']})")
        for cv in product["colors"]:
            info = m[cv]
            if info["status"] == "confident":
                raw = info["groups"][0]
                n = len(grouped[style][raw])
                print(f"  OK    {cv:<25} <- \"{raw}\"  ({n} imgs)  [{info['reason']}]")
                total_confident += 1
                plan.setdefault(style, {})[cv] = grouped[style][raw][:MAX_IMAGES_PER_COLOR]
            else:
                print(f"  ????  {cv:<25}     {info['reason']}")
                total_unresolved += 1
        if "_unmatched_groups" in m:
            for g in m["_unmatched_groups"]:
                n = len(grouped[style][g])
                print(f"  ????  (no Shopify color)      \"{g}\"  ({n} imgs) — filename color has no matching variant")
                total_unresolved += 1

    print(f"\n{'='*72}")
    print(f"  Confident matches : {total_confident}  (will upload+bind)")
    print(f"  Unresolved        : {total_unresolved}  (skipped — needs a human look)")
    print(f"  Styles w/o product: {len(no_product)}")
    if skipped:
        print(f"  Unparseable files : {len(skipped)}")
    print(f"{'='*72}\n")

    Path(Path(__file__).parent / "vaneli_publish_plan.json").write_text(
        json.dumps({s: {c: [i["path"] for i in imgs] for c, imgs in cs.items()} for s, cs in plan.items()}, indent=2)
    )
    print("Confident plan written to tools/vaneli_publish_plan.json")
    return products, plan


# ─────────────────────────────────────────────────── Phase 2/3: upload + bind

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
BIND_MUT = """
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    userErrors { field message }
  }
}
"""


def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"uploads": {}}


def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))


def phase_upload():
    products, plan = phase_scan()
    state = load_state()

    queue = []
    for style, colors in plan.items():
        prod = products[style]
        for color, imgs in colors.items():
            for img in imgs:
                queue.append({"path": img["path"], "file": img["file"], "style": style,
                              "color": color, "seq": img["seq"], "product_id": prod["id"],
                              "handle": prod["handle"]})

    done = sum(1 for q in queue if q["file"] in state["uploads"])
    print(f"\n{len(queue)} images queued for upload; {done} already done.\n")

    for i, item in enumerate(queue, 1):
        if item["file"] in state["uploads"]:
            continue
        path = Path(item["path"])
        if not path.exists():
            print(f"[{i}] MISSING: {path}")
            continue
        mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
        size = path.stat().st_size

        staged = gql(STAGED_MUT, {"input": [{"filename": path.name, "mimeType": mime,
                     "resource": "IMAGE", "httpMethod": "POST", "fileSize": str(size)}]})["stagedUploadsCreate"]
        if staged["userErrors"]:
            print(f"[{i}] stage error: {staged['userErrors']}")
            continue
        tgt = staged["stagedTargets"][0]
        form = {p["name"]: p["value"] for p in tgt["parameters"]}
        with open(path, "rb") as fh:
            up = requests.post(tgt["url"], data=form, files={"file": (path.name, fh, mime)}, timeout=120)
        if up.status_code not in (200, 201, 204):
            print(f"[{i}] HTTP {up.status_code}: {path.name}")
            continue

        alt = f"Vaneli {item['style'].title()} in {item['color']}"
        res = gql(MEDIA_MUT, {"productId": item["product_id"],
                  "media": [{"originalSource": tgt["resourceUrl"], "alt": alt, "mediaContentType": "IMAGE"}]})["productCreateMedia"]
        if res["mediaUserErrors"]:
            print(f"[{i}] media error: {res['mediaUserErrors']}")
            continue
        media_id = res["media"][0]["id"] if res["media"] else ""
        state["uploads"][item["file"]] = {"media_id": media_id, "style": item["style"],
                                           "color": item["color"], "seq": item["seq"],
                                           "product_id": item["product_id"], "handle": item["handle"]}
        save_state(state)
        print(f"[{i}/{len(queue)}]  {item['handle']}  {item['color']}  {path.name}")
        time.sleep(RATE_DELAY)

    print("\nUpload complete. Run --bind to attach images to variants.")


def phase_bind():
    products = fetch_products()
    state = load_state()
    if not state["uploads"]:
        sys.exit("ERROR: no uploads in state; run --upload first.")

    best = {}
    for fname, info in state["uploads"].items():
        key = (info["style"], info["color"])
        if key not in best or info["seq"] < best[key]["seq"]:
            best[key] = info

    by_style = defaultdict(dict)
    for (style, color), info in best.items():
        by_style[style][color] = info

    for style, colors in by_style.items():
        prod = products[style]
        bind_list = []
        for color, info in colors.items():
            vids = prod["variants_by_color"].get(color, [])
            if not vids:
                print(f"  no variants for {style}/{color} — skipping")
                continue
            for vid in vids:
                bind_list.append({"id": vid, "mediaId": info["media_id"]})
        if not bind_list:
            continue
        res = gql(BIND_MUT, {"productId": prod["id"], "variants": bind_list})
        errs = res["productVariantsBulkUpdate"]["userErrors"]
        if errs:
            print(f"ERR  {prod['handle']}: {errs}")
        else:
            print(f"OK   {prod['handle']}  ({len(bind_list)} variant binds)")
        time.sleep(RATE_DELAY)

    print("\nBind complete.")


# ─────────────────────────────────────────────────── CLI

if __name__ == "__main__":
    args = set(sys.argv[1:])
    if "--scan" in args:
        phase_scan()
    elif "--upload" in args:
        phase_upload()
    elif "--bind" in args:
        phase_bind()
    else:
        print(__doc__)
