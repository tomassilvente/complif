'use client'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface BusinessFiltersProps {
  search: string
  status: string
  country: string
  onSearchChange: (v: string) => void
  onStatusChange: (v: string) => void
  onCountryChange: (v: string) => void
}

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_REVIEW', label: 'En Revisión' },
  { value: 'APPROVED', label: 'Aprobada' },
  { value: 'REJECTED', label: 'Rechazada' },
]

const countryOptions = [
  { value: '', label: 'Todos los países' },
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

export function BusinessFilters({
  search,
  status,
  country,
  onSearchChange,
  onStatusChange,
  onCountryChange,
}: BusinessFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none mt-[1px]"
        />
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
        />
      </div>
      <div className="min-w-[160px]">
        <Select
          options={statusOptions}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        />
      </div>
      <div className="min-w-[160px]">
        <Select
          options={countryOptions}
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
        />
      </div>
    </div>
  )
}
