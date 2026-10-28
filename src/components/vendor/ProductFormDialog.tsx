import { useState } from 'react'
import { assetUrl } from '@/lib/assets'
import {
  AlignLeft,
  Barcode,
  Boxes,
  Building2,
  CircleHelp,
  FileText,
  FolderTree,
  ImageIcon,
  IndianRupee,
  Layers,
  ListChecks,
  MapPin,
  Package,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Type,
  Video as VideoIcon,
  Factory,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { FormField, ImageField, VideoField } from '@/components/common/admin'
import { MultiImageUpload } from '@/components/common/MultiImageUpload'
import { useCategories } from '@/hooks/useCategories'
import { useCollections } from '@/hooks/useCatalog'
import { useCreateVendorProduct, useUpdateVendorProduct } from '@/hooks/useVendor'
import type { Category, Product } from '@/types'
import { specificationsToText } from '@/utils/product'
import { useTranslation } from 'react-i18next'

interface FormImage {
  url: string
  alt_text: string
  is_primary: boolean
}

interface FormVideo {
  url: string
  provider: string
}

interface FormVariant {
  id?: number
  colour: string
  size: string
  extraText: string
  sku: string
  price: string
  mrp: string
  stock: string
  status: 'ACTIVE' | 'INACTIVE'
  images: string[]
}

interface FormFee {
  name: string
  amount: string
}

interface FormFaq {
  question: string
  answer: string
}

const NONE = '__none__'

function attributesToText(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
}

function splitAttributes(attributes: Record<string, string>): {
  colour: string
  size: string
  extraText: string
} {
  let colour = ''
  let size = ''
  const extra: Record<string, string> = {}

  for (const [key, value] of Object.entries(attributes ?? {})) {
    const normalized = key.trim().toLowerCase()
    if (normalized === 'color' || normalized === 'colour') {
      colour = value
    } else if (normalized === 'size') {
      size = value
    } else {
      extra[key] = value
    }
  }

  return { colour, size, extraText: attributesToText(extra) }
}

function mergeAttributes(colour: string, size: string, extraText: string): Record<string, string> {
  const attributes: Record<string, string> = {}

  if (colour.trim()) attributes['Color'] = colour.trim()
  if (size.trim()) attributes['Size'] = size.trim()

  for (const [key, value] of Object.entries(textToAttributes(extraText))) {
    attributes[key] = value
  }

  return attributes
}

function textToAttributes(text: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const [rawKey, ...rest] = line.split(':')
    const key = rawKey?.trim()
    const value = rest.join(':').trim()
    if (key && value) attributes[key] = value
  }
  return attributes
}

function numOrUndefined(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

function variantPrice(v: FormVariant): number | undefined {
  return numOrUndefined(v.price)
}

function childrenOf(categories: Category[], parentId: number | undefined): Category[] {
  if (parentId === undefined) return []
  const parent = categories.find((c) => c.id === parentId)
  return parent?.children ?? []
}

/**
 * Turns a Laravel validation key such as `faqs.0.answer` or `images.1.url`
 * into a short, human-readable label for the error summary.
 */
function humanizeFieldKey(key: string): string {
  const base = key
    .replace(/\.(\d+)\.?/g, ' #$1 ')
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .trim()
  return base.charAt(0).toUpperCase() + base.slice(1)
}

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { t } = useTranslation()
  const { data: categories = [] } = useCategories()
  const { data: collections = [] } = useCollections()
  const createMutation = useCreateVendorProduct()
  const updateMutation = useUpdateVendorProduct()

  // Initialise a fresh draft every time the dialog opens (parent keys/remounts).
  const initialImages: FormImage[] = (product?.images ?? []).map((url, index) => ({
    url,
    alt_text: '',
    is_primary: index === 0,
  }))
  const initialVideos: FormVideo[] = (product?.videos ?? []).map((video) => ({
    url: video.url,
    provider: video.provider,
  }))
  const initialVariants: FormVariant[] = (product?.variants ?? []).map((variant) => {
    const { colour, size, extraText } = splitAttributes(variant.attributes)
    return {
      id: variant.id,
      colour,
      size,
      extraText,
      sku: variant.sku ?? '',
      price: String(variant.price),
      mrp: variant.mrp != null ? String(variant.mrp) : '',
      stock: String(variant.stock),
      status: variant.status,
      images: variant.images ?? [],
    }
  })
  const initialFees: FormFee[] = (product?.fees ?? []).map((fee) => ({
    name: fee.name,
    amount: String(fee.amount),
  }))
  const initialFaqs: FormFaq[] = (product?.faqs ?? []).map((faq) => ({
    question: faq.question,
    answer: faq.answer,
  }))

  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.category_id ? String(product.category_id) : '')
  const [subcategoryId, setSubcategoryId] = useState(
    product?.subcategory_id ? String(product.subcategory_id) : NONE,
  )
  const [collectionIds, setCollectionIds] = useState<number[]>(product?.collection_ids ?? [])
  const [sku, setSku] = useState(product?.sku ?? '')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(
    product?.status ?? 'DRAFT',
  )
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [featured, setFeatured] = useState(product?.featured ?? false)
  const [bestSeller, setBestSeller] = useState(product?.best_seller ?? false)
  const [isReturnable, setIsReturnable] = useState(product?.is_returnable ?? true)
  const [returnDays, setReturnDays] = useState(
    product?.return_days != null ? String(product.return_days) : '7',
  )
  const [returnPolicy, setReturnPolicy] = useState(product?.return_policy ?? '')

  const [price, setPrice] = useState(product?.price != null ? String(product.price) : '')
  const [mrp, setMrp] = useState(product?.mrp != null ? String(product.mrp) : '')
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : '')

  const [shortDescription, setShortDescription] = useState(product?.short_description ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [specifications, setSpecifications] = useState(
    specificationsToText(product?.specifications),
  )
  const [highlights, setHighlights] = useState<string[]>(
    Array.isArray(product?.highlights) ? product.highlights.filter((h): h is string => Boolean(h)) : [],
  )
  const [manufacturerName, setManufacturerName] = useState(
    product?.manufacturer_info?.manufacturer ?? '',
  )
  const [manufacturerAddress, setManufacturerAddress] = useState(
    product?.manufacturer_info?.manufacturer_address ?? '',
  )
  const [packerName, setPackerName] = useState(product?.manufacturer_info?.packer ?? '')
  const [packerAddress, setPackerAddress] = useState(
    product?.manufacturer_info?.packer_address ?? '',
  )
  const [importerName, setImporterName] = useState(product?.manufacturer_info?.importer ?? '')
  const [importerAddress, setImporterAddress] = useState(
    product?.manufacturer_info?.importer_address ?? '',
  )
  const [countryOfOrigin, setCountryOfOrigin] = useState(
    product?.manufacturer_info?.country_of_origin ?? '',
  )

  const [metaTitle, setMetaTitle] = useState(product?.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(product?.meta_description ?? '')
  const [metaKeywords, setMetaKeywords] = useState(product?.meta_keywords ?? '')

  const [images, setImages] = useState<FormImage[]>(initialImages)
  const [videos, setVideos] = useState<FormVideo[]>(initialVideos)
  const [variants, setVariants] = useState<FormVariant[]>(initialVariants)
  const [fees, setFees] = useState<FormFee[]>(initialFees)
  const [faqs, setFaqs] = useState<FormFaq[]>(initialFaqs)

  const isSaving = createMutation.isPending || updateMutation.isPending
  const mutationError = product ? updateMutation.error : createMutation.error
  const fieldErrors =
    (mutationError as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors ?? {}
  const fieldError = (key: string): string | undefined => fieldErrors[key]?.[0]
  const selectedCategory = categoryId ? childrenOf(categories, Number(categoryId)) : []

  const updateImage = (index: number, patch: Partial<FormImage>) => {
    setImages((prev) => {
      const next = prev.map((img, i) => (i === index ? { ...img, ...patch } : img))
      if (patch.is_primary && next[index].is_primary) {
        return next.map((img, i) => (i === index ? img : { ...img, is_primary: false }))
      }
      return next
    })
  }

  const updateHighlight = (index: number, value: string) => {
    setHighlights((prev) => prev.map((h, i) => (i === index ? value : h)))
  }

  const removeHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, patch: Partial<FormVariant>) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  const updateFee = (index: number, patch: Partial<FormFee>) => {
    setFees((prev) => prev.map((fee, i) => (i === index ? { ...fee, ...patch } : fee)))
  }

  const addFee = () => {
    setFees((prev) => [...prev, { name: '', amount: '' }])
  }

  const removeFee = (index: number) => {
    setFees((prev) => prev.filter((_, i) => i !== index))
  }

  const updateFaq = (index: number, patch: Partial<FormFaq>) => {
    setFaqs((prev) => prev.map((faq, i) => (i === index ? { ...faq, ...patch } : faq)))
  }

  const addFaq = () => {
    setFaqs((prev) => [...prev, { question: '', answer: '' }])
  }

  const removeFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const imagePayload = images
      .filter((img) => img.url.trim())
      .map((img, index) => ({
        url: img.url.trim(),
        alt_text: img.alt_text.trim() || null,
        is_primary: img.is_primary,
        sort_order: img.is_primary ? 0 : index,
      }))
    const videoPayload = videos
      .filter((v) => v.url.trim())
      .map((v, index) => ({
        url: v.url.trim(),
        provider: v.provider || 'youtube',
        sort_order: index,
      }))
    const variantPayload = variants
      .filter(
        (v) =>
          v.colour.trim() || v.size.trim() || v.extraText.trim() || v.sku.trim() || variantPrice(v) !== undefined || v.stock.trim(),
      )
      .map((v) => ({
        id: v.id,
        sku: v.sku.trim() || undefined,
        price: variantPrice(v),
        mrp: numOrUndefined(v.mrp),
        stock: numOrUndefined(v.stock),
        status: v.status,
        attributes: mergeAttributes(v.colour, v.size, v.extraText),
        images: v.images.filter((url) => url.trim()),
      }))

    const payload = {
      name: name.trim(),
      category_id: Number(categoryId),
      subcategory_id: subcategoryId === NONE ? null : Number(subcategoryId),
      collection_ids: collectionIds,
      sku: sku.trim() || null,
      status,
      is_active: isActive,
      featured,
      best_seller: bestSeller,
      is_returnable: isReturnable,
      return_days: returnDays ? Math.max(1, Math.min(365, Number(returnDays))) : null,
      return_policy: returnPolicy.trim() || null,
      price: numOrUndefined(price),
      mrp: numOrUndefined(mrp),
      stock: numOrUndefined(stock),
      short_description: shortDescription.trim() || null,
      description: description.trim() || null,
      specifications: specifications.split('\n').map((line) => line.trim()).filter(Boolean),
      highlights: highlights.map((h) => h.trim()).filter(Boolean),
      manufacturer_info:
        manufacturerName.trim() ||
        manufacturerAddress.trim() ||
        packerName.trim() ||
        packerAddress.trim() ||
        importerName.trim() ||
        importerAddress.trim() ||
        countryOfOrigin.trim()
          ? {
              manufacturer: manufacturerName.trim() || undefined,
              manufacturer_address: manufacturerAddress.trim() || undefined,
              packer: packerName.trim() || undefined,
              packer_address: packerAddress.trim() || undefined,
              importer: importerName.trim() || undefined,
              importer_address: importerAddress.trim() || undefined,
              country_of_origin: countryOfOrigin.trim() || undefined,
            }
          : null,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      meta_keywords: metaKeywords.trim() || null,
      images: imagePayload,
      videos: videoPayload,
      variants: variantPayload,
      fees: fees
        .filter((fee) => fee.name.trim() !== '')
        .map((fee) => ({
          name: fee.name.trim(),
          amount: numOrUndefined(fee.amount) ?? 0,
        })),
      faqs: faqs
        .filter((faq) => faq.question.trim() !== '' || faq.answer.trim() !== '')
        .map((faq, index) => ({
          question: faq.question.trim(),
          answer: faq.answer.trim(),
          sort_order: index,
        })),
    }

    if (product) {
      await updateMutation.mutateAsync({ id: product.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  const mutationMessage =
    typeof mutationError === 'object' && mutationError !== null && 'message' in mutationError
      ? String((mutationError as { message: unknown }).message)
      : null

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Update product details. New products require admin approval before going live.'
              : 'Fill in the details to create a product. It will be sent for admin approval.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                {t('Basic details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label={t('Product name')}
                icon={<Type />}
                error={fieldError('name')}
                hint={t('The name shoppers see. Keep it clear and descriptive.')}
              >
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('e.g. Cotton T-Shirt')}
                  required
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label={t('Category')}
                  icon={<FolderTree />}
                  error={fieldError('category_id')}
                >
                  <Select
                    value={categoryId}
                    onValueChange={(v) => {
                      setCategoryId(v)
                      setSubcategoryId(NONE)
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={t('Subcategory')}>
                  <Select
                    value={subcategoryId}
                    onValueChange={(v) => setSubcategoryId(v)}
                    disabled={selectedCategory.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('None')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('None')}</SelectItem>
                      {selectedCategory.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              {collections.length > 0 && (
                <FormField label={t('Collections')}>
                  <div className="grid max-h-44 grid-cols-1 gap-0.5 overflow-y-auto rounded-md border p-1.5 sm:grid-cols-2">
                    {collections.map((collection) => (
                      <label
                        key={collection.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0"
                          checked={collectionIds.includes(collection.id)}
                          onChange={(e) => {
                            setCollectionIds((prev) =>
                              e.target.checked
                                ? [...prev, collection.id]
                                : prev.filter((id) => id !== collection.id),
                            )
                          }}
                        />
                        <span className="truncate">{collection.name}</span>
                      </label>
                    ))}
                  </div>
                </FormField>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label={t('SKU')}
                  icon={<Barcode />}
                  error={fieldError('sku')}
                  hint={t('Your internal product code. Optional for simple products.')}
                >
                  <Input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder={t('e.g. TSHIRT-COTTON-M')}
                  />
                </FormField>
                <FormField label={t('Status')}>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">{t('Draft')}</SelectItem>
                      <SelectItem value="PUBLISHED">{t('Published')}</SelectItem>
                      <SelectItem value="ARCHIVED">{t('Archived')}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  {t('Active')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={featured} onCheckedChange={setFeatured} />
                  {t('Featured')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={bestSeller} onCheckedChange={setBestSeller} />
                  {t('Best seller')}
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                {t('Pricing & stock')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <FormField
                label={t('Price (₹)')}
                icon={<IndianRupee />}
                error={fieldError('price')}
                hint={t('What the customer pays.')}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={t('e.g. 999.00')}
                />
              </FormField>
              <FormField
                label={t('MRP (₹)')}
                icon={<Tag />}
                error={fieldError('mrp')}
                hint={t('Original price, shown struck through when higher.')}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder={t('e.g. 1499.00')}
                />
              </FormField>
              <FormField
                label={t('Stock')}
                icon={<Boxes />}
                error={fieldError('stock')}
                hint={t('Units available to sell.')}
              >
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder={t('e.g. 50')}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                {t('Add-on fees')}
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addFee}>
                <Plus className="mr-1 h-3.5 w-3.5" /> {t('Add fee')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t('Optional one-time charges per product line, e.g. handling or packaging. They are added on top of the price and are not taxed.')}
              </p>
              {fees.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('No add-on fees set for this product.')}</p>
              )}
              {fees.map((fee, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormField label={t('Fee name')}>
                      <Input
                        value={fee.name}
                        onChange={(e) => updateFee(index, { name: e.target.value })}
                        placeholder={t('e.g. Handling charge')}
                        maxLength={191}
                      />
                    </FormField>
                  </div>
                  <div className="w-32">
                    <FormField label={t('Amount (₹)')}>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fee.amount}
                        onChange={(e) => updateFee(index, { amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </FormField>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-1 h-9 w-9 shrink-0"
                    aria-label={t('Remove fee')}
                    onClick={() => removeFee(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {t('Description (Product Details)')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label={t('Short description (Style & Fit Tips)')}
                icon={<AlignLeft />}
                error={fieldError('short_description')}
                hint={t('Shown in the "Style & Fit Tips" section on the product page. A one-line summary also used in listings and search results.')}
              >
                <Input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder={t('e.g. Soft breathable cotton tee for everyday wear.')}
                  maxLength={500}
                />
              </FormField>
              <FormField
                label={t('Full description')}
                icon={<FileText />}
                error={fieldError('description')}
                hint={t('Shown in the "Product Details" section. Describe the material, fit, care instructions and styling.')}
              >
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder={t('Tell shoppers everything they need to know about this product…')}
                />
              </FormField>
              <FormField
                label={t('Specifications (one per line) — Product Details')}
                icon={<ListChecks />}
                error={fieldError('specifications')}
                hint={t('Shown in the "Product Details" section. Each line becomes a row (use "Key: Value", e.g. "Fabric: Cotton").')}
              >
                <Textarea
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  rows={3}
                  placeholder={'Fabric: Cotton\nFit: Regular\nSleeve: Half'}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                {t('Highlights — Product Details')}
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setHighlights((prev) => [...prev, ''])}
              >
                <Plus className="h-3.5 w-3.5" /> {t('Add highlight')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t('Shown in the "Product Details" section as a bulleted list (e.g. "Care instructions: hand wash").')}
              </p>
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={highlight}
                    onChange={(e) => updateHighlight(index, e.target.value)}
                    placeholder={t('e.g. Premium combed cotton fabric')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeHighlight(index)}
                    aria-label={`Remove highlight ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {highlights.length === 0 && (
                <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  {t('No highlights yet — add a few selling points.')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Factory className="h-4 w-4 text-muted-foreground" />
                {t('Manufacturer details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label={t('Manufacturer')}
                  icon={<Building2 />}
                  error={fieldError('manufacturer_info.manufacturer')}
                >
                  <Input
                    value={manufacturerName}
                    onChange={(e) => setManufacturerName(e.target.value)}
                    placeholder={t('e.g. Waplia Textiles Pvt Ltd')}
                  />
                </FormField>
                <FormField
                  label={t('Country of origin')}
                  icon={<MapPin />}
                  error={fieldError('manufacturer_info.country_of_origin')}
                >
                  <Input
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    placeholder={t('e.g. India')}
                  />
                </FormField>
              </div>
              <FormField label={t('Manufacturer address')}>
                <Input
                  value={manufacturerAddress}
                  onChange={(e) => setManufacturerAddress(e.target.value)}
                  placeholder={t('Street, city, pin code')}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('Packer')}>
                  <Input
                    value={packerName}
                    onChange={(e) => setPackerName(e.target.value)}
                    placeholder={t('Packer name')}
                  />
                </FormField>
                <FormField label={t('Importer')}>
                  <Input
                    value={importerName}
                    onChange={(e) => setImporterName(e.target.value)}
                    placeholder={t('Importer name')}
                  />
                </FormField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('Packer address')}>
                  <Input
                    value={packerAddress}
                    onChange={(e) => setPackerAddress(e.target.value)}
                    placeholder={t('Street, city, pin code')}
                  />
                </FormField>
                <FormField label={t('Importer address')}>
                  <Input
                    value={importerAddress}
                    onChange={(e) => setImporterAddress(e.target.value)}
                    placeholder={t('Street, city, pin code')}
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                {t('Returns')}
              </CardTitle>
              <Switch checked={isReturnable} onCheckedChange={setIsReturnable} />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {isReturnable
                  ? 'Customers can request a return after delivery.'
                  : 'This product cannot be returned by customers.'}
              </p>
              {isReturnable ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-1">
                    <FormField
                      label={t('Return window (days)')}
                      icon={<Truck />}
                      error={fieldError('return_days')}
                      hint={t('How many days after delivery a customer can request a return.')}
                    >
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        step="1"
                        value={returnDays}
                        onChange={(e) => setReturnDays(e.target.value)}
                        placeholder="7"
                      />
                    </FormField>
                  </div>
                  <FormField
                    label={t('Return policy (Cancellation, Shipping & Returns)')}
                    icon={<ShieldCheck />}
                    error={fieldError('return_policy')}
                    hint={t('Shown in the "Cancellation, Shipping & Returns" section on the product page.')}
                  >
                    <Textarea
                      value={returnPolicy}
                      onChange={(e) => setReturnPolicy(e.target.value)}
                      rows={3}
                      placeholder={t('Return a product within 7 days of delivery for a full refund…')}
                    />
                  </FormField>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                {t('Images')}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <MultiImageUpload
                  hint={t('Pick several photos at once.')}
                  onUploaded={(url) =>
                    setImages((prev) => [
                      ...prev,
                      { url, alt_text: '', is_primary: prev.length === 0 },
                    ])
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setImages((prev) => [
                      ...prev,
                      { url: '', alt_text: '', is_primary: prev.length === 0 },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  {t('Add image')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {fieldError('images') ? (
                <p className="text-xs text-destructive">{fieldError('images')}</p>
              ) : null}
              {images.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('No images yet. Add a first image to show a primary thumbnail.')}
                </p>
              ) : (
                images.map((img, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-md border p-3">
                    {img.url.trim() ? (
                      <img
                        src={assetUrl(img.url)}
                        alt={img.alt_text || 'product'}
                        className="h-14 w-14 shrink-0 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-md border bg-muted" />
                    )}
                    <div className="flex-1 space-y-2">
                      <ImageField value={img.url} onChange={(next) => updateImage(index, { url: next })} placeholder={t('https://.../image.jpg')} />
                      {fieldError(`images.${index}.url`) ? (
                        <p className="text-xs text-destructive">{fieldError(`images.${index}.url`)}</p>
                      ) : null}
                      <div className="flex items-center gap-3">
                        <Input
                          value={img.alt_text}
                          onChange={(e) => updateImage(index, { alt_text: e.target.value })}
                          placeholder={t('Alt text (describe the image)')}
                          className="flex-1"
                        />
                        <label className="flex shrink-0 items-center gap-1.5 text-sm">
                          <Switch
                            checked={img.is_primary}
                            onCheckedChange={(v) => updateImage(index, { is_primary: v })}
                          />
                          {t('Primary')}
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <VideoIcon className="h-4 w-4 text-muted-foreground" />
                {t('Videos (optional)')}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVideos((prev) => [...prev, { url: '', provider: 'youtube' }])}
              >
                <Plus className="h-4 w-4" />
                {t('Add video')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {videos.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No videos yet.')}</p>
              ) : (
                videos.map((video, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-md border p-3">
                    <div className="flex-1 space-y-2">
                      <VideoField
                        value={video.url}
                        onChange={(next) =>
                          setVideos((prev) =>
                            prev.map((v, i) =>
                              i === index
                                ? {
                                    ...v,
                                    url: next,
                                    provider: next.startsWith('/uploads/') ? 'upload' : v.provider,
                                  }
                                : v,
                            ),
                          )
                        }
                        placeholder={t('https://youtube.com/watch?v=...')}
                      />
                      {fieldError(`videos.${index}.url`) ? (
                        <p className="text-xs text-destructive">{fieldError(`videos.${index}.url`)}</p>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Select
                          value={video.provider}
                          onValueChange={(v) =>
                            setVideos((prev) =>
                              prev.map((x, i) => (i === index ? { ...x, provider: v } : x)),
                            )
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="youtube">{t('YouTube')}</SelectItem>
                            <SelectItem value="vimeo">{t('Vimeo')}</SelectItem>
                            <SelectItem value="upload">{t('Uploaded file')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setVideos((prev) => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-muted-foreground" />
                {t('Variants')}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setVariants((prev) => [
                    ...prev,
                    { colour: '', size: '', extraText: '', sku: '', price: '', mrp: '', stock: '', status: 'ACTIVE', images: [] },
                  ])
                }
              >
                <Plus className="h-4 w-4" />
                {t('Add variant')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('Configure SKU-level variations such as colour and size. Leave empty to sell a simple product.')}
              </p>
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No variants added.')}</p>
              ) : (
                variants.map((variant, index) => (
                  <div key={index} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Variant {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FormField label={t('Colour')}>
                        <Input
                          value={variant.colour}
                          onChange={(e) => updateVariant(index, { colour: e.target.value })}
                          placeholder={t('e.g. Black')}
                        />
                      </FormField>
                      <FormField label={t('Size')}>
                        <Input
                          value={variant.size}
                          onChange={(e) => updateVariant(index, { size: e.target.value })}
                          placeholder={t('e.g. M')}
                        />
                      </FormField>
                    </div>
                    <FormField label={t('Other options (one per line, e.g. Material: Cotton)')}>
                      <Textarea
                        value={variant.extraText}
                        onChange={(e) => updateVariant(index, { extraText: e.target.value })}
                        rows={2}
                      />
                    </FormField>
                    <div className="grid gap-2 sm:grid-cols-5">
                      <Input
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, { sku: e.target.value })}
                        placeholder={t('SKU')}
                        className="sm:col-span-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, { price: e.target.value })}
                        placeholder={t('Price')}
                        className="sm:col-span-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.mrp}
                        onChange={(e) => updateVariant(index, { mrp: e.target.value })}
                        placeholder={t('MRP')}
                        className="sm:col-span-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, { stock: e.target.value })}
                        placeholder={t('Stock')}
                        className="sm:col-span-1"
                      />
                      <Select
                        value={variant.status}
                        onValueChange={(v) =>
                          updateVariant(index, { status: v as 'ACTIVE' | 'INACTIVE' })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">{t('Active')}</SelectItem>
                          <SelectItem value="INACTIVE">{t('Inactive')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(['sku', 'price', 'mrp', 'stock'] as const).map((key) =>
                      fieldError(`variants.${index}.${key}`) ? (
                        <p key={key} className="text-xs text-destructive">
                          {t('Variant')} {index + 1} {key}: {fieldError(`variants.${index}.${key}`)}
                        </p>
                      ) : null,
                    )}
                    <FormField
                      label={
                        variant.colour.trim()
                          ? `Images for "${variant.colour.trim()}" colour`
                          : 'Variant images'
                      }
                    >
                      <div className="space-y-2">
                        {variant.images.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No image set yet — the product photo will be shown until you upload one.
                            Upload the main photo for this colour, then add more for other angles
                            (front, back, side).
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            {variant.images.map((url, imgIndex) => (
                              <div
                                key={imgIndex}
                                className="flex items-center gap-2 rounded-md border p-2"
                              >
                                {url.trim() ? (
                                  <img
                                    src={assetUrl(url)}
                                    alt=""
                                    className="h-12 w-12 shrink-0 rounded-md border object-cover"
                                  />
                                ) : (
                                  <div className="h-12 w-12 shrink-0 rounded-md border bg-muted" />
                                )}
                                <ImageField
                                  value={url}
                                  onChange={(next) =>
                                    updateVariant(index, {
                                      images: variant.images.map((u, i) =>
                                        i === imgIndex ? next : u,
                                      ),
                                    })
                                  }
                                  placeholder={imgIndex === 0 ? 'Main photo' : 'Front, back, side…'}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateVariant(index, {
                                      images: variant.images.filter((_, i) => i !== imgIndex),
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <MultiImageUpload
                            label={t('Upload multiple angles')}
                            onUploaded={(url) =>
                              updateVariant(index, { images: [...variant.images, url] })
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateVariant(index, { images: [...variant.images, ''] })}
                          >
                            <Plus className="h-4 w-4" />
                            {t('Add another angle')}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Add as many photos as you like for this colour — each one shows as a
                          thumbnail on the product page.
                        </p>
                      </div>
                    </FormField>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CircleHelp className="h-4 w-4 text-muted-foreground" />
                {t('Frequently asked questions')}
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                <Plus className="h-4 w-4" />
                {t('Add FAQ')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('Answer the questions shoppers ask most about this product. These appear on the product page.')}
              </p>
              {faqs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('No FAQs yet. Add one to help buyers decide.')}
                </p>
              ) : (
                faqs.map((faq, index) => (
                  <div key={index} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">FAQ {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFaq(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormField
                      label={t('Question')}
                      icon={<CircleHelp />}
                      error={fieldError(`faqs.${index}.question`)}
                    >
                      <Input
                        value={faq.question}
                        onChange={(e) => updateFaq(index, { question: e.target.value })}
                        placeholder={t('e.g. Is this product machine washable?')}
                      />
                    </FormField>
                    <FormField
                      label={t('Answer')}
                      icon={<AlignLeft />}
                      error={fieldError(`faqs.${index}.answer`)}
                    >
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => updateFaq(index, { answer: e.target.value })}
                        rows={2}
                        placeholder={t('e.g. Yes, machine wash cold and tumble dry low.')}
                      />
                    </FormField>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                {t('SEO metadata')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label={t('Meta title')}
                icon={<Search />}
                error={fieldError('meta_title')}
                hint={t('Shown in the browser tab and search results. About 60 characters.')}
              >
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={t('e.g. Buy Cotton T-Shirt Online | Your Store')}
                />
              </FormField>
              <FormField
                label={t('Meta description')}
                icon={<AlignLeft />}
                error={fieldError('meta_description')}
                hint={t('A short summary for search engines. About 155 characters.')}
              >
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  placeholder={t('e.g. Shop our soft, breathable cotton t-shirt with free delivery.')}
                />
              </FormField>
              <FormField
                label={t('Meta keywords')}
                icon={<Tag />}
                error={fieldError('meta_keywords')}
              >
                <Input
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  placeholder={t('e.g. cotton t-shirt, men, casual wear')}
                />
              </FormField>
            </CardContent>
          </Card>

          {Object.keys(fieldErrors).length > 0 ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <p className="font-medium">{t('Please fix the highlighted fields below.')}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {Object.entries(fieldErrors).map(([key, messages]) => (
                  <li key={key}>
                    <span className="font-medium">{humanizeFieldKey(key)}</span>
                    {messages[0] ? `: ${messages[0]}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : mutationMessage ? (
            <p className="text-sm text-destructive">{mutationMessage}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : product ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}