interface RazorpayHandlerPayload {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name?: string
  description?: string
  prefill?: Record<string, string>
  handler: (payload: RazorpayHandlerPayload) => void
  modal?: { ondismiss?: () => void }
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, callback: (response: unknown) => void) => void
}

declare global {
  interface Window {
    Razorpay: { new (options: RazorpayOptions): RazorpayInstance }
  }
}

export async function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return true

  try {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-razorpay="checkout"]',
      )
      if (existing) {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')))
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.dataset.razorpay = 'checkout'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
      document.body.appendChild(script)
    })

    return !!window.Razorpay
  } catch {
    return false
  }
}

export function openRazorpayCheckout(options: RazorpayOptions): void {
  const instance = new window.Razorpay(options)
  instance.open()
}