import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

const ELLIPSIS = Symbol('ellipsis')

function pageItems(current: number, last: number): (number | typeof ELLIPSIS)[] {
  const wanted = new Set<number>()
  for (const value of [1, last, current - 1, current, current + 1]) {
    if (value >= 1 && value <= last) wanted.add(value)
  }
  const sorted = [...wanted].sort((left, right) => left - right)
  const items: (number | typeof ELLIPSIS)[] = []
  let previous = 0
  for (const value of sorted) {
    if (value - previous > 1) items.push(ELLIPSIS)
    items.push(value)
    previous = value
  }
  return items
}

export function PaginationBar({
  page,
  lastPage,
  buildPageHref,
}: {
  page: number
  lastPage: number
  buildPageHref: (page: number) => string
  tone?: 'gold' | 'rose'
}) {
  if (lastPage <= 1) return null

  const controlClass =
    'h-9 rounded-full px-2.5 text-xs font-semibold text-ink-soft hover:bg-cream hover:text-gold-deep sm:px-3'
  const pageClass =
    'h-9 min-w-9 rounded-full px-2.5 text-xs font-bold text-ink-soft transition hover:bg-cream hover:text-gold-deep sm:px-3'
  const activeClass = 'bg-ink text-[#e6c97e] shadow-md shadow-[#8a6a1f]/25 hover:bg-ink hover:text-[#e6c97e]'

  return (
    <Pagination className="w-fit max-w-full rounded-full border border-line-warm bg-ivory p-1.5 shadow-sm">
      <PaginationContent className="gap-0.5 sm:gap-1">
        <PaginationItem>
          <PaginationPrevious
            to={page > 1 ? buildPageHref(page - 1) : '#'}
            disabled={page <= 1}
            className={controlClass}
          />
        </PaginationItem>
        {pageItems(page, lastPage).map((item, index) =>
          item === ELLIPSIS ? (
            <PaginationItem key={`ellipsis-${index}`} className="max-sm:hidden">
              <PaginationEllipsis className="h-9 w-9 text-ink-soft/50" />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                to={buildPageHref(item)}
                isActive={page === item}
                className={cn(pageClass, page === item && activeClass)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            to={page < lastPage ? buildPageHref(page + 1) : '#'}
            disabled={page >= lastPage}
            className={controlClass}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}