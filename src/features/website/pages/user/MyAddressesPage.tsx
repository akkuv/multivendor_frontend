import { useState } from 'react'
import {
  Globe,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
} from '@/hooks/useAddresses'
import { useAuthStore } from '@/store/authStore'
import {
  AddressForm,
  addressTypeIcon,
  type AddressFormValues,
} from '@/components/account/address-form'
import { AccountSubPageHeader } from '@/components/common/AccountSubPageHeader'
import type { Address } from '@/types'
import type { AddressPayload } from '@/services/address'
import { useTranslation } from 'react-i18next'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function MyAddressesPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: addresses, isLoading } = useAddresses(!!user)
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  const openCreateAddress = () => {
    setEditingAddress(null)
    setAddressFormOpen(true)
  }

  const openEditAddress = (addr: Address) => {
    setEditingAddress(addr)
    setAddressFormOpen(true)
  }

  const closeAddressForm = () => {
    setAddressFormOpen(false)
    setEditingAddress(null)
  }

  const handleSaveAddress = (values: AddressFormValues) => {
    const payload = values as AddressPayload
    if (editingAddress) {
      updateAddress.mutate(
        { id: editingAddress.id, data: payload },
        { onSuccess: closeAddressForm },
      )
    } else {
      createAddress.mutate(payload, { onSuccess: closeAddressForm })
    }
  }

  const addressFormBusy = createAddress.isPending || updateAddress.isPending
  const addressList = addresses ?? []
  const defaultCount = addressList.filter((a) => a.is_default).length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AccountSubPageHeader
        icon={MapPin}
        title={t('My Addresses')}
        subtitle={t('Manage your saved shipping addresses for a faster checkout.')}
        actions={
          <Button size="sm" onClick={openCreateAddress}>
            <Plus className="mr-1 h-4 w-4" /> {t('Add Address')}
          </Button>
        }
      />

      {addressList.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label={t('Saved addresses')} value={addressList.length} />
          <StatCard label={t('Default')} value={defaultCount} />
          <StatCard label={t('Address types')} value={new Set(addressList.map((a) => a.type ?? 'home')).size} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : addressList.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {addressList.map((addr) => {
            const TypeIcon = addressTypeIcon(addr.type)
            return (
              <Card key={addr.id} className="transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{addr.name}</p>
                        {addr.type && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium uppercase">
                            {addr.type}
                          </Badge>
                        )}
                        {addr.is_default && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
                            {t('Default')}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {addr.phone}
                      </p>
                      <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {addr.address_line1}
                          {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                          {addr.landmark ? `, ${addr.landmark}` : ''}, {addr.city},{' '}
                          {addr.state} - {addr.pincode}
                        </span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        {addr.country}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title={t('Edit address')}
                        onClick={() => openEditAddress(addr)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={t('Delete address')}
                        disabled={deleteAddress.isPending}
                        onClick={() => deleteAddress.mutate(addr.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-8 w-8" />
            </div>
            <p className="font-display text-xl font-bold">{t('No saved addresses')}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t('Add a shipping address to make checkout faster.')}
            </p>
            <Button onClick={openCreateAddress} className="mt-5">
              <Plus className="mr-1 h-4 w-4" /> {t('Add Your First Address')}
            </Button>
          </CardContent>
        </Card>
      )}

      {addressFormOpen && (
        <Card className="mt-6">
          <CardContent className="p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <MapPin className="h-5 w-5 text-primary" />
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            <AddressForm
              key={editingAddress?.id ?? 'new'}
              initial={editingAddress ?? undefined}
              isPending={addressFormBusy}
              onSave={handleSaveAddress}
              onCancel={closeAddressForm}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}