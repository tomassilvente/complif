'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBusinesses } from '@/hooks/useBusinesses'
import { BusinessFilters } from '@/components/business/BusinessFilters'
import { BusinessStatusBadge } from '@/components/business/BusinessStatusBadge'
import { RiskScoreBadge } from '@/components/common/RiskScoreBadge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableTd,
  TableTh,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 10

export default function BusinessesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [country, setCountry] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useBusinesses({
    search,
    status,
    country,
    page,
    limit: PAGE_SIZE,
  })

  const businesses = data?.businesses ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  const handleFilterChange = (
    type: 'search' | 'status' | 'country',
    value: string
  ) => {
    setPage(1)
    if (type === 'search') setSearch(value)
    if (type === 'status') setStatus(value)
    if (type === 'country') setCountry(value)
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Empresas
          </h2>
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {total} empresa{total !== 1 ? 's' : ''} registrada
              {total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button onClick={() => router.push('/businesses/new')} className="gap-1.5">
          <Plus size={16} />
          Nueva Empresa
        </Button>
      </div>

      {/* Filters */}
      <BusinessFilters
        search={search}
        status={status}
        country={country}
        onSearchChange={(v) => handleFilterChange('search', v)}
        onStatusChange={(v) => handleFilterChange('status', v)}
        onCountryChange={(v) => handleFilterChange('country', v)}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" label="Cargando empresas..." />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-700">Error al cargar las empresas.</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className="rounded-lg bg-white border border-gray-200 p-12 text-center">
          <p className="text-gray-500 font-medium">
            No se encontraron empresas.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Prueba cambiando los filtros o registra una nueva empresa.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Empresa</TableTh>
                <TableTh>Tax ID</TableTh>
                <TableTh>País</TableTh>
                <TableTh>Industria</TableTh>
                <TableTh>Estado</TableTh>
                <TableTh>Riesgo</TableTh>
                <TableTh>Fecha Alta</TableTh>
                <TableTh>Docs</TableTh>
              </TableRow>
            </TableHead>
            <TableBody>
              {businesses.map((biz) => (
                <TableRow
                  key={biz.id}
                  onClick={() => router.push(`/businesses/${biz.id}`)}
                >
                  <TableTd>
                    <span className="font-medium text-gray-900">
                      {biz.name}
                    </span>
                  </TableTd>
                  <TableTd>
                    <span className="font-mono text-xs text-gray-600">
                      {biz.taxId}
                    </span>
                  </TableTd>
                  <TableTd>{biz.country}</TableTd>
                  <TableTd>{biz.industry}</TableTd>
                  <TableTd>
                    <BusinessStatusBadge status={biz.status} />
                  </TableTd>
                  <TableTd>
                    <RiskScoreBadge score={biz.riskScore} />
                  </TableTd>
                  <TableTd>
                    {format(new Date(biz.createdAt), 'd MMM yyyy', {
                      locale: es,
                    })}
                  </TableTd>
                  <TableTd>
                    <span className="text-gray-500">
                      {biz._count?.documents ?? 0}
                    </span>
                  </TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft size={14} />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1"
                >
                  Siguiente
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
