import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useVendorSupport } from '@/hooks/useSupport'
import RequesterSupportChat, {
  SupportPageHeading,
} from '@/components/support/RequesterSupportChat'
import { useTranslation } from 'react-i18next'

/**
 * The vendor's own support chat.
 *
 * Shares the chat panel with the customer side — same conversation, same
 * assistant, same admin team behind it.
 */
export function VendorSupportPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const {
    messages,
    suggestions,
    conversation,
    connectionStatus,
    isLoading,
    isError,
    isSending,
    refetch,
    sendMessage,
    markRead,
  } = useVendorSupport()

  const handleSend = useCallback(
    async (body: string, askBot: boolean) => {
      await sendMessage({ body, skip_bot: !askBot })
    },
    [sendMessage],
  )

  return (
    <div className="space-y-6">
      <div>
        <SupportPageHeading>{t('Support')}</SupportPageHeading>
        <p className="text-muted-foreground">
          Talk to the marketplace team. The assistant answers common questions instantly, and anything
          else is passed to an admin in this same chat.
        </p>
      </div>

      <RequesterSupportChat
        conversation={conversation}
        messages={messages}
        suggestions={suggestions}
        connectionStatus={connectionStatus}
        isLoading={isLoading}
        isError={isError}
        isSending={isSending}
        currentUserId={user?.id}
        onSend={handleSend}
        onRetry={() => void refetch()}
        onMarkRead={markRead}
        hasUnread={(conversation?.unread_count ?? 0) > 0}
        headerTitle={conversation?.vendor?.store_name ?? t('Marketplace Support')}
        composerPlaceholder={t('Ask about payouts, commission, shipping or anything else…')}
        assistantNote={t('The assistant reads your live figures — wallet balance, payout status, commission rate and return windows — straight from your account, so its answers match what your dashboard shows. If it cannot help, it tells an admin and the conversation continues here.')}
      />
    </div>
  )
}

export default VendorSupportPage
