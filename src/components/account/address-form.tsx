import { cloneElement, type InputHTMLAttributes, type ReactElement } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Globe, Hash, Home, Map, MapPin, Phone, User, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Address } from '@/types'
import { useTranslation } from 'react-i18next'

export const addressSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  address_line1: z.string().min(2, 'Enter your address'),
  address_line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'Enter your city'),
  state: z.string().min(2, 'Enter your state'),
  country: z.string().min(2, 'Enter your country'),
  pincode: z.string().min(4, 'Enter a valid pincode'),
  is_default: z.boolean().optional(),
})

export type AddressFormValues = z.infer<typeof addressSchema>

export function addressTypeIcon(type: string): LucideIcon {
  if (type === 'office' || type === 'work') return Building2
  if (type === 'billing') return Wallet
  return Home
}

export function AddressField({
  label,
  icon: Icon,
  placeholder,
  error,
  className,
  children,
}: {
  label: string
  icon: LucideIcon
  placeholder?: string
  error?: string
  className?: string
  children: ReactElement
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {placeholder
          ? cloneElement(
              children as ReactElement<InputHTMLAttributes<HTMLInputElement>>,
              { placeholder },
            )
          : children}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function AddressForm({
  initial,
  isPending,
  onSave,
  onCancel,
}: {
  initial?: Address
  isPending: boolean
  onSave: (values: AddressFormValues) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          phone: initial.phone,
          address_line1: initial.address_line1,
          address_line2: initial.address_line2 ?? '',
          landmark: initial.landmark ?? '',
          city: initial.city,
          state: initial.state,
          country: initial.country,
          pincode: initial.pincode,
          is_default: initial.is_default,
        }
      : { is_default: false },
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="grid gap-4 sm:grid-cols-2">
      <AddressField
        label={t('Full name')}
        icon={User}
        placeholder={t('Enter your full name')}
        error={errors.name?.message}
      >
        <Input {...register('name')} placeholder={t('Enter your full name')} className="pl-9" />
      </AddressField>
      <AddressField
        label={t('Phone')}
        icon={Phone}
        placeholder={t('10-digit mobile number')}
        error={errors.phone?.message}
      >
        <Input {...register('phone')} placeholder={t('10-digit mobile number')} className="pl-9" />
      </AddressField>
      <AddressField
        label={t('Address line 1')}
        icon={Home}
        placeholder={t('House no., street, area')}
        error={errors.address_line1?.message}
        className="sm:col-span-2"
      >
        <Input
          {...register('address_line1')}
          placeholder={t('House no., street, area')}
          className="pl-9"
        />
      </AddressField>
      <AddressField
        label={t('Address line 2 (optional)')}
        icon={Building2}
        placeholder={t('Apartment, floor, building')}
        className="sm:col-span-2"
      >
        <Input
          {...register('address_line2')}
          placeholder={t('Apartment, floor, building')}
          className="pl-9"
        />
      </AddressField>
      <AddressField
        label={t('Landmark (optional)')}
        icon={MapPin}
        placeholder={t('Nearby landmark')}
        className="sm:col-span-2"
      >
        <Input {...register('landmark')} placeholder={t('Nearby landmark')} className="pl-9" />
      </AddressField>
      <AddressField
        label={t('City')}
        icon={Building2}
        placeholder={t('Enter your city')}
        error={errors.city?.message}
      >
        <Input {...register('city')} placeholder={t('Enter your city')} className="pl-9" />
      </AddressField>
      <AddressField
        label={t('State')}
        icon={Map}
        placeholder={t('Enter your state')}
        error={errors.state?.message}
      >
        <Input {...register('state')} placeholder={t('Enter your state')} className="pl-9" />
      </AddressField>
      <AddressField
        label={t('Country')}
        icon={Globe}
        placeholder={t('Enter your country')}
        error={errors.country?.message}
      >
        <Input {...register('country')} placeholder={t('Enter your country')} className="pl-9" />
      </AddressField>
      <AddressField
        label={t('Pincode')}
        icon={Hash}
        placeholder={t('e.g. 110001')}
        error={errors.pincode?.message}
      >
        <Input {...register('pincode')} placeholder={t('e.g. 110001')} className="pl-9" />
      </AddressField>
      <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" {...register('is_default')} className="h-4 w-4 rounded border-input accent-primary" />
        {t('Set as default address')}
      </label>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : initial ? 'Save Changes' : 'Save Address'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('Cancel')}
        </Button>
      </div>
    </form>
  )
}