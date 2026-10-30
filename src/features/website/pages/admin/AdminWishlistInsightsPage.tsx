import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Heart,
  Users,
  Package,
  Search,
  Send,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError, PaginationFooter } from '@/components/common/admin'
import { assetUrl } from '@/lib/assets'
import { formatCurrency } from '@/utils/format'
import {
  getWishlistInsightStats,
  getWishlistInsightList,
  getCustomerWishlistDetail,
  getWishlistRecommendations,
  sendWishlistSuggestion,
} from '@/services/wishlist'
import { useTranslation } from 'react-i18next'

export function AdminWishlistInsightsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('')
  const [detailUserId, setDetailUserId] = useState<number | null>(null)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestCustomerId, setSuggestCustomerId] = useState<number | null>(null)
  const [suggestProductId, setSuggestProductId] = useState<number | null>(null)
  const [selectedRecs, setSelectedRecs] = useState<number[]>([])
  const [suggestMessage, setSuggestMessage] = useState('')
  const [channel, setChannel] = useState('email')

  // debounce search
  // (simple: update debounced on blur/enter)
  const applySearch = () => setDebounced(search)

  const statsQ = useQuery({ queryKey: ['admin', 'wishlist', 'stats'], queryFn: getWishlistInsightStats })
  const listQ = useQuery({
    queryKey: ['admin', 'wishlist', 'list', page, debounced, status],
    queryFn: () =>
      getWishlistInsightList({ page, per_page: 20, search: debounced || undefined, status: status || undefined }),
  })
  const detailQ = useQuery({
    queryKey: ['admin', 'wishlist', 'detail', detailUserId],
    queryFn: () => getCustomerWishlistDetail(detailUserId as number),
    enabled: detailUserId !== null,
  })
  const recsQ = useQuery({
    queryKey: ['admin', 'wishlist', 'recs', suggestProductId],
    queryFn: () => getWishlistRecommendations(suggestProductId as number),
    enabled: suggestProductId !== null,
  })
  const sendMutation = useMutation({
    mutationFn: sendWishlistSuggestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'wishlist'] })
      setSuggestOpen(false)
      setSelectedRecs([])
      setSuggestMessage('')
    },
  })

  const stats = statsQ.data
  const list = listQ.data as any

  const openSuggest = (customerId: number, productId: number) => {
    setSuggestCustomerId(customerId)
    setSuggestProductId(productId)
    setSelectedRecs([])
    setSuggestMessage('')
    setSuggestOpen(true)
  }

  const toggleRec = (id: number) => {
    setSelectedRecs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSend = () => {
    if (!suggestCustomerId || !suggestProductId || selectedRecs.length === 0) return
    sendMutation.mutate({
      customer_user_id: suggestCustomerId,
      product_id: suggestProductId,
      recommended_product_ids: selectedRecs,
      message: suggestMessage || undefined,
      channel,
    })
  }

  if (statsQ.isError) return <ApiError error={statsQ.error as Error} onRetry={() => statsQ.refetch()} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('Wishlist Insights')}</h1>
        <p className="text-muted-foreground">{t('Track customer wishlist activity and send personalized recommendations.')}</p>
      </div>

      {/* Stats cards */}
      {statsQ.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label={t('Total Entries')} value={stats?.total_entries ?? 0} icon={<Heart className="h-5 w-5" />} />
          <StatCard label={t('Active')} value={stats?.active_entries ?? 0} icon={<Heart className="h-5 w-5" />} />
          <StatCard label={t('Customers')} value={stats?.customers_with_wishlist ?? 0} icon={<Users className="h-5 w-5" />} />
          <StatCard label={t('Unique Products')} value={stats?.unique_products ?? 0} icon={<Package className="h-5 w-5" />} />
        </div>
      )}

      {/* Most wishlisted */}
      {stats?.most_wishlisted?.length ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('Most Wishlisted Products')}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {stats.most_wishlisted.map((row: any) => (
                <div key={row.product_id} className="rounded-xl border p-3 text-center">
                  <img src={assetUrl(row.product?.images?.[0])} alt="" className="mx-auto h-16 w-16 rounded-lg object-cover" />
                  <p className="mt-2 line-clamp-2 text-xs font-medium">{row.product?.name}</p>
                  <Badge variant="secondary" className="mt-1">{row.wishlist_count} {t('wishes')}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('Search customer or product…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t('All statuses')}</option>
          <option value="active">{t('Active')}</option>
          <option value="removed">{t('Removed')}</option>
        </select>
        <Button variant="outline" size="sm" onClick={applySearch}>{t('Search')}</Button>
      </div>

      {/* Table */}
      {listQ.isError ? (
        <ApiError error={listQ.error as Error} onRetry={() => listQ.refetch()} />
      ) : listQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (list?.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">{t('No wishlist records found.')}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t('Customer')}</th>
                <th className="px-4 py-3 font-medium">{t('Product')}</th>
                <th className="px-4 py-3 font-medium">{t('Vendor')}</th>
                <th className="px-4 py-3 font-medium">{t('Price')}</th>
                <th className="px-4 py-3 font-medium">{t('Added On')}</th>
                <th className="px-4 py-3 font-medium">{t('Status')}</th>
                <th className="px-4 py-3 font-medium">{t('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {list.data.data.map((row: any) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">
                    <button className="text-left hover:underline" onClick={() => setDetailUserId(row.customer?.id)}>
                      <div className="font-medium">{row.customer?.name}</div>
                      <div className="text-xs text-muted-foreground">{row.customer?.email}</div>
                      <div className="text-xs text-muted-foreground">{row.customer?.phone}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={assetUrl(row.product?.image)} alt="" className="h-10 w-10 rounded-md object-cover" />
                      <div>
                        <div className="font-medium">{row.product?.name}</div>
                        <div className="text-xs text-muted-foreground">{row.product?.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.product?.vendor}</td>
                  <td className="px-4 py-3">{formatCurrency(row.product?.price)}</td>
                  <td className="px-4 py-3 text-xs">{new Date(row.added_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>{row.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDetailUserId(row.customer?.id)}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> {t('View')}
                      </Button>
                      <Button size="sm" onClick={() => openSuggest(row.customer?.id, row.product?.id)}>
                        <Send className="mr-1 h-3.5 w-3.5" /> {t('Suggest')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4">
            <PaginationFooter data={list} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Customer detail dialog */}
      <Dialog open={detailUserId !== null} onOpenChange={(o) => !o && setDetailUserId(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('Customer Wishlist Details')}</DialogTitle>
          </DialogHeader>
          {detailQ.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : detailQ.data ? (
            <div className="space-y-4">
              <div className="rounded-xl border p-4">
                <p className="font-semibold">{detailQ.data.customer?.name}</p>
                <p className="text-sm text-muted-foreground">{detailQ.data.customer?.email}</p>
                <p className="text-sm text-muted-foreground">{detailQ.data.customer?.phone}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('Active: {{a}} · Total: {{t}}', { a: detailQ.data.counts?.active, t: detailQ.data.counts?.total })}
                </p>
              </div>
              <div>
                <p className="mb-2 font-medium">{t('Active Wishlist')}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(detailQ.data.active ?? []).map((it: any) => (
                    <div key={it.id} className="rounded-lg border p-2">
                      <img src={assetUrl(it.product?.images?.[0])} alt="" className="h-20 w-full rounded-md object-cover" />
                      <p className="mt-1 line-clamp-2 text-xs font-medium">{it.product?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(it.product?.price)}</p>
                    </div>
                  ))}
                </div>
              </div>
              {detailQ.data.suggestions?.length ? (
                <div>
                  <p className="mb-2 font-medium">{t('Previously Sent Suggestions')}</p>
                  <ul className="space-y-2 text-sm">
                    {detailQ.data.suggestions.map((s: any) => (
                      <li key={s.id} className="rounded-lg border p-2">
                        <p className="text-xs text-muted-foreground">{new Date(s.sent_at).toLocaleString()} · {s.channel} · {s.status}</p>
                        <p className="text-sm">{s.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Suggestion modal */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('Send Product Suggestion')}</DialogTitle>
            <DialogDescription>{t('Select related products to recommend to the customer.')}</DialogDescription>
          </DialogHeader>
          {recsQ.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(recsQ.data ?? []).map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleRec(p.id)}
                    className={`rounded-lg border p-2 text-left transition ${selectedRecs.includes(p.id) ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <img src={assetUrl(p.image)} alt="" className="h-20 w-full rounded-md object-cover" />
                    <p className="mt-1 line-clamp-2 text-xs font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(p.price)}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{(p.reasons ?? []).join(', ')}</p>
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">{t('Channel')}</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="email">{t('Email')}</option>
                  <option value="notification">{t('Website Notification')}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">{t('Personalized message (optional)')}</label>
                <textarea
                  value={suggestMessage}
                  onChange={(e) => setSuggestMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder={t('Hello [Customer Name], we noticed...')}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuggestOpen(false)}>{t('Cancel')}</Button>
            <Button onClick={handleSend} disabled={selectedRecs.length === 0 || sendMutation.isPending}>
              {sendMutation.isPending ? t('Sending...') : t('Send Suggestion')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}