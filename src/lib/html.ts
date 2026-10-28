/**
 * Minimal allow-list sanitizer for admin-authored rich text.
 *
 * The section editor writes HTML with `document.execCommand`, so the markup is
 * authored by a trusted admin — but we still strip anything that could execute
 * (scripts, event handlers, `javascript:` URLs) before injecting it with
 * `dangerouslySetInnerHTML`.
 */

const ALLOWED_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'hr',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'del',
  'sub',
  'sup',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'span',
  'div',
  'code',
  'pre',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
])

const DROPPED_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
])

const UNSAFE_URL = /^\s*(?:javascript|vbscript|data):/i

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) {
    return ''
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Unwrapping a disallowed tag can expose new children, so repeat until stable.
  for (let pass = 0; pass < 5; pass += 1) {
    let changed = false

    for (const element of Array.from(doc.body.querySelectorAll('*'))) {
      const tag = element.tagName.toLowerCase()

      if (DROPPED_TAGS.has(tag)) {
        element.remove()
        changed = true
        continue
      }

      if (!ALLOWED_TAGS.has(tag)) {
        element.replaceWith(...Array.from(element.childNodes))
        changed = true
        continue
      }

      for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase()
        const isUrl = name === 'href' || name === 'src'

        if (name.startsWith('on') || name === 'style' || (isUrl && UNSAFE_URL.test(attribute.value))) {
          element.removeAttribute(attribute.name)
        }
      }
    }

    if (!changed) {
      break
    }
  }

  return doc.body.innerHTML
}
