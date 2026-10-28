// Wraps display-label strings that live in object/array literals inside a
// function body, so they also pick up the Hindi dictionary.
//
// Two shapes are rewritten:
//   1. config object   label: 'Savings'      ->  label: t('Savings')
//   2. label tuple     ['Savings', amount]  ->  [t('Savings'), amount]
//
// Only label-ish properties are touched. `name`, `value` and `key` are
// deliberately skipped: those hold form field names, enum values compared in
// logic, and object keys, none of which are display text.
//
// Only sites inside a function body are rewritten. A module-level constant is
// evaluated once at import, so a t() call there would freeze the label in the
// language active at startup and never follow a language switch. Those few
// sites are moved into their component by hand instead.
//
// Values that are not prose are left alone: brand names, acronyms, URLs, paths,
// query strings, email addresses, constants, and anything already wrapped.
//
// Usage: node scripts/wrap-config-labels.mjs [--dry]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const DRY = process.argv.includes('--dry')

/** Object properties whose value is rendered to the user. */
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
  'PAN', 'IFSC', 'HSN', 'AWB', 'SMTP', 'CSV', 'MRP', 'SEO', 'URL', 'API', 'ID',
  'X (Twitter)',
])

/** Escape a literal for use inside a single-quoted JS string. */
const q = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

/** True when the value is display prose that should be translated. */
function isProse(v) {
  const s = v.trim()
  if (!/[A-Za-z]{3}/.test(s)) return false
  if (KEEP.has(s)) return false
  if (s.includes('://')) return false
  if (s.startsWith('/')) return false
  if (/[?=&]/.test(s)) return false
  if (/^[\d\s.,:/-]+$/.test(s)) return false
  if (/^[A-Z0-9_]{2,}$/.test(s)) return false
  if (/^[\w.+-]+@[\w.]+$/.test(s)) return false
  if (/\{\{/.test(s)) return false
  if (s.length < 3) return false
  return true
}

const PROP_RE = new RegExp(`\\b(${PROPS.join('|')})\\s*:\\s*'([^']*)'`, 'g')
// A tuple whose first element is prose: ['Savings', amount]
const TUPLE_RE = /(\[\s*)'([A-Z][^']*)'(\s*,)/g

/**
 * Line ranges covered by a function body, from the shared scanner used by
 * scripts/add-i18n-hooks.py, so both agree on what "inside a function" means.
 */
/** Inline copy of the scanner's range printer; keeps the two in step. */
const rangeScript = (() => {
  return [
    'import json, sys, importlib.util',
    "spec = importlib.util.spec_from_file_location('h', 'scripts/add-i18n-hooks.py')",
    'mod = importlib.util.module_from_spec(spec)',
    'try:',
    '    spec.loader.exec_module(mod)',
    'except SystemExit:',
    '    pass',
    'src = open(sys.argv[1], encoding="utf-8").read()',
    'pairs = mod.scan(src)',
    'out = [[src[:a].count(chr(10)) + 1, src[:b].count(chr(10)) + 1] for a, b in pairs]',
    'print(json.dumps(out))',
  ].join('\n')
  return ''
})()

const files = []
;(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx?$/.test(p)) files.push(p)
  }
})('src')

let total = 0
const touched = new Set()
const perFile = []

for (const f of files) {
  const src = readFileSync(f, 'utf8')
  const res = spawnSync('python3', ['-c', rangeScript, f], { encoding: 'utf8' })
  if (res.status !== 0) throw new Error(res.stderr || 'range scanner failed for ' + f)
  const ranges = JSON.parse(res.stdout)

  const lines = src.split('\n')
  const inFn = new Array(lines.length).fill(false)
  for (const [a, b] of ranges) {
    for (let i = a - 1; i <= b - 1 && i < inFn.length; i++) inFn[i] = true
  }

  let changed = 0
  const keys = new Set()
  for (let i = 0; i < lines.length; i++) {
    if (!inFn[i]) continue
    const line = lines[i]
    const orig = line

    PROP_RE.lastIndex = 0
    let next = line.replace(PROP_RE, (m, prop, val) => {
      if (!isProse(val)) return m
      if (val.includes("t('")) return m
      keys.add(val)
      return prop + ": t('" + q(val) + "')"
    })

    TUPLE_RE.lastIndex = 0
    next = next.replace(TUPLE_RE, (m, open, val, comma) => {
      if (!isProse(val)) return m
      if (val.includes("t('")) return m
      keys.add(val)
      return open + "t('" + q(val) + "')" + comma
    })

    if (next !== orig) {
      lines[i] = next
      changed++
      total++
    }
  }

  if (changed) {
    perFile.push([f, changed, keys.size])
    for (const k of keys) touched.add(k)
    if (!DRY) writeFileSync(f, lines.join('\n'), 'utf8')
  }
}

console.log(`${DRY ? '[dry] ' : ''}rewrote ${total} line(s) across ${perFile.length} file(s), ${touched.size} distinct label(s)`)
for (const [f, c] of perFile) console.log(`  ${f}  (${c})`)
if (touched.size) {
  console.log('--- keys ---')
  console.log(JSON.stringify([...touched].sort(), null, 1))
}
