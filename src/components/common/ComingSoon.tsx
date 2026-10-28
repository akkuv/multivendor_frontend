import { useTranslation } from 'react-i18next'
export function ComingSoon({ title, description }: { title: string; description: string }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-background py-20 text-center">
        <p className="text-sm font-medium">{t('Coming soon')}</p>
        <p className="text-sm text-muted-foreground">
          {t('This module will be built in a future phase.')}
        </p>
      </div>
    </div>
  )
}