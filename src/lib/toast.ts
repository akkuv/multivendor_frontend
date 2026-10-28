export type ToastVariant = 'default' | 'success' | 'destructive'

export interface ToastAction {
  label: string
  to: string
}

export interface ToastData {
  id: number
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
}

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: ToastAction
}

let toasts: ToastData[] = []
let listeners: (() => void)[] = []
let nextId = 1

function emit(): void {
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: () => void): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export function getSnapshot(): ToastData[] {
  return toasts
}

export function removeToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function toast({ title, description, variant = 'default', duration = 4000, action }: ToastOptions): { dismiss: () => void } {
  const id = nextId++
  toasts = [...toasts, { id, title, description, variant, duration, action }]
  emit()
  if (duration > 0) {
    window.setTimeout(() => removeToast(id), duration)
  }
  return {
    dismiss() {
      removeToast(id)
    },
  }
}