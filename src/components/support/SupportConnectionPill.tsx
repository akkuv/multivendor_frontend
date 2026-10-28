import { Wifi, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * Tells the user honestly whether messages are arriving over the websocket.
 *
 * A "Live" badge is only shown once the server has actually authorised the
 * channel, so it never claims a connection that is not there.
 */
export function SupportConnectionPill({ status }: { status: 'connecting' | 'live' | 'offline' }) {
  const { t } = useTranslation()
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <Wifi className="h-3.5 w-3.5" aria-hidden="true" /> {t('Live')}
      </span>
    )
  }

  if (status === 'connecting') {
    return <span className="text-xs text-slate-400">{t('Connecting…')}</span>
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-amber-600"
      title={t('Realtime is not connected — the page still refreshes automatically.')}
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" /> {t('Auto-refresh')}
    </span>
  )
}

export default SupportConnectionPill
