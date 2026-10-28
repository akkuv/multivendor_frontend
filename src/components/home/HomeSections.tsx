import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BestSellersStrip,
  CategoryRing,
  EditorsPicks,
  HeroCarousel,
  IconInfoBand,
  ImageBanner,
  InstagramDiaries,
  MiniBannerGrid,
  type MiniBannerItem,
  PersonalizationStrip,
  ProductCarousel,
  RichTextSection,
  SplitCollage,
  StoreLocations,
  SubcategoryGrid,
  TestimonialsSection,
  TextBanner,
  TrendingStyles,
  ValuePropsSection,
  VideoBanner,
  VisitBand,
  FaqSection,
} from '@/components/home/sections'
import type {
  FeaturedCategoryCard,
  HomeBanner,
  HomeCategoryCard,
  HomeIconInfoContent,
  HomeImageBannerContent,
  HomeInstagramDiariesContent,
  HomePersonalizationContent,
  HomeProductCarouselContent,
  HomeSection,
  HomeSectionType,
  HomeSplitCollageContent,
  HomeStoreLocationsContent,
  HomeTextBannerContent,
  HomeTrendingStylesContent,
  HomeValueProp,
  HomeVideoBannerContent,
  HomeVisitStoresContent,
  HomeFaqItem,
  Product,
  Testimonial,
} from '@/types'

/**
 * Renders an ordered list of storefront sections. Shared by the homepage and by
 * admin-created custom pages so every section type behaves identically on both.
 */
export function HomeSections({
  sections,
  heroHeadingLevel = 'h1',
  renderAfterType,
}: {
  sections: HomeSection[]
  heroHeadingLevel?: 'h1' | 'h2'
  /** Extra nodes injected directly after a section of the matching type. */
  renderAfterType?: Partial<Record<HomeSectionType, ReactNode>>
}) {
  const { t } = useTranslation()

  return (
    <>
      {sections.map((section) => {
        const type = section.type

        const node = renderSectionNode(section, heroHeadingLevel, t)
        const injected = renderAfterType?.[type]

        if (!injected) return node

        return (
          <Fragment key={section.id}>
            {node}
            {injected}
          </Fragment>
        )
      })}
    </>
  )
}

function renderSectionNode(
  section: HomeSection,
  heroHeadingLevel: 'h1' | 'h2',
  t: (key: string) => string,
): ReactNode {
  {
    const type = section.type

    switch (type) {
          case 'HERO': {
            return <HeroCarousel key={section.id} banners={section.content as HomeBanner[]} headingLevel={heroHeadingLevel} />
          }
          case 'PERSONALIZATION': {
            const content = (section.content as HomePersonalizationContent | undefined) ?? undefined
            return (
              <PersonalizationStrip
                key={section.id}
                text={section.title}
                subtitle={section.subtitle}
                buttonText={content?.button_text}
                buttonUrl={content?.button_url}
              />
            )
          }
          case 'VALUE_PROPS': {
            const items = (section.content as { items?: HomeValueProp[] } | undefined)?.items ?? []
            if (items.length > 0) {
              return <ValuePropsSection key={section.id} items={items} />
            }
            return null
          }
          case 'MINI_BANNERS': {
            const items = (section.content as MiniBannerItem[] | undefined) ?? []
            if (items.length > 0) {
              return <MiniBannerGrid key={section.id} title={section.title} subtitle={section.subtitle} items={items} />
            }
            return null
          }
          case 'CATEGORIES': {
            const items = (section.content as HomeCategoryCard[] | undefined) ?? []
            if (items.length > 0) {
              return <CategoryRing key={section.id} categories={items} title={section.title} subtitle={section.subtitle} />
            }
            return null
          }
          case 'BEST_SELLERS': {
            const products = (section.content as Product[] | undefined) ?? []
            if (products.length > 0) {
              return (
                <BestSellersStrip key={section.id} title={section.title} subtitle={section.subtitle} products={products} />
              )
            }
            return null
          }
          case 'FEATURED_CATEGORIES': {
            const items = (section.content as FeaturedCategoryCard[] | undefined) ?? []
            if (items.length > 0) {
              return (
                <SubcategoryGrid
                  key={section.id}
                  title={section.title ?? t('Featured Categories')}
                  subtitle={section.subtitle ?? t('Browse every department')}
                  categories={items}
                  square
                />
              )
            }
            return null
          }
          case 'TEXT_BANNER': {
            const band = section.content as HomeTextBannerContent | null
            if (!band) return null
            return <TextBanner key={section.id} content={band} title={section.title} subtitle={section.subtitle} />
          }
          case 'EDITORS_PICKS': {
            const items = (section.content as MiniBannerItem[] | undefined) ?? []
            if (items.length > 0) {
              return <EditorsPicks key={section.id} items={items} title={section.title} subtitle={section.subtitle} />
            }
            return null
          }
          case 'SPLIT_COLLAGE': {
            const split = section.content as HomeSplitCollageContent | null
            if (!split) return null
            return <SplitCollage key={section.id} content={split} title={section.title} subtitle={section.subtitle} />
          }
          case 'IMAGE_BANNER': {
            const banner = section.content as HomeImageBannerContent | null
            if (!banner) return null
            return <ImageBanner key={section.id} content={banner} title={section.title} subtitle={section.subtitle} />
          }
          case 'VIDEO_BANNER': {
            const banner = section.content as HomeVideoBannerContent | null
            if (!banner) return null
            return <VideoBanner key={section.id} content={banner} title={section.title} />
          }
          case 'PRODUCT_CAROUSEL': {
            const carousel = section.content as HomeProductCarouselContent | null
            if (!carousel || !Array.isArray(carousel.items) || carousel.items.length === 0) return null
            return (
              <ProductCarousel
                key={section.id}
                content={carousel}
                title={section.title}
                subtitle={section.subtitle}
              />
            )
          }
          case 'INSTAGRAM_DIARIES': {
            const diaries = section.content as HomeInstagramDiariesContent | null
            if (!diaries) return null
            return <InstagramDiaries key={section.id} content={diaries} />
          }
          case 'TRENDING_STYLES': {
            const styles = section.content as HomeTrendingStylesContent | null
            if (!styles || !Array.isArray(styles.items) || styles.items.length === 0) return null
            return <TrendingStyles key={section.id} content={styles} title={section.title} subtitle={section.subtitle} />
          }
          case 'ICON_INFO': {
            const content = section.content as HomeIconInfoContent | undefined
            if (!content?.items?.length) {
              return null
            }
            return <IconInfoBand key={section.id} content={content} />
          }
          case 'VISIT_STORES': {
            const content = section.content as HomeVisitStoresContent | undefined
            if (!content || (!content.title && !content.description)) {
              return null
            }
            return <VisitBand key={section.id} content={content} />
          }
          case 'STORE_LOCATIONS': {
            const content = section.content as HomeStoreLocationsContent | undefined
            if (!content?.items?.length) {
              return null
            }
            return (
              <StoreLocations key={section.id} content={content} title={section.title} subtitle={section.subtitle} />
            )
          }
          case 'TESTIMONIALS': {
            const items = (section.content as Testimonial[] | undefined) ?? []
            if (items.length > 0) {
              return (
                <TestimonialsSection
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                  testimonials={items}
                />
              )
            }
            return null
          }

          case 'RICH_TEXT': {
            const content = section.content as { html?: string } | undefined
            if (!content?.html) {
              return null
            }
            return (
              <RichTextSection
                key={section.id}
                html={content.html}
                title={section.title}
                subtitle={section.subtitle}
              />
            )
          }

          case 'FAQ': {
            const items = (section.content as { items?: HomeFaqItem[] } | undefined)?.items ?? []
            if (items.length === 0) {
              return null
            }
            return (
              <FaqSection
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                items={items}
              />
            )
          }

          default:
            return null
        }
  }
}
