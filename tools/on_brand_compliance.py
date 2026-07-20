"""
on_brand_compliance.py — B2B Playbook admin changes:
1. Collection 'On Running' title -> 'On' (handle/URL unchanged)
2. Main-menu nav item 'On Running' -> 'On'
3. Manual product ranking: blockbusters + new-gen in row one
Run: python on_brand_compliance.py
"""
import subprocess, json, tempfile, os, re, time

SHOP = "bhnfcj-9i.myshopify.com"
COLLECTION_ID = "gid://shopify/Collection/286055694382"  # on-running

# Desired first rows (4-col grid): Cloud 6 (blockbuster) + Cloudrunner 3 (new gen)
DESIRED_ORDER_HANDLES = [
    "on-cloud-6-women",
    "on-cloud-6-men",
    "on-cloudrunner-3-women",
    "on-cloudrunner-3-men",
    "on-cloudsurfer-2-women",
    "on-cloudsurfer-2-men",
    "on-cloud-6-women-waterproof",
    "on-cloud-6-men-waterproof",
    "on-cloudrunner-2-women",
    "on-cloudrunner-2-men",
    "on-cloudrunner-2-women-waterproof",
    "on-cloudrunner-2-men-waterproof",
]


def gql(query, variables=None):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".graphql", delete=False, encoding="utf-8") as qf:
        qf.write(query); qp = qf.name
    vp = None
    if variables is not None:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as vf:
            json.dump(variables, vf); vp = vf.name
    try:
        cmd = ["shopify", "store", "execute", "--store", SHOP,
               "--query-file", qp, "--allow-mutations"]
        if vp:
            cmd += ["--variable-file", vp]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120, shell=True)
        if r.returncode != 0:
            raise RuntimeError((r.stderr + r.stdout)[:600])
        return json.loads(re.search(r"\{[\s\S]+\}", r.stdout).group(0))
    finally:
        os.unlink(qp)
        if vp: os.unlink(vp)


# ── 1. Collection title ────────────────────────────────────────────────
d = gql("""
mutation($input: CollectionInput!) {
  collectionUpdate(input: $input) {
    collection { id title handle sortOrder }
    userErrors { field message }
  }
}""", {"input": {"id": COLLECTION_ID, "title": "On"}})["collectionUpdate"]
if d["userErrors"]:
    print("TITLE ERROR:", d["userErrors"])
else:
    c = d["collection"]
    print(f"Collection title -> {c['title']!r} (handle {c['handle']}, sort {c['sortOrder']})")
sort_order = d["collection"]["sortOrder"] if d["collection"] else None
time.sleep(0.6)

# ── 2. Nav menu item ───────────────────────────────────────────────────
menus = gql("""
{ menus(first: 10) { edges { node { id handle title items { id title type url items { id title type url } } } } } }
""")["menus"]["edges"]

for edge in menus:
    menu = edge["node"]
    changed = False

    def rename(items):
        global changed
        out = []
        for it in items:
            title = it["title"]
            if title.strip().lower() in ("on running", "on-running"):
                title = "On"
                changed = True
            entry = {"id": it["id"], "title": title, "type": it["type"], "url": it["url"]}
            if it.get("items"):
                entry["items"] = rename(it["items"])
            out.append(entry)
        return out

    new_items = rename(menu["items"])
    if changed:
        res = gql("""
mutation($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
  menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
    menu { id title }
    userErrors { field message }
  }
}""", {"id": menu["id"], "title": menu["title"], "handle": menu["handle"], "items": new_items})["menuUpdate"]
        if res["userErrors"]:
            print(f"MENU ERROR ({menu['handle']}):", res["userErrors"])
        else:
            print(f"Menu '{menu['handle']}': 'On Running' -> 'On'")
        time.sleep(0.6)

# ── 3. Manual ranking ──────────────────────────────────────────────────
if sort_order != "MANUAL":
    d = gql("""
mutation($input: CollectionInput!) {
  collectionUpdate(input: $input) {
    collection { sortOrder }
    userErrors { field message }
  }
}""", {"input": {"id": COLLECTION_ID, "sortOrder": "MANUAL"}})["collectionUpdate"]
    if d["userErrors"]:
        raise SystemExit(f"SORT ERROR: {d['userErrors']}")
    print("Sort order -> MANUAL")
    time.sleep(0.6)

prods = gql("""
query($id: ID!) {
  collection(id: $id) {
    products(first: 50) { edges { node { id handle } } }
  }
}""", {"id": COLLECTION_ID})["collection"]["products"]["edges"]
by_handle = {e["node"]["handle"]: e["node"]["id"] for e in prods}
print(f"Collection has {len(by_handle)} products")

moves = []
pos = 0
for h in DESIRED_ORDER_HANDLES:
    if h in by_handle:
        moves.append({"id": by_handle[h], "newPosition": str(pos)})
        pos += 1
    else:
        print(f"  (skip — not in collection: {h})")

d = gql("""
mutation($id: ID!, $moves: [MoveInput!]!) {
  collectionReorderProducts(id: $id, moves: $moves) {
    job { id }
    userErrors { field message }
  }
}""", {"id": COLLECTION_ID, "moves": moves})["collectionReorderProducts"]
if d["userErrors"]:
    print("REORDER ERROR:", d["userErrors"])
else:
    print(f"Reordered {len(moves)} products (async job {d['job']['id'].split('/')[-1]})")

print("\nDone.")
