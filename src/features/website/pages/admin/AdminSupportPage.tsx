import { AdminSupportInbox } from '@/features/website/pages/admin/AdminSupportInbox'

/**
 * The vendor half of the admin support inboxes.
 *
 * Its own page, paired with the customer inbox: vendors and customers are
 * different triage queues and speak about completely different things.
 */
export function AdminSupportPage() {
  return (
    <AdminSupportInbox
      kind="VENDOR"
      heading="Vendor Support"
      description="One thread per vendor. The assistant handles the repeat questions; what reaches you needs a person."
      requesterNoun="vendor"
      searchPlaceholder="Search store, vendor or message…"
    />
  )
}

export default AdminSupportPage
