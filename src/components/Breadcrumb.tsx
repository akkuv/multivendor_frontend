import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Breadcrumb({
  items,
  className,
}: {
  items: { label: string; to?: string }[]
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <nav className={cn('border-b border-line-warm bg-ivory', className)} aria-label={t('Breadcrumb')}>
      <div className="container-store flex flex-wrap items-center gap-1 py-3 text-sm text-ink-soft">
        <Link to="/" className="transition-colors hover:text-gold-deep">{t('Home')}</Link>
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-ink-soft/40" />
            {item.to ? (
              <Link to={item.to} className="transition-colors hover:text-gold-deep">{item.label}</Link>
            ) : (
              <span className="font-medium text-ink">{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </nav>
  )
}