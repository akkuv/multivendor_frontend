import { AtSign, Globe2, Music2, Send, Share2 } from 'lucide-react'
import type { FC } from 'react'
import type { FooterSocialLinkConfig, FooterSocialSettings } from '@/types'

/** Simple "f" glyph. */
const FacebookIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

/** Instagram glyph composed from primitives (rounded square, ring, dot). */
const InstagramIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.2" />
    <circle cx="12" cy="12" r="4.1" />
    <circle cx="17.5" cy="6.5" r="1.15" fill="currentColor" stroke="none" />
  </svg>
)

/** X (formerly Twitter) glyph. */
const XIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
)

/** YouTube play glyph. */
const YoutubeIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

/** LinkedIn "in" glyph. */
const LinkedinIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

/** WhatsApp bubble glyph. */
const WhatsappIcon: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
)

export interface SocialPlatform {
  slug: string
  label: string
  /** Tailwind text color applied to the icon at rest. */
  brandClass: string
  /** Tailwind background color applied on hover. */
  hoverClass: string
  icon: FC<{ className?: string }>
}

export const SOCIAL_CATALOG: SocialPlatform[] = [
  { slug: 'facebook', label: 'Facebook', brandClass: 'text-[#1877F2]', hoverClass: 'hover:bg-[#1877F2]', icon: FacebookIcon },
  { slug: 'instagram', label: 'Instagram', brandClass: 'text-[#E4405F]', hoverClass: 'hover:bg-[#E4405F]', icon: InstagramIcon },
  { slug: 'twitter', label: 'X (Twitter)', brandClass: 'text-black', hoverClass: 'hover:bg-black', icon: XIcon },
  { slug: 'youtube', label: 'YouTube', brandClass: 'text-[#FF0000]', hoverClass: 'hover:bg-[#FF0000]', icon: YoutubeIcon },
  { slug: 'linkedin', label: 'LinkedIn', brandClass: 'text-[#0A66C2]', hoverClass: 'hover:bg-[#0A66C2]', icon: LinkedinIcon },
  { slug: 'whatsapp', label: 'WhatsApp', brandClass: 'text-[#25D366]', hoverClass: 'hover:bg-[#25D366]', icon: WhatsappIcon },
  { slug: 'tiktok', label: 'TikTok', brandClass: 'text-black', hoverClass: 'hover:bg-black', icon: Music2 },
  { slug: 'telegram', label: 'Telegram', brandClass: 'text-[#229ED9]', hoverClass: 'hover:bg-[#229ED9]', icon: Send },
  { slug: 'threads', label: 'Threads', brandClass: 'text-black', hoverClass: 'hover:bg-black', icon: AtSign },
  { slug: 'website', label: 'Website', brandClass: 'text-zinc-700', hoverClass: 'hover:bg-zinc-800', icon: Globe2 },
]

const catalogBySlug = new Map(SOCIAL_CATALOG.map((platform) => [platform.slug, platform]))

export function socialPlatform(slug: string): SocialPlatform {
  return catalogBySlug.get(slug) ?? SOCIAL_CATALOG[SOCIAL_CATALOG.length - 1]
}

export function SocialLinks({
  links,
  style,
}: {
  links: FooterSocialLinkConfig[]
  style?: FooterSocialSettings['style']
}) {
  const visible = links.filter((link) => link.enabled && link.url)

  if (visible.length === 0) return null

  const isLabeled = style === 'labeled'

  return (
    <div className="flex flex-wrap gap-2.5">
      {visible.map((link) => {
        const platform = socialPlatform(link.platform)
        const label = link.label || platform.label
        const Icon = platform.icon

        return (
          <a
            key={`${link.platform}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
            className={
              isLabeled
                ? `group inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent hover:text-white hover:shadow-lg ${platform.hoverClass}`
                : `group grid h-10 w-10 place-items-center rounded-full ring-1 ring-zinc-200 transition-all duration-200 hover:-translate-y-0.5 hover:text-white hover:ring-transparent hover:shadow-lg ${platform.brandClass} ${platform.hoverClass}`
            }
          >
            <Icon className={`h-[18px] w-[18px] ${isLabeled ? `${platform.brandClass} transition-colors group-hover:text-white` : ''}`} />
            {isLabeled && <span>{label}</span>}
          </a>
        )
      })}
    </div>
  )
}

export function FooterSocialBlock({ social }: { social: FooterSocialSettings }) {
  const visible = (social?.links ?? []).filter((link) => link.enabled && link.url)

  if (!social?.enabled || visible.length === 0) return null

  return (
    <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-line-warm bg-cream/70 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md">
        <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-ink">
          <Share2 className="h-4 w-4 shrink-0 text-gold-deep" />
          {social.title || 'Follow us'}
        </h3>
        {social.description && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{social.description}</p>}
      </div>
      <SocialLinks links={social.links} style={social.style} />
    </div>
  )
}