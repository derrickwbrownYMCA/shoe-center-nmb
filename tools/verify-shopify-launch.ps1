param(
  [string]$Domain = "shoecenternmb.com",
  [string]$ShopifyStore = "bhnfcj-9i.myshopify.com"
)

$ErrorActionPreference = "Continue"

function Section($Name) {
  Write-Output ""
  Write-Output "=== $Name ==="
}

Section "DNS: expected Shopify web records"
Write-Output "Expected @ A:     23.227.38.65"
Write-Output "Expected @ AAAA:  2620:0127:f00f:5::"
Write-Output "Expected www CNAME: shops.myshopify.com"

Section "DNS: current A"
Resolve-DnsName $Domain -Type A | Format-Table Name, Type, TTL, IPAddress -AutoSize

Section "DNS: current AAAA"
Resolve-DnsName $Domain -Type AAAA | Format-Table Name, Type, TTL, IPAddress -AutoSize

Section "DNS: current www CNAME"
Resolve-DnsName "www.$Domain" -Type CNAME | Format-Table Name, Type, TTL, NameHost -AutoSize

Section "DNS: email records preserved"
Resolve-DnsName $Domain -Type MX | Sort-Object Preference | Format-Table Name, Type, TTL, Preference, NameExchange -AutoSize
Resolve-DnsName $Domain -Type TXT | Format-Table Name, Type, TTL, Strings -AutoSize

Section "HTTP/SSL checks"
$urls = @(
  "https://$Domain/",
  "https://www.$Domain/",
  "http://$Domain/",
  "http://www.$Domain/",
  "https://$ShopifyStore/"
)

foreach ($url in $urls) {
  $result = & curl.exe -L -I -s -o NUL -w "%{http_code} %{url_effective} %{content_type}" --max-time 20 $url
  Write-Output "$url -> $result"
}

Section "Shopify storefront inventory"
try {
  $sitemap = Invoke-WebRequest -Uri "https://$ShopifyStore/sitemap.xml" -UseBasicParsing -TimeoutSec 20
  Write-Output "Shopify sitemap reachable: $($sitemap.StatusCode)"
} catch {
  Write-Output "Shopify sitemap error: $($_.Exception.Message)"
}
