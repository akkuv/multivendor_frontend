import { AdminSupportInbox } from '@/features/website/pages/admin/AdminSupportInbox'

/**
 * The customer half of the admin support inboxes.
 *
 * Deliberately its own page rather than a tab inside the vendor inbox: vendors
 * and customers are different triage queues, and a mixed list would bury a
 * customer's order problem under a vendor's payout question.
 */
export function AdminCustomerSupportPage() {
  return (
    <AdminSupportInbox
      kind="CUSTOMER"
      heading="Customer Support"
      description="One thread per customer. The assistant handles the repeat questions; what reaches you needs a person."
      requesterNoun="customer"
      searchPlaceholder="Search customer, email or message…"
    />
  )
}

export default AdminCustomerSupportPage
