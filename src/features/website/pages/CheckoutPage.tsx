import {
  cloneElement,
  useMemo,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  Banknote,
  Building2,
  CreditCard,
  Globe,
  Hash,
  Home,
  Map,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  ShoppingBag,
  Tag,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { useAddresses, useCreateAddress } from '@/hooks/useAddresses'
import { usePlaceOrder } from '@/hooks/useOrders'
import { useWallet } from '@/hooks/useWallet'
import { usePaymentOptions } from '@/hooks/usePaymentOptions'
import { validateCoupon } from '@/services/coupon'
import { loadRazorpayScript, openRazorpayCheckout } from '@/services/razorpay'
import { verifyPayment } from '@/services/order'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/format'
import { useTranslation } from 'react-i18next'
import type { Address } from '@/types'
import type { AddressPayload } from '@/services/address'

const addressSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  address_line1: z.string().min(2, 'Enter your address'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'Enter your city'),
  state: z.string().min(2, 'Enter your state'),
  country: z.string().min(2, 'Enter your country'),
  pincode: z.string().min(4, 'Enter a valid pincode'),
})

type AddressForm = z.infer<typeof addressSchema>

type PayMethod = 'razorpay' | 'cod' | 'wallet'

function AddressField({
  label,
  icon: Icon,
  placeholder,
  error,
  className,
  children,
}: {
  label: string
  icon: LucideIcon
  placeholder?: string
  error?: string
  className?: string
  children: ReactElement
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {placeholder
          ? cloneElement(children as ReactElement<InputHTMLAttributes<HTMLInputElement>>, {
              placeholder,
            })
          : children}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function CheckoutAddressList({
  addresses,
  selectedAddressId,
  onSelect,
}: {
  addresses?: Address[]
  selectedAddressId: number | null
  onSelect: (id: number) => void
}) {
  const { t } = useTranslation()

  return (
    <>
      {addresses?.map((addr) => {
        const TypeIcon = addr.type === 'billing' ? Wallet : Home
        return (
          <label
            key={addr.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
              selectedAddressId === addr.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-input hover:bg-muted/40',
            )}
          >
            <input
              type="radio"
              name="address"
              checked={selectedAddressId === addr.id}
              onChange={() => onSelect(addr.id)}
              className="sr-only"
            />
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{addr.name}</p>
                {addr.is_default && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
                    {t('Default')}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                {addr.phone}
              </p>
              <p className="text-muted-foreground">
                {addr.address_line1}
                {addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city},{' '}
                {addr.state} - {addr.pincode}
              </p>
            </div>
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border">
              {selectedAddressId === addr.id && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
            </div>
          </label>
        )
      })}
    </>
  )
}

export function CheckoutPage() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isCustomer = !!token && user?.role === 'CUSTOMER'
  const { data: cart, isLoading, isError, refetch } = useCart(isCustomer)
  const { data: addresses } = useAddresses(isCustomer)
  const { data: wallet } = useWallet(isCustomer)
  const { data: paymentOptions } = usePaymentOptions(isCustomer)
  const createAddress = useCreateAddress()
  const placeOrder = usePlaceOrder()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [error, setError] = useState('')
  const [payMethod, setPayMethod] = useState<PayMethod>('razorpay')
  const [walletSelected, setWalletSelected] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) })

  const subtotal = cart?.subtotal ?? 0
  const tax = cart?.tax ?? 0
  const shipping = cart?.shipping ?? 0
  const fees = cart?.fees_total ?? 0
  const discount = appliedCoupon?.discount ?? 0
  // Tax is already included in the subtotal, so only display it separately.
  // Add-on fees are a non-taxable surcharge added on top of the subtotal.
  const total = Math.max(0, subtotal + fees - discount + shipping)
  const walletBalance = Number(wallet?.available_balance ?? 0)
  const walletCharge = payMethod === 'razorpay' && walletSelected ? Math.min(walletBalance, total) : 0
  const gatewayAmount = Math.max(0, total - walletCharge)

  const razorpayEnabled = paymentOptions?.razorpay.enabled ?? true
  const walletEnabled = paymentOptions?.wallet.enabled ?? true
  const codEnabled = paymentOptions?.cod.enabled ?? true
  const codMin = Number(paymentOptions?.cod.min_amount ?? 0)
  const codMax = paymentOptions?.cod.max_amount ?? null
  const codFee = Number(paymentOptions?.cod.fee ?? 0)
  const codInRange = total >= codMin && (codMax === null || total <= codMax)
  const codAvailable = codEnabled && codInRange
  const walletCovers = walletEnabled && walletBalance >= total && total > 0
  const canPayWalletFull = walletEnabled && walletBalance > 0
  const codReason =
    !codEnabled ? t('Cash on Delivery is currently unavailable.')
    : total < codMin ? t('COD is unavailable for orders below {{amount}}.', { amount: formatCurrency(codMin) })
    : codMax !== null && total > codMax ? t('COD is unavailable for orders above {{amount}}.', { amount: formatCurrency(codMax) })
    : ''

  const onCoupon = async () => {
    try {
      const result = await validateCoupon(couponCode, subtotal)
      if (!result?.coupon) {
        throw new Error('Invalid coupon response.')
      }
      setAppliedCoupon({ code: result.coupon.code, discount: result.discount ?? 0 })
      setCouponError('')
    } catch (e) {
      setCouponError((e as Error)?.message || 'Failed to apply coupon.')
    }
  }

  const onPlaceOrder = () => {
    if (!selectedAddressId) {
      setError(t('Please select a shipping address.'))
      return
    }
    setError('')

    const coversInFull = walletCharge >= total

    let payment_method: PayMethod = payMethod
    let walletAmount: number | undefined

    if (payMethod === 'razorpay' && walletSelected) {
      if (coversInFull) {
        payment_method = 'wallet'
      } else if (walletCharge > 0) {
        walletAmount = walletCharge
      }
    }

    placeOrder.mutate(
      {
        address_id: selectedAddressId,
        coupon_code: appliedCoupon?.code,
        payment_method,
        wallet_amount: walletAmount,
      },
      {
        onSuccess: async (result) => {
          if (!result.payment) {
            navigate('/account')
            return
          }
          await openGatewayCheckout(result.payment, result.order.id)
        },
        onError: (e) => setError((e as Error).message),
      },
    )
  }

  const openGatewayCheckout = async (
    payment: { order_id: string; amount: number; currency: string; key: string },
    orderId: number,
  ) => {
    const loaded = await loadRazorpayScript()

    if (!loaded) {
      setError(t('Razorpay could not be loaded. Please try again.'))
      navigate('/account')
      return
    }

    const gatewayOrderId = payment.order_id

    openRazorpayCheckout({
      key: payment.key,
      amount: payment.amount,
      currency: payment.currency,
      order_id: gatewayOrderId,
      name: 'My Store',
      description: t('Order payment'),
      handler: async (payload) => {
        try {
          await verifyPayment({ order_id: orderId, ...payload })
          navigate('/account')
        } catch (e) {
          setError((e as Error).message)
        }
      },
      modal: { ondismiss: () => navigate('/account') },
    })
  }

  const activeAddressCount = useMemo(() => addresses?.length ?? 0, [addresses])

  if (!token) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t('Sign in to check out')}</h1>
        <p className="mt-2 text-muted-foreground">{t('You need to be signed in to place an order.')}</p>
        <Button asChild className="mt-6">
          <Link to="/login">{t('Sign In')}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">{t('Could not load checkout')}</h1>
        <p className="mt-2 text-muted-foreground">{t('Something went wrong while fetching your cart.')}</p>
        <Button className="mt-6" onClick={() => refetch()}>
          <RefreshCw className="mr-1 h-4 w-4" /> {t('Try Again')}
        </Button>
      </div>
    )
  }

  if (!cart || !cart.items?.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t('Your cart is empty')}</h1>
        <Button asChild className="mt-6">
          <Link to="/shop">{t('Continue Shopping')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold">{t('Checkout')}</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> {t('Shipping Address')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeAddressCount === 0 && !showNew ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">{t('No saved addresses')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('Add a shipping address to continue with checkout.')}
                  </p>
                </div>
              ) : (
                !showNew && (
                  <CheckoutAddressList
                    addresses={addresses}
                    selectedAddressId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                  />
                )
              )}

              {showNew && (
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  onSubmit={handleSubmit((data) => {
                    createAddress.mutate(data as AddressPayload, {
                      onSuccess: () => {
                        reset()
                        setShowNew(false)
                      },
                    })
                  })}
                >
                  <AddressField
                    label={t('Full name')}
                    icon={User}
                    placeholder={t('Enter your full name')}
                    error={formErrors.name?.message}
                  >
                    <Input {...register('name')} className="pl-9" />
                  </AddressField>
                  <AddressField
                    label={t('Phone')}
                    icon={Phone}
                    placeholder={t('10-digit mobile number')}
                    error={formErrors.phone?.message}
                  >
                    <Input {...register('phone')} className="pl-9" />
                  </AddressField>
                  <AddressField
                    label={t('Address line 1')}
                    icon={Home}
                    placeholder={t('House no., street, area')}
                    error={formErrors.address_line1?.message}
                    className="sm:col-span-2"
                  >
                    <Input {...register('address_line1')} className="pl-9" />
                  </AddressField>
                  <AddressField
                    label={t('Address line 2 (optional)')}
                    icon={Building2}
                    placeholder={t('Apartment, floor, building')}
                    className="sm:col-span-2"
                  >
                    <Input {...register('address_line2')} className="pl-9" />
                  </AddressField>
                  <AddressField
                    label={t('City')}
                    icon={Building2}
                    placeholder={t('Enter your city')}
                    error={formErrors.city?.message}
                  >
                    <Input {...register('city')} className="pl-9" />
                  </AddressField>
                  <AddressField
                    label={t('State')}
                    icon={Map}
                    placeholder={t('Enter your state')}
                    error={formErrors.state?.message}
                  >
                    <Input {...register('state')} className="pl-9" />
                  </AddressField>
                  <AddressField
                    label={t('Country')}
                    icon={Globe}
                    placeholder={t('Enter your country')}
                    error={formErrors.country?.message}
                  >
                    <Input {...register('country')} className="pl-9" />
                  </AddressField>
                  <AddressField
                    label={t('Pincode')}
                    icon={Hash}
                    placeholder={t('e.g. 110001')}
                    error={formErrors.pincode?.message}
                  >
                    <Input {...register('pincode')} className="pl-9" />
                  </AddressField>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit" disabled={createAddress.isPending}>
                      {createAddress.isPending ? t('Saving...') : t('Save Address')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>
                      {t('Cancel')}
                    </Button>
                  </div>
                </form>
              )}

              {!showNew && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => setShowNew(true)}
                >
                  <Plus className="mr-1 h-4 w-4" /> {t('Add new address')}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" /> {t('Coupon')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  onCoupon()
                }}
              >
                <Input
                  placeholder={t('Enter coupon code')}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault()
                    onCoupon()
                  }}
                  disabled={!!appliedCoupon}
                >
                  {t('Apply')}
                </Button>
              </form>
              {appliedCoupon && (
                <p className="mt-2 text-sm text-emerald-600">
                  {t('Coupon {{code}} applied: -{{discount}}', { code: appliedCoupon.code, discount: formatCurrency(appliedCoupon.discount) })}
                </p>
              )}
              {couponError && <p className="mt-2 text-sm text-destructive">{couponError}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> {t('Payment')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PaymentOption
                icon={<CreditCard className="h-5 w-5" />}
                title={t('Pay online via Razorpay')}
                description={t('UPI, Cards, Net Banking and other Razorpay-supported methods.')}
                disabled={!razorpayEnabled}
                disabledReason={!razorpayEnabled ? t('Online payments are currently unavailable.') : ''}
                selected={payMethod === 'razorpay'}
                onSelect={() => setPayMethod('razorpay')}
              />

              {payMethod === 'razorpay' && (
                <div
                  role="button"
                  tabIndex={canPayWalletFull ? 0 : -1}
                  onClick={() => canPayWalletFull && setWalletSelected(!walletSelected)}
                  onKeyDown={(e) => {
                    if (canPayWalletFull && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      setWalletSelected(!walletSelected)
                    }
                  }}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors',
                    walletSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-muted/40',
                    !canPayWalletFull && 'opacity-60',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                        walletSelected
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{t('Use wallet balance first')}</p>
                      <p className="text-muted-foreground">
                        {t('Available')}: {formatCurrency(walletBalance)}
                      </p>
                      {walletBalance <= 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t('Add money to your wallet from your account page.')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={walletSelected}
                    disabled={!canPayWalletFull}
                    onCheckedChange={setWalletSelected}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t('Use wallet balance first')}
                  />
                </div>
              )}

              <PaymentOption
                icon={<Wallet className="h-5 w-5" />}
                title={t('Pay with wallet')}
                description={t('Pay {{amount}} from your wallet balance.', { amount: formatCurrency(total) })}
                disabled={!walletCovers}
                disabledReason={
                  !walletEnabled
                    ? t('Wallet payments are currently unavailable.')
                    : walletBalance <= 0
                      ? t('Your wallet balance is zero.')
                      : t('Wallet balance is less than the order total.')
                }
                selected={payMethod === 'wallet'}
                onSelect={() => {
                  setPayMethod('wallet')
                  setWalletSelected(false)
                }}
              />

              <PaymentOption
                icon={<Banknote className="h-5 w-5" />}
                title={t('Cash on Delivery')}
                description={
                  codFee > 0
                    ? t('Pay when you receive the order. A COD fee of {{fee}} applies.', { fee: formatCurrency(codFee) })
                    : t('Pay when you receive the order.')
                }
                disabled={!codAvailable}
                disabledReason={codReason}
                selected={payMethod === 'cod'}
                onSelect={() => {
                  setPayMethod('cod')
                  setWalletSelected(false)
                }}
              />

              {walletSelected && payMethod === 'razorpay' && walletBalance > 0 && (
                <div className="rounded-md border bg-accent/40 p-3 text-sm">
                  {walletCharge >= total ? (
                    <p>
                      {t('You will pay {{amount}} from your wallet and nothing online.', { amount: formatCurrency(total) })}
                    </p>
                  ) : (
                    <p>
                      {t('{{wallet}} from wallet · {{online}} via Razorpay.', { wallet: formatCurrency(walletCharge), online: formatCurrency(gatewayAmount) })}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border bg-accent/40 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {payMethod === 'cod' ? t('Total due on delivery') : t('Total due online')}
                </span>
                <span className="text-base font-semibold text-primary">
                  {formatCurrency(payMethod === 'cod' ? total : gatewayAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">{t('Order Summary')}</h2>
              <div className="space-y-2 text-sm">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-2">
                    <span className="line-clamp-1 text-muted-foreground">
                      {item.product?.name ?? `#${item.product_id}`} × {item.quantity}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('Subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('Discount')}</span>
                  <span className="text-emerald-600">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('Tax (inclusive)')}</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('Shipping')}</span>
                {shipping > 0 ? (
                  <div className="text-right">
                    <span>{formatCurrency(shipping)}</span>
                    {Number(paymentOptions?.free_delivery?.threshold ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t('Free delivery on orders above {{amount}}', { amount: formatCurrency(paymentOptions?.free_delivery?.threshold ?? 0) })}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-emerald-600">{t('Free')}</span>
                )}
              </div>
              {fees > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('Product fees')}</span>
                  <span>{formatCurrency(fees)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>{t('Total')}</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                className="w-full"
                size="lg"
                onClick={onPlaceOrder}
                disabled={placeOrder.isPending}
              >
                {placeOrder.isPending ? t('Placing order...') : t('Place Order')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PaymentOption({
  icon,
  title,
  description,
  disabled,
  disabledReason,
  selected,
  onSelect,
}: {
  icon: ReactNode
  title: string
  description: string
  disabled?: boolean
  disabledReason?: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <label
      className={cn(
        'group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all duration-200',
        selected
          ? 'border-primary/40 bg-primary/[0.03] shadow-[0_12px_28px_-18px_rgba(0,0,0,0.25)] ring-1 ring-primary/10'
          : 'border-border bg-card hover:border-primary/20 hover:bg-muted/30',
        disabled && 'cursor-not-allowed opacity-50 hover:border-border hover:bg-card',
      )}
    >
      <input
        type="radio"
        name="pay-method"
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
          selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 pt-0.5 text-sm">
        <p className={cn('font-medium', selected && 'text-primary')}>{title}</p>
        <p className="text-muted-foreground">{description}</p>
        {disabled && disabledReason && (
          <p className="mt-1 text-xs font-medium text-destructive">{disabledReason}</p>
        )}
      </div>
      <span
        className={cn(
          'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-primary' : 'border-muted-foreground/30',
        )}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </span>
    </label>
  )
}
