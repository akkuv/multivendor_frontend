import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Headphones, Lock, Mail, ShieldCheck, Sparkles, Store, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/hooks/useAuth'
import { useWebsiteContent } from '@/hooks/useWebsite'
import { assetUrl } from '@/lib/assets'
import { useTranslation } from 'react-i18next'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { t } = useTranslation()
  const { data: websiteData } = useWebsiteContent()
  const logoText = websiteData?.navbar?.logo?.text || 'Waplia'
  const logoImage = websiteData?.navbar?.logo?.image
  const [showPassword, setShowPassword] = useState(false)
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function onSubmit(values: FormValues) {
    login.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: (result) => {
          const dest = result.user.role === 'VENDOR' ? '/vendor' : from
          navigate(dest, { replace: true })
        },
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

      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line-warm bg-ivory shadow-2xl md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-ink via-[#2c2620] to-[#1a1612] p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#e9c891]/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-gold-mid/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            {logoImage ? (
              <img src={assetUrl(logoImage)} alt={logoText} className="h-12 w-12 rounded-xl object-contain bg-white/15 p-1.5" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#b89045] via-[#c9a25a] to-[#8a6a1f] text-white shadow-lg">
                <Store className="h-6 w-6" />
              </div>
            )}
            <div>
              <p className="heading-serif text-xl font-bold tracking-tight">{logoText}</p>
              <p className="text-xs font-medium text-white/60">{t('Shop smarter, every day')}</p>
            </div>
          </div>

          <div className="relative space-y-6">
            <h2 className="heading-serif text-3xl font-bold leading-tight">
              {t('One marketplace, endless choices.')}
            </h2>
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
              <li className="flex items-center gap-3 text-sm text-white/85">
                <Sparkles className="h-5 w-5 text-[#e9c891]" />
                {t('Curated collections, every day')}
              </li>
            </ul>
          </div>

          <p className="relative text-xs text-white/50">
            © {new Date().getFullYear()} {logoText}. {t('All rights reserved.')}
          </p>
        </div>

        {/* Sign-in panel */}
        <div className="p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            {logoImage ? (
              <img src={assetUrl(logoImage)} alt={logoText} className="h-10 w-10 rounded-xl object-contain bg-cream/40 p-1" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#b89045] via-[#c9a25a] to-[#8a6a1f] text-white">
                <Store className="h-5 w-5" />
              </div>
            )}
            <span className="heading-serif text-2xl font-bold tracking-tight text-ink">{logoText}</span>
          </div>

          <h1 className="heading-serif text-2xl font-bold tracking-tight text-ink">{t('Welcome back')}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t('Sign in to continue shopping')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft">{t('Email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="border-line-warm bg-cream/40 pl-9 focus-visible:ring-gold-deep"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft">{t('Password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="border-line-warm bg-cream/40 pl-9 pr-9 focus-visible:ring-gold-deep"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full rounded-full bg-ink px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#e9c891] transition-colors hover:bg-[#2c2620]"
            >
              {login.isPending ? t('Signing in...') : t('Sign In')}
            </Button>
          </form>

          <div className="mt-3 text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-gold-deep hover:underline">
              {t('Forgot password?')}
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-ink-soft">
            {t("Don't have an account?")}{' '}
            <Link to="/register" className="font-medium text-gold-deep hover:underline">
              {t('Register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}