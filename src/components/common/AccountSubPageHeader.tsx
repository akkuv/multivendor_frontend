import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function AccountSubPageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 shadow-sm sm:p-7">
      <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-primary/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 right-28 h-36 w-36 rounded-full bg-pink-200/25 blur-2xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 sm:h-16 sm:w-16">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}