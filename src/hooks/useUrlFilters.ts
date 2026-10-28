import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Keeps a list page's filter state in the URL query string so that:
 *  - a dashboard stat card or chart slice can deep-link into a pre-filtered list,
 *  - the filters survive a refresh and can be shared as a link.
 *
 * Pagination is part of that state too, so changing any filter resets to page 1
 * in the same navigation instead of needing an effect to do it after the fact.
 * Only the listed keys are managed; anything else in the query string is left alone.
 */
export function useUrlFilters(keys: readonly string[]): {
  values: Record<string, string>
  set: (key: string, value: string) => void
  reset: () => void
  hasActive: boolean
  page: number
  /** Accepts either a number or a `(current) => next` updater. */
  setPage: (next: number | ((current: number) => number)) => void
} {
  const [searchParams, setSearchParams] = useSearchParams()
  const keySignature = keys.join('|')

  const values = useMemo(() => {
    const result: Record<string, string> = {}
    for (const key of keySignature.split('|')) {
      result[key] = searchParams.get(key) ?? ''
    }
    return result
  }, [keySignature, searchParams])

  const mutate = useCallback(
    (apply: (params: URLSearchParams) => void) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          apply(next)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const set = useCallback(
    (key: string, value: string) => {
      mutate((params) => {
        if (value === '' || value === 'ALL') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
        // Any filter change invalidates the current page offset.
        params.delete('page')
      })
    },
    [mutate],
  )

  const reset = useCallback(() => {
    mutate((params) => {
      for (const key of keySignature.split('|')) {
        params.delete(key)
      }
      params.delete('page')
    })
  }, [keySignature, mutate])

  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const setPage = useCallback(
    (next: number | ((current: number) => number)) => {
      mutate((params) => {
        const current = Math.max(1, Number(params.get('page') ?? '1') || 1)
        const resolved = typeof next === 'function' ? next(current) : next
        if (resolved <= 1) {
          params.delete('page')
        } else {
          params.set('page', String(resolved))
        }
      })
    },
    [mutate],
  )

  const hasActive = useMemo(
    () =>
      keySignature.split('|').some((key) => (searchParams.get(key) ?? '') !== '') ||
      searchParams.get('page') !== null,
    [keySignature, searchParams],
  )

  return { values, set, reset, hasActive, page, setPage }
}

/**
 * A text filter kept in the URL, but only written back after typing pauses so
 * we do not fire a request per keystroke.
 */
export function useDebouncedUrlFilter(key: string) {
  const { values, set } = useUrlFilters([key])
  const urlValue = values[key] ?? ''
  const [input, setInput] = useState(urlValue)
  const [adoptedUrlValue, setAdoptedUrlValue] = useState(urlValue)

  // Adopt external changes (a dashboard deep-link, back/forward) during render
  // rather than in an effect, so the input never shows a stale value for a frame
  // and we do not fight the debounce while the user is typing.
  if (adoptedUrlValue !== urlValue) {
    setAdoptedUrlValue(urlValue)
    setInput(urlValue)
  }

  useEffect(() => {
    if (input === urlValue) return
    const timer = window.setTimeout(() => set(key, input), 350)
    return () => window.clearTimeout(timer)
  }, [input, urlValue, key, set])

  return { input, setInput }
}