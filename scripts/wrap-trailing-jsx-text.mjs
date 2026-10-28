/**
 * Wraps JSX text that follows a self-closing element on the same line.
 *
 * The common "icon plus label" shape is a third way JSX text can appear, and
 * neither earlier wrapper covers it, because the text is not alone on its line
 * and the character before it is not `>`:
 *
 *     <RefreshCw className="mr-1 h-4 w-4" /> Try again
 *
 * Only a trailing run of prose after `/>` is rewritten, so the element itself
 * and its props are untouched. Non-prose is left alone: brand names, acronyms,
 * snake_case and dotted identifiers.
 *
 * Usage: node scripts/wrap-trailing-jsx-text.mjs [--dry]
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

/** A self-closing JSX element followed by prose and nothing else. */
const LINE_RE = /^([ \t]*<[A-Z][A-Za-z0-9.]*(?:\s[^>]*)?\/>)([ \t]+)(.+?)[ \t]*$/

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

const keys = new Set()
const perFile = []
let total = 0

for (const file of walk(SRC)) {
  const lines = readFileSync(file, 'utf8').split('\n')
  let changed = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes("t('")) continue
    const m = LINE_RE.exec(line)
    if (!m) continue
    const [, element, gap, tail] = m
    const text = tail.trim().replace(/\s+/g, ' ')
    if (isNotProse(text)) continue

    lines[i] = `${element}${gap}{t('${q(text)}')}`
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
