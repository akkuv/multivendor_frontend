/**
 * Wraps remaining hardcoded user-visible English literals across src (tsx only).
 * with t('...') so they pick up the Hindi dictionary.
 *
 * Only three shapes are rewritten, all unambiguous:
 *   1. JSX text node     >Some words<            ->  >{t('Some words')}<
 *   2. literal string attr  prop="Some words"   ->  prop={t('Some words')}
 *
 * Values that are clearly not prose are left alone: URLs, paths, query
 * strings, class names, api payloads, single tokens (SKU, PAN, ...).
 * Nothing that is compared in logic, used as a form name, or already inside a
 * t() call is touched.
 *
 * Usage: node scripts/wrap-literals.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DRY = process.argv.includes('--dry')

/** Literal props whose value is user-visible text. */
const PROPS = ['placeholder', 'title', 'aria-label', 'alt', 'label']

/** Values that are not prose and must stay literal. */
function isNotProse(v) {
  if (!/[A-Za-z]{3}/.test(v)) return true
  if (v.includes('://')) return true // URL
  if (v.startsWith('/')) return true // path
  if (/[?=&]/.test(v)) return true // query string / expression-ish
  if (v.includes('\\')) return true // escaped
  if (/^\s*[&*{]/.test(v)) return true // expression
  if (/^[\d\s.,:/-]+$/.test(v)) return true // numbers only
  if (/^[A-Z0-9_]{2,}$/.test(v)) return true // CONST / enum
  if (/^[\w.+-]+@[\w.]+$/.test(v)) return true // email
  if (/^#[\da-fA-F]{3,8}$/.test(v)) return true // hex colour
  if (/\{\{/.test(v)) return true // already an interpolated key
  return false
}

/** True when a JSX text node is really prose and not code-ish. */
function isProseText(v) {
  const s = v.trim()
  if (!s) return false
  if (!/[A-Za-z]{3}/.test(s)) return false
  if (/[<>{}]/.test(s)) return false
  if (/[&|=<>!]/.test(s)) return false
  if (/\d/.test(s) && !/[A-Za-z]{3}/.test(s)) return false
  if (/^\s*[/.\-—•·|]/.test(s) && !/^[A-Za-z]/.test(s)) return false
  // reject whitespace-padded single separators / bullets
  if (/^[\s\W]*$/.test(s)) return false
  return true
}

/** Escape a literal for use inside a single-quoted JS string. */
const q = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const files = []
;(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx$/.test(p)) files.push(p)
  }
})('src')

let total = 0
const report = []

for (const f of files) {
  const src = readFileSync(f, 'utf8')
  const lines = src.split('\n')
  const touchedKeys = new Set()
  let changed = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const orig = line
    // Already-translated lines: skip wholesale so we never double-wrap.
    const already = line.includes("{t(") || line.includes("{t'") || line.includes("t('")

    if (!already) {
      // 1. literal string attrs
      line = line.replace(
        new RegExp(`\\b(${PROPS.join('|')})="([^"']*)"`, 'g'),
        (m, prop, val) => (isNotProse(val.trim()) ? m : prop + "={t('" + q(val) + "')}"),
      )
    }

    // 2. JSX text node:  >Text<   (only when the line has no existing t())
    if (!already) {
      // Require a real closing tag after the text node. The lookahead (rather
      // than a capture group) matters: it keeps `</Button>` intact instead of
      // swallowing `</B`, and it prevents TS generics like `Promise<void>` from
      // ever looking like a text node.
      line = line.replace(/>([^<>{}]*)<(?=\/[A-Za-z])/g, (m, txt) => {
        // Preserve leading/trailing whitespace the way JSX collapses it.
        const lead = txt.match(/^\s*/)[0]
        const trail = txt.match(/\s*$/)[0]
        const core = txt.trim()
        if (!isProseText(core)) return m
        touchedKeys.add(core)
        return '>' + lead + "{t('" + q(core) + "')}" + trail + '<'
      })
    }

    if (line !== orig) {
      changed = true
      total++
      lines[i] = line
    }
  }

  if (!changed) continue

  let next = lines.join('\n')
  report.push({ file: f, lines: lines.filter((l, i) => l !== src.split('\n')[i]).length, keys: [...touchedKeys] })
  if (!DRY) writeFileSync(f, next, 'utf8')
}

console.log(`${DRY ? '[dry] ' : ''}rewrote ${total} line(s) across ${report.length} file(s)`)
for (const r of report) console.log(`  ${r.file}  (${r.lines} lines, ${r.keys.length} keys)`)