'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  taxId: z.string().min(5, 'Ingrese un Tax ID válido'),
  country: z.string().min(1, 'Seleccione un país'),
  industry: z.string().min(1, 'Seleccione una industria'),
})

export type BusinessFormValues = z.infer<typeof schema>

interface BusinessFormProps {
  defaultValues?: Partial<BusinessFormValues>
  onSubmit: (data: BusinessFormValues) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

const countryOptions = [
  { value: 'Argentina', label: 'Argentina' },
  { value: 'México', label: 'México' },
  { value: 'Brasil', label: 'Brasil' },
  { value: 'Chile', label: 'Chile' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Uruguay', label: 'Uruguay' },
  { value: 'Paraguay', label: 'Paraguay' },
  { value: 'Perú', label: 'Perú' },
  { value: 'Bolivia', label: 'Bolivia' },
  { value: 'Venezuela', label: 'Venezuela' },
  { value: 'Ecuador', label: 'Ecuador' },
  { value: 'España', label: 'España' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'Otro', label: 'Otro' },
]

const industryOptions = [
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Construcción', label: 'Construcción' },
  { value: 'Finanzas', label: 'Finanzas' },
  { value: 'Seguros', label: 'Seguros' },
  { value: 'Casinos', label: 'Casinos' },
  { value: 'Casas de Cambio', label: 'Casas de Cambio' },
  { value: 'Seguridad', label: 'Seguridad' },
  { value: 'Salud', label: 'Salud' },
  { value: 'Educación', label: 'Educación' },
  { value: 'Manufactura', label: 'Manufactura' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Otra', label: 'Otra' },
]

export function BusinessForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = 'Guardar',
}: BusinessFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Nombre de la Empresa"
        placeholder="Ej: Acme S.A."
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="CUIT / RFC / Tax ID"
        placeholder="Ej: 20-12345678-9"
        error={errors.taxId?.message}
        {...register('taxId')}
      />
      <Select
        label="País"
        options={countryOptions}
        placeholder="Seleccione un país"
        error={errors.country?.message}
        {...register('country')}
      />
      <Select
        label="Industria"
        options={industryOptions}
        placeholder="Seleccione una industria"
        error={errors.industry?.message}
        {...register('industry')}
      />
      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
        {submitLabel}
      </Button>
    </form>
  )
}
