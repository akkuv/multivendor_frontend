import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value: number
  onChange?: (value: number) => void
  size?: number
  readonly?: boolean
  className?: string
}

export function RatingStars({ value, onChange, size = 16, readonly = false, className }: RatingStarsProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} role={readonly ? undefined : 'radiogroup'}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value)
        const starEl = (
          <Star
            key={star}
            style={{ width: size, height: size }}
            className={cn(
              filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30',
              !readonly && 'cursor-pointer transition-transform hover:scale-110',
            )}
          />
        )
        if (readonly) return starEl
        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange?.(star)}
          >
            {starEl}
          </button>
        )
      })}
    </div>
  )
}