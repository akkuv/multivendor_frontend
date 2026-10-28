import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Keeps the viewport at the top of the page on every navigation.
 *
 * React Router does not reset scroll position on route changes, and the
 * browser's own restoration makes a page refresh land back where the user left
 * off — so navigating from the footer of a long page dropped you into the
 * middle of the next one.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  // We drive restoration ourselves, otherwise the browser restores the
  // previous offset after our effect has already scrolled to the top.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}