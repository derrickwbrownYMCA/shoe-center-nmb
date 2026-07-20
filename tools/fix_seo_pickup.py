"""
fix_seo_pickup.py — D6a: remove stale free-pickup claims from product SEO descriptions.
Policy reality: pickup is paid ($7.95, free at $200+), so descriptions must not say "free pickup".
One-shot script; prints before/after for each product.
"""
import subprocess, json, tempfile, os, re, time

SHOP = "bhnfcj-9i.myshopify.com"

MUT = """
mutation($input: ProductInput!) {
  productUpdate(input: $input) {
    product { id handle seo { description } }
    userErrors { field message }
  }
}
"""

# handle → (product gid, new description)
FIXES = {
    "on-cloud-6-men": (
        "gid://shopify/Product/7559607386158",
        "Shop the On Cloud 6 for men in regular and wide widths. Fitted by experts since 1978 — local pickup in North Myrtle Beach or fast U.S. shipping.",
    ),
    "on-cloud-6-women": (
        "gid://shopify/Product/7603770097710",
        "Shop the On Cloud 6 for women in regular and wide widths. Fitted by experts since 1978 — local pickup in North Myrtle Beach or fast U.S. shipping.",
    ),
    "on-cloud-6-men-waterproof": (
        "gid://shopify/Product/7559607451694",
        "The waterproof On Cloud 6 for men, in regular and wide widths. Expert fitting at Shoe Center NMB — North Myrtle Beach pickup or fast U.S. shipping.",
    ),
    "on-cloud-6-women-waterproof": (
        "gid://shopify/Product/7559607484462",
        "The waterproof On Cloud 6 for women, in regular and wide widths. Expert fitting at Shoe Center NMB — North Myrtle Beach pickup or fast shipping.",
    ),
    "on-cloudrunner-2-men": (
        "gid://shopify/Product/7578011500590",
        "On Cloudrunner 2 for men — supportive everyday running comfort, fitted by experts. Local pickup in North Myrtle Beach, SC or fast U.S. shipping.",
    ),
    "on-cloudrunner-2-women": (
        "gid://shopify/Product/7578011533358",
        "On Cloudrunner 2 for women — supportive everyday running comfort, fitted by experts. Local pickup in North Myrtle Beach, SC or fast U.S. shipping.",
    ),
    "on-cloudrunner-2-women-waterproof": (
        "gid://shopify/Product/7578011566126",
        "Waterproof On Cloudrunner 2 for women — all-weather running comfort. Expert fitting at Shoe Center NMB, North Myrtle Beach pickup or U.S. shipping.",
    ),
    "on-cloudrunner-2-men-waterproof": (
        "gid://shopify/Product/7578011598894",
        "Waterproof On Cloudrunner 2 for men — all-weather running comfort. Expert fitting at Shoe Center NMB, North Myrtle Beach pickup or U.S. shipping.",
    ),
    "on-cloudsurfer-2-women": (
        "gid://shopify/Product/7578011664430",
        "On Cloudsurfer 2 for women — soft, fast CloudTec Phase cushioning. Expert fitting at Shoe Center NMB. North Myrtle Beach pickup or fast U.S. shipping.",
    ),
    "on-cloudsurfer-2-men": (
        "gid://shopify/Product/7578011697198",
        "On Cloudsurfer 2 for men — soft, fast CloudTec Phase cushioning. Expert fitting at Shoe Center NMB. North Myrtle Beach pickup or fast U.S. shipping.",
    ),
    "on-cloudrunner-3-women": (
        "gid://shopify/Product/7578011729966",
        "The new On Cloudrunner 3 for women — cushioned, stable, everyday miles. Fitted by experts since 1978. Local pickup in North Myrtle Beach or U.S. shipping.",
    ),
    "on-cloudrunner-3-men": (
        "gid://shopify/Product/7578011762734",
        "The new On Cloudrunner 3 for men — cushioned, stable, everyday miles. Fitted by experts since 1978. Local pickup in North Myrtle Beach or U.S. shipping.",
    ),
}


def gql(query, variables):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".graphql", delete=False, encoding="utf-8") as qf:
        qf.write(query)
        qp = qf.name
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as vf:
        json.dump(variables, vf)
        vp = vf.name
    try:
        cmd = ["shopify", "store", "execute", "--store", SHOP,
               "--query-file", qp, "--variable-file", vp, "--allow-mutations"]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120, shell=True)
        if r.returncode != 0:
            raise RuntimeError((r.stderr + r.stdout)[:400])
        m = re.search(r"\{[\s\S]+\}", r.stdout)
        return json.loads(m.group(0))
    finally:
        os.unlink(qp)
        os.unlink(vp)


for handle, (gid, desc) in FIXES.items():
    data = gql(MUT, {"input": {"id": gid, "seo": {"description": desc}}})["productUpdate"]
    if data["userErrors"]:
        print(f"ERROR  {handle}: {data['userErrors']}")
    else:
        print(f"FIXED  {handle}")
    time.sleep(0.5)

print("\nDone. Verify with a products SEO query.")
