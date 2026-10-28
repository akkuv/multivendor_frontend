import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useCollections } from '@/hooks/useCatalog'
import { assetUrl } from '@/lib/assets'
import type { Collection } from '@/types'
import { useTranslation } from 'react-i18next'

const sections: Array<{ key: Collection['gender']; title: string }> = [
  { key: 'female', title: 'Women' },
  { key: 'male', title: 'Men' },
  { key: 'kids', title: 'Kids' },
  { key: 'unisex', title: 'Everyone' },
]

function CollectionCard({ collection }: { collection: Collection }) {
  const { t } = useTranslation()
  const image = collection.image ?? collection.banner_image

  return (
    <Link to={`/collections/${collection.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#241f18]">
        {image ? (
          <img
            src={assetUrl(image)}
            alt={collection.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#f3e9d4] via-[#faf5e9] to-[#ecdcb8]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="font-serif text-lg font-semibold leading-tight text-white drop-shadow">
            {collection.name}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
            {t('{{count}} products', { count: collection.products_count ?? 0 })}
          </p>
        </div>
      </div>
    </Link>
  )
}

export function CollectionsIndexPage() {
  const { t } = useTranslation()
  const { data: collections = [], isLoading } = useCollections()

  const grouped = sections
    .map((section) => ({
      ...section,
      items: collections.filter((collection) => collection.gender === section.key),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <div className="min-h-screen bg-ivory">
      <section className="border-b border-line-warm bg-ivory py-10 sm:py-14">
        <div className="container-store text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold-deep">{t('Shop by edit')}</p>
          <h1 className="heading-serif mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t('Curated Collections')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
            {t('Handpicked edits for brides, grooms, families and celebrations — discover the look that is unmistakably yours.')}
          </p>
        </div>
      </section>

      <div className="container-store space-y-12 py-10 sm:py-14">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/5] w-full rounded-none bg-gold-soft/40" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-soft">{t('No collections available yet.')}</p>
        ) : (
          grouped.map((section) => (
            <section key={section.key}>
              <div className="flex items-baseline justify-between gap-4 border-b border-line-warm pb-3">
                <h2 className="heading-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {t(section.title)}
                </h2>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft/60">
                  {t('{{count}} collections', { count: section.items.length })}
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                {section.items.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
