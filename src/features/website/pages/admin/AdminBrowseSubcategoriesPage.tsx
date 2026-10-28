import { useMemo, useState } from 'react'
import {
  Award,
  Camera,
  Check,
  ExternalLink,
  Flame,
  Gem,
  Image as ImageIcon,
  LayoutGrid,
  MessageCircle,
  Package,
  Plus,
  Save,
  Search,
  Shapes,
  Sparkles,
  Store,
  Trash2,
  TrendingUp,
  Video as VideoIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ActiveBadge,
  ApiError,
  ConfirmDialog,
  EmptyState,
  FormField,
  LiveStorePreview,
} from '@/components/common/admin'
import {
  useAdminCategoryPages,
  useAdminCategoryPage,
  useCreateAdminCategoryPage,
  useUpdateAdminCategoryPage,
  useDeleteAdminCategoryPage,
  useToggleAdminCategoryPage,
  useUpdateAdminCategoryPageSection,
} from '@/hooks/useCategoryPages'
import { useAdminCategoriesAll } from '@/hooks/useCategories'
import {
  buildCategoryOptions,
  buildRelatedCategoryGroups,
  categoryOptionLabel,
  type RelatedCategoryGroup,
} from '@/lib/categoryTree'
import { CategoryPageSections } from '@/components/admin/CategoryPageSections'
import { cn } from '@/lib/utils'
import { assetUrl } from '@/lib/assets'
import { buildCategoryPageEntries } from '@/lib/categoryPageEntries'
import type { AdminCategoryPage, Category, CategoryPageSection, HomeSectionType } from '@/types'
import { useTranslation } from 'react-i18next'

const sectionMeta: Record<HomeSectionType | 'ALL_PRODUCTS', { label: string; hint: string; icon: typeof Shapes }> = {
  HERO: { label: 'Hero Banner', hint: 'Category spotlight banner', icon: ImageIcon },
  PERSONALIZATION: { label: 'Personalization', hint: 'Personalized picks strip', icon: Sparkles },
  VALUE_PROPS: { label: 'Value Props', hint: 'Value proposition cards', icon: Gem },
  MINI_BANNERS: { label: 'Mini Banners', hint: 'Compact category banners', icon: ImageIcon },
  CATEGORIES: { label: 'Browse Subcategories', hint: 'Related subcategory tiles', icon: Shapes },
  FEATURED_CATEGORIES: { label: 'Featured Categories', hint: 'Featured category tiles', icon: Shapes },
  EDITORS_PICKS: { label: "Editor's Picks", hint: 'Curated category picks', icon: Award },
  SPLIT_COLLAGE: { label: 'The Saree Edit', hint: 'Media collage with side text', icon: LayoutGrid },
  IMAGE_BANNER: { label: 'Image Banner', hint: 'Full-width clickable image banner with heading', icon: LayoutGrid },
  TEXT_BANNER: { label: 'Text Banner', hint: 'Banner with optional background image, text and a button', icon: LayoutGrid },
  VIDEO_BANNER: { label: 'Video Banner', hint: 'Autoplaying video banner with a headline, description and button', icon: VideoIcon },
  PRODUCT_CAROUSEL: { label: 'Product Carousel', hint: 'Cream box with a text column and an autoplaying product carousel', icon: LayoutGrid },
  INSTAGRAM_DIARIES: { label: 'Instagram Diaries', hint: 'Clickable Instagram media grid with lightbox', icon: Camera },
  TRENDING_STYLES: { label: 'Trending Styles', hint: 'Portrait image/video style slider', icon: TrendingUp },
  BEST_SELLERS: { label: 'Best Sellers', hint: 'Popular picks', icon: Flame },
  ICON_INFO: { label: 'Icon Info', hint: 'Icon and text info band', icon: MessageCircle },
  TESTIMONIALS: { label: 'Testimonials', hint: 'Customer reviews', icon: MessageCircle },
  VISIT_STORES: { label: 'Visit Stores', hint: 'Store visit band', icon: Store },
  STORE_LOCATIONS: { label: 'Visit Our Stores', hint: 'Store cards with image, name and links', icon: Store },
  VENDOR_STORES: { label: 'Vendor Stores', hint: 'Featured vendor stores', icon: Store },
  RICH_TEXT: { label: 'Text / Content Block', hint: 'Free-form HTML content block', icon: LayoutGrid },
  FAQ: { label: 'FAQ (Questions)', hint: 'Expandable Q&A accordion', icon: MessageCircle },
  ALL_PRODUCTS: { label: 'All Products', hint: 'Paginated full listing (24 per page)', icon: LayoutGrid },
}

function tileProductCount(category: Category): number {
  return typeof category.products_count === 'number' ? category.products_count : 0
}

function TileChip({
  category,
  selected,
  onToggle,
}: {
  category: Category
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'group relative flex w-[140px] flex-col overflow-hidden rounded-2xl border text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40'
          : 'border-slate-200 bg-background hover:border-primary/50 hover:shadow-sm',
      )}
    >
      <div className="relative h-16 w-full overflow-hidden bg-muted">
        {category.image ? (
          <img src={assetUrl(category.image)} alt={category.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Store className="h-6 w-6" />
          </div>
        )}
        <span
          className={cn(
            'absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-slate-300 bg-background text-transparent',
          )}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-2">
        <span className="truncate text-xs font-medium">{category.name}</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Package className="h-3 w-3" />
          {tileProductCount(category)} product{tileProductCount(category) === 1 ? '' : 's'}
        </span>
      </div>
    </button>
  )
}

function TileGroup({
  group,
  selected,
  onToggle,
}: {
  group: RelatedCategoryGroup
  selected: Set<number>
  onToggle: (id: number) => void
}) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Shapes className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-semibold">{t(group.label)}</p>
          {group.hint && <p className="text-xs text-muted-foreground">{t(group.hint)}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {group.categories.map((c) => (
          <TileChip key={c.id} category={c} selected={selected.has(c.id)} onToggle={() => onToggle(c.id)} />
        ))}
      </div>
    </div>
  )
}

function BrowseSectionDesigner({
  section,
  categories,
  rootId,
  rootName,
  onSaved,
}: {
  section: CategoryPageSection
  categories: Category[]
  rootId: number
  rootName: string
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const updateSection = useUpdateAdminCategoryPageSection()
  const initialPicked: number[] = Array.isArray(section.config?.category_ids) ? (section.config.category_ids as number[]) : []
  const [custom, setCustom] = useState(initialPicked.length > 0)
  const [picked, setPicked] = useState<number[]>(initialPicked)
  const [limit, setLimit] = useState(() => String((section.config?.limit as number | undefined) ?? 12))
  const [saved, setSaved] = useState(false)

  const groups = buildRelatedCategoryGroups(categories, rootId, rootName)
  const selected = new Set(picked)

  const toggle = (id: number) => {
    setSaved(false)
    setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id])
  }

  const save = async () => {
    const config: Record<string, unknown> = { limit: Number(limit || 12) }
    if (custom && picked.length > 0) config.category_ids = picked
    await updateSection.mutateAsync({ id: section.id, data: { config } })
    setSaved(true)
    onSaved()
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-r from-primary/10 via-transparent to-transparent p-4">
        <div>
          <h4 className="font-semibold">{section.title ?? 'Browse Subcategories'}</h4>
          {section.subtitle && <p className="text-xs text-muted-foreground">{section.subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className={cn('font-medium', custom ? 'text-muted-foreground' : 'text-primary')}>{t('Auto')}</span>
            <Switch
              checked={custom}
              onCheckedChange={(v) => {
                setCustom(v)
                setSaved(false)
              }}
              aria-label={t('Custom tile selection')}
            />
            <span className={cn('font-medium', custom ? 'text-primary' : 'text-muted-foreground')}>{t('Custom')}</span>
          </div>
          <Button size="sm" onClick={save} disabled={updateSection.isPending}>
            <Save className="mr-1.5 h-4 w-4" />
            {updateSection.isPending ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="space-y-5 p-4">
        {custom ? (
          <>
            <p className="text-sm text-muted-foreground">
              Pick the exact subcategory tiles for this page. Only categories related to <b>{rootName}</b> are shown.
            </p>
            {groups.length === 0 ? (
              <EmptyState message="No related categories found for this page." />
            ) : (
              groups.map((g) => (
                <TileGroup key={g.id} group={g} selected={selected} onToggle={toggle} />
              ))
            )}
            <div className="flex items-center gap-4">
              <FormField label={t('Show up to')}>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={limit}
                  onChange={(e) => {
                    setLimit(e.target.value)
                    setSaved(false)
                  }}
                  className="max-w-24"
                />
              </FormField>
              <span className="text-sm text-muted-foreground">
                {picked.length} selected
                {picked.length === 0 ? ' · page will fall back to automatic tiles when saved' : ''}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
            <Shapes className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">{t('Showing related subcategories automatically')}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                The page displays the subcategories of {rootName} (or related categories when it is a subcategory),
                chosen by the system. Flip to <b>{t('Custom')}</b> to pick the exact tiles.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SlugBanner({
  page,
  fallbackTitle,
  fallbackSlug,
  fallbackImage,
  tileCount,
  sectionCount,
  onToggle,
  onDelete,
  isPending,
}: {
  page: AdminCategoryPage | null
  fallbackTitle: string
  fallbackSlug: string
  fallbackImage?: string | null
  tileCount: number
  sectionCount: number
  onToggle: () => void
  onDelete: () => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  const title = page?.title ?? fallbackTitle
  const slug = page?.slug ?? fallbackSlug
  const image = page?.category?.image ?? fallbackImage ?? null

  return (
    <div className="relative overflow-hidden rounded-2xl border">
      {image ? (
        <img src={assetUrl(image)} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30" />
      <div className="relative flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">{t('Browse Subcategories Page')}</p>
          <h3 className="mt-0.5 truncate text-xl font-semibold">{title}</h3>
          <p className="truncate text-sm text-muted-foreground">/category/{slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Shapes className="h-3.5 w-3.5" />
            {tileCount} tile{tileCount === 1 ? '' : 's'}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <LayoutGrid className="h-3.5 w-3.5" />
            {sectionCount} section{sectionCount === 1 ? '' : 's'}
          </span>
          {page ? (
            <Button variant="outline" size="sm" onClick={onToggle} disabled={isPending} title={t('Toggle page')}>
              <ActiveBadge active={page.is_active} />
            </Button>
          ) : (
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {t('Default page')}
            </span>
          )}
          {page && (
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="mr-1.5 h-4 w-4" /> {t('Delete')}
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <a href={`/category/${slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" /> {t('Open page')}
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

function PageFlowStrip({ sections }: { sections: CategoryPageSection[] }) {
  const { t } = useTranslation()
  const present = new Set(sections.map((s) => s.type))
  const flow: Array<keyof typeof sectionMeta> = [
    'HERO',
    'CATEGORIES',
    'BEST_SELLERS',
    'TESTIMONIALS',
    'ALL_PRODUCTS',
  ]

  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{t('Complete page flow')}</h4>
          <p className="text-xs text-muted-foreground">
            {t('Every section below is controlled from Category Pages › Manage.')}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href="/admin/category-pages">
            <LayoutGrid className="mr-1.5 h-4 w-4" /> {t('Manage sections')}
          </a>
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {flow.map((type) => {
          const meta = sectionMeta[type]
          const Icon = meta.icon
          const on = type === 'ALL_PRODUCTS' || present.has(type)
          return (
            <div
              key={type}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-2.5',
                on ? 'border-primary/20 bg-primary/5' : 'border-dashed opacity-60',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  on ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {t(meta.label)}
                  {on && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{type === 'ALL_PRODUCTS' ? '' : 'On'}</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{t(meta.hint)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AdminBrowseSubcategoriesPage() {
  const { t } = useTranslation()
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'design' | 'sections' | 'preview'>('design')
  const [refreshKey, setRefreshKey] = useState(0)

  const allPagesQuery = useAdminCategoryPages({ per_page: 1000 })
  const createPage = useCreateAdminCategoryPage()
  const updatePage = useUpdateAdminCategoryPage()
  const togglePage = useToggleAdminCategoryPage()
  const deletePage = useDeleteAdminCategoryPage()
  const categoriesQuery = useAdminCategoriesAll()

  const [creating, setCreating] = useState(false)
  const [createCategory, setCreateCategory] = useState('')
  const [deletingPage, setDeletingPage] = useState<AdminCategoryPage | null>(null)

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const entries = useMemo(
    () => buildCategoryPageEntries(categories, allPagesQuery.data?.data ?? []),
    [categories, allPagesQuery.data],
  )

  const existingPageCategoryIds = new Set(
    (allPagesQuery.data?.data ?? []).map((p) => p.category_id ?? p.category?.id).filter((id): id is number => id != null),
  )
  const categoryOptions = buildCategoryOptions(categories)
  const creatableCategories = categoryOptions.filter((o) => !existingPageCategoryIds.has(o.category.id))

  const selectedEntry = entries.find((e) => e.category.id === selectedCatId) ?? null
  const selectedPage = selectedEntry?.page ?? null
  const detailQuery = useAdminCategoryPage(selectedPage?.id)
  const isPageDetailLoading = !!selectedPage && detailQuery.isLoading

  const pageDetailSource = selectedPage ? (detailQuery.data ?? selectedPage) : null
  const pageCategoryId = (selectedPage?.category_id ?? selectedEntry?.category.id) ?? null
  const pageTitle = pageDetailSource?.title ?? selectedEntry?.category.name ?? ''
  const pageSlug = selectedEntry?.category.slug ?? pageDetailSource?.slug ?? ''
  const pageImage = selectedEntry?.category.image ?? null

  const categoriesSections = (pageDetailSource?.sections ?? []).filter((s) => s.type === 'CATEGORIES')
  const tileCount = categoriesSections.reduce<number>(
    (n, s) => n + (Array.isArray(s.config?.category_ids) ? (s.config.category_ids as number[]).length : 0),
    0,
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) =>
      `${e.category.name} ${e.category.slug} ${e.page?.title ?? ''}`.toLowerCase().includes(q),
    )
  }, [entries, search])

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const option = creatableCategories.find((o) => String(o.category.id) === createCategory)
    if (!option) return
    const created = await createPage.mutateAsync({ category_id: option.category.id })
    setCreating(false)
    setCreateCategory('')
    setSelectedCatId(created.category_id ?? option.category.id)
    setTab('design')
    setRefreshKey((k) => k + 1)
  }

  const handlePageFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedEntry) return
    const form = new FormData(e.currentTarget)
    const title = String(form.get('title') || '').trim()
    const subtitle = String(form.get('subtitle') || '').trim() || null
    const description = String(form.get('description') || '').trim() || null

    if (selectedPage) {
      await updatePage.mutateAsync({ id: selectedPage.id, data: { title, subtitle, description } })
    } else {
      const created = await createPage.mutateAsync({ category_id: selectedEntry.category.id, title, subtitle, description })
      setSelectedCatId(created.category_id ?? selectedEntry.category.id)
      setRefreshKey((k) => k + 1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-gradient-to-r from-primary/10 via-muted/40 to-transparent p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-md shadow-primary/25">
            <Shapes className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">{t('Browse Subcategories')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('Create and set up every category\'s subcategory flow — tiles, sections, and live preview, all from here.')}
            </p>
          </div>
        </div>
        <Button onClick={() => { setCreating(true); setCreateCategory('') }}>
          <Plus className="mr-1.5 h-4 w-4" /> {t('New Page')}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border bg-background">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('Search pages...')}
                className="pl-9"
              />
            </div>
          </div>
          {allPagesQuery.isLoading || !categories ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : allPagesQuery.error ? (
            <div className="p-3">
              <ApiError error={allPagesQuery.error} onRetry={() => allPagesQuery.refetch()} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-3">
              <EmptyState message="No categories match your search." />
            </div>
          ) : (
            <div className="max-h-[calc(100vh-17rem)] space-y-1.5 overflow-y-auto p-2">
              {filtered.map((entry) => (
                <button
                  key={entry.category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCatId(entry.category.id)
                    setTab('design')
                    setRefreshKey((k) => k + 1)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all',
                    selectedCatId === entry.category.id
                      ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/30'
                      : 'border-slate-200 bg-background hover:border-primary/40 hover:shadow-sm',
                  )}
                >
                  {entry.category.image ? (
                    <img
                      src={assetUrl(entry.category.image)}
                      alt={entry.category.name}
                      className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Store className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {entry.depth > 0 && <span className="mr-1 text-muted-foreground">↳</span>}
                      {entry.page?.title ?? entry.category.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">/category/{entry.category.slug}</span>
                  </span>
                  {entry.page ? (
                    <ActiveBadge active={entry.page.is_active} />
                  ) : (
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {t('Default')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          {selectedCatId == null ? (
            <div className="rounded-2xl border bg-background py-16 text-center">
              <Shapes className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">{t('Select a category page')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('Every main category and subcategory is listed on the left — choose one to design its tiles, sections, and preview its live layout.')}
              </p>
            </div>
          ) : !selectedEntry ? (
            <div className="rounded-2xl border bg-background p-6">
              <ApiError error={new Error('This category could not be found.')} onRetry={() => setSelectedCatId(null)} />
            </div>
          ) : isPageDetailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              <SlugBanner
                page={pageDetailSource}
                fallbackTitle={selectedEntry.category.name}
                fallbackSlug={selectedEntry.category.slug}
                fallbackImage={pageImage}
                tileCount={tileCount}
                sectionCount={pageDetailSource?.sections?.length ?? 0}
                onToggle={() => {
                  if (selectedPage) togglePage.mutate(selectedPage.id)
                }}
                onDelete={() => {
                  if (pageDetailSource) setDeletingPage(pageDetailSource)
                }}
                isPending={togglePage.isPending}
              />

              <div className="grid gap-4 lg:grid-cols-3">
                <form onSubmit={handlePageFormSubmit} className="rounded-2xl border bg-background p-4 lg:col-span-1">
                  <h3 className="mb-3 font-semibold">{selectedPage ? 'Page Setup' : 'Set up default page'}</h3>
                  <div className="space-y-3">
                    <FormField label={t('Title')}>
                      <Input name="title" defaultValue={pageDetailSource?.title ?? selectedEntry.category.name} required />
                    </FormField>
                    <FormField label={t('Subtitle')}>
                      <Input name="subtitle" defaultValue={pageDetailSource?.subtitle ?? ''} />
                    </FormField>
                    <FormField label={t('Description')}>
                      <Textarea name="description" defaultValue={pageDetailSource?.description ?? ''} rows={4} />
                    </FormField>
                    <Button type="submit" disabled={updatePage.isPending || createPage.isPending}>
                      {createPage.isPending ? 'Creating...' : updatePage.isPending ? 'Saving...' : selectedPage ? 'Save Page' : 'Save & Create Page'}
                    </Button>
                    {!selectedPage && (
                      <p className="text-xs text-muted-foreground">
                        Saving creates a new page for “{selectedEntry.category.name}” at /category/{selectedEntry.category.slug}
                        and activates it immediately.
                      </p>
                    )}
                  </div>
                </form>

                <div className="min-w-0 lg:col-span-2">
                  <Tabs value={tab} onValueChange={(v) => setTab(v as 'design' | 'sections' | 'preview')}>
                    <TabsList className="mb-3">
                      <TabsTrigger value="design">{t('Design Tiles')}</TabsTrigger>
                      <TabsTrigger value="sections">{t('Sections')}</TabsTrigger>
                      <TabsTrigger value="preview">{t('Live Preview')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="design" className="space-y-4">
                      {categoriesSections.length === 0 ? (
                        <div className="rounded-2xl border bg-background p-8">
                          <EmptyState message={selectedPage ? 'This page has no Subcategories section yet. Add one on the Sections tab, then design its tiles here.' : 'Save this page first to design its tiles. The page will show automatic subcategory tiles until then.'} />
                        </div>
                      ) : (
                        categoriesSections.map((s) => (
                          <BrowseSectionDesigner
                            key={`${s.id}-${refreshKey}`}
                            section={s}
                            categories={categories}
                            rootId={pageCategoryId ?? 0}
                            rootName={pageTitle}
                            onSaved={() => {}}
                          />
                        ))
                      )}
                      <PageFlowStrip sections={pageDetailSource?.sections ?? []} />
                    </TabsContent>

                    <TabsContent value="sections">
                      <div className="rounded-2xl border bg-background p-4">
                        {selectedPage ? (
                          <CategoryPageSections pageId={selectedPage.id} />
                        ) : (
                          <EmptyState message="Save this page first to add custom sections. Until then, the default sections (hero, featured, best sellers, brands) are used automatically." />
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="preview">
                      <LiveStorePreview
                        slug={pageSlug}
                        note={`Live view of /category/${pageSlug} — the exact flow this page's tiles produce.`}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create page dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Create a Browse Subcategories Page')}</DialogTitle>
            <DialogDescription>
              {t('Pick a category to build its subcategory flow. You can set it up immediately after creating.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <FormField label={t('Category')}>
              <Select value={createCategory} onValueChange={setCreateCategory}>
                <SelectTrigger><SelectValue placeholder={creatableCategories.length ? 'Select a category' : 'No categories available'} /></SelectTrigger>
                <SelectContent className="max-h-80">
                  {creatableCategories.map((o) => (
                    <SelectItem key={o.category.id} value={String(o.category.id)}>
                      {categoryOptionLabel(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <p className="text-xs text-muted-foreground">
              You can create pages for main categories and their subcategories so every page can have its own curated
              subcategory flow.
            </p>
            {creatableCategories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t('Every category already has a page. Delete one to free its category first.')}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>{t('Cancel')}</Button>
              <Button type="submit" disabled={!createCategory || createPage.isPending}>
                {createPage.isPending ? 'Creating...' : 'Create Page'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete page confirm */}
      {deletingPage && (
        <ConfirmDialog
          open
          onOpenChange={() => setDeletingPage(null)}
          title={t('Delete page?')}
          description={t('"{{title}}" won\'t have a custom subcategory flow anymore. The category falls back to a default page.', { title: deletingPage.title })}
          onConfirm={() => {
            deletePage.mutate(deletingPage.id, { onSuccess: () => setDeletingPage(null) })
          }}
          loading={deletePage.isPending}
          error={deletePage.error?.message ?? null}
        />
      )}
    </div>
  )
}