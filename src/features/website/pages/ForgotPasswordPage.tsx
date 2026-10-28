import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Headphones, Lock, Mail, ShieldCheck, Store, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/services/api'
import { toast } from '@/lib/toast'
import { useTranslation } from 'react-i18next'

/**
 * Password recovery — visually mirrors the sign-in screen (same brand panel
 * and layout) so the auth flow feels like one coherent set of pages.
 */
export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await api.post('/auth/forgot-password', { email })
      setMessage(t('If your email exists, a reset link/token has been sent.'))
      setStep('reset')
      toast({ title: t('Reset instructions sent'), variant: 'success' })
    } catch (err: any) {
      setMessage(err?.response?.data?.message || t('Something went wrong'))
      toast({ title: err?.response?.data?.message || t('Failed to reset password'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      })
      setMessage(t('Password reset successfully. You can now login.'))
      toast({ title: t('Password reset successfully'), variant: 'success' })
    } catch (err: any) {
      setMessage(err?.response?.data?.message || t('Failed to reset password'))
      toast({ title: err?.response?.data?.message || t('Failed to reset password'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10 sm:py-14">
      {/* Soft, branded backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />
      </div>

      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border bg-card shadow-2xl md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#e91e63] via-[#d81b60] to-[#880e4f] p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight">{t('Waplia')}</p>
              <p className="text-xs font-medium text-white/70">{t('Shop smarter, every day')}</p>
            </div>
          </div>

          <div className="relative space-y-6">
            <h2 className="text-3xl font-bold leading-tight">{t('One marketplace, endless choices.')}</h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm">
                <Truck className="h-5 w-5 text-white/80" />
                {t('Free & fast delivery on eligible orders')}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <ShieldCheck className="h-5 w-5 text-white/80" />
                {t('100% secure payments')}
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Headphones className="h-5 w-5 text-white/80" />
                {t('24/7 customer support')}
              </li>
            </ul>
          </div>

          <p className="relative text-xs text-white/60">
            © {new Date().getFullYear()} {t('Waplia')}. {t('All rights reserved.')}
          </p>
        </div>

        {/* Form panel */}
        <div className="p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">{t('Waplia')}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">{t('Forgot password?')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 'request'
              ? t('Enter your email to receive password reset instructions')
              : t('Enter the token from your email and set a new password')}
          </p>

          {step === 'request' ? (
            <form onSubmit={requestReset} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              {message && <p className="text-sm text-muted-foreground">{message}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('Sending...') : t('Send Reset Link')}
              </Button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">{t('Reset Token')}</Label>
                <Input
                  id="token"
                  placeholder={t('Enter token from email')}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('New Password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="pl-9 pr-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirmation">{t('Confirm Password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password_confirmation"
                    type={showConfirm ? 'text' : 'password'}
                    className="pl-9 pr-9"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {message && <p className="text-sm text-muted-foreground">{message}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('Resetting...') : t('Reset Password')}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-primary hover:underline">
              {t('Back to Login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}