import { Link } from 'react-router-dom'
import {
  CircleHelp,
  User,
  Package,
  Truck,
  RefreshCcw,
  CreditCard,
  Store,
  Mail,
  Phone,
  MessageCircleQuestion,
} from 'lucide-react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'

export function HelpPage() {
  const { t } = useTranslation()

  const sections: { icon: typeof CircleHelp; title: string; items: string[] }[] = [
    {
      icon: User,
      title: t('Account & Login'),
      items: [
        t('Create an account to track orders, save addresses and manage your wishlist.'),
        t('Forgot your password? Use the "Forgot password" link on the sign-in page.'),
        t('You can update your profile, password and saved addresses from My Account.'),
      ],
    },
    {
      icon: Package,
      title: t('Orders'),
      items: [
        t('Orders can be placed after signing in and adding items to your cart.'),
        t('Track the status of every order from My Account → Orders.'),
        t('Order details, including items and totals, are available on each order page.'),
      ],
    },
    {
      icon: Truck,
      title: t('Shipping & Delivery'),
      items: [
        t('Delivery times depend on the vendor and your delivery address.'),
        t('You can add multiple addresses and choose one at checkout.'),
        t('Shipment tracking details appear in your order summary once shipped.'),
      ],
    },
    {
      icon: RefreshCcw,
      title: t('Returns & Refunds'),
      items: [
        t('Eligible products can be returned from My Account → Returns.'),
        t('Refunds are processed back to your original payment method.'),
        t('Contact support if a refund has not appeared within the listed time.'),
      ],
    },
    {
      icon: CreditCard,
      title: t('Payments & Wallet'),
      items: [
        t('We accept the payment methods shown at checkout.'),
        t('Credit from returns and cancellations is credited to your wallet.'),
        t('Wallet balance can be viewed in My Account → Wallet.'),
      ],
    },
    {
      icon: Store,
      title: t('Vendors'),
      items: [
        t('Each product is sold by an individual vendor.'),
        t('Questions about a product can be asked on the product page.'),
        t('For sellers: sign in, then open the Vendor Panel from your account menu.'),
      ],
    },
  ]

  return (
    <div>
      <Breadcrumb items={[{ label: t('Help') }]} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold text-[#1a1308] shadow-lg shadow-[#c9a25a]/30">
            <CircleHelp className="h-8 w-8" />
          </div>
          <p className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#a07a28]">
            <span className="h-px w-8 bg-[#c9a25a]/60" />
            {t("We're here to help")}
            <span className="h-px w-8 bg-[#c9a25a]/60" />
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#1c1812] sm:text-4xl">{t('How can we help you?')}</h1>
          <p className="mx-auto mt-2 max-w-xl text-[#6b5d47]">
            {t('Find answers to common questions about your account, orders, shipping and more.')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ icon: Icon, title, items }) => (
            <Card key={title} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft text-[#8a6a1f] ring-1 ring-[#c9a25a]/30">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {items.map((item) => (
                  <p key={item} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <MessageCircleQuestion className="h-5 w-5 text-[#a07a28]" />
                <h2 className="text-lg font-semibold">{t('Still need help?')}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("Reach out to our support team and we'll get back to you as soon as possible.")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm text-muted-foreground sm:justify-start">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> support@waplia.com
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" /> +1 (555) 000-0000
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-3">
              <Button asChild variant="outline">
                <a href="mailto:support@waplia.com">{t('Contact Us')}</a>
              </Button>
              <Button asChild>
                <Link to="/">{t('Back to Home')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}