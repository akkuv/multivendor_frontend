import { useQuery } from '@tanstack/react-query'
import { assetUrl } from '@/lib/assets'
import { useRef, useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Scale, Search, X } from 'lucide-react'
import { compareProducts } from '@/services/cx'
import { getProducts } from '@/services/product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/utils/format'
import { useTranslation } from 'react-i18next'

export function ComparePage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const ids = (params.get('ids') ?? '')
    .split(',')
    .map((id) => Number(id))
    .filter((id) => id > 0)
    .slice(0, 5)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['compare', ids],
    queryFn: () => compareProducts(ids),
    enabled: ids.length > 0,
    retry: 1,
  })

  // Search-as-you-type so users can find products by name or style number (SKU).
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(handle)
  }, [query])

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['compare-search', debouncedQuery],
    queryFn: () => getProducts({ search: debouncedQuery, per_page: 8 }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  })

  const candidates = useMemo(
    () => (searchResults?.data ?? []).filter((p) => !ids.includes(p.id)),
    [searchResults, ids],
  )

  const addProduct = (productId: number) => {
    if (productId > 0 && !ids.includes(productId) && ids.length < 5) {
      setParams({ ids: [...ids, productId].join(',') })
    }
    setQuery('')
  }

  // Fallback: allow adding by typing a numeric id (legacy behaviour).
  const addId = () => {
    const value = Number(inputRef.current?.value?.trim())
    if (value > 0 && !ids.includes(value) && ids.length < 5) {
      setParams({ ids: [...ids, value].join(',') })
    }
    if (inputRef.current) inputRef.current.value = ''
    setQuery('')
  }

  const removeId = (id: number) => {
    setParams({ ids: ids.filter((i) => i !== id).join(',') })
  }

  // Keep columns in the order the user requested (the API returns `order` for this).
  const order = data?.order ?? ids
  const products = (data?.products ?? [])
    .slice()
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (ids.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
        <Scale className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-3 text-lg font-medium">{t('No products to compare')}</p>
        <p className="text-sm text-muted-foreground">
          {t('Add products from their pages, or open a product\'s "Compare" link.')}
        </p>
        <Button asChild className="mt-4">
          <Link to="/shop">{t('Browse products')}</Link>
        </Button>
      </div>
    )
  }

  const brand = (p: (typeof products)[number]) => p.brand?.name
  const category = (p: (typeof products)[number]) => p.category?.name

  // Parse each product's specifications into a key->value map (supports both
  // "Key: Value" text lines and object-shaped specs).
  const specsOf = (p: (typeof products)[number]): Record<string, string> => {
    const result: Record<string, string> = {}
    const raw = p.specifications
    if (Array.isArray(raw)) {
      for (const line of raw) {
        if (!line) continue
        const [rawKey, ...rest] = String(line).split(':')
        const key = rawKey?.trim()
        const value = rest.join(':').trim()
        if (key && value) result[key] = value
      }
    } else if (raw && typeof raw === 'object') {
      for (const [k, v] of Object.entries(raw)) {
        if (v) result[k] = String(v)
      }
    }
    return result
  }
  const allSpecKeys = Array.from(
    new Set(products.flatMap((p) => Object.keys(specsOf(p)))),
  )
  const highlightsOf = (p: (typeof products)[number]) =>
    Array.isArray(p.highlights) ? p.highlights.filter(Boolean) : []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Scale className="h-6 w-6" /> {t('Compare products')}
        </h1>
        <div ref={searchRef} className="relative flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  // If the typed value is a numeric id, add it directly;
                  // otherwise pick the first search result.
                  const numeric = Number(query.trim())
                  if (numeric > 0) {
                    addId()
                  } else if (candidates.length > 0) {
                    addProduct(candidates[0].id)
                  }
                }
              }}
              placeholder={t('Search by name or style number…')}
              className="w-48 pl-9"
            />
            {query.trim().length >= 2 && (
              <div className="absolute right-0 top-full z-20 mt-1 w-72 max-h-80 overflow-y-auto rounded-lg border bg-background shadow-lg">
                {isSearching ? (
                  <p className="p-3 text-sm text-muted-foreground">{t('Searching…')}</p>
                ) : candidates.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">{t('No matching products.')}</p>
                ) : (
                  <ul>
                    {candidates.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => addProduct(p.id)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          {p.images?.[0] ? (
                            <img
                              src={assetUrl(p.images[0])}
                              alt=""
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-muted" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {p.sku ? `${t('Style')}: ${p.sku}` : `#${p.id}`}
                              {p.price ? ` · ${formatCurrency(p.price)}` : ''}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <Button variant="outline" onClick={addId}>
            {t('Add')}
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">
            Could not load the comparison. {error?.message ?? 'Please try again.'}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            {t('Try again')}
          </Button>
        </div>
      ) : products.length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {t('None of those products were found. Check the product IDs.')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="w-40 p-4 text-left align-top text-muted-foreground">{t('Product')}</th>
                {products.map((p) => (
                  <th key={p.id} className="p-4 text-left align-top">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <Link to={`/product/${p.slug}`} className="font-semibold hover:underline">
                        {p.name}
                      </Link>
                      <button
                        aria-label={t('Remove')}
                        onClick={() => removeId(p.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 text-muted-foreground">{t('Image')}</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4">
                    {p.images?.[0] ? (
                      <img src={assetUrl(p.images[0])} alt="" className="h-24 w-24 rounded-md object-cover" />
                    ) : (
                      <div className="h-24 w-24 rounded-md bg-muted" />
                    )}
                  </td>
                ))}
              </tr>
              {[
                { label: t('Price'), value: (p: (typeof products)[number]) => formatCurrency(p.price) },
                {
                  label: t('Savings'),
                  value: (p: (typeof products)[number]) =>
                    p.mrp && p.mrp > p.price
                      ? `${formatCurrency(p.mrp - p.price)} (${p.discount_percent}%)`
                      : '—',
                },
                { label: t('Brand'), value: brand },
                { label: t('Category'), value: category },
                {
                  label: t('Shipping'),
                  value: () => 'Free',
                },
              ].map((row) => (
                <tr key={row.label} className="border-t">
                  <td className="p-4 font-medium text-muted-foreground">{row.label}</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4">
                      {row.value(p)}
                    </td>
                  ))}
                </tr>
              ))}
              {allSpecKeys.map((key) => (
                <tr key={`spec-${key}`} className="border-t">
                  <td className="p-4 font-medium text-muted-foreground">{key}</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4">
                      {specsOf(p)[key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
              {products.some((p) => highlightsOf(p).length > 0) && (
                <tr className="border-t">
                  <td className="p-4 font-medium text-muted-foreground">{t('Highlights')}</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4">
                      {highlightsOf(p).length > 0 ? (
                        <ul className="list-disc space-y-1 pl-4">
                          {highlightsOf(p).map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
                </tr>
              )}
              {products.some((p) => p.short_description) && (
                <tr className="border-t">
                  <td className="p-4 font-medium text-muted-foreground">{t('Style & Fit')}</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 whitespace-pre-line">
                      {p.short_description ?? '—'}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {products.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {products.length} product{products.length > 1 ? 's' : ''} in comparison. Add up to 5.
        </p>
      )}
    </div>
  )
}