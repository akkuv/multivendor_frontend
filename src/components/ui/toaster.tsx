import { useSyncExternalStore } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { getSnapshot, removeToast, subscribe } from '@/lib/toast'
import { Button } from '@/components/ui/button'

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
        destructive: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type ToastVariantClass = VariantProps<typeof toastVariants>['variant']

export function Toaster() {
  const currentToasts = useSyncExternalStore(subscribe, getSnapshot)

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {currentToasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open
          onOpenChange={(open) => {
            if (!open) removeToast(t.id)
          }}
          duration={t.duration}
          className={cn(toastVariants({ variant: t.variant as ToastVariantClass | undefined }))}
        >
          <div className="grid min-w-0 flex-1 gap-1">
            {t.title ? <ToastPrimitive.Title className="text-sm font-semibold">{t.title}</ToastPrimitive.Title> : null}
            {t.description ? (
              <ToastPrimitive.Description className="text-sm opacity-90">{t.description}</ToastPrimitive.Description>
            ) : null}
          </div>
          {t.action ? (
            <ToastPrimitive.Action asChild altText={t.action.label}>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link to={t.action.to}>{t.action.label}</Link>
              </Button>
            </ToastPrimitive.Action>
          ) : null}
          <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none">
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[80] flex max-h-screen w-full max-w-[340px] flex-col gap-2 p-4 outline-none" />
    </ToastPrimitive.Provider>
  )
}