/**
 * Wraps own-line JSX text nodes in t().
 *
 * scripts/wrap-literals.mjs handles JSX text that sits inline between two tags
 * on one source line. It leaves alone the equally common shape where the text
 * is the only thing on its own line:
 *
 *     <p className="...">
 *       Store Management
 *     </p>
 *
 * This pass covers just that shape. The surrounding lines must prove the node
 * is a JSX child: the line above has to end with `>` and the line below has to
 * start with `<`. A candidate line may not itself contain any JSX syntax
 * (`<`, `>`, `{`, `}`) or a stray code operator, so a ternary arm such as
 * ") : !isLoading ? (" can never be mistaken for prose.
 *
 * Non-prose is left alone: brand names, acronyms, snake_case and dotted
 * identifiers, and anything with fewer than three letters.
 *
 * Usage: node scripts/wrap-jsx-text-lines.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'src'
const DRY = process.argv.includes('--dry')

/** Brand and acronym values that stay in Latin script. */
const KEEP = new Set([
  'Waplia', 'Facebook', 'Instagram', 'Twitter', 'YouTube', 'LinkedIn',
  'WhatsApp', 'Razorpay', 'Shiprocket', 'Vimeo', 'UPI', 'COD', 'SKU', 'GSTIN',
  'PAN', 'IFSC', 'HSN', 'AWB', 'SMTP', 'CSV', 'MRP', 'SEO', 'URL', 'API',
])

/** Escape a literal for use inside a single-quoted JS string. */
const q = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

/** Prose that is code, not user-facing text. */
function isNotProse(v) {
  const s = v.trim().replace(/\s+/g, ' ')
  if (s.length < 2) return true
  if (!/[A-Za-z]{3}/.test(s)) return true
  if (KEEP.has(s)) return true
  if (/[(){}?=|&;`=<>]/.test(s)) return true
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

const files = [...walk(SRC)]
const keys = new Set()
const perFile = []
let total = 0

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  let changed = 0

  for (let i = 1; i < lines.length - 1; i++) {
    if (!/>\s*$/.test(lines[i - 1])) continue
    if (!/^\s*</.test(lines[i + 1])) continue
    if (/[<>{]/.test(lines[i])) continue
    if (!/^\s+\S/.test(lines[i])) continue
    if (lines[i].includes("t('")) continue

    const raw = lines[i]
    const indent = raw.match(/^\s*/)[0]
    const text = raw.trim().replace(/\s+/g, ' ')
    if (isNotProse(text)) continue

    lines[i] = `${indent}{t('${q(text)}')}`
    keys.add(text)
    changed++
    total++
  }

  if (changed) {
    perFile.push([file, changed])
    if (!DRY) writeFileSync(file, lines.join('\n'), 'utf8')
  }
}

console.log(`${DRY ? '[dry] ' : ''}rewrote ${total} line(s) across ${perFile.length} file(s), ${keys.size} distinct key(s)`)
for (const [f, c] of perFile) console.log(`  ${f}  (${c})`)
console.log('--- keys ---')
console.log(JSON.stringify([...keys].sort((a, b) => a.localeCompare(b)), null, 1))
