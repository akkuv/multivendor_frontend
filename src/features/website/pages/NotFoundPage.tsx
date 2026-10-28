import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-7xl font-extrabold text-muted-foreground">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t('Page not found')}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("The page you're looking for doesn't exist or has been moved.")}
      </p>
      <Button asChild className="mt-6">
        <Link to="/">{t('Back to Home')}</Link>
      </Button>
    </div>
  )
}