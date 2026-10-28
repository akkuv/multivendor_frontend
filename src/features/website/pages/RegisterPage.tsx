import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Headphones,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Store,
  Truck,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegister } from '@/hooks/useAuth'
import { useWebsiteContent } from '@/hooks/useWebsite'
import { assetUrl } from '@/lib/assets'
import { useTranslation } from 'react-i18next'

const schema = z
  .object({
    name: z.string().min(2, 'Enter your name'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    password_confirmation: z.string(),
    role: z.enum(['CUSTOMER', 'VENDOR']),
    store_name: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type FormValues = z.infer<typeof schema>

/**
 * Account creation — visually mirrors the sign-in and password-recovery
 * screens so the whole auth flow feels like one coherent set of pages.
 */
export function RegisterPage() {
  const { t } = useTranslation()
  const { data: websiteData } = useWebsiteContent()
  const logoText = websiteData?.navbar?.logo?.text || 'Waplia'
  const logoImage = websiteData?.navbar?.logo?.image
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CUSTOMER' },
  })

  const role = watch('role')

  function onSubmit(values: FormValues) {
    registerMutation.mutate(
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        password_confirmation: values.password_confirmation,
        role: values.role,
        store_name: values.role === 'VENDOR' ? values.store_name : undefined,
      },
      {
        onError: (error) => {
          setError('root', { message: (error as Error).message })
        },
      },
    )
  }

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10 sm:py-14">
      {/* Branded backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-ivory to-ivory" />
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-gold-mid/20 blur-3xl" />
        <div className="absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-[#e9c891]/20 blur-3xl" />
      </div>

      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border bg-card shadow-2xl md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-ink via-[#2c2620] to-[#1a1612] p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#e9c891]/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-gold-mid/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            {logoImage ? (
              <img src={assetUrl(logoImage)} alt={logoText} className="h-12 w-12 rounded-xl object-contain bg-white/15 p-1.5" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Store className="h-6 w-6" />
              </div>
            )}
            <div>
              <p className="heading-serif text-xl font-bold tracking-tight">{logoText}</p>
              <p className="text-xs font-medium text-white/60">{t('Shop smarter, every day')}</p>
            </div>
          </div>

          <div className="relative space-y-6">
            <h2 className="heading-serif text-3xl font-bold leading-tight">{t('One marketplace, endless choices.')}</h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-white/85">
                <Truck className="h-5 w-5 text-[#e9c891]" />
                {t('Free & fast delivery on eligible orders')}
              </li>
              <li className="flex items-center gap-3 text-sm text-white/85">
                <ShieldCheck className="h-5 w-5 text-[#e9c891]" />
                {t('100% secure payments')}
              </li>
              <li className="flex items-center gap-3 text-sm text-white/85">
                <Headphones className="h-5 w-5 text-[#e9c891]" />
                {t('24/7 customer support')}
              </li>
            </ul>
          </div>

          <p className="relative text-xs text-white/60">
            © {new Date().getFullYear()} {logoText}. {t('All rights reserved.')}
          </p>
        </div>

        {/* Registration panel */}
        <div className="p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            {logoImage ? (
              <img src={assetUrl(logoImage)} alt={logoText} className="h-10 w-10 rounded-xl object-contain bg-cream/40 p-1" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#b89045] via-[#c9a25a] to-[#8a6a1f] text-white">
                <Store className="h-5 w-5" />
              </div>
            )}
            <span className="text-2xl font-extrabold tracking-tight">{logoText}</span>
          </div>

          <h1 className="heading-serif text-2xl font-bold tracking-tight text-ink">{t('Create an account')}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t('Join')} {logoText} {t('as a customer or a vendor')}</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft">{t('I am a...')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    role === 'CUSTOMER' ? 'border-gold-deep bg-gold-deep/10 text-gold-deep' : 'border-line-warm hover:bg-cream'
                  }`}
                >
                  <input type="radio" value="CUSTOMER" className="sr-only" {...register('role')} />
                  <User className="h-4 w-4" />
                  {t('Customer')}
                </label>
                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    role === 'VENDOR' ? 'border-gold-deep bg-gold-deep/10 text-gold-deep' : 'border-line-warm hover:bg-cream'
                  }`}
                >
                  <input type="radio" value="VENDOR" className="sr-only" {...register('role')} />
                  <Store className="h-4 w-4" />
                  {t('Vendor')}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft" htmlFor="name">{role === 'VENDOR' ? t('Your name') : t('Full name')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" placeholder="e.g. Priya Sharma" className="border-line-warm bg-cream/40 pl-9 focus-visible:ring-gold-deep" {...register('name')} />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {role === 'VENDOR' && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft" htmlFor="store_name">{t('Store name')}</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="store_name" placeholder="e.g. Sharma Fashions" className="border-line-warm bg-cream/40 pl-9 focus-visible:ring-gold-deep" {...register('store_name')} />
                </div>
                {errors.store_name && (
                  <p className="text-sm text-destructive">{errors.store_name.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft" htmlFor="phone">{t('Phone (optional)')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" placeholder="e.g. 9876543210" className="border-line-warm bg-cream/40 pl-9 focus-visible:ring-gold-deep" {...register('phone')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft" htmlFor="email">{t('Email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="border-line-warm bg-cream/40 pl-9 focus-visible:ring-gold-deep" {...register('email')} />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft" htmlFor="password">{t('Password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('Min. 6 characters')}
                  className="border-line-warm bg-cream/40 pl-9 pr-9 focus-visible:ring-gold-deep"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft" htmlFor="password_confirmation">{t('Confirm password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password_confirmation"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder={t('Repeat your password')}
                  className="border-line-warm bg-cream/40 pl-9 pr-9 focus-visible:ring-gold-deep"
                  {...register('password_confirmation')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="text-sm text-destructive">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>

            {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full rounded-full bg-ink px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#e9c891] transition-colors hover:bg-[#2c2620]"
            >
              {registerMutation.isPending ? t('Creating account...') : t('Create Account')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('Already have an account?')}{' '}
            <Link to="/login" className="font-medium text-gold-deep hover:underline">
              {t('Sign In')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}