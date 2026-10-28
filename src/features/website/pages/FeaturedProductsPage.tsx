import { useTranslation } from 'react-i18next'
import { ProductCollectionPage } from './ProductCollectionPage'

export function FeaturedProductsPage() {
  const { t } = useTranslation()

  return (
    <ProductCollectionPage
      title={t('Featured Products')}
      eyebrow={t('Handpicked for you')}
      description={t('Browse every handpicked product we are featuring right now.')}
      query={{ featured: true, sort: 'best_selling' }}
    />
  )
}