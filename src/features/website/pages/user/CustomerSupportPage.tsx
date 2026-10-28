import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { useCustomerSupport } from '@/hooks/useSupport'
import RequesterSupportChat, {
  SupportPageHeading,
} from '@/components/support/RequesterSupportChat'

/**
 * The customer's own support chat, in the account area.
 *
 * Same conversation, assistant and admin team as the vendor chat — the customer
 * just asks about orders, returns and payments instead of commission.
 */
export function CustomerSupportPage() {
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
  } = useCustomerSupport()

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
          {t(
            'Talk to the marketplace team. The assistant answers common questions instantly, and anything else is passed to an admin in this same chat.',
          )}
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
        headerTitle={t('Marketplace Support')}
        composerPlaceholder={t('Ask about your order, a return, a refund or anything else…')}
        assistantNote={t(
          'The assistant reads your live account — order status and tracking, returns, refunds, payments and wallet balance — straight from the app, so its answers match what you see. If it cannot help, it tells an admin and the conversation continues here.',
        )}
        recentOrders={conversation?.recent_orders ?? null}
        recentOrdersHref={(order) => `/account/orders/${order.id}`}
      />
    </div>
  )
}

export default CustomerSupportPage
