import { useTranslation } from 'react-i18next'
import { ProductCollectionPage } from './ProductCollectionPage'

export function BestSellersPage() {
  const { t } = useTranslation()

  return (
    <ProductCollectionPage
      title={t('Best Sellers')}
      eyebrow={t('Customer favourites')}
      description={t('The most loved products, all in one place.')}
      query={{ best_seller: true, sort: 'best_selling' }}
    />
  )
}