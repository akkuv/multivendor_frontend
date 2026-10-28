/**
 * Reports string literals that look like display labels but are absent from
 * hi.json.
 *
 * scripts/check-i18n.mjs only sees t() calls whose first argument is a literal,
 * so it misses the other common i18next pattern: a config object holds the key
 * (`{ value: 'latest', label: 'Newest first' }`) and the render site translates
 * it indirectly (`{t(option.label)}`). Those literals must exist in the
 * dictionary too, or they silently render English.
 *
 * Usage: node scripts/find-label-literals.mjs [--missing-only]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const LOCALES = 'src/i18n/locales/hi.json'
const SRC = 'src'
const missingOnly = process.argv.includes('--missing-only')

const hi = JSON.parse(readFileSync(LOCALES, 'utf8'))

/** Properties whose string value is shown to the user. */
const PROPS = [
  'label',
  'hint',
  'title',
  'description',
  'heading',
  'subheading',
  'subtitle',
  'placeholder',
  'message',
  'eyebrow',
  'kicker',
  'helperText',
]

/** Brand and acronym values that stay in Latin script. */
const KEEP = new Set([
  'Waplia', 'Facebook', 'Instagram', 'Twitter', 'YouTube', 'LinkedIn',
  'WhatsApp', 'Razorpay', 'Shiprocket', 'Vimeo', 'UPI', 'COD', 'SKU', 'GSTIN',
  'PAN', 'IFSC', 'HSN', 'AWB', 'SMTP', 'CSV', 'MRP', 'SEO', 'URL', 'API',
])

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) {
      if (entry === 'i18n') continue
      yield* walk(p)
    } else if (/\.tsx?$/.test(entry)) {
      yield p
    }
  }
}

const RE = new RegExp(`\\b(?:${PROPS.join('|')})\\s*:\\s*'([^']*)'`, 'g')
const RE_DQ = new RegExp(`\\b(?:${PROPS.join('|')})\\s*:\\s*"([^"]*)"`, 'g')

/** Values that are not prose and must stay literal. */
function isNotProse(v) {
  const s = v.trim()
  if (s.length < 2) return false
  if (!/[A-Za-z]{3}/.test(s)) return false
  if (KEEP.has(s)) return true
  if (s.includes('://')) return true
  if (s.startsWith('/')) return true
  if (/[?=&]/.test(s)) return true
  if (/^[\d\s.,:/-]+%?$/.test(s)) return true
  if (/^[A-Z0-9_]{2,}$/.test(s)) return true
  if (/^[\w.+-]+@[\w.]+$/.test(s)) return true
  if (/\{\{/.test(s)) return true
  return false
}

const found = new Map()
for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8')
  for (const re of [RE, RE_DQ]) {
    re.lastIndex = 0
    for (const m of src.matchAll(re)) {
      const val = m[1]
      if (isNotProse(val)) continue
      if (!found.has(val)) found.set(val, new Set())
      found.get(val).add(file)
    }
  }
}

const keys = [...found.keys()].sort((a, b) => a.localeCompare(b))
const missing = keys.filter((k) => !(k in hi))

console.log(`label-ish literals: ${keys.length}`)
console.log(`missing from hi.json: ${missing.length}`)

if (missingOnly) {
  console.log(JSON.stringify(missing, null, 1))
} else {
  for (const k of keys) {
    console.log(`${k in hi ? '  ok ' : 'MISS'}  ${JSON.stringify(k)}  ${[...found.get(k)].join(', ')}`)
  }
}
