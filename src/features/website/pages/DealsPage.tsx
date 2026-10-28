import { useTranslation } from 'react-i18next'
import { ProductCollectionPage } from './ProductCollectionPage'

export function DealsPage() {
  const { t } = useTranslation()

  return (
    <ProductCollectionPage
      title={t('Best Deals')}
      eyebrow={t('Limited time offers')}
      description={t('Every discounted product across the marketplace, all on one page.')}
      query={{ deals_only: true, sort: 'discount' }}
    />
  )
}