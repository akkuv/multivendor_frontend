import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { assetUrl } from '@/lib/assets'
import { ArrowDown, ArrowUp, Check, Plus, Search, Star, Tag, LayoutGrid, Image, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAdminHomepageSections,
  useCreateAdminHomepageSection,
  useUpdateAdminHomepageSection,
  useDeleteAdminHomepageSection,
  useToggleAdminHomepageSection,
  useReorderAdminHomepageSections,
  useAdminBanners,
  useCreateAdminBanner,
  useUpdateAdminBanner,
  useDeleteAdminBanner,
  useToggleAdminBanner,
  useReorderAdminBanners,
  useAdminTestimonials,
  useCreateAdminTestimonial,
  useUpdateAdminTestimonial,
  useDeleteAdminTestimonial,
  useToggleAdminTestimonial,
  useAdminProducts,
  useAdminCategories,
} from '@/hooks/useAdmin'
import {
  useAdminCategoryPage,
  useCreateAdminCategoryPageSection,
  useDeleteAdminCategoryPageSection,
  useReorderAdminCategoryPageSections,
  useUpdateAdminCategoryPageSection,
} from '@/hooks/useCategoryPages'
import type {
  Category,
  HomeBanner,
  HomeImageBannerContent,
  HomeSectionType,
  HomeSplitCollageContent,
  HomeTextBannerContent,
  HomeVideoBannerContent,
  HomeProductCarouselContent,
  HomeProductCarouselItem,
  HomeInstagramDiariesContent,
  HomeIconInfoItem,
  HomeInstagramDiaryItem,
  HomePersonalizationContent,
  HomeStoreLocationItem,
  HomeStoreLocationsContent,
  HomeTrendingStylesContent,
  HomeVisitStoresContent,
  HomeTrendingStyleItem,
  HomeValueProp,
  HomepageSection,
  Product,
  Testimonial,
} from '@/types'
import {
  ActiveBadge,
  ApiError,
  ConfirmDialog,
  EmptyState,
  FormField,
  ImageField,
  PaginationFooter,
  VideoField,
} from '@/components/common/admin'
import { RichTextEditor } from '@/features/website/pages/admin/components/RichTextEditor'
import { FaqEditor } from '@/features/website/pages/admin/components/FaqEditor'
import { sectionTypeLabel } from '@/features/website/pages/admin/components/SectionTypeBadge'
import { useTranslation } from 'react-i18next'

type Tab = 'sections' | 'banners' | 'testimonials'

const sectionTypeOptions: { value: HomeSectionType; label: string }[] = (
  [
    'HERO',
    'PERSONALIZATION',
    'VALUE_PROPS',
    'MINI_BANNERS',
    'CATEGORIES',
    'BEST_SELLERS',
    'FEATURED_CATEGORIES',
    'EDITORS_PICKS',
    'SPLIT_COLLAGE',
    'IMAGE_BANNER',
    'TEXT_BANNER',
    'VIDEO_BANNER',
    'PRODUCT_CAROUSEL',
    'INSTAGRAM_DIARIES',
    'TRENDING_STYLES',
    'ICON_INFO',
    'VISIT_STORES',
    'STORE_LOCATIONS',
    'TESTIMONIALS',
    'RICH_TEXT',
    'FAQ',
  ] as HomeSectionType[]
).map((value) => ({ value, label: sectionTypeLabel(value) }))

const configSectionTypes: HomeSectionType[] = [
  'VALUE_PROPS',
  'INSTAGRAM_DIARIES',
  'TRENDING_STYLES',
  'ICON_INFO',
  'VISIT_STORES',
]

const productSectionTypes: HomeSectionType[] = [
  'BEST_SELLERS',
]

const simpleSectionTypes: HomeSectionType[] = [
  'CATEGORIES',
  'PERSONALIZATION',
  'MINI_BANNERS',
  'FEATURED_CATEGORIES',
  'EDITORS_PICKS',
  'SPLIT_COLLAGE',
  'IMAGE_BANNER',
  'TEXT_BANNER',
  'VIDEO_BANNER',
  'PRODUCT_CAROUSEL',
  'STORE_LOCATIONS',
  'RICH_TEXT',
  'FAQ',
  ...configSectionTypes,
]

const pageContentSectionTypes: HomeSectionType[] = ['RICH_TEXT', 'FAQ']
const valuePropIconOptions = [
  { value: 'gem', label: 'Gem' },
  { value: 'truck', label: 'Truck' },
  { value: 'shield_check', label: 'Shield Check' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'award', label: 'Award' },
  { value: 'package', label: 'Package' },
  { value: 'quote', label: 'Quote' },
  { value: 'store', label: 'Store' },
  { value: 'tag', label: 'Tag' },
  { value: 'flame', label: 'Flame' },
  { value: 'badge_check', label: 'Badge Check' },
  { value: 'star', label: 'Star' },
  { value: 'check_circle2', label: 'Check Circle' },
  { value: 'video', label: 'Video Call' },
]

const bannerPositions = ['HERO', 'PROMO', 'SIDE', 'BOTTOM']

function emptyImageBanner(): HomeImageBannerContent {
  return { image: '', image_mobile: '', alt: '', link_url: '' }
}

function emptyTextBanner(): HomeTextBannerContent {
  return { image: '', alt: '', description: '', button_text: '', button_url: '' }
}

function emptyVideoBanner(): HomeVideoBannerContent {
  return { video: '', video_mobile: '', poster: '', description: '', button_text: '', button_url: '' }
}

function emptyProductCarousel(): HomeProductCarouselContent {
  return { button_text: '', button_url: '', items: [] }
}

function emptyProductCarouselItem(): HomeProductCarouselItem {
  return { image: '', title: '', price: '', url: '' }
}

function emptyPersonalization(): HomePersonalizationContent {
  return { button_text: '', button_url: '' }
}

function emptyVisitStores(): HomeVisitStoresContent {
  return { eyebrow: '', title: '', description: '', button_text: '', button_url: '' }
}

function emptyStoreLocations(): HomeStoreLocationsContent {
  return { heading: '', items: [] }
}

function emptyStoreLocationItem(): HomeStoreLocationItem {
  return {
    image: '',
    name: '',
    button_text: '',
    button_url: '',
    secondary_button_text: '',
    secondary_button_url: '',
  }
}

/**
 * Item editors hand their parent an updater instead of a finished array.
 * Image/video uploads resolve several renders after the click that started
 * them, so a write built from a captured snapshot would silently drop whatever
 * the admin typed in the meantime (store name, second button, captions, …).
 */
type ListUpdater<T> = (update: (items: T[]) => T[]) => void

function emptySplitCollage(): HomeSplitCollageContent {
  return {
    eyebrow: '',
    heading: '',
    description: '',
    video: '',
    poster: '',
    images: [],
    button_text: '',
    button_url: '',
    media_position: 'left',
  }
}

function emptyInstagramDiaries(): HomeInstagramDiariesContent {
  return {
    heading: '',
    handle: '',
    avatar: '',
    items: [],
    button_text: '',
    button_url: '',
  }
}

function emptyInstagramDiaryItem(): HomeInstagramDiaryItem {
  return {
    image: '',
    video: '',
    poster: '',
    caption: '',
    permalink: '',
    likes: '',
    comments: '',
  }
}

function emptyTrendingStyles(): HomeTrendingStylesContent {
  return {
    heading: 'Trending Styles',
    items: [],
  }
}

function emptyTrendingStyleItem(): HomeTrendingStyleItem {
  return {
    image: '',
    video: '',
    title: '',
    url: '',
  }
}

/* ─────────────────────── Repeater editors for config ─────────────────────── */

function ValuePropsItemsEditor({
  items,
  onChange,
}: {
  items: HomeValueProp[]
  onChange: (items: HomeValueProp[]) => void
}) {
  const { t } = useTranslation()
  const updateItem = (index: number, patch: Partial<HomeValueProp>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Select value={item.icon} onValueChange={(v) => updateItem(index, { icon: v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {valuePropIconOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{t(o.label)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              title={t('Remove item')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Input value={item.title} onChange={(e) => updateItem(index, { title: e.target.value })} placeholder={t('Title e.g. Curated selection')} />
          <Textarea rows={2} value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} placeholder={t('Short description')} />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { icon: 'gem', title: '', description: '' }])}
      >
        <Plus className="h-4 w-4" />
        {t('Add Item')}
      </Button>
    </div>
  )
}

function IconInfoItemsEditor({
  items,
  onChange,
}: {
  items: HomeIconInfoItem[]
  onChange: (items: HomeIconInfoItem[]) => void
}) {
  const { t } = useTranslation()
  const updateItem = (index: number, patch: Partial<HomeIconInfoItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Select value={item.icon} onValueChange={(v) => updateItem(index, { icon: v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {valuePropIconOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{t(o.label)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              title={t('Remove tile')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Input value={item.title} onChange={(e) => updateItem(index, { title: e.target.value })} placeholder={t('Title e.g. Book a video styling session')} />
          <Textarea rows={2} value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} placeholder={t('Short description')} />
          <Input value={item.url} onChange={(e) => updateItem(index, { url: e.target.value })} placeholder="/contact" />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { icon: 'sparkles', title: '', description: '', url: '' }])}
      >
        <Plus className="h-4 w-4" />
        {t('Add Tile')}
      </Button>
    </div>
  )
}

function ImageListEditor({
  values,
  onChange,
  max = 3,
  addLabel = 'Add Image',
}: {
  values: string[]
  onChange: ListUpdater<string>
  max?: number
  addLabel?: string
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      {values.map((value, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <ImageField
              value={value}
              onChange={(next) =>
                onChange((current) => current.map((v, i) => (i === index ? next : v)))
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange((current) => current.filter((_, i) => i !== index))}
            title={t('Remove image')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {values.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange((current) => [...current, ''])}
        >
          <Plus className="h-4 w-4" />
          {t(addLabel)}
        </Button>
      )}
    </div>
  )
}

function InstagramItemsEditor({
  items,
  onChange,
}: {
  items: HomeInstagramDiaryItem[]
  onChange: ListUpdater<HomeInstagramDiaryItem>
}) {
  const { t } = useTranslation()
  const updateItem = (index: number, patch: Partial<HomeInstagramDiaryItem>) => {
    onChange((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('Post')} {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onChange((current) => current.filter((_, i) => i !== index))}
              title={t('Remove post')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label={t('Image / Thumbnail')}>
              <ImageField
                value={item.image}
                onChange={(image) => updateItem(index, { image })}
              />
            </FormField>
            <FormField
              label={t('Video (optional)')}
              hint={t('When set, the post plays as a video in the lightbox.')}
            >
              <VideoField value={item.video} onChange={(video) => updateItem(index, { video })} />
            </FormField>
          </div>
          {item.video && (
            <FormField label={t('Video Poster (optional)')}>
              <ImageField value={item.poster} onChange={(poster) => updateItem(index, { poster })} />
            </FormField>
          )}
          <FormField label={t('Caption (optional)')}>
            <Textarea
              rows={2}
              value={item.caption}
              onChange={(e) => updateItem(index, { caption: e.target.value })}
              placeholder={t('Shown inside the popup dialog.')}
            />
          </FormField>
          <FormField label={t('Post URL (optional)')}>
            <Input
              value={item.permalink}
              onChange={(e) => updateItem(index, { permalink: e.target.value })}
              placeholder="https://instagram.com/p/..."
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('Likes (optional)')}>
              <Input
                value={item.likes}
                onChange={(e) => updateItem(index, { likes: e.target.value })}
                placeholder={t('e.g. 1,204')}
              />
            </FormField>
            <FormField label={t('Comments (optional)')}>
              <Input
                value={item.comments}
                onChange={(e) => updateItem(index, { comments: e.target.value })}
                placeholder={t('e.g. 36')}
              />
            </FormField>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange((current) => [...current, emptyInstagramDiaryItem()])}
      >
        <Plus className="h-4 w-4" />
        {t('Add Post')}
      </Button>
    </div>
  )
}

function ProductCarouselItemsEditor({
  items,
  onChange,
}: {
  items: HomeProductCarouselItem[]
  onChange: ListUpdater<HomeProductCarouselItem>
}) {
  const { t } = useTranslation()
  const updateItem = (index: number, patch: Partial<HomeProductCarouselItem>) => {
    onChange((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('Card')} {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onChange((current) => current.filter((_, i) => i !== index))}
              title={t('Remove card')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <FormField label={t('Product Image')} hint={t('Portrait 5:7 crop, like KALKI’s carousel cards.')}>
            <ImageField value={item.image} onChange={(image) => updateItem(index, { image })} />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label={t('Product Name (optional)')}>
              <Input
                value={item.title}
                onChange={(e) => updateItem(index, { title: e.target.value })}
                placeholder={t('e.g. Off White Bridal Lehenga')}
              />
            </FormField>
            <FormField label={t('Price (optional)')}>
              <Input
                value={item.price}
                onChange={(e) => updateItem(index, { price: e.target.value })}
                placeholder={t('e.g. ₹1,29,999')}
              />
            </FormField>
          </div>
          <FormField label={t('Product Link (optional)')}>
            <Input
              value={item.url}
              onChange={(e) => updateItem(index, { url: e.target.value })}
              placeholder="/product/off-white-bridal-lehenga"
            />
          </FormField>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange((current) => [...current, emptyProductCarouselItem()])}
      >
        <Plus className="h-4 w-4" />
        {t('Add Card')}
      </Button>
    </div>
  )
}

function TrendingStylesItemsEditor({
  items,
  onChange,
}: {
  items: HomeTrendingStyleItem[]
  onChange: ListUpdater<HomeTrendingStyleItem>
}) {
  const { t } = useTranslation()
  const updateItem = (index: number, patch: Partial<HomeTrendingStyleItem>) => {
    onChange((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('Style')} {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onChange((current) => current.filter((_, i) => i !== index))}
              title={t('Remove style')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label={t('Image / Poster')}>
              <ImageField value={item.image} onChange={(image) => updateItem(index, { image })} />
            </FormField>
            <FormField
              label={t('Video (optional)')}
              hint={t('When set, the card plays the video instead of the still image.')}
            >
              <VideoField value={item.video} onChange={(video) => updateItem(index, { video })} />
            </FormField>
          </div>
          <FormField label={t('Product / Style Name')}>
            <Input
              value={item.title}
              onChange={(e) => updateItem(index, { title: e.target.value })}
              placeholder={t('e.g. Zardosi Silk Lehenga')}
            />
          </FormField>
          <FormField label={t('Link URL (optional)')}>
            <Input
              value={item.url}
              onChange={(e) => updateItem(index, { url: e.target.value })}
              placeholder="/product/... or /shop"
            />
          </FormField>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange((current) => [...current, emptyTrendingStyleItem()])}
      >
        <Plus className="h-4 w-4" />
        {t('Add Style')}
      </Button>
    </div>
  )
}

/* ──────────────────────────────── Section Row ─────────────────────────────── */

function SectionRow({
  section,
  index,
  total,
  onEdit,
  onToggle,
  onDelete,
  onMove,
  isPending,
}: {
  section: EditableSection
  index: number
  total: number
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex w-6 justify-center text-muted-foreground">{index + 1}</span>
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{t(sectionTypeOptions.find((o) => o.value === section.type)?.label ?? section.type)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{section.title ?? '—'}</td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <span className="rounded-md border px-2 py-0.5 text-xs font-medium">{section.type}</span>
      </td>
      <td className="px-4 py-3">
        <button type="button" onClick={onToggle} disabled={isPending} title={t('Toggle section')}>
          <ActiveBadge active={section.is_active} />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(-1)} title={t('Move up')}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={index === total - 1} onClick={() => onMove(1)} title={t('Move down')}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>{t('Edit')}</Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>{t('Delete')}</Button>
        </div>
      </td>
    </tr>
  )
}

/* ──────────────────────────────── Banner Row ──────────────────────────────── */

function BannerRow({
  banner,
  index,
  total,
  onEdit,
  onToggle,
  onDelete,
  onMove,
  isPending,
}: {
  banner: HomeBanner
  index: number
  total: number
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex w-6 justify-center text-muted-foreground">{index + 1}</span>
          {banner.image ? (
            <img src={assetUrl(banner.image)} alt={banner.title || ''} className="h-10 w-16 rounded object-cover" />
          ) : (
            <div className="flex h-10 w-16 items-center justify-center rounded bg-muted text-muted-foreground">
              <Image className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{banner.title ?? 'Untitled'}</p>
            {banner.subtitle && <p className="truncate text-xs text-muted-foreground">{banner.subtitle}</p>}
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <span className="rounded-md border px-2 py-0.5 text-xs font-medium">{banner.position}</span>
      </td>
      <td className="px-4 py-3">
        <button type="button" onClick={onToggle} disabled={isPending} title={t('Toggle banner')}>
          <ActiveBadge active={banner.is_active} />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(-1)} title={t('Move up')}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={index === total - 1} onClick={() => onMove(1)} title={t('Move down')}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>{t('Edit')}</Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>{t('Delete')}</Button>
        </div>
      </td>
    </tr>
  )
}

/* ─────────────────────────────── Testimonial Row ───────────────────────────── */

function TestimonialRow({
  testimonial,
  onEdit,
  onToggle,
  onDelete,
  isPending,
}: {
  testimonial: Testimonial
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {testimonial.image && (
            <img src={assetUrl(testimonial.image)} alt="" className="h-10 w-8 rounded object-cover" />
          )}
          {testimonial.author_avatar ? (
            <img src={assetUrl(testimonial.author_avatar)} alt={testimonial.author_name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {testimonial.author_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{testimonial.author_name}</p>
            {testimonial.author_role && (
              <p className="truncate text-xs text-muted-foreground">{testimonial.author_role}</p>
            )}
          </div>
        </div>
      </td>
      <td className="hidden max-w-[280px] truncate px-4 py-3 text-sm text-muted-foreground sm:table-cell">
        {testimonial.content}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < testimonial.rating ? 'fill-amber-500 text-amber-500' : 'text-muted'}`} />
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <button type="button" onClick={onToggle} disabled={isPending} title={t('Toggle testimonial')}>
          <ActiveBadge active={testimonial.is_active} />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>{t('Edit')}</Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>{t('Delete')}</Button>
        </div>
      </td>
    </tr>
  )
}

/* ──────────────────────────────── Mini Banner Items Editor ─────────────────────────────── */

type MiniBannerEditorItem = {
  image: string
  title: string
  subtitle: string
  description: string
  button_text: string
  url: string
}

type HeroSlideEditorItem = {
  image: string
  mobile_image: string
  title: string
  subtitle: string
  button_text: string
  url: string
}

type TestimonialEditorItem = {
  author_name: string
  author_role: string
  author_avatar: string
  image: string
  url: string
  content: string
  rating: string
}

function MiniBannerItemsEditor({
  items,
  onChange,
  itemLabel = 'Banner',
  addLabel = 'Add Mini Banner',
  showExtraFields = true,
}: {
  items: MiniBannerEditorItem[]
  onChange: ListUpdater<MiniBannerEditorItem>
  itemLabel?: string
  addLabel?: string
  showExtraFields?: boolean
}) {
  const addItem = () => {
    onChange((current) => [
      ...current,
      { image: '', title: '', subtitle: '', description: '', button_text: '', url: '' },
    ])
  }

  const updateItem = (index: number, field: keyof MiniBannerEditorItem, value: string) => {
    onChange((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  const removeItem = (index: number) => {
    onChange((current) => current.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="space-y-2 rounded-lg border p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{itemLabel} {idx + 1}</span>
            <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(idx)}>
              Remove
            </Button>
          </div>
          <ImageField
            label="Image"
            value={item.image}
            onChange={(v) => updateItem(idx, 'image', v)}
          />
          <Input
            value={item.url}
            onChange={(e) => updateItem(idx, 'url', e.target.value)}
            placeholder="Link URL (e.g. /collections/blouse)"
          />
          <Input
            value={item.title}
            onChange={(e) => updateItem(idx, 'title', e.target.value)}
            placeholder="Title (optional)"
          />
          <Input
            value={item.subtitle}
            onChange={(e) => updateItem(idx, 'subtitle', e.target.value)}
            placeholder="Subtitle (optional)"
          />
          {showExtraFields && (
            <>
              <Textarea
                value={item.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                placeholder="Description (optional)"
              />
              <Input
                value={item.button_text}
                onChange={(e) => updateItem(idx, 'button_text', e.target.value)}
                placeholder="Button Text (optional, e.g. Shop Now)"
              />
            </>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addItem}>
        {addLabel}
      </Button>
    </div>
  )
}

/* ──────────────────────────────── Hero Slides Editor ──────────────────────────────── */

function HeroSlidesEditor({
  items,
  onChange,
}: {
  items: HeroSlideEditorItem[]
  onChange: ListUpdater<HeroSlideEditorItem>
}) {
  const { t } = useTranslation()

  const addItem = () => {
    onChange((current) => [
      ...current,
      { image: '', mobile_image: '', title: '', subtitle: '', button_text: '', url: '' },
    ])
  }

  const updateItem = (index: number, field: keyof HeroSlideEditorItem, value: string) => {
    onChange((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const removeItem = (index: number) => {
    onChange((current) => current.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('Slide')} {idx + 1}</span>
            <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(idx)}>
              {t('Remove')}
            </Button>
          </div>
          <ImageField
            label={t('Image')}
            value={item.image}
            onChange={(next) => updateItem(idx, 'image', next)}
          />
          <ImageField
            label={t('Mobile Image (optional)')}
            value={item.mobile_image}
            onChange={(next) => updateItem(idx, 'mobile_image', next)}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={item.title}
              onChange={(e) => updateItem(idx, 'title', e.target.value)}
              placeholder={t('Title (e.g. Festive Edit)')}
            />
            <Input
              value={item.subtitle}
              onChange={(e) => updateItem(idx, 'subtitle', e.target.value)}
              placeholder={t('Subtitle (optional)')}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={item.button_text}
              onChange={(e) => updateItem(idx, 'button_text', e.target.value)}
              placeholder={t('Button Text (e.g. Shop Now)')}
            />
            <Input
              value={item.url}
              onChange={(e) => updateItem(idx, 'url', e.target.value)}
              placeholder="/shop"
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
      >
        <Plus className="h-4 w-4" />
        {t('Add Slide')}
      </Button>
    </div>
  )
}

/* ───────────────────────────── Testimonial Items Editor ───────────────────────────── */

function TestimonialsItemsEditor({
  items,
  onChange,
}: {
  items: TestimonialEditorItem[]
  onChange: ListUpdater<TestimonialEditorItem>
}) {
  const { t } = useTranslation()

  const updateItem = (index: number, field: keyof TestimonialEditorItem, value: string) => {
    onChange((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const removeItem = (index: number) => {
    onChange((current) => current.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('Testimonial')} {idx + 1}</span>
            <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(idx)}>
              {t('Remove')}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={item.author_name}
              onChange={(e) => updateItem(idx, 'author_name', e.target.value)}
              placeholder={t('Author Name')}
            />
            <Input
              value={item.author_role}
              onChange={(e) => updateItem(idx, 'author_role', e.target.value)}
              placeholder={t('Author Role (e.g. Regular Customer)')}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <ImageField
              label={t('Customer Photo (optional)')}
              value={item.image}
              onChange={(next) => updateItem(idx, 'image', next)}
            />
            <ImageField
              label={t('Author Avatar (optional)')}
              value={item.author_avatar}
              onChange={(next) => updateItem(idx, 'author_avatar', next)}
            />
          </div>
          <Textarea
            value={item.content}
            onChange={(e) => updateItem(idx, 'content', e.target.value)}
            placeholder={t('Testimonial text')}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              type="number"
              min={1}
              max={5}
              value={item.rating}
              onChange={(e) => updateItem(idx, 'rating', e.target.value)}
              placeholder={t('Rating (1-5)')}
            />
            <Input
              value={item.url}
              onChange={(e) => updateItem(idx, 'url', e.target.value)}
              placeholder={t('Product Link (optional)')}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange((current) => [
            ...current,
            { author_name: '', author_role: '', author_avatar: '', image: '', url: '', content: '', rating: '5' },
          ])
        }
      >
        {t('Add Testimonial')}
      </Button>
    </div>
  )
}

function StoreLocationItemsEditor({
  items,
  onChange,
}: {
  items: HomeStoreLocationItem[]
  onChange: ListUpdater<HomeStoreLocationItem>
}) {
  const { t } = useTranslation()
  const updateItem = (index: number, patch: Partial<HomeStoreLocationItem>) => {
    onChange((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('Store')} {index + 1}</span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onChange((current) => current.filter((_, i) => i !== index))}
            >
              {t('Remove')}
            </Button>
          </div>
          <ImageField
            label={t('Store Image')}
            value={item.image}
            onChange={(v) => updateItem(index, { image: v })}
          />
          <Input
            value={item.name}
            onChange={(e) => updateItem(index, { name: e.target.value })}
            placeholder={t('Store Name (e.g. Waplia Mumbai)')}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={item.button_text}
              onChange={(e) => updateItem(index, { button_text: e.target.value })}
              placeholder={t('Button Text (e.g. Visit Store)')}
            />
            <Input
              value={item.button_url}
              onChange={(e) => updateItem(index, { button_url: e.target.value })}
              placeholder={t('Button Link (e.g. /vendors/1)')}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={item.secondary_button_text}
              onChange={(e) => updateItem(index, { secondary_button_text: e.target.value })}
              placeholder={t('Second Button Text (e.g. View Collection)')}
            />
            <Input
              value={item.secondary_button_url}
              onChange={(e) => updateItem(index, { secondary_button_url: e.target.value })}
              placeholder={t('Second Button Link (e.g. /shop)')}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange((current) => [...current, emptyStoreLocationItem()])}
      >
        {t('Add Store')}
      </Button>
    </div>
  )
}

/* ────────────────────────── Featured Category Cards Editor ────────────────────────── */

type FeaturedCategoryCardDraft = {
  category_id: number | ''
  image: string
  title: string
  subtitle: string
  url: string
}

/** Sentinel for the "no category" choice: these cards are pure art + optional link. */
const NO_CATEGORY = '__none__'

/** A draft card is worth keeping when any field carries the admin's intent. */
function hasFeaturedCardContent(item: FeaturedCategoryCardDraft): boolean {
  return Boolean(item.category_id || item.image || item.title || item.subtitle || item.url)
}

function FeaturedCategoryCardsEditor({
  items,
  onChange,
}: {
  items: FeaturedCategoryCardDraft[]
  onChange: ListUpdater<FeaturedCategoryCardDraft>
}) {
  const { t } = useTranslation()
  const query = useAdminCategories({ per_page: 100, page: 1 })
  const categories = useMemo(() => query.data?.data ?? [], [query.data])

  const update = (index: number, patch: Partial<FeaturedCategoryCardDraft>) => {
    onChange((current) => current.map((card, i) => (i === index ? { ...card, ...patch } : card)))
  }

  const remove = (index: number) => onChange((current) => current.filter((_, i) => i !== index))

  const add = () =>
    onChange((current) => [
      ...current,
      { category_id: '', image: '', title: '', subtitle: '', url: '' },
    ])

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t('No cards yet. Add an image card for everything you want to feature.')}
        </p>
      ) : null}

      {items.map((item, idx) => {
        return (
          <div key={idx} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('Card')} {idx + 1}
              </span>
              <Button type="button" variant="destructive" size="sm" onClick={() => remove(idx)}>
                {t('Remove')}
              </Button>
            </div>

            <Select
              value={item.category_id === '' ? undefined : String(item.category_id)}
              onValueChange={(value) =>
                update(idx, { category_id: value === NO_CATEGORY ? '' : Number(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Category (optional)')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>{t('No category')}</SelectItem>
                {categories.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ImageField
              label={t('Card image')}
              value={item.image}
              onChange={(value) => update(idx, { image: value })}
            />
            {!item.image ? (
              <p className="text-[11px] text-amber-600">
                {t('No image uploaded — this card stays hidden on the storefront.')}
              </p>
            ) : null}

            <Input
              value={item.title}
              onChange={(e) => update(idx, { title: e.target.value })}
              placeholder={t('Title (optional)')}
            />
            <Input
              value={item.subtitle}
              onChange={(e) => update(idx, { subtitle: e.target.value })}
              placeholder={t('Subtitle (optional)')}
            />
            <Input
              value={item.url}
              onChange={(e) => update(idx, { url: e.target.value })}
              placeholder={t('Link URL (optional) — falls back to the category page')}
            />
          </div>
        )
      })}

      <Button type="button" variant="outline" onClick={add}>
        <Plus className="mr-1 h-4 w-4" /> {t('Add category card')}
      </Button>
    </div>
  )
}

/* ───────────────────── Category Tiles Editor (Categories ring) ───────────────────── */

type CategoryTileDraft = {
  category_id: number | ''
  image: string
  title: string
  description: string
  url: string
}

/** A hand-built tile is worth keeping when it carries an image, heading, description or link. */
function hasCategoryTileContent(item: CategoryTileDraft): boolean {
  return Boolean(item.category_id || item.image || item.title || item.description || item.url)
}

function CategoryTilesEditor({
  items,
  onChange,
}: {
  items: CategoryTileDraft[]
  onChange: ListUpdater<CategoryTileDraft>
}) {
  const { t } = useTranslation()
  const query = useAdminCategories({ per_page: 100, page: 1 })
  const categories = useMemo(() => query.data?.data ?? [], [query.data])

  const update = (index: number, patch: Partial<CategoryTileDraft>) => {
    onChange((current) => current.map((tile, i) => (i === index ? { ...tile, ...patch } : tile)))
  }

  const remove = (index: number) => onChange((current) => current.filter((_, i) => i !== index))

  const add = () =>
    onChange((current) => [
      ...current,
      { category_id: '', image: '', title: '', description: '', url: '' },
    ])

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t('No tiles yet. Add a tile with an uploaded image, a heading and a description.')}
        </p>
      ) : null}

      {items.map((item, idx) => (
        <div key={idx} className="space-y-3 rounded-xl border border-input bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t('Tile')} {idx + 1}
            </span>
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(idx)}>
              <Trash2 className="mr-1 h-4 w-4" />
              {t('Remove')}
            </Button>
          </div>

          <ImageField
            label={t('Tile image')}
            value={item.image}
            onChange={(value) => update(idx, { image: value })}
          />
          <Input
            value={item.title}
            onChange={(e) => update(idx, { title: e.target.value })}
            placeholder={t('Title (e.g. Lehenga)')}
          />
          <Textarea
            rows={2}
            value={item.description}
            onChange={(e) => update(idx, { description: e.target.value })}
            placeholder={t('Description (e.g. Hand-embroidered occasion wear)')}
          />
          <Select
            value={item.category_id === '' ? undefined : String(item.category_id)}
            onValueChange={(value) =>
              update(idx, { category_id: value === NO_CATEGORY ? '' : Number(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Link to a category (optional)')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>{t('No category')}</SelectItem>
              {categories.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={item.url}
            onChange={(e) => update(idx, { url: e.target.value })}
            placeholder={t('Custom link (optional, overrides the category link)')}
          />
        </div>
      ))}

      <Button type="button" variant="outline" onClick={add}>
        <Plus className="mr-1 h-4 w-4" /> {t('Add tile')}
      </Button>
    </div>
  )
}

/* ──────────────────────────────── Product Picker ─────────────────────────────── */

function ProductPicker({
  selected,
  onChange,
}: {
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const query = useAdminProducts({ search: debounced || undefined, per_page: 100, page: 1 })
  const byId = useMemo(
    () => new Map((query.data?.data ?? []).map((p) => [p.id, p])),
    [query.data],
  )

  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  return (
    <div className="space-y-3 rounded-xl border border-input bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {selected.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('No products pinned yet — the section fills automatically.')}
          </p>
        ) : (
          <>
            {selected.map((id) => {
              const p = byId.get(id)
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-1 pr-2 text-xs font-medium"
                >
                  {p?.images?.[0] ? (
                    <img src={assetUrl(p.images[0])} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : null}
                  <span className="max-w-[200px] truncate">{p?.name ?? `#${id}`}</span>
                  <button type="button" onClick={() => toggle(id)} aria-label={`Remove product ${id}`}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </span>
              )
            })}
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-medium text-muted-foreground underline hover:text-foreground"
            >
              {t('Clear all')}
            </button>
          </>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search products...')}
          className="pl-8"
        />
      </div>

      <div className="max-h-52 space-y-1 overflow-y-auto">
        {query.isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : query.isError ? (
          <p className="text-sm text-destructive">{t('Failed to load products.')}</p>
        ) : !query.data?.data.length ? (
          <p className="text-sm text-muted-foreground">{t('No products found.')}</p>
        ) : (
          query.data.data.map((p: Product) => (
            <button
              type="button"
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                selected.includes(p.id) ? 'bg-primary/10' : 'hover:bg-muted'
              }`}
            >
              {p.images?.[0] ? (
                <img src={assetUrl(p.images[0])} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
              <span className="flex-1 truncate text-sm">{p.name}</span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  selected.includes(p.id)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input'
                }`}
              >
                {selected.includes(p.id) && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          ))
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {t('Pinned products render in the order you pick them. Leave empty for automatic selection.')}
      </p>
    </div>
  )
}

function CategoryPicker({
  selected,
  onChange,
}: {
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const query = useAdminCategories({ search: debounced || undefined, per_page: 100, page: 1 })
  const items = query.data?.data ?? []
  const byId = useMemo(() => new Map(items.map((c) => [c.id, c])), [items])

  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  return (
    <div className="space-y-3 rounded-xl border border-input bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {selected.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('No categories selected — section fills automatically.')}
          </p>
        ) : (
          <>
            {selected.map((id) => {
              const c = byId.get(id)
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-1 pr-2 text-xs font-medium"
                >
                  {c?.image ? (
                    <img src={assetUrl(c.image)} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : null}
                  <span className="max-w-[200px] truncate">{c?.name ?? `#${id}`}</span>
                  <button type="button" onClick={() => toggle(id)} aria-label={`Remove category ${id}`}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </span>
              )
            })}
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-medium text-muted-foreground underline hover:text-foreground"
            >
              {t('Clear all')}
            </button>
          </>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search categories...')}
          className="pl-8"
        />
      </div>

      <div className="max-h-52 space-y-1 overflow-y-auto">
        {query.isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : query.isError ? (
          <p className="text-sm text-destructive">{t('Failed to load categories.')}</p>
        ) : !items.length ? (
          <p className="text-sm text-muted-foreground">{t('No categories found.')}</p>
        ) : (
          items.map((c: Category) => (
            <button
              type="button"
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                selected.includes(c.id) ? 'bg-primary/10' : 'hover:bg-muted'
              }`}
            >
              {c.image ? (
                <img src={assetUrl(c.image)} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
              <span className="flex-1 truncate text-sm">{c.name}</span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  selected.includes(c.id)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input'
                }`}
              >
                {selected.includes(c.id) && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────── Main Page ───────────────────────────────── */

/** Which table the embedded section editor reads and writes. */
export type SectionApi = 'homepage' | 'category'

/**
 * Fields the section editor touches. Homepage and category-page sections share
 * these columns, so the editor can drive either row type. The homepage type
 * additionally carries `custom_page_id`, which the editor never reads.
 */
export type EditableSection = Omit<HomepageSection, 'custom_page_id'> & { custom_page_id?: number | null }

export function AdminHomeManagerPage({
  pageId,
  heading,
  description,
  hideSharedTabs,
  children,
  sectionApi,
}: {
  pageId?: number
  heading?: string
  description?: string
  /** Embed in another page: drop the banners/testimonials tabs and scoped chrome. */
  hideSharedTabs?: boolean
  /** Extra content rendered under the section list (used by embedded callers). */
  children?: ReactNode
  /**
   * Route section CRUD somewhere other than the homepage tables.
   *
   * Category pages keep their own `category_page_sections` rows, so the
   * embedded editor must post to `/admin/category-pages/{id}/sections`
   * instead of `/admin/homepage-sections`. The editors themselves are
   * unchanged — only the transport differs.
   */
  sectionApi?: SectionApi
} = {}) {
  const { t } = useTranslation()
  const isCustomPage = pageId != null
  const [tab, setTab] = useState<Tab>('sections')

  const homepageSectionsQuery = useAdminHomepageSections(pageId)
  const homepageToggleSection = useToggleAdminHomepageSection()
  const homepageReorderSections = useReorderAdminHomepageSections(pageId)

  const categorySectionsQuery = useAdminCategoryPage(pageId)
  const categoryReorderSections = useReorderAdminCategoryPageSections()

  const isCategoryPage = sectionApi === 'category'
  const sectionsQuery = isCategoryPage ? categorySectionsQuery : homepageSectionsQuery

  /** Uniform reorder entry point; the two hooks take different payload shapes. */
  const reorderSectionList = (ordered: { id: number; is_active?: boolean }[]) => {
    if (isCategoryPage) {
      categoryReorderSections.mutate({ pageId: pageId as number, sections: ordered })
    } else {
      homepageReorderSections.mutate(ordered)
    }
  }

  /** The category-page API has no dedicated toggle route; flip it via update. */
  const toggleSectionActive = (section: EditableSection) => {
    if (isCategoryPage) {
      updateCategorySection.mutate({ id: section.id, data: { is_active: !section.is_active } })
    } else {
      homepageToggleSection.mutate(section.id)
    }
  }

  const [bannerPage, setBannerPage] = useState(1)
  const bannersQuery = useAdminBanners({ page: bannerPage, per_page: 15 })
  const toggleBanner = useToggleAdminBanner()
  const reorderBanners = useReorderAdminBanners()

  const [testimonialPage, setTestimonialPage] = useState(1)
  const testimonialsQuery = useAdminTestimonials({ page: testimonialPage, per_page: 15 })
  const toggleTestimonial = useToggleAdminTestimonial()

  const [editingSection, setEditingSection] = useState<EditableSection | null>(null)
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [sectionType, setSectionType] = useState<HomeSectionType>('BEST_SELLERS')
  const [sectionTitle, setSectionTitle] = useState('')
  const [sectionSubtitle, setSectionSubtitle] = useState('')
  const [sectionLimit, setSectionLimit] = useState('10')
  const [sectionProductIds, setSectionProductIds] = useState<number[]>([])
  const [sectionCategoryId, setSectionCategoryId] = useState('__all__')
  const [sectionCategoryIdsList, setSectionCategoryIdsList] = useState<number[]>([])
  const [miniBannerItems, setMiniBannerItems] = useState<any[]>([])
  const [heroSlideItems, setHeroSlideItems] = useState<HeroSlideEditorItem[]>([])
  const [testimonialItems, setTestimonialItems] = useState<TestimonialEditorItem[]>([])
  const [featuredCategoryItems, setFeaturedCategoryItems] = useState<FeaturedCategoryCardDraft[]>([])
  const [categoryTileItems, setCategoryTileItems] = useState<CategoryTileDraft[]>([])
  const [valuePropsItems, setValuePropsItems] = useState<HomeValueProp[]>([])
  const [richTextHtml, setRichTextHtml] = useState('')
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([])
  const [splitCollageConfig, setSplitCollageConfig] = useState<HomeSplitCollageContent>(emptySplitCollage)
  const [imageBannerConfig, setImageBannerConfig] = useState<HomeImageBannerContent>(emptyImageBanner)
  const [textBannerConfig, setTextBannerConfig] = useState<HomeTextBannerContent>(emptyTextBanner)
  const [videoBannerConfig, setVideoBannerConfig] = useState<HomeVideoBannerContent>(emptyVideoBanner)
  const [productCarouselConfig, setProductCarouselConfig] =
    useState<HomeProductCarouselContent>(emptyProductCarousel)
  const [personalizationConfig, setPersonalizationConfig] = useState<HomePersonalizationContent>(emptyPersonalization)
  const [iconInfoItems, setIconInfoItems] = useState<HomeIconInfoItem[]>([])
  const [visitStoresConfig, setVisitStoresConfig] = useState<HomeVisitStoresContent>(emptyVisitStores)
  const [storeLocationsConfig, setStoreLocationsConfig] = useState<HomeStoreLocationsContent>(emptyStoreLocations)
  const [instagramConfig, setInstagramConfig] = useState<HomeInstagramDiariesContent>(emptyInstagramDiaries)
  const [trendingStylesConfig, setTrendingStylesConfig] = useState<HomeTrendingStylesContent>(emptyTrendingStyles)
  const [deletingSection, setDeletingSection] = useState<EditableSection | null>(null)

  const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null)
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false)
  const [bannerPosition, setBannerPosition] = useState('HERO')
  const [deletingBanner, setDeletingBanner] = useState<HomeBanner | null>(null)

  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false)
  const [deletingTestimonial, setDeletingTestimonial] = useState<Testimonial | null>(null)

  const createSection = useCreateAdminHomepageSection()
  const updateSection = useUpdateAdminHomepageSection()
  const deleteSection = useDeleteAdminHomepageSection()

  const createCategorySection = useCreateAdminCategoryPageSection()
  const updateCategorySection = useUpdateAdminCategoryPageSection()
  const deleteCategorySection = useDeleteAdminCategoryPageSection()

  const createBanner = useCreateAdminBanner()
  const updateBanner = useUpdateAdminBanner()
  const deleteBanner = useDeleteAdminBanner()

  const createTestimonial = useCreateAdminTestimonial()
  const updateTestimonial = useUpdateAdminTestimonial()
  const deleteTestimonial = useDeleteAdminTestimonial()

  const sections: EditableSection[] = isCategoryPage
    ? (categorySectionsQuery.data?.sections ?? [])
    : (homepageSectionsQuery.data ?? [])

  const openCreateSection = () => {
    setEditingSection(null)
    setSectionType('BEST_SELLERS')
    setSectionTitle('')
    setSectionSubtitle('')
    setSectionLimit('10')
    setSectionProductIds([])
    setSectionCategoryId('__all__')
    setSectionCategoryIdsList([])
    setMiniBannerItems([])
    setHeroSlideItems([])
    setTestimonialItems([])
    setFeaturedCategoryItems([])
    setCategoryTileItems([])
    setValuePropsItems([])
    setRichTextHtml('')
    setFaqItems([])
    setSplitCollageConfig(emptySplitCollage())
    setImageBannerConfig(emptyImageBanner())
    setTextBannerConfig(emptyTextBanner())
    setVideoBannerConfig(emptyVideoBanner())
    setProductCarouselConfig(emptyProductCarousel())
    setPersonalizationConfig(emptyPersonalization())
    setIconInfoItems([])
    setVisitStoresConfig(emptyVisitStores())
    setStoreLocationsConfig(emptyStoreLocations())
    setInstagramConfig(emptyInstagramDiaries())
    setTrendingStylesConfig(emptyTrendingStyles())
    setSectionDialogOpen(true)
  }

  const openEditSection = (s: EditableSection) => {
    const config = s.config ?? {}
    setEditingSection(s)
    setSectionType(s.type)
    setSectionTitle(s.title ?? '')
    setSectionSubtitle(s.subtitle ?? '')
    setSectionLimit(String((config.limit as number | undefined) ?? 10))
    setSectionProductIds(
      Array.isArray(config.product_ids)
        ? (config.product_ids as number[]).filter((id) => Number.isInteger(id))
        : [],
    )
    setSectionCategoryId(config.category_id ? String(config.category_id) : '__all__')
    setSectionCategoryIdsList(
      Array.isArray(config.category_ids)
        ? (config.category_ids as number[]).filter((id) => Number.isInteger(id))
        : [],
    )
    setMiniBannerItems(
      Array.isArray(config.items)
        ? (config.items as any[]).map((it) => ({
            image: it.image ? String(it.image) : '',
            title: it.title ? String(it.title) : '',
            subtitle: it.subtitle ? String(it.subtitle) : '',
            description: it.description ? String(it.description) : '',
            button_text: it.button_text ? String(it.button_text) : '',
            url: it.url ? String(it.url) : '',
          }))
        : [],
    )
    setHeroSlideItems(
      Array.isArray(config.items)
        ? (config.items as any[]).map((it) => ({
            image: it.image ? String(it.image) : '',
            mobile_image: it.mobile_image ? String(it.mobile_image) : '',
            title: it.title ? String(it.title) : '',
            subtitle: it.subtitle ? String(it.subtitle) : '',
            button_text: it.button_text ? String(it.button_text) : '',
            url: it.url ? String(it.url) : '',
          }))
        : [],
    )
    setTestimonialItems(
      Array.isArray(config.items)
        ? (config.items as any[]).map((it) => ({
            author_name: it.author_name ? String(it.author_name) : '',
            author_role: it.author_role ? String(it.author_role) : '',
            author_avatar: it.author_avatar ? String(it.author_avatar) : '',
            image: it.image ? String(it.image) : '',
            url: it.url ? String(it.url) : '',
            content: it.content ? String(it.content) : '',
            rating: it.rating != null ? String(it.rating) : '5',
          }))
        : [],
    )
    const configuredItems = Array.isArray(config.items) ? (config.items as any[]) : []
    setFeaturedCategoryItems(
      configuredItems
        .filter((it) => it && (it.image || it.category_id || it.title || it.subtitle || it.url))
        .map((it) => ({
          category_id: it.category_id ? Number(it.category_id) : '',
          image: it.image ? String(it.image) : '',
          title: it.title ? String(it.title) : '',
          subtitle: it.subtitle ? String(it.subtitle) : '',
          url: it.url ? String(it.url) : '',
        })),
    )
    setCategoryTileItems(
      configuredItems
        .filter((it) => it && (it.image || it.category_id || it.title || it.description || it.url))
        .map((it) => ({
          category_id: it.category_id ? Number(it.category_id) : '',
          image: it.image ? String(it.image) : '',
          title: it.title ? String(it.title) : '',
          description: it.description ? String(it.description) : '',
          url: it.url ? String(it.url) : '',
        })),
    )
    setValuePropsItems(
      Array.isArray(config.items)
        ? (config.items as HomeValueProp[]).map((item) => ({
            icon: String(item.icon ?? 'gem'),
            title: String(item.title ?? ''),
            description: String(item.description ?? ''),
          }))
        : [],
    )
    setRichTextHtml(
      typeof config.html === 'string' ? config.html : '',
    )
    setFaqItems(
      Array.isArray(config.items)
        ? (config.items as any[]).map((item) => ({
            question: String(item.question ?? ''),
            answer: String(item.answer ?? ''),
          }))
        : [],
    )
    setSplitCollageConfig({
      eyebrow: String(config.eyebrow ?? ''),
      heading: String(config.heading ?? ''),
      description: String(config.description ?? ''),
      video: String(config.video ?? ''),
      poster: String(config.poster ?? ''),
      images: Array.isArray(config.images) ? (config.images as unknown[]).map((img) => String(img)) : [],
      button_text: String(config.button_text ?? ''),
      button_url: String(config.button_url ?? ''),
      media_position: config.media_position === 'right' ? 'right' : 'left',
    })
    setImageBannerConfig({
      image: String(config.image ?? ''),
      image_mobile: String(config.image_mobile ?? ''),
      alt: String(config.alt ?? ''),
      link_url: String(config.link_url ?? ''),
    })
    setTextBannerConfig({
      image: String(config.image ?? ''),
      alt: String(config.alt ?? ''),
      description: String(config.description ?? ''),
      button_text: String(config.button_text ?? ''),
      button_url: String(config.button_url ?? ''),
    })
    setVideoBannerConfig({
      video: String(config.video ?? ''),
      video_mobile: String(config.video_mobile ?? ''),
      poster: String(config.poster ?? ''),
      description: String(config.description ?? ''),
      button_text: String(config.button_text ?? ''),
      button_url: String(config.button_url ?? ''),
    })
    setProductCarouselConfig({
      button_text: String(config.button_text ?? ''),
      button_url: String(config.button_url ?? ''),
      items: Array.isArray(config.items)
        ? (config.items as Partial<HomeProductCarouselItem>[]).map((item) => ({
            image: String(item.image ?? ''),
            title: String(item.title ?? ''),
            price: String(item.price ?? ''),
            url: String(item.url ?? ''),
          }))
        : [],
    })
    setPersonalizationConfig({
      button_text: String(config.button_text ?? ''),
      button_url: String(config.button_url ?? ''),
    })
    setIconInfoItems(
      Array.isArray(config.items)
        ? (config.items as Partial<HomeIconInfoItem>[]).map((item) => ({
            icon: String(item.icon ?? ''),
            title: String(item.title ?? ''),
            description: String(item.description ?? ''),
            url: String(item.url ?? ''),
          }))
        : [],
    )
    setVisitStoresConfig({
      eyebrow: String(config.eyebrow ?? ''),
      title: String(config.title ?? ''),
      description: String(config.description ?? ''),
      button_text: String(config.button_text ?? ''),
      button_url: String(config.button_url ?? ''),
    })
    setStoreLocationsConfig({
      heading: String(config.heading ?? ''),
      items: Array.isArray(config.items)
        ? (config.items as Partial<HomeStoreLocationItem>[]).map((item) => ({
            image: String(item.image ?? ''),
            name: String(item.name ?? ''),
            button_text: String(item.button_text ?? ''),
            button_url: String(item.button_url ?? ''),
            secondary_button_text: String(item.secondary_button_text ?? ''),
            secondary_button_url: String(item.secondary_button_url ?? ''),
          }))
        : [],
    })
    setInstagramConfig({
      heading: String(config.heading ?? ''),
      handle: String(config.handle ?? ''),
      avatar: String(config.avatar ?? ''),
      items: Array.isArray(config.items)
        ? (config.items as Partial<HomeInstagramDiaryItem>[]).map((item) => ({
            image: String(item.image ?? ''),
            video: String(item.video ?? ''),
            poster: String(item.poster ?? ''),
            caption: String(item.caption ?? ''),
            permalink: String(item.permalink ?? ''),
            likes: String(item.likes ?? ''),
            comments: String(item.comments ?? ''),
          }))
        : [],
      button_text: String(config.button_text ?? ''),
      button_url: String(config.button_url ?? ''),
    })
    setTrendingStylesConfig({
      heading: String(config.heading ?? ''),
      items: Array.isArray(config.items)
        ? (config.items as Partial<HomeTrendingStyleItem>[]).map((item) => ({
            image: String(item.image ?? ''),
            video: String(item.video ?? ''),
            title: String(item.title ?? ''),
            url: String(item.url ?? ''),
          }))
        : [],
    })
    setSectionDialogOpen(true)
  }

  const handleSectionsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const config: Record<string, unknown> = {}
    let title = sectionTitle || null

    if (sectionType === 'VALUE_PROPS') {
      config.items = valuePropsItems.filter((item) => item.title && item.description)
    } else if (sectionType === 'SPLIT_COLLAGE') {
      const cfg = splitCollageConfig
      config.video = cfg.video || null
      config.poster = cfg.poster || null
      config.images = cfg.images.map((image) => image.trim()).filter(Boolean)
      config.eyebrow = cfg.eyebrow || null
      config.heading = cfg.heading || null
      config.description = cfg.description || null
      config.button_text = cfg.button_text || null
      config.button_url = cfg.button_url || null
      config.media_position = cfg.media_position
    } else if (sectionType === 'IMAGE_BANNER') {
      const cfg = imageBannerConfig
      config.image = cfg.image.trim() || null
      config.image_mobile = cfg.image_mobile.trim() || null
      config.alt = cfg.alt.trim() || null
      config.link_url = cfg.link_url.trim() || null
    } else if (sectionType === 'TEXT_BANNER') {
      const cfg = textBannerConfig
      config.image = cfg.image.trim() || null
      config.alt = cfg.alt.trim() || null
      config.description = cfg.description.trim() || null
      config.button_text = cfg.button_text.trim() || null
      config.button_url = cfg.button_url.trim() || null
    } else if (sectionType === 'VIDEO_BANNER') {
      const cfg = videoBannerConfig
      config.video = cfg.video.trim() || null
      config.video_mobile = cfg.video_mobile.trim() || null
      config.poster = cfg.poster.trim() || null
      config.description = cfg.description.trim() || null
      config.button_text = cfg.button_text.trim() || null
      config.button_url = cfg.button_url.trim() || null
    } else if (sectionType === 'PRODUCT_CAROUSEL') {
      const cfg = productCarouselConfig
      config.button_text = cfg.button_text.trim() || null
      config.button_url = cfg.button_url.trim() || null
      config.items = cfg.items
        .filter((item) => item.image.trim() || item.title.trim())
        .map((item) => ({
          image: item.image.trim() || null,
          title: item.title.trim() || null,
          price: item.price.trim() || null,
          url: item.url.trim() || null,
        }))
    } else if (sectionType === 'PERSONALIZATION') {
      const cfg = personalizationConfig
      config.button_text = cfg.button_text.trim() || null
      config.button_url = cfg.button_url.trim() || null
    } else if (sectionType === 'ICON_INFO') {
      config.items = iconInfoItems
        .filter((item) => item.title.trim() || item.description.trim())
        .map((item) => ({
          icon: item.icon.trim() || null,
          title: item.title.trim() || null,
          description: item.description.trim() || null,
          url: item.url.trim() || null,
        }))
    } else if (sectionType === 'VISIT_STORES') {
      const cfg = visitStoresConfig
      config.eyebrow = cfg.eyebrow.trim() || null
      config.title = cfg.title.trim() || null
      config.description = cfg.description.trim() || null
      config.button_text = cfg.button_text.trim() || null
      config.button_url = cfg.button_url.trim() || null
      if (cfg.title) title = cfg.title
    } else if (sectionType === 'STORE_LOCATIONS') {
      const cfg = storeLocationsConfig
      config.heading = cfg.heading.trim() || null
      config.items = cfg.items
        .filter((item) => item.image.trim() || item.name.trim())
        .map((item) => ({
          image: item.image.trim() || null,
          name: item.name.trim() || null,
          button_text: item.button_text.trim() || null,
          button_url: item.button_url.trim() || null,
          secondary_button_text: item.secondary_button_text.trim() || null,
          secondary_button_url: item.secondary_button_url.trim() || null,
        }))
      if (cfg.heading.trim()) title = cfg.heading.trim()
    } else if (sectionType === 'RICH_TEXT') {
      config.html = richTextHtml.trim() || null
      if (!title && richTextHtml) {
        title = null
      }
    } else if (sectionType === 'FAQ') {
      config.items = faqItems
        .map((item) => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
        }))
        .filter((item) => item.question && item.answer)
    } else if (sectionType === 'FEATURED_CATEGORIES') {
      config.items = featuredCategoryItems
        .filter(hasFeaturedCardContent)
        .map((item) => ({
          category_id: item.category_id === '' ? null : item.category_id,
          image: item.image.trim() || null,
          title: item.title.trim() || null,
          subtitle: item.subtitle.trim() || null,
          url: item.url.trim() || null,
        }))
    } else if (sectionType === 'CATEGORIES') {
      // Hand-built tiles own the ring; the category quick-pick below is only a
      // fallback used when the admin has not added any tiles yet.
      const tiles = categoryTileItems
        .filter(hasCategoryTileContent)
        .map((item) => ({
          category_id: item.category_id === '' ? null : item.category_id,
          image: item.image.trim() || null,
          title: item.title.trim() || null,
          description: item.description.trim() || null,
          url: item.url.trim() || null,
        }))
      if (tiles.length > 0) {
        config.items = tiles
      } else if (sectionCategoryIdsList.length) {
        config.category_ids = sectionCategoryIdsList
      }
    } else if (sectionType === 'INSTAGRAM_DIARIES') {
      const cfg = instagramConfig
      config.heading = cfg.heading.trim() || null
      config.handle = cfg.handle.trim() || null
      config.avatar = cfg.avatar.trim() || null
      config.button_text = cfg.button_text.trim() || null
      config.button_url = cfg.button_url.trim() || null
      config.items = cfg.items
        .filter((item) => item.image.trim() || item.video.trim())
        .map((item) => ({
          image: item.image.trim() || null,
          video: item.video.trim() || null,
          poster: item.poster.trim() || null,
          caption: item.caption.trim() || null,
          permalink: item.permalink.trim() || null,
          likes: item.likes.trim() || null,
          comments: item.comments.trim() || null,
        }))
    } else if (sectionType === 'TRENDING_STYLES') {
      const cfg = trendingStylesConfig
      config.heading = cfg.heading.trim() || null
      config.items = cfg.items
        .filter((item) => item.image.trim() || item.video.trim())
        .map((item) => ({
          image: item.image.trim() || null,
          video: item.video.trim() || null,
          title: item.title.trim() || null,
          url: item.url.trim() || null,
        }))
    } else {
      config.limit = Number(sectionLimit || 10)
      if (productSectionTypes.includes(sectionType)) {
        if (sectionCategoryId !== '__all__') config.category_id = Number(sectionCategoryId)
        if (sectionProductIds.length) config.product_ids = sectionProductIds
      }
      if (sectionType === 'EDITORS_PICKS') {
        if (sectionCategoryIdsList.length) config.category_ids = sectionCategoryIdsList
      }
      if (sectionType === 'MINI_BANNERS' || sectionType === 'EDITORS_PICKS') {
        config.items = miniBannerItems
          .filter((it) => it.image || it.title)
          .map((it) => ({
            image: it.image || null,
            title: it.title || null,
            subtitle: it.subtitle === '' ? null : it.subtitle,
            description: it.description === '' ? null : it.description,
            button_text: it.button_text === '' ? null : it.button_text,
            url: it.url === '' ? null : it.url,
          }))
      }
      if (sectionType === 'HERO') {
        // Section-owned slides: each page keeps its own banner images and copy.
        // None added keeps the shared homepage banners as the fallback.
        config.items = heroSlideItems
          .filter((it) => it.image || it.title)
          .map((it) => ({
            image: it.image || null,
            mobile_image: it.mobile_image || null,
            title: it.title || null,
            subtitle: it.subtitle || null,
            button_text: it.button_text || null,
            url: it.url || null,
          }))
      }
      if (sectionType === 'TESTIMONIALS') {
        config.items = testimonialItems
          .filter((it) => it.author_name || it.content)
          .map((it) => ({
            author_name: it.author_name,
            author_role: it.author_role || null,
            author_avatar: it.author_avatar || null,
            image: it.image || null,
            url: it.url || null,
            content: it.content,
            rating: Number(it.rating) || 5,
          }))
      }
    }

    const payload: Partial<HomepageSection> = {
      type: sectionType,
      title,
      subtitle: sectionSubtitle || null,
      config: Object.keys(config).length ? config : null,
    }
    if (editingSection) {
      if (isCategoryPage) {
        await updateCategorySection.mutateAsync({ id: editingSection.id, data: payload })
      } else {
        await updateSection.mutateAsync({ id: editingSection.id, data: payload })
      }
    } else if (isCategoryPage) {
      await createCategorySection.mutateAsync({ pageId: pageId as number, data: payload })
    } else {
      await createSection.mutateAsync({ ...payload, custom_page_id: pageId ?? null, is_active: true })
    }
    setSectionDialogOpen(false)
  }

  const handleMoveSection = (index: number, dir: -1 | 1) => {
    const next = [...sections]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    reorderSectionList(next.map((s) => ({ id: s.id })))
  }

  const openCreateBanner = () => {
    setEditingBanner(null)
    setBannerPosition('HERO')
    setBannerDialogOpen(true)
  }

  const handleMoveBanner = (index: number, dir: -1 | 1) => {
    const list = bannersQuery.data?.data ?? []
    const next = [...list]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    reorderBanners.mutate(next.map((b) => b.id))
  }

  const openEditBanner = (b: HomeBanner) => {
    setEditingBanner(b)
    setBannerPosition(b.position)
    setBannerDialogOpen(true)
  }

  const handleBannersSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload: Partial<HomeBanner> = {
      title: String(form.get('title') || '').trim() || null,
      subtitle: String(form.get('subtitle') || '').trim() || null,
      image: String(form.get('image') || '').trim() || null,
      mobile_image: String(form.get('mobile_image') || '').trim() || null,
      button_text: String(form.get('button_text') || '').trim() || null,
      url: String(form.get('url') || '').trim() || null,
      position: bannerPosition,
      sort_order: Number(form.get('sort_order') || 0),
    }
    if (editingBanner) {
      await updateBanner.mutateAsync({ id: editingBanner.id, data: payload })
    } else {
      await createBanner.mutateAsync({ ...payload, is_active: true })
    }
    setBannerDialogOpen(false)
  }

  const openCreateTestimonial = () => {
    setEditingTestimonial(null)
    setTestimonialDialogOpen(true)
  }

  const openEditTestimonial = (t: Testimonial) => {
    setEditingTestimonial(t)
    setTestimonialDialogOpen(true)
  }

  const handleTestimonialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload: Partial<Testimonial> = {
      author_name: String(form.get('author_name')).trim(),
      author_role: String(form.get('author_role') || '').trim() || null,
      author_avatar: String(form.get('author_avatar') || '').trim() || null,
      image: String(form.get('image') || '').trim() || null,
      url: String(form.get('url') || '').trim() || null,
      content: String(form.get('content')).trim(),
      rating: Number(form.get('rating') || 5),
      sort_order: Number(form.get('sort_order') || 0),
    }
    if (editingTestimonial) {
      await updateTestimonial.mutateAsync({ id: editingTestimonial.id, data: payload })
    } else {
      await createTestimonial.mutateAsync({ ...payload, is_active: true })
    }
    setTestimonialDialogOpen(false)
  }

  const tabs: { value: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { value: 'sections', label: t('Sections'), icon: LayoutGrid },
    ...(isCustomPage || hideSharedTabs
      ? []
      : [
          { value: 'banners' as const, label: t('Banners'), icon: Image },
          { value: 'testimonials' as const, label: t('Testimonials'), icon: Star },
        ]),
  ]

  return (
    <div className="space-y-4">
      {!hideSharedTabs && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{heading ?? t('Homepage Manager')}</h1>
            <p className="text-sm text-muted-foreground">
              {description ?? t('Configure the storefront homepage sections, banners, and testimonials.')}
            </p>
          </div>
          <div className="flex rounded-lg border bg-muted/50 p-1">
            {tabs.map((entry) => (
              <button
                key={entry.value}
                onClick={() => setTab(entry.value)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === entry.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <entry.icon className="h-4 w-4" />
                {t(entry.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Homepage Sections ── */}
      {tab === 'sections' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateSection}>
              <Plus className="h-4 w-4" />
              {t('Add Section')}
            </Button>
          </div>
          {sectionsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : sectionsQuery.error ? (
            <ApiError error={sectionsQuery.error} onRetry={sectionsQuery.refetch} />
          ) : !sections.length ? (
            <EmptyState
              message={
                isCustomPage
                  ? t('No sections yet. Add the first one to start building this page.')
                  : t('No sections configured yet. Add the first one to build your homepage.')
              }
            />
          ) : (
            <div className="rounded-lg border bg-background">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-medium">{t('Order / Type')}</th>
                      <th className="px-4 py-3 font-medium">{t('Title')}</th>
                      <th className="hidden px-4 py-3 font-medium sm:table-cell">{t('Key')}</th>
                      <th className="px-4 py-3 font-medium">{t('Active')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((s, i) => (
                      <SectionRow
                        key={s.id}
                        section={s}
                        index={i}
                        total={sections.length}
                        onEdit={() => openEditSection(s)}
                        onToggle={() => toggleSectionActive(s)}
                        onDelete={() => setDeletingSection(s)}
                        onMove={(dir) => handleMoveSection(i, dir)}
                        isPending={updateCategorySection.isPending || updateSection.isPending || categoryReorderSections.isPending || homepageReorderSections.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {isCustomPage
              ? t('Sections render on this page in the order shown. Use the arrow buttons to reorder.')
              : t('Sections render on the homepage in the order shown. Use the arrow buttons to reorder.')}
          </p>
          {children}
        </div>
      )}

      {/* ── Banners ── */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateBanner}>
              <Plus className="h-4 w-4" />
              {t('Add Banner')}
            </Button>
          </div>
          {bannersQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : bannersQuery.error ? (
            <ApiError error={bannersQuery.error} onRetry={bannersQuery.refetch} />
          ) : !bannersQuery.data?.data.length ? (
            <EmptyState message="No banners yet." />
          ) : (
            <div className="rounded-lg border bg-background">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-medium">{t('Banner')}</th>
                      <th className="hidden px-4 py-3 font-medium md:table-cell">{t('Position')}</th>
                      <th className="px-4 py-3 font-medium">{t('Active')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannersQuery.data?.data.map((b, i) => (
                      <BannerRow
                        key={b.id}
                        banner={b}
                        index={i}
                        total={bannersQuery.data?.data.length ?? 0}
                        onEdit={() => openEditBanner(b)}
                        onToggle={() => toggleBanner.mutate(b.id)}
                        onDelete={() => setDeletingBanner(b)}
                        onMove={(dir) => handleMoveBanner(i, dir)}
                        isPending={toggleBanner.isPending || reorderBanners.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <PaginationFooter data={bannersQuery.data} onPageChange={setBannerPage} />
          <p className="text-xs text-muted-foreground">
            {t('Banners render on the homepage in the order shown. Use the arrow buttons to reorder, or set a specific number in each banner\'s Sort Order.')}
          </p>
        </div>
      )}

      {/* ── Testimonials ── */}
      {tab === 'testimonials' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateTestimonial}>
              <Plus className="h-4 w-4" />
              {t('Add Testimonial')}
            </Button>
          </div>
          {testimonialsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : testimonialsQuery.error ? (
            <ApiError error={testimonialsQuery.error} onRetry={testimonialsQuery.refetch} />
          ) : !testimonialsQuery.data?.data.length ? (
            <EmptyState message="No testimonials yet." />
          ) : (
            <div className="rounded-lg border bg-background">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-medium">{t('Author')}</th>
                      <th className="hidden px-4 py-3 font-medium sm:table-cell">{t('Content')}</th>
                      <th className="px-4 py-3 font-medium">{t('Rating')}</th>
                      <th className="px-4 py-3 font-medium">{t('Active')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testimonialsQuery.data?.data.map((t) => (
                      <TestimonialRow
                        key={t.id}
                        testimonial={t}
                        onEdit={() => openEditTestimonial(t)}
                        onToggle={() => toggleTestimonial.mutate(t.id)}
                        onDelete={() => setDeletingTestimonial(t)}
                        isPending={toggleTestimonial.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <PaginationFooter data={testimonialsQuery.data} onPageChange={setTestimonialPage} />
        </div>
      )}

      {/* ── Section Dialog ── */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent
          className={configSectionTypes.includes(sectionType) || pageContentSectionTypes.includes(sectionType) ? 'max-w-3xl' : 'max-w-lg'}
        >
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
            <DialogDescription>
              {isCustomPage
                ? t('Configure how this section appears on this page.')
                : t('Configure how this section appears on the homepage.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSectionsSubmit} className="flex max-h-[60vh] flex-col overflow-hidden">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <FormField label={t('Section Type')}>
              <Select value={sectionType} onValueChange={(v) => setSectionType(v as HomeSectionType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sectionTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{t(o.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label={t('Title')}
              hint={
                sectionType === 'TEXT_BANNER'
                  ? t('Renders as the banner heading (h2).')
                  : sectionType === 'VIDEO_BANNER'
                    ? t('Renders as the white headline overlaid on the video.')
                    : sectionType === 'PRODUCT_CAROUSEL'
                      ? t('Renders as the cream box heading (24px, centred).')
                      : sectionType === 'PERSONALIZATION'
                      ? t('Renders as the strip text.')
                      : undefined
              }
            >
              <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder={sectionType === 'TEXT_BANNER' ? 'e.g. Shop With A Stylist' : sectionType === 'VIDEO_BANNER' ? "e.g. Because Every Wedding Chapter Deserves A Look Of Its Own" : sectionType === 'PRODUCT_CAROUSEL' ? 'e.g. HANDCRAFTED WITH LOVE' : sectionType === 'PERSONALIZATION' ? 'e.g. Curated pieces, styled to your taste' : configSectionTypes.includes(sectionType) ? 'Auto-filled from the section content' : 'e.g. Best Sellers'} />
            </FormField>
            {sectionType !== 'VIDEO_BANNER' && (
              <FormField label={t('Subtitle')} hint={sectionType === 'TEXT_BANNER' ? t('Renders as the banner subheading (h3), directly under the title.') : sectionType === 'PRODUCT_CAROUSEL' ? t('Renders as the 18px line under the heading. Hidden below 750px, like KALKI.') : sectionType === 'PERSONALIZATION' ? t('Optional second line shown under the strip text.') : undefined}>
                <Input value={sectionSubtitle} onChange={(e) => setSectionSubtitle(e.target.value)} placeholder={t('Optional subtitle')} />
              </FormField>
            )}
            {sectionType === 'PERSONALIZATION' && (
              <FormField
                label={t('Strip Link')}
                hint={t('Label and destination for the strip link. Leave the label empty to hide the link.')}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={personalizationConfig.button_text}
                    onChange={(e) => setPersonalizationConfig({ ...personalizationConfig, button_text: e.target.value })}
                    placeholder={t('e.g. View Your Edit')}
                  />
                  <Input
                    value={personalizationConfig.button_url}
                    onChange={(e) => setPersonalizationConfig({ ...personalizationConfig, button_url: e.target.value })}
                    placeholder="/featured-products"
                  />
                </div>
              </FormField>
            )}
            {!simpleSectionTypes.includes(sectionType) && sectionType !== 'HERO' && (
              <FormField label={t('Limit (number of items)')}>
                <Input type="number" min={1} value={sectionLimit} onChange={(e) => setSectionLimit(e.target.value)} />
              </FormField>
            )}
            {sectionType === 'CATEGORIES' && (
              <FormField
                label={t('Category Tiles')}
                hint={t('Build the ring by hand: upload an image and set a heading and a description for each tile. A tile without an image falls back to a gold monogram. Link a tile to a category to reuse its link and item count, or give it a custom link instead.')}
              >
                <CategoryTilesEditor items={categoryTileItems} onChange={setCategoryTileItems} />
              </FormField>
            )}
            {sectionType === 'CATEGORIES' && (
              <FormField
                label={t('Categories (fallback)')}
                hint={t('Used only when no tiles are added above.')}
              >
                <CategoryPicker selected={sectionCategoryIdsList} onChange={setSectionCategoryIdsList} />
              </FormField>
            )}
            {sectionType === 'FEATURED_CATEGORIES' && (
              <FormField
                label={t('Featured Category Cards')}
                hint={t('Cards are square and clickable. Only cards with an uploaded image appear on the storefront; category, title, caption and link are all optional.')}
              >
                <FeaturedCategoryCardsEditor items={featuredCategoryItems} onChange={setFeaturedCategoryItems} />
              </FormField>
            )}
            {productSectionTypes.includes(sectionType) && (
              <FormField label={t('Pinned Products')}>
                <ProductPicker selected={sectionProductIds} onChange={setSectionProductIds} />
              </FormField>
            )}
            {(sectionType === 'MINI_BANNERS' || sectionType === 'EDITORS_PICKS') && (
              <FormField
                label={sectionType === 'EDITORS_PICKS' ? t("Editor's Picks Banners") : t('Mini Banners')}
                hint={
                  sectionType === 'EDITORS_PICKS'
                    ? t('Upload a banner image and set a link for each card. Text is optional.')
                    : undefined
                }
              >
                <MiniBannerItemsEditor
                  items={miniBannerItems}
                  onChange={setMiniBannerItems}
                  addLabel={sectionType === 'EDITORS_PICKS' ? "Add Editor's Pick" : 'Add Mini Banner'}
                  showExtraFields={sectionType !== 'EDITORS_PICKS'}
                />
              </FormField>
            )}
            {sectionType === 'HERO' && (
              <FormField
                label={t('Hero Slides')}
                hint={
                  isCustomPage
                    ? t('Upload a banner image and set the title, subtitle, button text and link for each slide. These show only on this page.')
                    : t('Upload a banner image and set the title, subtitle, button text and link for each slide. Leave empty to keep using the Banners tab.')
                }
              >
                <HeroSlidesEditor items={heroSlideItems} onChange={setHeroSlideItems} />
              </FormField>
            )}
            {sectionType === 'TESTIMONIALS' && (
              <FormField
                label={t('Testimonials')}
                hint={
                  isCustomPage
                    ? t('Add the reviews shown on this page. These show only on this page.')
                    : t('Add the reviews shown in this section. Leave empty to keep using the Testimonials tab.')
                }
              >
                <TestimonialsItemsEditor items={testimonialItems} onChange={setTestimonialItems} />
              </FormField>
            )}
            {sectionType === 'VALUE_PROPS' && (
              <FormField label={t('Value Props Items')}>
                <ValuePropsItemsEditor items={valuePropsItems} onChange={setValuePropsItems} />
              </FormField>
            )}
            {sectionType === 'ICON_INFO' && (
              <FormField
                label={t('Icon Info Tiles')}
                hint={t('Each tile shows an icon, a title, an optional line of text and an optional link. Tiles without a link render as plain cards.')}
              >
                <IconInfoItemsEditor items={iconInfoItems} onChange={setIconInfoItems} />
              </FormField>
            )}
            {sectionType === 'VISIT_STORES' && (
              <>
                <FormField label={t('Eyebrow / Kicker')}>
                  <Input value={visitStoresConfig.eyebrow} onChange={(e) => setVisitStoresConfig({ ...visitStoresConfig, eyebrow: e.target.value })} placeholder={t('Visit our stores')} />
                </FormField>
                <FormField label={t('Heading')}>
                  <Input value={visitStoresConfig.title} onChange={(e) => setVisitStoresConfig({ ...visitStoresConfig, title: e.target.value })} placeholder={t('Visit us or reach out')} />
                </FormField>
                <FormField label={t('Description')}>
                  <Textarea rows={3} value={visitStoresConfig.description} onChange={(e) => setVisitStoresConfig({ ...visitStoresConfig, description: e.target.value })} placeholder={t('Supporting paragraph')} />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t('Button Text')}>
                    <Input value={visitStoresConfig.button_text} onChange={(e) => setVisitStoresConfig({ ...visitStoresConfig, button_text: e.target.value })} placeholder={t('Contact us')} />
                  </FormField>
                  <FormField label={t('Button URL')}>
                    <Input value={visitStoresConfig.button_url} onChange={(e) => setVisitStoresConfig({ ...visitStoresConfig, button_url: e.target.value })} placeholder="/contact" />
                  </FormField>
                </div>
              </>
            )}
            {sectionType === 'STORE_LOCATIONS' && (
              <>
                <FormField label={t('Heading')} hint={t('Shown above the store cards.')}>
                  <Input value={storeLocationsConfig.heading} onChange={(e) => setStoreLocationsConfig((prev) => ({ ...prev, heading: e.target.value }))} placeholder={t('Visit our Stores')} />
                </FormField>
                <FormField
                  label={t('Store Cards')}
                  hint={t('Each card shows an uploaded image with the store name and up to two link buttons. A card without a button just shows its name; a card without an image is hidden. The first four cards sit in a row and any others appear in a slider on the storefront.')}
                >
                  <StoreLocationItemsEditor
                    items={storeLocationsConfig.items}
                    onChange={(update) =>
                      setStoreLocationsConfig((prev) => ({ ...prev, items: update(prev.items) }))
                    }
                  />
                </FormField>
              </>
            )}
            {sectionType === 'SPLIT_COLLAGE' && (
              <>
                <FormField
                  label={t('Collage Video')}
                  hint={t('Upload an MP4 (or paste a URL). It plays in the tall tile of the collage.')}
                >
                  <VideoField
                    value={splitCollageConfig.video}
                    onChange={(video) => setSplitCollageConfig({ ...splitCollageConfig, video })}
                  />
                </FormField>
                <ImageField
                  label={t('Video Poster (optional)')}
                  value={splitCollageConfig.poster}
                  onChange={(poster) => setSplitCollageConfig({ ...splitCollageConfig, poster })}
                />
                <FormField
                  label={t('Collage Images (up to 3)')}
                  hint={t('First image fills the wide tile, the next two fill the smaller tiles.')}
                >
                  <ImageListEditor
                    values={splitCollageConfig.images}
                    onChange={(update) =>
                      setSplitCollageConfig((prev) => ({ ...prev, images: update(prev.images) }))
                    }
                    max={3}
                    addLabel="Add Collage Image"
                  />
                </FormField>
                <FormField label={t('Eyebrow / Kicker')}>
                  <Input
                    value={splitCollageConfig.eyebrow}
                    onChange={(e) => setSplitCollageConfig({ ...splitCollageConfig, eyebrow: e.target.value })}
                    placeholder={t('THE PERFECT DRAPE, MADE EASY')}
                  />
                </FormField>
                <FormField label={t('Heading')}>
                  <Input
                    value={splitCollageConfig.heading}
                    onChange={(e) => setSplitCollageConfig({ ...splitCollageConfig, heading: e.target.value })}
                    placeholder={t('INSTANT SAREE')}
                  />
                </FormField>
                <FormField label={t('Description')}>
                  <Textarea
                    rows={3}
                    value={splitCollageConfig.description}
                    onChange={(e) => setSplitCollageConfig({ ...splitCollageConfig, description: e.target.value })}
                    placeholder={t('The sarees you love, expertly pre-draped for you.')}
                  />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t('Button Text')}>
                    <Input
                      value={splitCollageConfig.button_text}
                      onChange={(e) => setSplitCollageConfig({ ...splitCollageConfig, button_text: e.target.value })}
                      placeholder={t('PRE-DRAPE NOW')}
                    />
                  </FormField>
                  <FormField label={t('Button URL')}>
                    <Input
                      value={splitCollageConfig.button_url}
                      onChange={(e) => setSplitCollageConfig({ ...splitCollageConfig, button_url: e.target.value })}
                      placeholder="/shop"
                    />
                  </FormField>
                </div>
                <FormField label={t('Media Position')}>
                  <Select
                    value={splitCollageConfig.media_position}
                    onValueChange={(v) =>
                      setSplitCollageConfig({ ...splitCollageConfig, media_position: v as 'left' | 'right' })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">{t('Left')}</SelectItem>
                      <SelectItem value="right">{t('Right')}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </>
            )}
            {sectionType === 'RICH_TEXT' && (
              <RichTextEditor html={richTextHtml} onChange={setRichTextHtml} />
            )}
            {sectionType === 'FAQ' && (
              <FaqEditor items={faqItems} onChange={setFaqItems} />
            )}
            {sectionType === 'IMAGE_BANNER' && (
              <>
                <FormField
                  label={t('Banner Image')}
                  hint={t('Wide banner shown full width. Recommended 1438×540 (the section is hidden until an image is set).')}
                >
                  <ImageField
                    value={imageBannerConfig.image}
                    onChange={(image) => setImageBannerConfig({ ...imageBannerConfig, image })}
                  />
                </FormField>
                <FormField
                  label={t('Mobile Banner Image (optional)')}
                  hint={t('Used on screens under 750px. Falls back to the banner image.')}
                >
                  <ImageField
                    value={imageBannerConfig.image_mobile}
                    onChange={(image_mobile) => setImageBannerConfig({ ...imageBannerConfig, image_mobile })}
                  />
                </FormField>
                <FormField label={t('Alt Text (optional)')}>
                  <Input
                    value={imageBannerConfig.alt}
                    onChange={(e) => setImageBannerConfig({ ...imageBannerConfig, alt: e.target.value })}
                    placeholder={t('Describe the banner for screen readers')}
                  />
                </FormField>
                <FormField
                  label={t('Link URL')}
                  hint={t('The whole section — heading and banner — links here.')}
                >
                  <Input
                    value={imageBannerConfig.link_url}
                    onChange={(e) => setImageBannerConfig({ ...imageBannerConfig, link_url: e.target.value })}
                    placeholder="/collections/bridal"
                  />
                </FormField>
              </>
            )}
            {sectionType === 'VIDEO_BANNER' && (
              <>
                <FormField
                  label={t('Video')}
                  hint={t(
                    'Plays automatically (muted, looping). Recommended: a wide 16:9 MP4 — desktop shows it in a 37.5% cinematic box. The section stays hidden until a video is uploaded.',
                  )}
                >
                  <VideoField
                    value={videoBannerConfig.video}
                    onChange={(video) => setVideoBannerConfig({ ...videoBannerConfig, video })}
                  />
                </FormField>
                <FormField
                  label={t('Mobile Video (optional)')}
                  hint={t(
                    'Portrait clip used on screens under 750px, like Kalki\'s separate mobile video. Leave empty to reuse the main video.',
                  )}
                >
                  <VideoField
                    value={videoBannerConfig.video_mobile}
                    onChange={(video_mobile) => setVideoBannerConfig({ ...videoBannerConfig, video_mobile })}
                  />
                </FormField>
                <ImageField
                  label={t('Poster Image (optional)')}
                  value={videoBannerConfig.poster}
                  onChange={(poster) => setVideoBannerConfig({ ...videoBannerConfig, poster })}
                />
                <FormField
                  label={t('Description')}
                  hint={t('White line shown under the headline, overlaid on the video.')}
                >
                  <Textarea
                    rows={3}
                    value={videoBannerConfig.description}
                    onChange={(e) => setVideoBannerConfig({ ...videoBannerConfig, description: e.target.value })}
                    placeholder={t('Exquisite craftsmanship of premium fabrics, made for moments that matter.')}
                  />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t('Button Text')}>
                    <Input
                      value={videoBannerConfig.button_text}
                      onChange={(e) => setVideoBannerConfig({ ...videoBannerConfig, button_text: e.target.value })}
                      placeholder={t('BOOK YOUR APPOINTMENT')}
                    />
                  </FormField>
                  <FormField label={t('Button URL')}>
                    <Input
                      value={videoBannerConfig.button_url}
                      onChange={(e) => setVideoBannerConfig({ ...videoBannerConfig, button_url: e.target.value })}
                      placeholder="/contact"
                    />
                  </FormField>
                </div>
              </>
            )}
            {sectionType === 'PRODUCT_CAROUSEL' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t('Button Text')} hint={t('Leave empty to hide the button.')}>
                    <Input
                      value={productCarouselConfig.button_text}
                      onChange={(e) => setProductCarouselConfig({ ...productCarouselConfig, button_text: e.target.value })}
                      placeholder="Shop Now"
                    />
                  </FormField>
                  <FormField label={t('Button URL')}>
                    <Input
                      value={productCarouselConfig.button_url}
                      onChange={(e) => setProductCarouselConfig({ ...productCarouselConfig, button_url: e.target.value })}
                      placeholder="/collections/bridal"
                    />
                  </FormField>
                </div>
                <FormField
                  label={t('Cards')}
                  hint={t('Each card is a portrait 5:7 product tile with its own image, name, price and link. Three cards show at a time on desktop and the row scrolls on its own.')}
                >
                  <ProductCarouselItemsEditor
                    items={productCarouselConfig.items}
                    onChange={(update) =>
                      setProductCarouselConfig((prev) => ({ ...prev, items: update(prev.items) }))
                    }
                  />
                </FormField>
              </>
            )}
            {sectionType === 'TEXT_BANNER' && (
              <>
                <FormField
                  label={t('Background Image (optional)')}
                  hint={t('Wide banner behind the text. Recommended 1438×388. Without an image the band uses the dark house gradient.')}
                >
                  <ImageField
                    value={textBannerConfig.image}
                    onChange={(image) => setTextBannerConfig({ ...textBannerConfig, image })}
                  />
                </FormField>
                <FormField label={t('Alt Text (optional)')}>
                  <Input
                    value={textBannerConfig.alt}
                    onChange={(e) => setTextBannerConfig({ ...textBannerConfig, alt: e.target.value })}
                    placeholder={t('Describe the background image for screen readers')}
                  />
                </FormField>
                <FormField label={t('Description')}>
                  <Textarea
                    rows={3}
                    value={textBannerConfig.description}
                    onChange={(e) => setTextBannerConfig({ ...textBannerConfig, description: e.target.value })}
                    placeholder={t('e.g. Our Stylists speak English, Hindi, Gujarati & Marathi')}
                  />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t('Button Text')}>
                    <Input value={textBannerConfig.button_text} onChange={(e) => setTextBannerConfig({ ...textBannerConfig, button_text: e.target.value })} placeholder={t('START CALL NOW')} />
                  </FormField>
                  <FormField label={t('Button URL')}>
                    <Input value={textBannerConfig.button_url} onChange={(e) => setTextBannerConfig({ ...textBannerConfig, button_url: e.target.value })} placeholder="/contact" />
                  </FormField>
                </div>
              </>
            )}
            {sectionType === 'INSTAGRAM_DIARIES' && (
              <>
                <FormField label={t('Heading')}>
                  <Input
                    value={instagramConfig.heading}
                    onChange={(e) => setInstagramConfig({ ...instagramConfig, heading: e.target.value })}
                    placeholder={t('VISIT OUR INSTAGRAM DIARIES')}
                  />
                </FormField>
                <FormField label={t('Handle / Tagline')}>
                  <Input
                    value={instagramConfig.handle}
                    onChange={(e) => setInstagramConfig({ ...instagramConfig, handle: e.target.value })}
                    placeholder={t('Follow To Know More @yourhandle')}
                  />
                </FormField>
                <FormField
                  label={t('Avatar Image (optional)')}
                  hint={t('Small round picture shown beside the handle inside the dialog.')}
                >
                  <ImageField
                    value={instagramConfig.avatar}
                    onChange={(avatar) => setInstagramConfig({ ...instagramConfig, avatar })}
                  />
                </FormField>
                <FormField
                  label={t('Posts')}
                  hint={t('Each post can be an image or a video. Clicking a tile opens a lightbox dialog.')}
                >
                  <InstagramItemsEditor
                    items={instagramConfig.items}
                    onChange={(update) =>
                      setInstagramConfig((prev) => ({ ...prev, items: update(prev.items) }))
                    }
                  />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label={t('Button Text (optional)')}>
                    <Input
                      value={instagramConfig.button_text}
                      onChange={(e) => setInstagramConfig({ ...instagramConfig, button_text: e.target.value })}
                      placeholder={t('Visit Instagram')}
                    />
                  </FormField>
                  <FormField label={t('Button URL (optional)')}>
                    <Input
                      value={instagramConfig.button_url}
                      onChange={(e) => setInstagramConfig({ ...instagramConfig, button_url: e.target.value })}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </FormField>
                </div>
              </>
            )}
            {sectionType === 'TRENDING_STYLES' && (
              <FormField
                label={t('Styles')}
                hint={t('Tall 9:16 cards shown in a horizontal slider. Each card may use an image or a video.')}
              >
                <TrendingStylesItemsEditor
                  items={trendingStylesConfig.items}
                  onChange={(update) =>
                    setTrendingStylesConfig((prev) => ({ ...prev, items: update(prev.items) }))
                  }
                />
              </FormField>
            )}
            </div>
            {(createSection.error || updateSection.error || createCategorySection.error || updateCategorySection.error) && (
              <p className="mt-3 text-sm text-destructive">
                {(createSection.error || updateSection.error || createCategorySection.error || updateCategorySection.error)?.message}
              </p>
            )}
            <DialogFooter className="mt-4 shrink-0">
              <Button
                type="submit"
                disabled={
                  createSection.isPending ||
                  updateSection.isPending ||
                  createCategorySection.isPending ||
                  updateCategorySection.isPending
                }
              >
                {createSection.isPending || updateSection.isPending || createCategorySection.isPending || updateCategorySection.isPending
                  ? 'Saving...'
                  : editingSection
                    ? 'Save Changes'
                    : 'Create Section'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Banner Dialog ── */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
            <DialogDescription>{t('Configure the banner image and link.')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBannersSubmit} className="space-y-4">
            <FormField label={t('Title')}>
              <Input name="title" defaultValue={editingBanner?.title ?? ''} />
            </FormField>
            <FormField label={t('Subtitle')}>
              <Input name="subtitle" defaultValue={editingBanner?.subtitle ?? ''} />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ImageField label={t('Image URL')} name="image" initialValue={editingBanner?.image ?? ''} placeholder={t('https://.../banner.png')} />
              <ImageField label={t('Mobile Image URL')} name="mobile_image" initialValue={editingBanner?.mobile_image ?? ''} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={t('Button Text')}>
                <Input name="button_text" defaultValue={editingBanner?.button_text ?? ''} placeholder={t('Shop Now')} />
              </FormField>
              <FormField label="URL">
                <Input name="url" defaultValue={editingBanner?.url ?? ''} placeholder="/shop" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('Position')}>
                <Select value={bannerPosition} onValueChange={setBannerPosition}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bannerPositions.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label={t('Sort Order')}>
                <Input name="sort_order" type="number" defaultValue={editingBanner?.sort_order ?? 0} />
              </FormField>
            </div>
            {(createBanner.error || updateBanner.error) && (
              <p className="text-sm text-destructive">{(createBanner.error || updateBanner.error)?.message}</p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={createBanner.isPending || updateBanner.isPending}>
                {createBanner.isPending || updateBanner.isPending ? 'Saving...' : editingBanner ? 'Save Changes' : 'Create Banner'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Testimonial Dialog ── */}
      <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
            <DialogDescription>{t('Add or update a customer testimonial.')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTestimonialsSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={t('Author Name')}>
                <Input name="author_name" required defaultValue={editingTestimonial?.author_name ?? ''} />
              </FormField>
              <FormField label={t('Author Role')}>
                <Input name="author_role" defaultValue={editingTestimonial?.author_role ?? ''} placeholder={t('Regular Customer')} />
              </FormField>
            </div>
            <ImageField label={t('Customer Photo (optional)')} name="image" initialValue={editingTestimonial?.image ?? ''} />
            <ImageField label={t('Author Avatar URL')} name="author_avatar" initialValue={editingTestimonial?.author_avatar ?? ''} />
            <FormField label={t('Product Link (optional)')}>
              <Input name="url" defaultValue={editingTestimonial?.url ?? ''} placeholder={t('/shop/product-name')} />
            </FormField>
            <FormField label={t('Content')}>
              <Textarea name="content" required defaultValue={editingTestimonial?.content ?? ''} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('Rating (1-5)')}>
                <Input name="rating" type="number" min={1} max={5} defaultValue={editingTestimonial?.rating ?? 5} />
              </FormField>
              <FormField label={t('Sort Order')}>
                <Input name="sort_order" type="number" defaultValue={editingTestimonial?.sort_order ?? 0} />
              </FormField>
            </div>
            {(createTestimonial.error || updateTestimonial.error) && (
              <p className="text-sm text-destructive">{(createTestimonial.error || updateTestimonial.error)?.message}</p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={createTestimonial.isPending || updateTestimonial.isPending}>
                {createTestimonial.isPending || updateTestimonial.isPending ? 'Saving...' : editingTestimonial ? 'Save Changes' : 'Create Testimonial'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmations ── */}
      <ConfirmDialog
        open={deletingSection !== null}
        onOpenChange={(open) => !open && setDeletingSection(null)}
        title={t('Delete Section')}
        description={`Delete the ${deletingSection?.type ?? ''} section? This cannot be undone.`}
        onConfirm={async () => {
          if (!deletingSection) return
          try {
            if (isCategoryPage) {
              await deleteCategorySection.mutateAsync(deletingSection.id)
            } else {
              await deleteSection.mutateAsync(deletingSection.id)
            }
            setDeletingSection(null)
          } catch { /* keep open to show error */ }
        }}
        loading={deleteSection.isPending || deleteCategorySection.isPending}
        error={(deleteSection.error ?? deleteCategorySection.error)?.message ?? null}
      />
      <ConfirmDialog
        open={deletingBanner !== null}
        onOpenChange={(open) => !open && setDeletingBanner(null)}
        title={t('Delete Banner')}
        description={`Delete "${deletingBanner?.title ?? 'this banner'}"? This cannot be undone.`}
        onConfirm={async () => {
          if (!deletingBanner) return
          try {
            await deleteBanner.mutateAsync(deletingBanner.id)
            setDeletingBanner(null)
          } catch { /* keep open */ }
        }}
        loading={deleteBanner.isPending}
        error={deleteBanner.error?.message ?? null}
      />
      <ConfirmDialog
        open={deletingTestimonial !== null}
        onOpenChange={(open) => !open && setDeletingTestimonial(null)}
        title={t('Delete Testimonial')}
        description={`Delete testimonial from "${deletingTestimonial?.author_name}"? This cannot be undone.`}
        onConfirm={async () => {
          if (!deletingTestimonial) return
          try {
            await deleteTestimonial.mutateAsync(deletingTestimonial.id)
            setDeletingTestimonial(null)
          } catch { /* keep open */ }
        }}
        loading={deleteTestimonial.isPending}
        error={deleteTestimonial.error?.message ?? null}
      />
    </div>
  )
}
