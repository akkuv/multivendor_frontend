import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  AtSign,
  CheckCircle2,
  Link2,
  Menu,
  PanelBottom,
  Phone,
  Plus,
  Save,
  Share2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FooterSocialBlock, SOCIAL_CATALOG, socialPlatform } from '@/components/layout/SocialLinks'
import { useAdminWebsiteSettings, useUpdateWebsiteSettings } from '@/hooks/useWebsite'
import { useCategories } from '@/hooks/useCategories'
import { ApiError } from '@/components/common/admin'
import { ImageField } from '@/components/common/admin'
import type { Category, FooterSettings, MailSettings, NavLinkConfig, NavLinkDepartments, NavbarSettings } from '@/types'
import { useTranslation } from 'react-i18next'

/** Defaults for a per-navigation-link departments bar override. */
const emptyLinkDepartments: NavLinkDepartments = {
  enabled: true,
  category_ids: null,
  show_all: true,
  show_shop_all: true,
  show_collections: true,
}

function LinkEditorRow({
  link,
  index,
  total,
  categories,
  onChange,
  onMove,
  onRemove,
}: {
  link: NavLinkConfig
  index: number
  total: number
  categories: Category[]
  onChange: (patch: Partial<NavLinkConfig>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const scope = link.departments ?? null
  const selectedIds = scope?.category_ids ?? null
  const isCategorySelected = (id: number) => (selectedIds ? selectedIds.includes(id) : true)

  const toggleCategory = (id: number) => {
    const base = selectedIds ?? categories.map((c) => c.id)
    const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
    onChange({ departments: { ...(scope ?? emptyLinkDepartments), category_ids: next } })
  }

  const patchScope = (patch: Partial<NavLinkDepartments>) => {
    onChange({ departments: { ...(scope ?? emptyLinkDepartments), ...patch } })
  }

  return (
    <div className="space-y-2 rounded-lg border p-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-32 flex-1">
          <Label className="text-xs">{t('Label')}</Label>
          <Input
            value={link.label}
            placeholder={t('e.g. Home')}
            onChange={(e) => onChange({ label: e.target.value })}
          />
        </div>
        <div className="min-w-40 flex-[2]">
          <Label className="text-xs">{t('URL')}</Label>
          <Input
            value={link.url}
            placeholder={t('e.g. /shop')}
            onChange={(e) => onChange({ url: e.target.value })}
          />
        </div>
        <label className="flex h-9 items-center gap-2 text-sm">
          <Switch checked={link.new_tab ?? false} onCheckedChange={(v) => onChange({ new_tab: v })} />
          {t('New tab')}
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? t('Hide departments bar') : t('Departments bar')}
        </Button>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(-1)} title={t('Move up')}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={index === total - 1} onClick={() => onMove(1)} title={t('Move down')}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={onRemove} title={t('Remove')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 rounded-md border border-dashed bg-muted/30 p-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={scope?.enabled ?? false}
              onCheckedChange={(v) =>
                onChange({ departments: v ? { ...emptyLinkDepartments, enabled: true } : null })
              }
            />
            {t('Use a separate departments bar for this page')}
          </label>

          {scope && (
            <>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={scope.show_all} onCheckedChange={(v) => patchScope({ show_all: v })} />
                  {t('Show "All Categories" dropdown')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={scope.show_shop_all} onCheckedChange={(v) => patchScope({ show_shop_all: v })} />
                  {t('Show "Shop All" link')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={scope.show_collections} onCheckedChange={(v) => patchScope({ show_collections: v })} />
                  {t('Show "Collections" link')}
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('Categories shown for this page')}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => patchScope({ category_ids: null })}
                  >
                    {t('Reset to all categories')}
                  </Button>
                </div>
                {scope.category_ids == null && (
                  <p className="text-xs text-muted-foreground">
                    {t('Showing all top-level categories automatically (including any new ones).')}
                  </p>
                )}
                <div className="max-h-48 space-y-0.5 overflow-y-auto rounded-lg border p-2">
                  {categories.length === 0 ? (
                    <p className="px-2 py-3 text-center text-sm text-muted-foreground">{t('No categories yet.')}</p>
                  ) : (
                    categories.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={isCategorySelected(c.id)}
                          onChange={() => toggleCategory(c.id)}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        {c.name}
                        {c.children_count != null && c.children_count > 0 && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {c.children_count} sub
                          </span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: typeof Link2; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border bg-background p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  )
}

export function AdminWebsiteSettingsPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = useAdminWebsiteSettings()
  const update = useUpdateWebsiteSettings()
  const { data: categoryData } = useCategories()

  const [navbar, setNavbar] = useState<NavbarSettings | null>(null)
  const [footer, setFooter] = useState<FooterSettings | null>(null)
  const [mail, setMail] = useState<MailSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (data) {
      setNavbar((prev) => prev ?? data.navbar)
      setFooter((prev) => prev ?? data.footer)
      setMail((prev) => prev ?? data.mail ?? null)
    }
  }, [data])

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(t)
  }, [saved])

  const handleSave = async () => {
    if (!navbar || !footer) return
    setSaveError(null)
    try {
      await update.mutateAsync({ navbar, footer, mail: mail ?? undefined })
      setSaved(true)
    } catch (error) {
      setSaveError((error as { message?: string }).message ?? 'Failed to save settings. Please try again.')
    }
  }

  /* ── Navbar helpers ── */

  const patchNavbar = (patch: Partial<NavbarSettings>) => setNavbar((prev) => (prev ? { ...prev, ...patch } : prev))

  const patchAnnouncement = (patch: Partial<NavbarSettings['announcement']>) =>
    setNavbar((prev) => (prev ? { ...prev, announcement: { ...prev.announcement, ...patch } } : prev))

  const navLinks = navbar?.links ?? []

  const updateNavLink = (i: number, patch: Partial<NavLinkConfig>) =>
    setNavbar((prev) =>
      prev ? { ...prev, links: prev.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) } : prev,
    )

  const moveNavLink = (i: number, dir: -1 | 1) =>
    setNavbar((prev) => {
      if (!prev) return prev
      const next = [...prev.links]
      const target = i + dir
      if (target < 0 || target >= next.length) return prev
      const [moved] = next.splice(i, 1)
      next.splice(target, 0, moved)
      return { ...prev, links: next }
    })

  const removeNavLink = (i: number) =>
    setNavbar((prev) => (prev ? { ...prev, links: prev.links.filter((_, idx) => idx !== i) } : prev))

  /* ── Departments helpers ── */

  const categories = categoryData ?? []
  const departments = navbar?.departments

  const patchDepartments = (patch: Partial<NavbarSettings['departments']>) =>
    setNavbar((prev) =>
      prev ? { ...prev, departments: { ...prev.departments, ...patch } } : prev,
    )

  const isCategorySelected = (id: number) =>
    departments?.category_ids ? departments.category_ids.includes(id) : true

  const toggleCategory = (id: number) =>
    setNavbar((prev) => {
      if (!prev) return prev
      const current = prev.departments.category_ids
      const base = current ?? categories.map((c) => c.id)
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
      return { ...prev, departments: { ...prev.departments, category_ids: next } }
    })

  /* ── Footer helpers ── */

  const patchFooter = (patch: Partial<FooterSettings>) => setFooter((prev) => (prev ? { ...prev, ...patch } : prev))

  const updateColumn = (ci: number, patch: Partial<FooterSettings['columns'][number]>) =>
    setFooter((prev) =>
      prev ? { ...prev, columns: prev.columns.map((c, idx) => (idx === ci ? { ...c, ...patch } : c)) } : prev,
    )

  const moveColumn = (ci: number, dir: -1 | 1) =>
    setFooter((prev) => {
      if (!prev) return prev
      const next = [...prev.columns]
      const target = ci + dir
      if (target < 0 || target >= next.length) return prev
      const [moved] = next.splice(ci, 1)
      next.splice(target, 0, moved)
      return { ...prev, columns: next }
    })

  const removeColumn = (ci: number) =>
    setFooter((prev) => (prev ? { ...prev, columns: prev.columns.filter((_, idx) => idx !== ci) } : prev))

  const updateColumnLink = (ci: number, li: number, patch: Partial<NavLinkConfig>) =>
    setFooter((prev) =>
      prev
        ? {
            ...prev,
            columns: prev.columns.map((c, idx) =>
              idx === ci ? { ...c, links: c.links.map((l, li2) => (li2 === li ? { ...l, ...patch } : l)) } : c,
            ),
          }
        : prev,
    )

  const moveColumnLink = (ci: number, li: number, dir: -1 | 1) =>
    setFooter((prev) => {
      if (!prev) return prev
      const col = prev.columns[ci]
      const links = [...col.links]
      const target = li + dir
      if (target < 0 || target >= links.length) return prev
      const [moved] = links.splice(li, 1)
      links.splice(target, 0, moved)
      return { ...prev, columns: prev.columns.map((c, idx) => (idx === ci ? { ...c, links } : c)) }
    })

  const removeColumnLink = (ci: number, li: number) =>
    setFooter((prev) =>
      prev
        ? {
            ...prev,
            columns: prev.columns.map((c, idx) => (idx === ci ? { ...c, links: c.links.filter((_, li2) => li2 !== li) } : c)),
          }
        : prev,
    )

  const patchSocial = (patch: Partial<FooterSettings['social']>) =>
    setFooter((prev) => (prev ? { ...prev, social: { ...prev.social, ...patch } } : prev))

  const patchSocialLink = (i: number, patch: Partial<FooterSettings['social']['links'][number]>) =>
    setFooter((prev) =>
      prev
        ? {
            ...prev,
            social: { ...prev.social, links: prev.social.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) },
          }
        : prev,
    )

  const moveSocialLink = (i: number, dir: -1 | 1) =>
    setFooter((prev) => {
      if (!prev) return prev
      const links = [...prev.social.links]
      const target = i + dir
      if (target < 0 || target >= links.length) return prev
      const [moved] = links.splice(i, 1)
      links.splice(target, 0, moved)
      return { ...prev, social: { ...prev.social, links } }
    })

  const removeSocialLink = (i: number) =>
    setFooter((prev) =>
      prev ? { ...prev, social: { ...prev.social, links: prev.social.links.filter((_, idx) => idx !== i) } } : prev,
    )

  const addSocialLink = () =>
    setFooter((prev) =>
      prev
        ? {
            ...prev,
            social: {
              ...prev.social,
              links: [...prev.social.links, { platform: SOCIAL_CATALOG[0].slug, url: '', label: '', enabled: true }],
            },
          }
        : prev,
    )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error) return <ApiError error={error} onRetry={() => refetch()} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('Website Settings')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('Control the storefront navbar and footer. Changes apply instantly across the site.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> {t('Saved')}
            </span>
          )}
          {saveError ? (
            <span className="text-sm font-medium text-destructive" role="alert">
              {saveError}
            </span>
          ) : null}
          <Button onClick={handleSave} disabled={update.isPending || !navbar || !footer}>
            <Save className="mr-1.5 h-4 w-4" />
            {update.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="navbar">
        <TabsList>
          <TabsTrigger value="navbar">
            <Menu className="mr-1.5 h-4 w-4" /> {t('Navbar')}
          </TabsTrigger>
          <TabsTrigger value="footer">
            <PanelBottom className="mr-1.5 h-4 w-4" /> {t('Footer')}
          </TabsTrigger>
          <TabsTrigger value="mail">
            <AtSign className="mr-1.5 h-4 w-4" /> {t('Mail')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="navbar" className="space-y-4">
          <Section icon={Menu} title={t('Announcement Bar')}>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={navbar?.announcement.enabled ?? false}
                onCheckedChange={(v) => patchAnnouncement({ enabled: v })}
              />
              {t('Show announcement bar')}
            </label>
            {navbar?.announcement.enabled && !navbar?.announcement.text ? (
              <p className="text-xs text-muted-foreground">
                {t('The bar appears on the site only after you add announcement text below.')}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">{t('Announcement text')}</Label>
                <Input
                  value={navbar?.announcement.text ?? ''}
                  placeholder={t('e.g. Free shipping on orders over ₹499')}
                  onChange={(e) => patchAnnouncement({ text: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">{t('Link (optional)')}</Label>
                <Input
                  value={navbar?.announcement.url ?? ''}
                  placeholder={t('e.g. /shop')}
                  onChange={(e) => patchAnnouncement({ url: e.target.value || null })}
                />
              </div>
            </div>
          </Section>

          <Section icon={Link2} title={t('Logo')}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-xs">{t('Logo text')}</Label>
                <Input
                  value={navbar?.logo.text ?? ''}
                  placeholder={t('e.g. Waplia')}
                  onChange={(e) => patchNavbar({ logo: { ...navbar!.logo, text: e.target.value } })}
                />
              </div>
              <div>
                <ImageField
                  label={t('Logo image URL (optional)')}
                  value={navbar?.logo.image ?? ''}
                  onChange={(v) => patchNavbar({ logo: { ...navbar!.logo, image: v || null } })}
                  placeholder={t('https://...logo.png')}
                />
              </div>
              <div>
                <Label className="text-xs">{t('Logo link')}</Label>
                <Input
                  value={navbar?.logo.url ?? '/'}
                  placeholder="/"
                  onChange={(e) => patchNavbar({ logo: { ...navbar!.logo, url: e.target.value } })}
                />
              </div>
            </div>
          </Section>

          <Section icon={Link2} title={t('Navigation Links')}>
            <div className="space-y-2">
              {navLinks.map((link, i) => (
                <LinkEditorRow
                  key={i}
                  link={link}
                  index={i}
                  total={navLinks.length}
                  categories={categories}
                  onChange={(patch) => updateNavLink(i, patch)}
                  onMove={(dir) => moveNavLink(i, dir)}
                  onRemove={() => removeNavLink(i)}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNavbar((prev) => (prev ? { ...prev, links: [...prev.links, { label: '', url: '/', new_tab: false }] } : prev))}
            >
              <Plus className="mr-1.5 h-4 w-4" /> {t('Add Link')}
            </Button>
          </Section>

          <Section icon={Menu} title={t('Departments Bar')}>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={departments?.enabled ?? true}
                  onCheckedChange={(v) => patchDepartments({ enabled: v })}
                />
                {t('Show the categories bar on the storefront')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={departments?.show_all ?? true}
                  onCheckedChange={(v) => patchDepartments({ show_all: v })}
                />
                {t('Show "All Categories" dropdown')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={departments?.show_shop_all ?? true}
                  onCheckedChange={(v) => patchDepartments({ show_shop_all: v })}
                />
                {t('Show "Shop All" link')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={departments?.show_collections ?? true}
                  onCheckedChange={(v) => patchDepartments({ show_collections: v })}
                />
                {t('Show "Collections" link')}
              </label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('Categories shown in the navbar')}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => patchDepartments({ category_ids: null })}
                >
                  {t('Reset to all categories')}
                </Button>
              </div>
              {departments?.category_ids == null && (
                <p className="text-xs text-muted-foreground">
                  Showing all top-level categories automatically (including any new ones).
                </p>
              )}
              <div className="max-h-48 space-y-0.5 overflow-y-auto rounded-lg border p-2">
                {categories.length === 0 ? (
                  <p className="px-2 py-3 text-center text-sm text-muted-foreground">{t('No categories yet.')}</p>
                ) : (
                  categories.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={isCategorySelected(c.id)}
                        onChange={() => toggleCategory(c.id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      {c.name}
                      {c.children_count != null && c.children_count > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {c.children_count} sub
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          <Section icon={PanelBottom} title={t('About')}>
            <Textarea
              value={footer?.about.text ?? ''}
              placeholder={t('Short description shown at the top of the footer.')}
              rows={3}
              onChange={(e) => patchFooter({ about: { text: e.target.value } })}
            />
          </Section>

          <Section icon={Link2} title={t('Link Columns')}>
            <div className="space-y-3">
              {(footer?.columns ?? []).map((col, ci) => (
                <div key={ci} className="space-y-2 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={col.title}
                      placeholder={t('Column title (e.g. Shop)')}
                      className="max-w-xs"
                      onChange={(e) => updateColumn(ci, { title: e.target.value })}
                    />
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="icon" disabled={ci === 0} onClick={() => moveColumn(ci, -1)} title={t('Move column up')}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled={ci === (footer?.columns.length ?? 1) - 1} onClick={() => moveColumn(ci, 1)} title={t('Move column down')}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeColumn(ci)} title={t('Remove column')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {col.links.map((link, li) => (
                      <div key={li} className="flex flex-wrap items-end gap-2">
                        <Input
                          value={link.label}
                          placeholder={t('Label')}
                          className="min-w-28 flex-1"
                          onChange={(e) => updateColumnLink(ci, li, { label: e.target.value })}
                        />
                        <Input
                          value={link.url}
                          placeholder="URL"
                          className="min-w-36 flex-[2]"
                          onChange={(e) => updateColumnLink(ci, li, { url: e.target.value })}
                        />
                        <label className="flex h-9 items-center gap-1.5 text-xs">
                          <Switch checked={link.new_tab ?? false} onCheckedChange={(v) => updateColumnLink(ci, li, { new_tab: v })} />
                          {t('New tab')}
                        </label>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" disabled={li === 0} onClick={() => moveColumnLink(ci, li, -1)}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" disabled={li === col.links.length - 1} onClick={() => moveColumnLink(ci, li, 1)}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeColumnLink(ci, li)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateColumn(ci, { links: [...col.links, { label: '', url: '/', new_tab: false }] })
                    }
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> {t('Add Link')}
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFooter((prev) => (prev ? { ...prev, columns: [...prev.columns, { title: '', links: [] }] } : prev))}
            >
              <Plus className="mr-1.5 h-4 w-4" /> {t('Add Column')}
            </Button>
          </Section>

          <Section icon={Share2} title={t('Social Media')}>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={footer?.social.enabled ?? true}
                onCheckedChange={(v) => patchSocial({ enabled: v })}
              />
              {t('Show the social block in the footer')}
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">{t('Heading')}</Label>
                <Input
                  value={footer?.social.title ?? ''}
                  placeholder={t('Follow us')}
                  onChange={(e) => patchSocial({ title: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">{t('Tagline (optional)')}</Label>
                <Input
                  value={footer?.social.description ?? ''}
                  placeholder={t('e.g. Community highlights and trend stories')}
                  onChange={(e) => patchSocial({ description: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">{t('Display style')}</Label>
              <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
                {(['icons', 'labeled'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => patchSocial({ style })}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                      (footer?.social.style ?? 'icons') === style
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    {style === 'icons' ? 'Icons only' : 'Icons + labels'}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Icons only renders compact circles; Icons + labels renders text pills.
              </p>
            </div>

            <div className="space-y-3">
              {(footer?.social.links ?? []).map((link, i) => {
                const platform = socialPlatform(link.platform)

                return (
                  <div key={i} className="space-y-2 rounded-lg border bg-muted/30 p-3">
                    <div className="grid gap-2 sm:grid-cols-[190px_1fr]">
                      <div>
                        <Label className="text-xs">{t('Platform')}</Label>
                        <Select value={link.platform} onValueChange={(v) => patchSocialLink(i, { platform: v })}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={t('Select platform')} />
                          </SelectTrigger>
                          <SelectContent>
                            {SOCIAL_CATALOG.map((p) => (
                              <SelectItem key={p.slug} value={p.slug}>
                                <span className="flex items-center gap-2">
                                  <p.icon className={`h-4 w-4 ${p.brandClass}`} />
                                  {p.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">{t('URL')}</Label>
                        <Input
                          value={link.url}
                          placeholder={t('https://...')}
                          onChange={(e) => patchSocialLink(i, { url: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="min-w-40 flex-1">
                        <Label className="text-xs">{t('Label (optional)')}</Label>
                        <Input
                          value={link.label}
                          placeholder={platform.label}
                          onChange={(e) => patchSocialLink(i, { label: e.target.value })}
                        />
                      </div>
                      <label className="flex h-9 items-center gap-2 text-sm">
                        <Switch
                          checked={link.enabled ?? true}
                          onCheckedChange={(v) => patchSocialLink(i, { enabled: v })}
                        />
                        {t('Visible')}
                      </label>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => moveSocialLink(i, -1)} title={t('Move up')}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={i === (footer?.social.links.length ?? 1) - 1}
                          onClick={() => moveSocialLink(i, 1)}
                          title={t('Move down')}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeSocialLink(i)} title={t('Remove')}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Button variant="outline" size="sm" onClick={addSocialLink} disabled={!footer}>
              <Plus className="mr-1.5 h-4 w-4" /> {t('Add Network')}
            </Button>

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('Live preview')}</p>
              <FooterSocialBlock
                social={
                  footer?.social ?? {
                    enabled: true,
                    title: t('Follow us'),
                    description: '',
                    style: 'icons',
                    links: [],
                  }
                }
              />
              {(footer?.social.links ?? []).filter((l) => l.enabled && l.url).length === 0 && (
                <p className="text-sm text-muted-foreground">{t('Add a network with a URL to see the footer block take shape.')}</p>
              )}
            </div>
          </Section>

          <Section icon={AtSign} title={t('Contact Information')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">{t('Email')}</Label>
                <Input
                  value={footer?.contact.email ?? ''}
                  placeholder="support@example.com"
                  onChange={(e) => patchFooter({ contact: { ...footer!.contact, email: e.target.value } })}
                />
              </div>
              <div>
                <Label className="text-xs">
                  <Phone className="mr-1 inline h-3.5 w-3.5" />
                  {t('Phone')}
                </Label>
                <Input
                  value={footer?.contact.phone ?? ''}
                  placeholder="+91 00000 00000"
                  onChange={(e) => patchFooter({ contact: { ...footer!.contact, phone: e.target.value } })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">{t('Address')}</Label>
                <Input
                  value={footer?.contact.address ?? ''}
                  placeholder={t('Street, City, State')}
                  onChange={(e) => patchFooter({ contact: { ...footer!.contact, address: e.target.value } })}
                />
              </div>
            </div>
          </Section>

          <Section icon={Link2} title={t('Copyright')}>
            <Input
              value={footer?.copyright ?? ''}
              placeholder={t('e.g. All rights reserved.')}
              onChange={(e) => patchFooter({ copyright: e.target.value })}
            />
          </Section>
        </TabsContent>

        <TabsContent value="mail" className="space-y-4">
          <Section icon={AtSign} title={t('SMTP Mail Configuration')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">{t('Mailer')}</Label>
                <Input value={mail?.mail_mailer ?? 'smtp'} onChange={(e) => setMail((m) => ({ ...(m ?? { mail_host: '', mail_port: '587', mail_username: '', mail_password: '', mail_encryption: 'tls', mail_from_address: '', mail_from_name: '' }), mail_mailer: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">{t('Host')}</Label>
                <Input value={mail?.mail_host ?? ''} onChange={(e) => setMail((m) => ({ ...(m ?? {}), mail_mailer: m?.mail_mailer ?? 'smtp', mail_host: e.target.value } as any))} />
              </div>
              <div>
                <Label className="text-xs">{t('Port')}</Label>
                <Input value={mail?.mail_port ?? '587'} onChange={(e) => setMail((m) => ({ ...(m ?? {}), mail_port: e.target.value } as any))} />
              </div>
              <div>
                <Label className="text-xs">{t('Encryption')}</Label>
                <Input value={mail?.mail_encryption ?? 'tls'} onChange={(e) => setMail((m) => ({ ...(m ?? {}), mail_encryption: e.target.value } as any))} placeholder={t('tls/ssl/null')} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">{t('Username')}</Label>
                <Input value={mail?.mail_username ?? ''} onChange={(e) => setMail((m) => ({ ...(m ?? {}), mail_username: e.target.value } as any))} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">{t('Password')}</Label>
                <Input type="password" value={mail?.mail_password ?? ''} onChange={(e) => setMail((m) => ({ ...(m ?? {}), mail_password: e.target.value } as any))} />
              </div>
              <div>
                <Label className="text-xs">{t('From Address')}</Label>
                <Input value={mail?.mail_from_address ?? ''} onChange={(e) => setMail((m) => ({ ...(m ?? {}), mail_from_address: e.target.value } as any))} />
              </div>
              <div>
                <Label className="text-xs">{t('From Name')}</Label>
                <Input value={mail?.mail_from_name ?? ''} onChange={(e) => setMail((m) => ({ ...(m ?? {}), mail_from_name: e.target.value } as any))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('These values are stored in website settings. Update them here to match your SMTP provider.')}</p>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  )
}