/**
 * Reports JSX text nodes that sit on their own source line and are still raw
 * English, i.e. the shape scripts/wrap-literals.mjs skips:
 *
 *     <p className="...">
 *       Store Management
 *     </p>
 *
 * Only a line that is nothing but whitespace plus prose, whose previous line
 * ends with `>` and whose next line starts with `<`, qualifies.
 *
 * Usage: node scripts/find-jsx-text.mjs [--missing-only]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'src'
const HI = 'src/i18n/locales/hi.json'
const missingOnly = process.argv.includes('--missing-only')

const hi = JSON.parse(readFileSync(HI, 'utf8'))

/** Brand and acronym values that stay in Latin script. */
const KEEP = new Set([
  'Waplia', 'Facebook', 'Instagram', 'Twitter', 'YouTube', 'LinkedIn',
  'WhatsApp', 'Razorpay', 'Shiprocket', 'Vimeo', 'UPI', 'COD', 'SKU', 'GSTIN',
  'PAN', 'IFSC', 'HSN', 'AWB', 'SMTP', 'CSV', 'MRP', 'SEO', 'URL', 'API',
])

/** Prose that is code, not user-facing text. */
function isNotProse(v) {
  const s = v.trim().replace(/\s+/g, ' ')
  if (s.length < 2) return true
  if (!/[A-Za-z]{3}/.test(s)) return true
  if (KEEP.has(s)) return true
  // A ternary arm such as ") : !isLoading ? (" lands on its own line between
  // two tags; it is code, not prose.
  if (/[(){}?=|&;`=<>]/.test(s)) return true
  // Prose starts with a capital, a digit, or a quote.
  if (!/^[A-Z0-9\u2018\u2019"']/.test(s)) return true
  if (/^[A-Z0-9_]{2,}$/.test(s)) return true
  if (/^[a-z0-9]+([._-][a-z0-9]+)+$/.test(s)) return true
  return false
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) {
      if (entry === 'i18n') continue
      yield* walk(p)
    } else if (entry.endsWith('.tsx')) {
      yield p
    }
  }
}

const found = new Map()
for (const file of walk(SRC)) {
  const lines = readFileSync(file, 'utf8').split('\n')
  for (let i = 1; i < lines.length - 1; i++) {
    const prev = lines[i - 1]
    const cur = lines[i]
    const next = lines[i + 1]
    if (!/>\s*$/.test(prev)) continue
    if (!/^\s*</.test(next)) continue
    if (cur.includes('{') || cur.includes('}') || cur.includes('<') || cur.includes('>')) continue
    if (!/^\s+\S/.test(cur)) continue
    const text = cur.trim().replace(/\s+/g, ' ')
    if (isNotProse(text)) continue
    if (!found.has(text)) found.set(text, new Set())
    found.get(text).add(`${file}:${i + 1}`)
  }
}

const keys = [...found.keys()].sort((a, b) => a.localeCompare(b))
const missing = keys.filter((k) => !(k in hi))

console.log(`own-line JSX text nodes: ${keys.length}`)
console.log(`missing from hi.json: ${missing.length}`)

if (missingOnly) {
  console.log(JSON.stringify(missing, null, 1))
} else {
  for (const k of keys) {
    console.log(`${k in hi ? '  ok ' : 'MISS'}  ${JSON.stringify(k)}  ${[...found.get(k)].join(', ')}`)
  }
}
