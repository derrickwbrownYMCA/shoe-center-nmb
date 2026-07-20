// get-token.mjs — extract the stored Shopify CLI auth token for a store
// Usage: node get-token.mjs <store-domain>
// The token is stored by `shopify store auth` in the OS keychain.

import { execSync } from 'child_process'
import { createRequire } from 'module'

const store = process.argv[2] || 'bhnfcj-9i.myshopify.com'

// Try to find the CLI's session storage location
// Shopify CLI 3.x uses @shopify/cli-kit secureStorage (keytar under the hood)
// The credential key is typically the store FQDN

let token = null

// Approach 1: use keytar directly if available
try {
  const require = createRequire(import.meta.url)
  // Find keytar in the CLI's own node_modules
  const result = execSync(
    `node -e ${JSON.stringify(`try{const k=require('keytar');k.getPassword('Shopify CLI',${JSON.stringify(store)}).then(t=>process.stdout.write(t||''))}catch(e){}`)}`,
    { encoding: 'utf8', timeout: 10000 }
  ).trim()
  if (result && result.length > 10) token = result
} catch (_) {}

if (!token) {
  // Approach 2: call the CLI's session file location
  // On Windows the CLI config lives under %LOCALAPPDATA%
  const localAppData = process.env.LOCALAPPDATA || ''
  const appData = process.env.APPDATA || ''
  const candidates = [
    `${localAppData}\\shopify-cli-nodejs\\config.json`,
    `${localAppData}\\Shopify\\shopify-cli-nodejs\\config.json`,
    `${appData}\\Shopify\\credentials.json`,
  ]
  const { readFileSync } = await import('fs')
  for (const p of candidates) {
    try {
      const data = JSON.parse(readFileSync(p, 'utf8'))
      const key = Object.keys(data).find(k => k.includes(store) || k.includes('token'))
      if (key) { token = data[key]; break }
    } catch (_) {}
  }
}

if (token) {
  console.log(token)
} else {
  console.error('Could not extract token. Try running: npx @shopify/cli@latest store auth --store ' + store)
  process.exit(1)
}
